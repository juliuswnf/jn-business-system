import cron from 'node-cron';
import Booking from '../models/Booking.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
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
    // Find bookings 24h away (23-25h window to avoid missing)
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
      .populate('service', 'name duration price');

    logger.info(`[Reminder] Found ${bookings.length} bookings needing 24h reminder`);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        // Check if booking is confirmed (has confirmation record)
        const confirmation = await BookingConfirmation.findOne({
          bookingId: booking._id,
          status: 'confirmed'
        });

        if (!confirmation) {
          logger.warn(`[Reminder] Booking ${booking._id} is not confirmed, skipping reminder`);
          skipped++;
          continue;
        }

        // Check if already sent 24h reminder (avoid duplicates)
        if (confirmation.remindersSent >= 2) {
          // 1st reminder = 48h confirmation, 2nd reminder = 24h reminder
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
      }
    }

    logger.info(`[Reminder] Finished: ${sent} sent, ${skipped} skipped, ${errors} errors`);

  } catch (error) {
    logger.error('[Reminder] Fatal error:', error);
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
