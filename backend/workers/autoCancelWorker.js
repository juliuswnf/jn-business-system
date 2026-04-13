import cron from 'node-cron';
import BookingConfirmation from '../models/BookingConfirmation.js';
import Booking from '../models/Booking.js';
import SlotSuggestion from '../models/SlotSuggestion.js';
import Waitlist from '../models/Waitlist.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendWaitlistOffer } from '../services/smsService.js';
import logger from '../utils/logger.js';

/**
 * Auto-Cancel Worker
 *
 * Runs every 15 minutes
 * Finds expired confirmations (deadline passed, not confirmed)
 * Auto-cancels the booking and triggers waitlist matcher
 */

let isRunning = false;
let cronTask = null;

async function processAutoCancellations() {
  if (isRunning) {
    logger.info('[AutoCancel] Already running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[AutoCancel] Starting auto-cancel worker...');

  try {
    // Find confirmations ready for auto-cancel (cap at 500 to prevent memory issues)
    const capped = await BookingConfirmation.findReadyForAutoCancel()
      .limit(500)
      .maxTimeMS(5000);

    logger.info(`[AutoCancel] Found ${capped.length} bookings to auto-cancel`);

    let cancelled = 0;
    let waitlistOffered = 0;
    let errors = 0;

    // Batch-fetch all bookings in one query to avoid N+1
    const bookingIds = capped.map(c => c.bookingId);
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate('salon', 'businessName')
      .populate('service', 'name duration price')
      .maxTimeMS(5000);
    const bookingMap = new Map(bookings.map(b => [b._id.toString(), b]));

    // Prefetch waitlists per salon/service key to avoid query-in-loop
    const waitlistKeys = [...new Set(bookings.map(b => `${b.salon?._id}:${b.service?._id}`))];
    const waitlistEntries = await Promise.all(
      waitlistKeys.map(async key => {
        const [salonId, serviceId] = key.split(':');
        const waitlist = await Waitlist.find({
          salonId,
          preferredService: serviceId,
          status: 'active'
        })
          .populate('customerId', 'firstName lastName phone')
          .sort({ priorityScore: -1 })
          .limit(5)
          .maxTimeMS(5000);

        return { key, waitlist };
      })
    );
    const waitlistMap = new Map(waitlistEntries.map(entry => [entry.key, entry.waitlist]));

    for (const confirmation of capped) {
      try {
        const booking = bookingMap.get(confirmation.bookingId.toString());

        if (!booking) {
          logger.warn(`[AutoCancel] Booking ${confirmation.bookingId} not found`);
          continue;
        }

        // Auto-cancel the booking
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'auto_cancelled_no_confirmation';
        await booking.save();

        // Mark confirmation as auto-cancelled
        await confirmation.markAutoCancelled();

        logger.info(`[AutoCancel] ✅ Auto-cancelled booking ${booking._id} (no confirmation)`);
        cancelled++;

        // Try to fill slot from waitlist
        try {
          const waitlistKey = `${booking.salon._id}:${booking.service._id}`;
          const waitlist = waitlistMap.get(waitlistKey) || [];

          if (waitlist.length > 0) {
            logger.info(`[AutoCancel] Found ${waitlist.length} waitlist candidates for freed slot`);

            // Offer slot to highest priority customer
            const topCandidate = waitlist[0];

            // Calculate match score
            const matchScore = 100; // High score since exact match (same service)

            // Create slot suggestion
            const suggestion = await SlotSuggestion.create({
              salonId: booking.salon._id,
              customerId: topCandidate.customerId._id,
              serviceId: booking.service._id,
              waitlistId: topCandidate._id,
              originalBookingId: booking._id,
              suggestedSlot: booking.startTime,
              matchScore,
              rankedCustomers: waitlist.map(w => ({
                customerId: w.customerId._id,
                priorityScore: w.priorityScore,
                rank: waitlist.indexOf(w) + 1
              })),
              status: 'pending'
            });

            // Send SMS offer
            try {
              await sendWaitlistOffer(topCandidate, suggestion);
              logger.info(`[AutoCancel] 📱 Sent waitlist offer to customer ${topCandidate.customerId._id}`);
              waitlistOffered++;
            } catch (smsError) {
              logger.error(`[AutoCancel] Failed to send waitlist SMS:`, smsError.message);
            }
          }

        } catch (waitlistError) {
          logger.error(`[AutoCancel] Error processing waitlist for cancelled booking:`, waitlistError);
        }

      } catch (error) {
        logger.error(`[AutoCancel] Error processing confirmation ${confirmation._id}:`, error);
        errors++;
        ErrorLog.logError({
          type: 'error',
          message: `AutoCancel: failed to process confirmation ${confirmation._id}: ${error.message}`,
          source: 'worker',
          salonId: confirmation?.salonId,
          stackTrace: error.stack
        }).catch(e => logger.error('[AutoCancel] ErrorLog write failed:', e.message));
      }
    }

    logger.info(`[AutoCancel] Finished: ${cancelled} cancelled, ${waitlistOffered} waitlist offers sent, ${errors} errors`);

  } catch (error) {
    logger.error('[AutoCancel] Fatal error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `AutoCancel worker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[AutoCancel] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
}

/**
 * Start the auto-cancel worker
 */
export function startAutoCancelWorker() {
  logger.info('[AutoCancel] Initializing auto-cancel worker (runs every 15 minutes)...');

  // Run immediately on startup
  processAutoCancellations();

  // Schedule to run every 15 minutes
  cronTask = cron.schedule('*/15 * * * *', () => {
    processAutoCancellations();
  });

  logger.info('[AutoCancel] Worker scheduled ✅');
}

export function stopAutoCancelWorker() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[AutoCancel] Worker stopped');
  }
}

export default startAutoCancelWorker;
