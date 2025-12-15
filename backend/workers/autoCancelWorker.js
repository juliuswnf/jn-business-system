import cron from 'node-cron';
import mongoose from 'mongoose';
import BookingConfirmation from '../models/BookingConfirmation.js';
import Booking from '../models/Booking.js';
import SlotSuggestion from '../models/SlotSuggestion.js';
import Waitlist from '../models/Waitlist.js';
import { sendWaitlistOffer } from '../services/smsService.js';

/**
 * Auto-Cancel Worker
 * 
 * Runs every 15 minutes
 * Finds expired confirmations (deadline passed, not confirmed)
 * Auto-cancels the booking and triggers waitlist matcher
 */

let isRunning = false;

async function processAutoCancellations() {
  if (isRunning) {
    console.log('[AutoCancel] Already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[AutoCancel] Starting auto-cancel worker...');

  try {
    // Find confirmations ready for auto-cancel
    const confirmations = await BookingConfirmation.findReadyForAutoCancel();

    console.log(`[AutoCancel] Found ${confirmations.length} bookings to auto-cancel`);

    let cancelled = 0;
    let waitlistOffered = 0;
    let errors = 0;

    for (const confirmation of confirmations) {
      try {
        // Get booking details
        const booking = await Booking.findById(confirmation.bookingId)
          .populate('salon', 'businessName')
          .populate('service', 'name duration price');

        if (!booking) {
          console.warn(`[AutoCancel] Booking ${confirmation.bookingId} not found`);
          continue;
        }

        // Auto-cancel the booking
        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'auto_cancelled_no_confirmation';
        await booking.save();

        // Mark confirmation as auto-cancelled
        await confirmation.markAutoCancelled();

        console.log(`[AutoCancel] ✅ Auto-cancelled booking ${booking._id} (no confirmation)`);
        cancelled++;

        // Try to fill slot from waitlist
        try {
          // Find waitlist entries for this salon and service
          const waitlist = await Waitlist.find({
            salonId: booking.salon._id,
            preferredService: booking.service._id,
            status: 'active'
          })
            .populate('customerId', 'firstName lastName phone')
            .sort({ priorityScore: -1 })
            .limit(5); // Top 5 candidates

          if (waitlist.length > 0) {
            console.log(`[AutoCancel] Found ${waitlist.length} waitlist candidates for freed slot`);

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
              console.log(`[AutoCancel] 📱 Sent waitlist offer to customer ${topCandidate.customerId._id}`);
              waitlistOffered++;
            } catch (smsError) {
              console.error(`[AutoCancel] Failed to send waitlist SMS:`, smsError.message);
            }
          }

        } catch (waitlistError) {
          console.error(`[AutoCancel] Error processing waitlist for cancelled booking:`, waitlistError);
        }

      } catch (error) {
        console.error(`[AutoCancel] Error processing confirmation ${confirmation._id}:`, error);
        errors++;
      }
    }

    console.log(`[AutoCancel] Finished: ${cancelled} cancelled, ${waitlistOffered} waitlist offers sent, ${errors} errors`);

  } catch (error) {
    console.error('[AutoCancel] Fatal error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the auto-cancel worker
 */
export function startAutoCancelWorker() {
  console.log('[AutoCancel] Initializing auto-cancel worker (runs every 15 minutes)...');

  // Run immediately on startup
  processAutoCancellations();

  // Schedule to run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processAutoCancellations();
  });

  console.log('[AutoCancel] Worker scheduled ✅');
}

export default startAutoCancelWorker;
