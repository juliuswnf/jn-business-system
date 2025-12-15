import twilio from 'twilio';
import ISMSProvider from './ISMSProvider.js';

/**
 * Twilio SMS Provider Implementation
 *
 * Docs: https://www.twilio.com/docs/sms
 * Pricing: ~€0.077 per SMS (Germany)
 */

export default class TwilioProvider extends ISMSProvider {
  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.client = null;

    if (this.isAvailable()) {
      this.client = twilio(this.accountSid, this.authToken);
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS({ phoneNumber, message, from }) {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: from || this.phoneNumber,
        to: phoneNumber
      });

      return {
        success: true,
        messageId: result.sid,
        cost: this.calculateCost(message, this.getCountryFromPhone(phoneNumber)),
        status: result.status, // 'queued', 'sent', 'delivered', etc.
        provider: 'twilio'
      };
    } catch (error) {
      console.error('Twilio SMS send error:', error);
      throw new Error(`Twilio: ${error.message}`);
    }
  }

  /**
   * Get delivery status from Twilio
   */
  async getStatus(messageId) {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const message = await this.client.messages(messageId).fetch();

      return {
        status: this.normalizeStatus(message.status),
        deliveredAt: message.dateUpdated,
        error: message.errorCode ? {
          code: message.errorCode,
          message: message.errorMessage
        } : null
      };
    } catch (error) {
      console.error('Twilio status check error:', error);
      throw new Error(`Twilio: ${error.message}`);
    }
  }

  /**
   * Calculate SMS cost (Twilio Germany pricing)
   */
  calculateCost(message, country = 'DE') {
    const segments = Math.ceil(message.length / 160);
    const pricePerSegment = country === 'DE' ? 7.7 : 10; // EUR cents
    return Math.round(segments * pricePerSegment);
  }

  /**
   * Validate Twilio webhook signature
   * https://www.twilio.com/docs/usage/webhooks/webhooks-security
   */
  validateWebhook(payload, signature, timestamp, secret) {
    if (!secret) return false;

    try {
      // Twilio uses a different validation method
      // URL + sorted params + authToken = expectedSignature
      const crypto = require('crypto');
      const url = payload.url || '';
      
      // Build signature string
      let signatureString = url;
      const sortedKeys = Object.keys(payload).sort();
      for (const key of sortedKeys) {
        if (key !== 'url') {
          signatureString += key + payload[key];
        }
      }

      const expectedSignature = crypto
        .createHmac('sha1', secret)
        .update(Buffer.from(signatureString, 'utf-8'))
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Twilio webhook validation error:', error);
      return false;
    }
  }

  /**
   * Parse Twilio webhook payload
   */
  parseWebhook(payload) {
    return {
      messageId: payload.MessageSid || payload.SmsSid,
      status: this.normalizeStatus(payload.MessageStatus || payload.SmsStatus),
      timestamp: new Date(),
      error: payload.ErrorCode ? {
        code: payload.ErrorCode,
        message: payload.ErrorMessage
      } : null
    };
  }

  /**
   * Normalize Twilio status to standard format
   */
  normalizeStatus(twilioStatus) {
    const statusMap = {
      'queued': 'pending',
      'sending': 'pending',
      'sent': 'sent',
      'delivered': 'delivered',
      'undelivered': 'failed',
      'failed': 'failed'
    };

    return statusMap[twilioStatus] || twilioStatus;
  }

  /**
   * Get country code from phone number
   */
  getCountryFromPhone(phoneNumber) {
    if (phoneNumber.startsWith('+49')) return 'DE';
    if (phoneNumber.startsWith('+1')) return 'US';
    if (phoneNumber.startsWith('+44')) return 'GB';
    // Add more country codes as needed
    return 'DE'; // Default
  }

  getName() {
    return 'twilio';
  }

  isAvailable() {
    return !!(this.accountSid && this.authToken && this.phoneNumber);
  }
}
