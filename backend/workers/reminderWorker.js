import cron from 'node-cron';
import Booking from '../models/Booking.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendReminderSMS } from '../services/smsService.js';
import logger from '../utils/logger.js';

/**
 * Reminder Worker
 *
 * Runs every 30 minutes
 * Finds confirmed bookings that are 24h away
 * Sends reminder SMS
 */

let isRunning = false;

async function processReminders() {
  if (isRunning) {
    logger.info('[Reminder] Already running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[Reminder] Starting reminder worker...');

  try {
    // Find bookings 24h away (23-25h window to avoid missing), cap at 500
    const now = new Date();
    const hours23FromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const hours25FromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      startTime: {
        $gte: hours23FromNow,
        $lte: hours25FromNow
      },
      status: 'confirmed'
    })
      .populate('customer', 'firstName lastName phone')
      .populate('salon', 'businessName phone email address')
      .populate('service', 'name duration price')
      .limit(500)
      .maxTimeMS(5000);

    logger.info(`[Reminder] Found ${bookings.length} bookings needing 24h reminder`);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    // Batch-fetch all relevant confirmations in one query to avoid N+1
    const bookingIds = bookings.map(b => b._id);
    const confirmations = await BookingConfirmation.find({
      bookingId: { $in: bookingIds },
      status: 'confirmed'
    }).maxTimeMS(5000);
    const confirmationMap = new Map(confirmations.map(c => [c.bookingId.toString(), c]));

    for (const booking of bookings) {
      try {
        const confirmation = confirmationMap.get(booking._id.toString());

        if (!confirmation) {
          logger.warn(`[Reminder] Booking ${booking._id} is not confirmed, skipping reminder`);
          skipped++;
          continue;
        }

        // Check if already sent 24h reminder (avoid duplicates)
        // 1st reminder = 48h confirmation, 2nd reminder = 24h reminder
        if (confirmation.remindersSent >= 2) {
          logger.info(`[Reminder] Already sent 24h reminder for booking ${booking._id}`);
          skipped++;
          continue;
        }

        // Send reminder SMS
        try {
          await sendReminderSMS(booking);

          // Update confirmation record
          confirmation.remindersSent += 1;
          confirmation.lastReminderSent = new Date();
          await confirmation.save();

          logger.info(`[Reminder] ✅ Sent 24h reminder for booking ${booking._id}`);
          sent++;

        } catch (smsError) {
          logger.error(`[Reminder] ❌ Failed to send reminder SMS for booking ${booking._id}:`, smsError.message);
          errors++;
        }

      } catch (error) {
        logger.error(`[Reminder] Error processing booking ${booking._id}:`, error);
        errors++;
        ErrorLog.logError({
          type: 'error',
          message: `Reminder: failed processing booking ${booking._id}: ${error.message}`,
          source: 'worker',
          salonId: booking.salon?._id,
          stackTrace: error.stack
        }).catch(e => logger.error('[Reminder] ErrorLog write failed:', e.message));
      }
    }

    logger.info(`[Reminder] Finished: ${sent} sent, ${skipped} skipped, ${errors} errors`);

  } catch (error) {
    logger.error('[Reminder] Fatal error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `Reminder worker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[Reminder] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
}

/**
 * Start the reminder worker
 */
export function startReminderWorker() {
  logger.info('[Reminder] Initializing reminder worker (runs every 30 minutes)...');

  // Run immediately on startup
  processReminders();

  // Schedule to run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    processReminders();
  });

  logger.info('[Reminder] Worker scheduled ✅');
}

export default startReminderWorker;
