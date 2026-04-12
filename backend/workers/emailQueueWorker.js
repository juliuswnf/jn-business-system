import logger from '../utils/logger.js';
/**
 * Email Queue Worker
 * Processes scheduled emails (reminders and review requests)
 * from the EmailQueue collection
 */

import EmailQueue from '../models/EmailQueue.js';
import EmailLog from '../models/EmailLog.js';
import Booking from '../models/Booking.js';
import Salon from '../models/Salon.js';
import ErrorLog from '../models/ErrorLog.js';
import emailService from '../services/emailService.js';
import emailTemplateService from '../services/emailTemplateService.js';
import alertingService from '../services/alertingService.js';

/**
 * ? SECURITY FIX: Determine if error is transient (retryable) or permanent
 * Transient errors: Timeout, Connection Reset, Network issues
 * Permanent errors: Invalid Email, Authentication Failed, Invalid Format
 */
const isTransientError = (error) => {
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  // Transient error patterns
  const transientPatterns = [
    'timeout',
    'connection reset',
    'connection refused',
    'econnrefused',
    'etimedout',
    'network',
    'temporary',
    'retry',
    'rate limit',
    'too many requests',
    'service unavailable',
    '503',
    '502',
    '504',
    'econnreset'
  ];

  // Permanent error patterns
  const permanentPatterns = [
    'invalid email',
    'email address',
    'authentication failed',
    'unauthorized',
    '401',
    '403',
    'invalid format',
    'malformed',
    'rejected',
    'bounced',
    'blacklisted'
  ];

  // Check for permanent errors first
  if (permanentPatterns.some(pattern => errorMessage.includes(pattern) || errorCode.includes(pattern))) {
    return false;
  }

  // Check for transient errors
  if (transientPatterns.some(pattern => errorMessage.includes(pattern) || errorCode.includes(pattern))) {
    return true;
  }

  // Default: assume transient (can retry)
  return true;
};

/**
 * Process all pending emails in the queue
 */
const processEmailQueue = async () => {
  try {
    const now = new Date();
    // ? SECURITY FIX: Get emails ready to send (scheduled and retry time passed)
    const pendingEmails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: now },
      $or: [
        { nextRetryAt: { $exists: false } },
        { nextRetryAt: { $lte: now } },
        { nextRetryAt: null }
      ],
      attempts: { $lt: 3 }
    })
      .limit(50)
      .maxTimeMS(5000); // Process in batches

    if (pendingEmails.length === 0) {
      return;
    }

    logger.log(`?? Processing ${pendingEmails.length} pending emails...`);

    // Batch-fetch booking/salon references to avoid N+1 reads per queue item
    const bookingRefs = pendingEmails
      .map(item => item.booking || item.bookingId)
      .filter(Boolean);

    const bookings = bookingRefs.length > 0
      ? await Booking.find({ _id: { $in: bookingRefs } })
        .populate('salonId')
        .populate('serviceId')
        .maxTimeMS(5000)
      : [];

    const bookingMap = new Map(bookings.map(booking => [booking._id.toString(), booking]));

    const directSalonRefs = pendingEmails
      .map(item => item.salon || item.salonId)
      .filter(Boolean);
    const salonRefsFromBookings = bookings
      .map(booking => booking.salonId?._id || booking.salonId)
      .filter(Boolean);
    const salonRefs = [...new Set([...directSalonRefs, ...salonRefsFromBookings].map(id => id.toString()))];

    const salons = salonRefs.length > 0
      ? await Salon.find({ _id: { $in: salonRefs } }).maxTimeMS(5000)
      : [];
    const salonMap = new Map(salons.map(salon => [salon._id.toString(), salon]));

    await Promise.allSettled(
      pendingEmails.map(queueItem => processEmailQueueItem(queueItem, bookingMap, salonMap))
    );

    logger.log(`? Finished processing email queue - ${pendingEmails.length} emails processed`);
  } catch (error) {
    logger.error('? Error processing email queue:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `EmailQueue worker error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[EmailQueue] ErrorLog write failed:', e.message));
  }
};

/**
 * Process a single email queue item
 * @param {Object} queueItem - EmailQueue document
 */
const processEmailQueueItem = async (queueItem, bookingMap = new Map(), salonMap = new Map()) => {
  // Declare outside try so catch block can access them
  let bookingRef;
  let salonRef;
  try {
    logger.log(`?? Processing email: ${queueItem._id} | Type: ${queueItem.type} | To: ${queueItem.to || 'N/A'}`);

    bookingRef = queueItem.booking || queueItem.bookingId;
    salonRef = queueItem.salon || queueItem.salonId;

    // If no bookingId, treat as direct email (notification/custom)
    if (!bookingRef) {
      logger.log(`?? Direct email (no booking) - sending to: ${queueItem.to}`);

      // Send direct email
      const result = await emailService.sendEmail({
        to: queueItem.to,
        subject: queueItem.subject,
        body: queueItem.body,
        html: queueItem.html || queueItem.body.replace(/\n/g, '<br>')
      });

      // Mark as sent
      queueItem.status = 'sent';
      queueItem.sentAt = new Date();
      queueItem.attempts = (queueItem.attempts || 0) + 1;
      await queueItem.save();

      logger.log(`? Email sent successfully: ${queueItem._id} | MessageID: ${result?.messageId || 'N/A'}`);
      return;
    }

    // Get booking with related data
    const booking = bookingMap.get(String(bookingRef));
    if (!booking) {
      logger.warn(`??  Booking not found: ${bookingRef}`);
      queueItem.status = 'failed';
      queueItem.error = {
        message: 'Booking not found',
        code: 'BOOKING_NOT_FOUND'
      };
      queueItem.attempts = (queueItem.attempts || 0) + 1;
      await queueItem.save();
      return;
    }
    // Get salon
    const bookingSalonId = booking.salonId?._id || booking.salonId;
    const salon = salonMap.get(String(bookingSalonId || salonRef));
    if (!salon) {
      logger.warn('??  Salon not found');
      queueItem.status = 'failed';
      queueItem.error = {
        message: 'Salon not found',
        code: 'SALON_NOT_FOUND'
      };
      await queueItem.save();
      return;
    }
    // Get language preference
    const language = emailTemplateService.getEmailLanguage(salon, booking);
    let emailData;
    // Render email based on type
    switch (queueItem.type) {
    case 'reminder':
      emailData = emailTemplateService.renderReminderEmail(salon, booking, language);
      break;
    case 'review':
      emailData = emailTemplateService.renderReviewEmail(salon, booking, language);
      break;
    case 'confirmation':
      emailData = emailTemplateService.renderConfirmationEmail(salon, booking, language);
      break;
    default:
      throw new Error(`Unknown email type: ${queueItem.type}`);
    }
    // Send email
    const result = await emailService.sendEmail({
      to: booking.customerEmail,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.body.replace(/\n/g, '<br>') // Simple HTML conversion
    });
    // Mark as sent
    queueItem.status = 'sent';
    queueItem.sentAt = new Date();
    queueItem.attempts = (queueItem.attempts || 0) + 1;
    await queueItem.save();

    logger.log(`? Email sent successfully: ${queueItem._id} | To: ${booking.customerEmail} | MessageID: ${result?.messageId || 'N/A'}`);

    // Log successful send (with required fields)
    try {
      await EmailLog.create({
        companyId: salon._id,
        recipientEmail: booking.customerEmail,
        subject: emailData.subject,
        emailType: queueItem.type === 'reminder' ? 'booking-reminder' :
                   queueItem.type === 'review' ? 'review-request' :
                   queueItem.type === 'confirmation' ? 'booking-confirmation' : 'general',
        status: 'sent',
        sentAt: new Date(),
        attempts: 1,
        userId: booking.customerId
      });
    } catch (logError) {
      // Non-blocking
      logger.warn(`??  Failed to log email: ${logError.message}`);
    }

    logger.log(`?? Sent ${queueItem.type} email (booking: ${booking._id})`);
  } catch (error) {
    logger.error(`? Failed to send email ${queueItem._id}:`, error.message);
    logger.error(`   Error stack: ${error.stack}`);

    ErrorLog.logError({
      type: 'error',
      message: `EmailQueue: failed to process queue item ${queueItem._id}: ${error.message}`,
      source: 'worker',
      salonId: salonRef || null,
      stackTrace: error.stack
    }).catch(e => logger.error('[EmailQueue] ErrorLog write failed:', e.message));

    // ? SECURITY FIX: Determine if error is transient or permanent
    const isTransient = isTransientError(error);

    // Increment retry counter
    queueItem.attempts = (queueItem.attempts || 0) + 1;
    queueItem.retryCount = (queueItem.retryCount || 0) + 1;
    queueItem.lastAttemptAt = new Date();
    queueItem.error = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN',
      isTransient
    };

    // If permanent error or max retries reached, mark as failed
    if (!isTransient || queueItem.attempts >= queueItem.maxAttempts) {
      queueItem.status = 'failed';
      queueItem.nextRetryAt = null;
      logger.error(`?? Email ${queueItem._id} failed after ${queueItem.attempts} attempts - ${isTransient ? 'MAX RETRIES REACHED' : 'PERMANENT FAILURE'}`);

      // ? SECURITY FIX: Alert for critical emails that failed
      const criticalTypes = ['confirmation', 'payment_receipt', 'booking_confirmation'];
      if (criticalTypes.includes(queueItem.type)) {
        try {
          await alertingService.sendAlert({
            type: 'email_failure',
            severity: 'critical',
            title: `Critical Email Failed: ${queueItem.type}`,
            message: `Failed to send ${queueItem.type} email after ${queueItem.attempts} attempts`,
            details: {
              emailId: queueItem._id,
              recipient: queueItem.to,
              error: error.message,
              isTransient
            }
          });
        } catch (alertError) {
          logger.error('Failed to send alert for email failure:', alertError);
        }
      }

      // Log failed send (with required fields, non-blocking)
      try {
        await EmailLog.create({
          companyId: salonRef,
          recipientEmail: queueItem.to || 'unknown',
          subject: `Failed: ${queueItem.type}`,
          emailType: 'general',
          status: 'failed',
          error: error.message,
          sentAt: new Date(),
          attempts: queueItem.attempts
        });
      } catch (logError) {
        // Non-blocking
        logger.warn(`??  Failed to log email failure: ${logError.message}`);
      }
    } else {
      // ? SECURITY FIX: Schedule retry with exponential backoff (1min, 5min, 15min)
      const backoffMinutes = queueItem.attempts === 1 ? 1 :
                            queueItem.attempts === 2 ? 5 : 15;
      queueItem.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
      queueItem.status = 'pending'; // Keep as pending for retry
      logger.log(`?? Scheduled retry #${queueItem.attempts} in ${backoffMinutes} minutes (transient error)`);
    }
    await queueItem.save();
  }
};

/**
 * Schedule reminder email for a booking
 * @param {Object} booking - Booking document
 * @param {Object} salon - Salon document
 */
const scheduleReminderEmail = async (booking, salon) => {
  try {
    const reminderHours = salon.reminderHoursBefore || 24;
    const scheduledFor = new Date(booking.bookingDate.getTime() - reminderHours * 60 * 60 * 1000);
    // Don't schedule if booking date is in the past or too soon
    if (scheduledFor < new Date()) {
      logger.log('??  Skipping reminder - booking is too soon or in the past');
      return null;
    }

    const serviceName = booking.serviceId?.name || 'Ihr Termin';
    const queueItem = await EmailQueue.create({
      salon: salon._id,
      booking: booking._id,
      to: booking.customerEmail,
      subject: `Erinnerung: ${serviceName}`,
      body: `Erinnerung zu Ihrem Termin ${serviceName}.`,
      type: 'reminder',
      scheduledFor,
      status: 'pending'
    });
    logger.log(`? Scheduled reminder email for ${booking.customerEmail} at ${scheduledFor}`);
    return queueItem;
  } catch (error) {
    logger.error('Error scheduling reminder email:', error);
    throw error;
  }
};

/**
 * Schedule review request email for a booking
 * @param {Object} booking - Booking document
 * @param {Object} salon - Salon document
 */
const scheduleReviewEmail = async (booking, salon) => {
  try {
    const reviewHours = salon.reviewHoursAfter || 2;
    const scheduledFor = new Date(booking.bookingDate.getTime() + reviewHours * 60 * 60 * 1000);

    const serviceName = booking.serviceId?.name || 'Ihrem Termin';
    const queueItem = await EmailQueue.create({
      salon: salon._id,
      booking: booking._id,
      to: booking.customerEmail,
      subject: `Wie war ${serviceName}?`,
      body: `Bitte bewerten Sie ${serviceName}.`,
      type: 'review',
      scheduledFor,
      status: 'pending'
    });
    logger.log(`? Scheduled review email for ${booking.customerEmail} at ${scheduledFor}`);
    return queueItem;
  } catch (error) {
    logger.error('Error scheduling review email:', error);
    throw error;
  }
};

/**
 * Cancel scheduled emails for a booking
 * @param {String} bookingId - Booking ID
 */
const cancelScheduledEmails = async (bookingId) => {
  try {
    const result = await EmailQueue.updateMany(
      {
        $or: [
          { booking: bookingId },
          { bookingId }
        ],
        status: 'pending'
      },
      {
        status: 'cancelled',
        error: 'Booking was cancelled'
      }
    ).maxTimeMS(5000);
    logger.log(`?? Cancelled ${result.modifiedCount} pending emails for booking ${bookingId}`);
    return result;
  } catch (error) {
    logger.error('Error cancelling scheduled emails:', error);
    throw error;
  }
};

/**
 * Clean up old processed emails from queue
 * Removes sent/failed/cancelled emails older than 30 days
 */
const cleanupOldEmails = async () => {
  try {
    // Delete sent/failed/cancelled emails older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await EmailQueue.deleteMany({
      status: { $in: ['sent', 'failed', 'cancelled'] },
      updatedAt: { $lt: thirtyDaysAgo }
    }).maxTimeMS(5000);
    if (result.deletedCount > 0) {
      logger.log(`🧹 Cleaned up ${result.deletedCount} old email queue items`);
    }

    // Auto-expire stuck pending emails: scheduledFor >2h ago and still pending
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const expiredResult = await EmailQueue.updateMany(
      { status: 'pending', scheduledFor: { $lt: twoHoursAgo } },
      { $set: { status: 'failed', error: 'Auto-expired: pending >2h past scheduled time' } }
    ).maxTimeMS(5000);
    if (expiredResult.modifiedCount > 0) {
      logger.log(`⏰ Auto-expired ${expiredResult.modifiedCount} stuck pending emails`);
    }

    return result;
  } catch (error) {
    logger.error('Error cleaning up old emails:', error);
    throw error;
  }
};

/**
 * Safe wrapper for processEmailQueue
 * Catches and logs errors without crashing the worker
 */
const processEmailQueueSafe = async () => {
  try {
    await processEmailQueue();
  } catch (error) {
    logger.error('? Email queue worker error (continuing):', error);
  }
};

/**
 * Start the email queue worker
 * Runs every minute to process pending emails
 */
const startWorker = () => {
  logger.log('?? Starting email queue worker...');

  // ? HIGH FIX #9: Run immediately on startup (don't wait 1 minute)
  processEmailQueueSafe();

  // ? HIGH FIX #9: Use safe wrapper - worker never dies
  const intervalId = setInterval(processEmailQueueSafe, 60 * 1000);

  // Cleanup old emails once per day
  const cleanupIntervalId = setInterval(cleanupOldEmails, 24 * 60 * 60 * 1000);

  // Return interval IDs so they can be cleared if needed
  return { intervalId, cleanupIntervalId };
};

/**
 * Stop the email queue worker
 * @param {Object} intervals - Object with intervalId and cleanupIntervalId
 */
const stopWorker = (intervals) => {
  if (intervals.intervalId) {
    clearInterval(intervals.intervalId);
  }
  if (intervals.cleanupIntervalId) {
    clearInterval(intervals.cleanupIntervalId);
  }
  logger.log('?? Email queue worker stopped');
};

// ES6 Export
export default {
  processEmailQueue,
  processEmailQueueItem,
  scheduleReminderEmail,
  scheduleReviewEmail,
  cancelScheduledEmails,
  cleanupOldEmails,
  startWorker,
  stopWorker
};
