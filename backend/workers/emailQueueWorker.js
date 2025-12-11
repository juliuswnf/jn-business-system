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
      retries: { $lt: 3 } // Max 3 retries
    }).limit(50); // Process in batches
    if (pendingEmails.length === 0) {
      return;
    }
    logger.log(`ðŸ“§ Processing ${pendingEmails.length} pending emails...`);
    for (const queueItem of pendingEmails) {
      await processEmailQueueItem(queueItem);
    }
    logger.log('âœ… Finished processing email queue');
  } catch (error) {
    logger.error('âŒ Error processing email queue:', error);
  }
};

/**
 * Process a single email queue item
 * @param {Object} queueItem - EmailQueue document
 */
const processEmailQueueItem = async (queueItem) => {
  try {
    // Get booking with related data
    const booking = await Booking.findById(queueItem.bookingId)
      .populate('salonId')
      .populate('serviceId');
    if (!booking) {
      logger.warn(`âš ï¸  Booking not found: ${queueItem.bookingId}`);
      queueItem.status = 'failed';
      queueItem.error = 'Booking not found';
      await queueItem.save();
      return;
    }
    // Get salon
    const salon = await Salon.findById(booking.salonId || queueItem.salonId);
    if (!salon) {
      logger.warn('âš ï¸  Salon not found');
      queueItem.status = 'failed';
      queueItem.error = 'Salon not found';
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
    await emailService.sendEmail({
      to: booking.customerEmail,
      subject: emailData.subject,
      text: emailData.body,
      html: emailData.body.replace(/\n/g, '<br>') // Simple HTML conversion
    });
    // Mark as sent
    queueItem.status = 'sent';
    queueItem.sentAt = new Date();
    await queueItem.save();
    // Log successful send
    await EmailLog.create({
      salonId: salon._id,
      bookingId: booking._id,
      type: queueItem.type,
      recipient: booking.customerEmail,
      subject: emailData.subject,
      status: 'sent',
      sentAt: new Date()
    });
    logger.log(`✉️ Sent ${queueItem.type} email (booking: ${booking._id})`);
  } catch (error) {
    logger.error(`âŒ Failed to send email ${queueItem._id}:`, error.message);
    // Increment retry counter
    queueItem.retries = (queueItem.retries || 0) + 1;
    queueItem.error = error.message;
    // If max retries reached, mark as failed
    if (queueItem.retries >= 3) {
      queueItem.status = 'failed';
      logger.error(`ðŸ’€ Email ${queueItem._id} failed after ${queueItem.retries} retries`);
      // Log failed send
      await EmailLog.create({
        salonId: queueItem.salonId,
        bookingId: queueItem.bookingId,
        type: queueItem.type,
        recipient: queueItem.recipient || 'unknown',
        subject: `Failed: ${queueItem.type}`,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });
    } else {
      // Schedule retry with exponential backoff
      const backoffMinutes = Math.pow(2, queueItem.retries) * 5; // 5, 10, 20 minutes
      queueItem.scheduledFor = new Date(Date.now() + backoffMinutes * 60 * 1000);
      logger.log(`ðŸ”„ Scheduled retry #${queueItem.retries} in ${backoffMinutes} minutes`);
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
      logger.log('â­ï¸  Skipping reminder - booking is too soon or in the past');
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
    logger.log(`â° Scheduled reminder email for ${booking.customerEmail} at ${scheduledFor}`);
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
    logger.log(`â­ Scheduled review email for ${booking.customerEmail} at ${scheduledFor}`);
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
    logger.log(`ðŸš« Cancelled ${result.modifiedCount} pending emails for booking ${bookingId}`);
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
      logger.log(`ðŸ§¹ Cleaned up ${result.deletedCount} old email queue items`);
    }
    return result;
  } catch (error) {
    logger.error('Error cleaning up old emails:', error);
    throw error;
  }
};

/**
 * Start the email queue worker
 * Runs every minute to process pending emails
 */
const startWorker = () => {
  logger.log('🚀 Starting email queue worker...');
  
  // ✅ HIGH FIX #9: Run immediately on startup (don't wait 1 minute)
  processEmailQueueSafe();

  // ✅ HIGH FIX #9: Use safe wrapper - worker never dies
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
  logger.log('ðŸ›‘ Email queue worker stopped');
};

// ES6 Export
export default {
  processEmailQueue,
  processEmailQueueSafe, // ✅ HIGH FIX #9
  processEmailQueueItem,
  scheduleReminderEmail,
  scheduleReviewEmail,
  cancelScheduledEmails,
  cleanupOldEmails,
  startWorker,
  stopWorker
};
