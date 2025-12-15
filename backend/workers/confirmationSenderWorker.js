import cron from 'node-cron';
import Booking from '../models/Booking.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
import { sendBookingConfirmation } from '../services/smsService.js';

/**
 * Confirmation Sender Worker
 *
 * Runs every 5 minutes
 * Finds bookings that are 48-72h away and don't have a confirmation yet
 * Creates BookingConfirmation and sends SMS
 */

let isRunning = false;

async function processConfirmations() {
  if (isRunning) {
    console.log('[ConfirmationSender] Already running, skipping...');
    return;
  }

  isRunning = true;
  console.log('[ConfirmationSender] Starting confirmation sender worker...');

  try {
    // Find bookings 48-72h away (optimal time to send confirmation)
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
      .populate('service', 'name duration price');

    console.log(`[ConfirmationSender] Found ${bookings.length} bookings needing confirmation`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        // Check if confirmation already exists
        const existingConfirmation = await BookingConfirmation.findOne({
          bookingId: booking._id
        });

        if (existingConfirmation) {
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

          console.log(`[ConfirmationSender] âœ… Sent confirmation for booking ${booking._id}`);
          created++;
        } catch (smsError) {
          console.error(`[ConfirmationSender] âŒ Failed to send SMS for booking ${booking._id}:`, smsError.message);
          // Keep confirmation but mark as failed SMS attempt
          errors++;
        }

      } catch (error) {
        console.error(`[ConfirmationSender] Error processing booking ${booking._id}:`, error);
        errors++;
      }
    }

    console.log(`[ConfirmationSender] Finished: ${created} sent, ${skipped} skipped, ${errors} errors`);

  } catch (error) {
    console.error('[ConfirmationSender] Fatal error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the confirmation sender worker
 */
export function startConfirmationSender() {
  console.log('[ConfirmationSender] Initializing confirmation sender worker (runs every 5 minutes)...');

  // Run immediately on startup
  processConfirmations();

  // Schedule to run every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    processConfirmations();
  });

  console.log('[ConfirmationSender] Worker scheduled âœ…');
}

export default startConfirmationSender;
