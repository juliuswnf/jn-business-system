import axios from 'axios';
import logger from '../utils/logger.js';
import {
  SMS_PRIORITY,
  shouldUseSMS,
  calculateSMSOverageCost
} from '../config/pricing.js';

/**
 * SMS Service - Enterprise-only feature
 *
 * Handles SMS notifications with:
 * - Priority-based sending (high: 2h+24h, medium: same-day, low: email-only)
 * - Plivo integration (�0.038/SMS)
 * - SMS limit enforcement with overage tracking
 * - Email fallback on failure/limit exceeded
 * - Usage tracking per salon
 *
 * CRITICAL: SMS is ONLY available for Enterprise tier
 */

class SMSService {
  constructor() {
    // Plivo credentials from environment
    this.authId = process.env.PLIVO_AUTH_ID;
    this.authToken = process.env.PLIVO_AUTH_TOKEN;
    this.phoneNumber = process.env.PLIVO_PHONE_NUMBER;

    // Base URL for Plivo API
    this.baseUrl = `https://api.plivo.com/v1/Account/${this.authId}`;

    // SMS cost (Plivo Germany rate)
    this.SMS_COST = 0.038; // �0.038 per SMS
  }

  /**
   * Send SMS notification (Enterprise only)
   *
   * @param {Object} options - SMS options
   * @param {String} options.to - Recipient phone number (E.164 format)
   * @param {String} options.message - SMS message content (max 160 chars recommended)
   * @param {Object} options.salon - Salon document (must have Enterprise tier)
   * @param {String} options.notificationType - Type of notification (2h_reminder, 24h_reminder, etc.)
   * @param {Object} options.booking - Booking document (for logging)
   * @returns {Object} - { success, messageId, cost, smsRemaining, fallbackToEmail }
   */
  async sendSMS({ to, message, salon, notificationType, booking: _booking }) {
    try {
      // ==================== ENTERPRISE-ONLY CHECK ====================

      // Check if salon has SMS feature (Enterprise only)
      if (!salon.hasFeature('smsNotifications')) {
        logger.warn(`[SMS Service] Salon ${salon._id} (${salon.subscription.tier}) tried to send SMS - NOT ENTERPRISE`);

        return {
          success: false,
          error: 'SMS_NOT_AVAILABLE',
          message: 'SMS notifications are only available in Enterprise tier',
          fallbackToEmail: true,
          currentTier: salon.subscription.tier,
          requiredTier: 'enterprise'
        };
      }

      // ==================== PRIORITY-BASED SENDING ====================

      // Calculate SMS limit based on tier and staff count
      const smsLimit = salon.getSMSLimit();
      const smsRemaining = salon.getRemainingSMS();

      // Check if we should use SMS based on priority and remaining budget
      const useSMS = shouldUseSMS(notificationType, smsRemaining, salon.subscription.tier);

      if (!useSMS) {
        logger.info(`[SMS Service] Skipping SMS for ${notificationType} - priority too low or budget exhausted`);
        logger.info(`[SMS Service] SMS remaining: ${smsRemaining}/${smsLimit}`);

        return {
          success: false,
          error: 'LOW_PRIORITY_OR_BUDGET_EXHAUSTED',
          message: `SMS skipped due to priority (${notificationType}) or budget (${smsRemaining}/${smsLimit} remaining)`,
          fallbackToEmail: true,
          smsRemaining,
          smsLimit,
          priority: this._getPriority(notificationType)
        };
      }

      // ==================== SMS LIMIT CHECK ====================

      // Check if salon can send SMS (under limit)
      if (!salon.canSendSMS()) {
        logger.warn(`[SMS Service] Salon ${salon._id} SMS limit exceeded: ${salon.subscription.smsUsedThisMonth}/${smsLimit}`);

        // Calculate overage cost
        const overageCost = calculateSMSOverageCost(
          salon.subscription.tier,
          salon.subscription.smsUsedThisMonth + 1,
          smsLimit
        );

        return {
          success: false,
          error: 'SMS_LIMIT_EXCEEDED',
          message: `SMS limit exceeded (${salon.subscription.smsUsedThisMonth}/${smsLimit}). Overage cost: �${overageCost.toFixed(4)}/SMS`,
          fallbackToEmail: true,
          smsUsed: salon.subscription.smsUsedThisMonth,
          smsLimit,
          overageCost,
          resetDate: salon.subscription.smsResetDate
        };
      }

      // ==================== PHONE NUMBER VALIDATION ====================

      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        console.error(`[SMS Service] Invalid phone number format: ${to}`);

        return {
          success: false,
          error: 'INVALID_PHONE_NUMBER',
          message: `Invalid phone number format: ${to}. Must be in E.164 format (+49...)`,
          fallbackToEmail: true
        };
      }

      // ==================== PLIVO CONFIGURATION CHECK ====================

      // Check if Plivo is configured
      if (!this.authId || !this.authToken || !this.phoneNumber) {
        console.error('[SMS Service] Plivo credentials not configured');

        return {
          success: false,
          error: 'SMS_NOT_CONFIGURED',
          message: 'SMS service is not configured. Please contact support.',
          fallbackToEmail: true
        };
      }

      // ==================== SEND SMS VIA PLIVO ====================

      // Truncate message to 160 characters (single SMS)
      const truncatedMessage = message.length > 160
        ? message.substring(0, 157) + '...'
        : message;

      // Send SMS via Plivo API
      const response = await axios.post(
        `${this.baseUrl}/Message/`,
        {
          src: this.phoneNumber,
          dst: to,
          text: truncatedMessage,
          type: 'sms'
        },
        {
          auth: {
            username: this.authId,
            password: this.authToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Check if SMS sent successfully
      if (response.data.message === 'message(s) queued') {
        // Increment SMS usage counter
        await salon.incrementSMSUsage();

        const newRemaining = salon.getRemainingSMS();

        logger.info(`[SMS Service] SMS sent successfully to ${to}`);
        logger.info(`[SMS Service] Message ID: ${response.data.message_uuid[0]}`);
        logger.info(`[SMS Service] SMS remaining: ${newRemaining}/${smsLimit}`);

        return {
          success: true,
          messageId: response.data.message_uuid[0],
          cost: this.SMS_COST,
          smsRemaining: newRemaining,
          smsLimit,
          notificationType,
          priority: this._getPriority(notificationType),
          fallbackToEmail: false
        };
      } else {
        console.error(`[SMS Service] Unexpected response from Plivo:`, response.data);

        return {
          success: false,
          error: 'PLIVO_ERROR',
          message: 'Failed to send SMS via Plivo',
          fallbackToEmail: true,
          plivoResponse: response.data
        };
      }

    } catch (error) {
      // ==================== ERROR HANDLING ====================

      console.error(`[SMS Service] Error sending SMS:`, error.response?.data || error.message);

      // Plivo API error
      if (error.response?.data) {
        return {
          success: false,
          error: 'PLIVO_API_ERROR',
          message: error.response.data.error || 'Plivo API error',
          fallbackToEmail: true,
          plivoError: error.response.data
        };
      }

      // Network or other error
      return {
        success: false,
        error: 'SMS_SEND_ERROR',
        message: error.message,
        fallbackToEmail: true
      };
    }
  }

  /**
   * Send booking reminder SMS (2h or 24h before appointment)
   *
   * @param {Object} booking - Booking document
   * @param {Object} salon - Salon document
   * @param {String} reminderType - '2h' or '24h'
   * @returns {Object} - SMS send result
   */
  async sendBookingReminderSMS(booking, salon, reminderType) {
    try {
      // Get customer phone number
      const customerPhone = booking.customerPhone || booking.customer?.phone;

      if (!customerPhone) {
        logger.warn(`[SMS Service] No phone number for booking ${booking._id}`);
        return {
          success: false,
          error: 'NO_PHONE_NUMBER',
          message: 'Customer has no phone number',
          fallbackToEmail: true
        };
      }

      // Format appointment time
      const appointmentTime = new Date(booking.startTime).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Build SMS message based on reminder type
      let message;
      const notificationType = reminderType === '2h' ? '2h_reminder' : '24h_reminder';

      if (reminderType === '2h') {
        message = `Erinnerung: Ihr Termin bei ${salon.name} ist in 2 Stunden (${appointmentTime}). Bis gleich!`;
      } else if (reminderType === '24h') {
        message = `Erinnerung: Ihr Termin bei ${salon.name} ist morgen um ${appointmentTime}. Wir freuen uns auf Sie!`;
      } else {
        message = `Erinnerung: Ihr Termin bei ${salon.name} am ${appointmentTime}. Wir freuen uns auf Sie!`;
      }

      // Send SMS
      return await this.sendSMS({
        to: customerPhone,
        message,
        salon,
        notificationType,
        booking
      });

    } catch (error) {
      console.error(`[SMS Service] Error sending booking reminder SMS:`, error);

      return {
        success: false,
        error: 'REMINDER_SMS_ERROR',
        message: error.message,
        fallbackToEmail: true
      };
    }
  }

  /**
   * Send booking confirmation SMS (low priority - usually email only)
   *
   * @param {Object} booking - Booking document
   * @param {Object} salon - Salon document
   * @returns {Object} - SMS send result
   */
  async sendBookingConfirmationSMS(booking, salon) {
    try {
      const customerPhone = booking.customerPhone || booking.customer?.phone;

      if (!customerPhone) {
        return {
          success: false,
          error: 'NO_PHONE_NUMBER',
          message: 'Customer has no phone number',
          fallbackToEmail: true
        };
      }

      const appointmentTime = new Date(booking.startTime).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const message = `Buchung best�tigt! ${salon.name} am ${appointmentTime}. Details per E-Mail.`;

      return await this.sendSMS({
        to: customerPhone,
        message,
        salon,
        notificationType: 'booking_confirmation',
        booking
      });

    } catch (error) {
      console.error(`[SMS Service] Error sending confirmation SMS:`, error);

      return {
        success: false,
        error: 'CONFIRMATION_SMS_ERROR',
        message: error.message,
        fallbackToEmail: true
      };
    }
  }

  /**
   * Get priority level for notification type
   *
   * @param {String} notificationType - Type of notification
   * @returns {String} - 'high', 'medium', or 'low'
   */
  _getPriority(notificationType) {
    if (SMS_PRIORITY.high.includes(notificationType)) return 'high';
    if (SMS_PRIORITY.medium.includes(notificationType)) return 'medium';
    if (SMS_PRIORITY.low.includes(notificationType)) return 'low';
    return 'unknown';
  }

  /**
   * Get SMS usage statistics for a salon
   *
   * @param {Object} salon - Salon document
   * @returns {Object} - SMS usage statistics
   */
  async getSMSUsageStats(salon) {
    const smsLimit = salon.getSMSLimit();
    const smsUsed = salon.subscription.smsUsedThisMonth || 0;
    const smsRemaining = salon.getRemainingSMS();
    const resetDate = salon.subscription.smsResetDate;

    // Calculate overage cost if over limit
    let overageCost = 0;
    if (smsUsed > smsLimit) {
      overageCost = calculateSMSOverageCost(salon.subscription.tier, smsUsed, smsLimit);
    }

    return {
      tier: salon.subscription.tier,
      hasAccess: salon.hasFeature('smsNotifications'),
      limit: smsLimit,
      used: smsUsed,
      remaining: smsRemaining,
      percentUsed: ((smsUsed / smsLimit) * 100).toFixed(1),
      resetDate,
      overLimit: smsUsed > smsLimit,
      overageCost,
      staffCount: salon.staff?.length || 0
    };
  }
}

// Singleton instance
export default new SMSService();
