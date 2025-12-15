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
import emailService from '../services/emailService.js';
import emailTemplateService from '../services/emailTemplateService.js';

/**
 * Process all pending emails in the queue
 */
const processEmailQueue = async () => {
  try {
    const now = new Date();
    // Get all pending emails that are due
    const pendingEmails = await EmailQueue.find({
      status: 'pending',
      scheduledFor: { $lte: now },
      $or: [
        { attempts: { $exists: false } },
        { attempts: { $lt: 3 } }
      ]
    }).limit(50); // Process in batches
    
    if (pendingEmails.length === 0) {
      return;
    }
    
    logger.log(`?? Processing ${pendingEmails.length} pending emails...`);
    
    for (const queueItem of pendingEmails) {
      await processEmailQueueItem(queueItem);
    }
    
    logger.log(`? Finished processing email queue - ${pendingEmails.length} emails processed`);
  } catch (error) {
    logger.error('? Error processing email queue:', error);
  }
};

/**
 * Process a single email queue item
 * @param {Object} queueItem - EmailQueue document
 */
const processEmailQueueItem = async (queueItem) => {
  try {
    logger.log(`?? Processing email: ${queueItem._id} | Type: ${queueItem.type} | To: ${queueItem.to || 'N/A'}`);
    
    // If no bookingId, treat as direct email (notification/custom)
    if (!queueItem.bookingId) {
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
    const booking = await Booking.findById(queueItem.bookingId)
      .populate('salonId')
      .populate('serviceId');
    if (!booking) {
      logger.warn(`??  Booking not found: ${queueItem.bookingId}`);
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
    const salon = await Salon.findById(booking.salonId || queueItem.salonId);
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
    
    // Increment retry counter
    queueItem.attempts = (queueItem.attempts || 0) + 1;
    queueItem.lastAttemptAt = new Date();
    queueItem.error = {
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN'
    };
    
    // If max retries reached, mark as failed
    if (queueItem.attempts >= queueItem.maxAttempts) {
      queueItem.status = 'failed';
      logger.error(`?? Email ${queueItem._id} failed after ${queueItem.attempts} attempts - PERMANENT FAILURE`);
      
      // Log failed send (with required fields, non-blocking)
      try {
        await EmailLog.create({
          companyId: queueItem.salonId || queueItem.salon,
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
      // Schedule retry with exponential backoff
      const backoffMinutes = Math.pow(2, queueItem.attempts) * 5; // 5, 10, 20 minutes
      queueItem.scheduledFor = new Date(Date.now() + backoffMinutes * 60 * 1000);
      queueItem.status = 'pending'; // Keep as pending for retry
      logger.log(`?? Scheduled retry #${queueItem.attempts} in ${backoffMinutes} minutes`);
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
    const queueItem = await EmailQueue.create({
      salonId: salon._id,
      bookingId: booking._id,
      type: 'reminder',
      recipient: booking.customerEmail,
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
    const queueItem = await EmailQueue.create({
      salonId: salon._id,
      bookingId: booking._id,
      type: 'review',
      recipient: booking.customerEmail,
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
        bookingId,
        status: 'pending'
      },
      {
        status: 'cancelled',
        error: 'Booking was cancelled'
      }
    );
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await EmailQueue.deleteMany({
      status: { $in: ['sent', 'failed', 'cancelled'] },
      updatedAt: { $lt: thirtyDaysAgo }
    });
    if (result.deletedCount > 0) {
      logger.log(`?? Cleaned up ${result.deletedCount} old email queue items`);
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
