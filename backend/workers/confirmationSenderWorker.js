import cron from 'node-cron';
import Booking from '../models/Booking.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendBookingConfirmation } from '../services/smsService.js';
import logger from '../utils/logger.js';

/**
 * Confirmation Sender Worker
 *
 * Runs every 5 minutes
 * Finds bookings that are 48-72h away and don't have a confirmation yet
 * Creates BookingConfirmation and sends SMS
 */

let isRunning = false;
let cronTask = null;

async function processConfirmations() {
  if (isRunning) {
    logger.info('[ConfirmationSender] Already running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[ConfirmationSender] Starting confirmation sender worker...');

  try {
    // Find bookings 48-72h away (optimal time to send confirmation), cap at 500
    const now = new Date();
    const hours48FromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const hours72FromNow = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      startTime: {
        $gte: hours48FromNow,
        $lte: hours72FromNow
      },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('customer', 'firstName lastName phone')
      .populate('salon', 'businessName phone email')
      .populate('service', 'name duration price')
      .limit(500)
      .maxTimeMS(5000);

    logger.info(`[ConfirmationSender] Found ${bookings.length} bookings needing confirmation`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Batch-fetch existing confirmations to avoid N+1
    const candidateBookingIds = bookings.map(b => b._id);
    const existingConfirmations = await BookingConfirmation.find({
      bookingId: { $in: candidateBookingIds }
    }).select('bookingId').lean().maxTimeMS(5000);
    const confirmedBookingIdSet = new Set(
      existingConfirmations.map(c => c.bookingId.toString())
    );

    for (const booking of bookings) {
      try {
        if (confirmedBookingIdSet.has(booking._id.toString())) {
          skipped++;
          continue;
        }

        // Calculate deadline (48h from now)
        const confirmationDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Create confirmation
        const confirmation = await BookingConfirmation.create({
          bookingId: booking._id,
          customerId: booking.customer._id,
          salonId: booking.salon._id,
          confirmationDeadline,
          status: 'pending'
        });

        // Send SMS
        try {
          await sendBookingConfirmation(booking, confirmation.confirmationToken);
          confirmation.remindersSent += 1;
          confirmation.lastReminderSent = new Date();
          await confirmation.save();

          logger.info(`[ConfirmationSender] ✅ Sent confirmation for booking ${booking._id}`);
          created++;
        } catch (smsError) {
          logger.error(`[ConfirmationSender] ❌ Failed to send SMS for booking ${booking._id}:`, smsError.message);
          errors++;
        }

      } catch (error) {
        logger.error(`[ConfirmationSender] Error processing booking ${booking._id}:`, error);
        errors++;
        ErrorLog.logError({
          type: 'error',
          message: `ConfirmationSender: failed processing booking ${booking._id}: ${error.message}`,
          source: 'worker',
          salonId: booking.salon?._id,
          stackTrace: error.stack
        }).catch(e => logger.error('[ConfirmationSender] ErrorLog write failed:', e.message));
      }
    }

    logger.info(`[ConfirmationSender] Finished: ${created} sent, ${skipped} skipped, ${errors} errors`);

  } catch (error) {
    logger.error('[ConfirmationSender] Fatal error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `ConfirmationSender worker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[ConfirmationSender] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
}

/**
 * Start the confirmation sender worker
 */
export function startConfirmationSender() {
  logger.info('[ConfirmationSender] Initializing confirmation sender worker (runs every 5 minutes)...');

  // Run immediately on startup
  processConfirmations();

  // Schedule to run every 5 minutes
  cronTask = cron.schedule('*/5 * * * *', () => {
    processConfirmations();
  });

  logger.info('[ConfirmationSender] Worker scheduled ✅');
}

export function stopConfirmationSender() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[ConfirmationSender] Worker stopped');
  }
}

export default startConfirmationSender;
