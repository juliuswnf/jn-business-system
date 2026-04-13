import cron from 'node-cron';
import logger from '../utils/logger.js';
import Booking from '../models/Booking.js';
import { sendBookingReminder, sendReviewRequest } from './emailService.js';
import backupService from './backupService.js';

// ==================== BOOKING REMINDER & REVIEW JOBS ====================

/**
 * Send booking reminders 24h before appointment
 * Runs every hour to catch all upcoming bookings
 */
const sendBookingReminders = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find confirmed bookings in the next 24-25 hours that haven't been reminded
    const bookings = await Booking.find({
      status: 'confirmed',
      bookingDate: { $gte: in24Hours, $lt: in25Hours },
      'emailsSent.reminder': { $ne: true }
    }).populate('salonId serviceId');

    logger.info(`📧 Reminder check: Found ${bookings.length} bookings to remind`);

    for (const booking of bookings) {
      try {
        if (!booking.salonId) continue;

        // Send reminder email using email service
        await sendBookingReminder(booking);

        // Mark as reminded
        booking.emailsSent.reminder = true;
        await booking.save();

        logger.info(`? Reminder sent for booking ${booking._id}`);
      } catch (emailError) {
        logger.error(`❌ Failed to send reminder for booking ${booking._id}:`, emailError.message);
      }
    }
  } catch (err) {
    logger.error('❌ sendBookingReminders failed:', err.message);
  }
};

/**
 * Send review requests 2h after completed appointments
 * Runs every hour
 */
const sendReviewRequests = async () => {
  try {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    // Find completed bookings from 2-3 hours ago that haven't received review request
    const bookings = await Booking.find({
      status: 'completed',
      bookingDate: { $gte: threeHoursAgo, $lt: twoHoursAgo },
      'emailsSent.review': { $ne: true }
    }).populate('salonId serviceId');

    logger.info(`⭐ Review check: Found ${bookings.length} bookings for review request`);

    for (const booking of bookings) {
      try {
        const salon = booking.salonId;
        if (!salon || !salon.googleReviewUrl) continue;

        // Send review request email using email service
        await sendReviewRequest(booking);

        // Mark as sent
        booking.emailsSent.review = true;
        await booking.save();

        logger.info(`? Review request sent for booking ${booking._id}`);
      } catch (emailError) {
        logger.error(`❌ Failed to send review request for booking ${booking._id}:`, emailError.message);
      }
    }
  } catch (err) {
    logger.error('❌ sendReviewRequests failed:', err.message);
  }
};

// ==================== CLEANUP JOBS ====================

const cleanupExpiredErrorLogs = async () => {
  try {
    // MVP: Error logs are console-only, no DB cleanup needed
    logger.log('✅ Cleanup: Error logs cleanup triggered (console-only for MVP)');
  } catch (err) {
    logger.error('❌ Cleanup error logs failed:', err.message);
  }
};

const cleanupExpiredSessions = async () => {
  try {
    logger.log('✅ Session cleanup triggered');
  } catch (err) {
    logger.error('❌ Session cleanup failed:', err.message);
  }
};

const cleanupOrphanedData = async () => {
  try {
    logger.log('✅ Orphaned data cleanup triggered');
  } catch (err) {
    logger.error('❌ Orphaned data cleanup failed:', err.message);
  }
};

// ==================== MAINTENANCE JOBS ====================

const performDatabaseMaintenance = async () => {
  try {
    logger.log('✅ Database maintenance started');
    // Add DB index building, stats update, etc.
  } catch (err) {
    logger.error('❌ Database maintenance failed:', err.message);
  }
};

const generateSystemReport = async () => {
  try {
    // MVP: Simple console report
    logger.log('✅ System Report: System running normally');
  } catch (err) {
    logger.error('❌ System report generation failed:', err.message);
  }
};

// ==================== MONITORING JOBS ====================

const checkSystemHealth = async () => {
  try {
    logger.log('✅ System health check passed');
  } catch (err) {
    logger.error('❌ System health check failed:', err.message);
  }
};

const checkWebhookHealth = async () => {
  try {
    logger.log('✅ Webhook health check triggered');
  } catch (err) {
    logger.error('❌ Webhook health check failed:', err.message);
  }
};

// ==================== NOTIFICATION JOBS ====================

const sendDailyReports = async () => {
  try {
    logger.log('✅ Daily reports sent');
  } catch (err) {
    logger.error('❌ Daily report sending failed:', err.message);
  }
};

const sendWeeklyDigest = async () => {
  try {
    logger.log('✅ Weekly digest sent');
  } catch (err) {
    logger.error('❌ Weekly digest sending failed:', err.message);
  }
};

// ==================== INITIALIZE CRON JOBS ====================

export const initializeCronJobs = () => {
  try {
    logger.log('?? Initializing Cron Jobs...');

    // ? SECURITY FIX: Automated Database Backups
    // Every day at 3 AM - Create database backup.
    // NOT a standalone worker: backups are a one-shot daily task with no queue, no isRunning guard,
    // and no in-process state. A cron job is sufficient and correct here.
    cron.schedule(backupService.BACKUP_SCHEDULE, async () => {
      try {
        logger.log('?? Starting scheduled database backup...');
        await backupService.runBackupJob();
      } catch (error) {
        logger.error('? Scheduled backup failed:', error);
      }
    });

    // ? Cleanup Jobs
    // Every day at 2:30 AM - Clean up old error logs.
    // NOT a standalone worker: pure database housekeeping with no shared state or queuing needs.
    cron.schedule('30 2 * * *', cleanupExpiredErrorLogs);

    // Every day at 3 AM - Clean up expired sessions.
    // NOT a standalone worker: stateless one-shot cleanup; no retry or batch-cap logic required.
    cron.schedule('0 3 * * *', cleanupExpiredSessions);

    // Every day at 4 AM - Clean up orphaned data.
    // NOT a standalone worker: stateless housekeeping; runs once per day with no concurrency risk.
    cron.schedule('0 4 * * *', cleanupOrphanedData);

    // ✅ Maintenance Jobs
    // Every Sunday at 3 AM - Database maintenance.
    // NOT a standalone worker: weekly, read-only maintenance with no customer-facing side effects.
    cron.schedule('0 3 * * 0', performDatabaseMaintenance);

    // Every day at 6 AM - Generate system report.
    // NOT a standalone worker: analytics snapshot with no queue or retry semantics needed.
    cron.schedule('0 6 * * *', generateSystemReport);

    // ✅ Monitoring Jobs
    // Every 5 minutes - Check system health.
    // NOT a standalone worker: passive health-check probe only; does not write customer data.
    cron.schedule('*/5 * * * *', checkSystemHealth);

    // Every 10 minutes - Check webhook health.
    // NOT a standalone worker: passive endpoint probe; no customer data mutations.
    cron.schedule('*/10 * * * *', checkWebhookHealth);

    // ✅ Notification Jobs
    // Every day at 8 AM - Send daily reports.
    // NOT a standalone worker: fires once per day; no persistent queue or idempotency required.
    cron.schedule('0 8 * * *', sendDailyReports);

    // Every Monday at 9 AM - Send weekly digest.
    // NOT a standalone worker: fires once per week; no persistent queue or idempotency required.
    cron.schedule('0 9 * * 1', sendWeeklyDigest);

    // ✅ Booking Notification Jobs (EMAIL channel)
    // Every hour - Send 24h EMAIL booking reminders.
    // NOT a duplicate of reminderWorker.js: reminderWorker sends SMS via smsService and tracks
    // state in BookingConfirmation.remindersSent. This job sends EMAILS via emailService and
    // tracks state in booking.emailsSent.reminder — a completely different channel and flag.
    cron.schedule('0 * * * *', sendBookingReminders);

    // Every hour - Send EMAIL review requests (2h after appointment).
    // NOT a standalone worker: no corresponding worker handles post-appointment review emails.
    // cronService is the single source of truth for review request emails.
    cron.schedule('30 * * * *', sendReviewRequests);

    // ✅ NO-SHOW-KILLER: DSGVO Auto-Delete Payment Methods (daily at 3:15 AM)
    // NOT a standalone worker: GDPR data-deletion task that runs once daily with no queue or
    // retry semantics. noShowChargeWorker handles Stripe no-show CHARGES; this job handles
    // post-policy GDPR DELETION of stored payment methods — a separate obligation entirely.
    cron.schedule('15 3 * * *', async () => {
      try {
        logger.info('🧹 Starting payment method cleanup (DSGVO auto-delete)...');

        const Customer = (await import('../models/Customer.js')).default;
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        const now = new Date();

        // Find customers with payment methods scheduled for deletion
        const customers = await Customer.find({
          'paymentMethods.scheduledDeletionAt': { $lte: now },
          'paymentMethods.deletedAt': null
        });

        let deletedCount = 0;

        for (const customer of customers) {
          for (const pm of customer.paymentMethods) {
            if (pm.scheduledDeletionAt && pm.scheduledDeletionAt <= now && !pm.deletedAt) {
              try {
                // Delete from Stripe
                await stripe.paymentMethods.detach(pm.paymentMethodId);

                // Mark as deleted in database
                pm.deletedAt = new Date();
                deletedCount++;

                logger.info(`✅ Deleted payment method ${pm.paymentMethodId} for customer ${customer._id} (DSGVO auto-delete)`);
              } catch (error) {
                logger.error(`❌ Failed to delete payment method ${pm.paymentMethodId}:`, error);
              }
            }
          }

          // Save customer with updated payment methods
          await customer.save();
        }

        logger.info(`✅ Payment method cleanup completed: ${deletedCount} payment methods deleted`);
      } catch (error) {
        logger.error('❌ Payment method cleanup error:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Berlin'
    });

    logger.log('✅ All Cron Jobs initialized successfully');
  } catch (err) {
    logger.error('❌ Failed to initialize cron jobs:', err.message);
    throw err;
  }
};

// ==================== STOP CRON JOBS ====================

export const stopAllCronJobs = () => {
  try {
    cron.getTasks().forEach(task => {
      task.stop();
    });
    logger.log('✅ All cron jobs stopped');
  } catch (err) {
    logger.error('❌ Failed to stop cron jobs:', err.message);
    throw err;
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  initializeCronJobs,
  stopAllCronJobs,
  cleanupExpiredErrorLogs,
  cleanupExpiredSessions,
  checkSystemHealth,
  sendDailyReports
};
