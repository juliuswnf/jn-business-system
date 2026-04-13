import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Salon from '../models/Salon.js';
import ErrorLog from '../models/ErrorLog.js';
import { chargeNoShowFeeConnect } from '../services/stripeConnectService.js';
import logger from '../utils/logger.js';

/**
 * No-Show Charge Worker
 *
 * Runs every hour.
 * Finds bookings marked as no_show where:
 *   - noShowFee.charged is NOT true
 *   - noShowFee.attemptedAt is null (never attempted) — prevents infinite retries
 *   - startTime is within the last 7 days (process only recent no-shows)
 *   - stripeCustomerId and paymentMethodId are present (payment method stored)
 *   - noShowFeeAcceptance.accepted is true (customer accepted the policy)
 *
 * On success: sets noShowFee.charged = true, records chargeId, amount.
 * On failure: sets noShowFee.attemptedAt so it is NOT retried, logs to ErrorLog.
 */

let isRunning = false;
let cronTask = null;

async function processNoShowCharges() {
  if (isRunning) {
    logger.info('[NoShowCharge] Already running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[NoShowCharge] Starting no-show charge worker...');

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find no-show bookings that require a charge and have not been attempted yet
    const bookings = await Booking.find({
      status: 'no_show',
      'noShowFee.charged': { $ne: true },
      'noShowFee.attemptedAt': null,
      noShowChargeFailed: { $ne: true },
      'noShowFeeAcceptance.accepted': true,
      stripeCustomerId: { $exists: true, $ne: null },
      paymentMethodId: { $exists: true, $ne: null },
      startTime: { $gte: sevenDaysAgo, $lte: now }
    })
      .limit(100) // Process at most 100 per run to prevent overload
      .maxTimeMS(5000);

    logger.info(`[NoShowCharge] Found ${bookings.length} no-show bookings to charge`);

    const salonIds = [...new Set(bookings.map(booking => booking.salonId?.toString()).filter(Boolean))];
    const salons = salonIds.length > 0
      ? await Salon.find({ _id: { $in: salonIds } }).maxTimeMS(5000)
      : [];
    const salonMap = new Map(salons.map(salon => [salon._id.toString(), salon]));

    let charged = 0;
    let failed = 0;

    for (const booking of bookings) {
      // Mark as attempted first (prevents concurrent runs from double-charging)
      booking.noShowFee.attemptedAt = new Date();
      await booking.save();

      try {
        const salon = salonMap.get(booking.salonId?.toString());

        if (!salon) {
          logger.warn(`[NoShowCharge] Salon ${booking.salonId} not found for booking ${booking._id}, skipping`);
          booking.noShowFee.error = 'Salon not found';
          booking.noShowChargeFailed = true;
          await booking.save();
          continue;
        }

        // Charge via Stripe Connect
        const chargeResult = await chargeNoShowFeeConnect(booking, salon);

        // Record successful charge on the booking
        booking.noShowFee.charged = true;
        booking.noShowFee.chargeId = chargeResult.chargeId;
        booking.noShowFee.amount = chargeResult.amount;
        booking.noShowFee.chargedAt = new Date();
        booking.noShowChargeFailed = false;
        booking.noShowFee.transferId = chargeResult.transferId || null;
        if (chargeResult.breakdown) {
          booking.noShowFee.breakdown = chargeResult.breakdown;
        }
        await booking.save();

        logger.info(`[NoShowCharge] ✅ Charged €${(chargeResult.amount / 100).toFixed(2)} no-show fee for booking ${booking._id}`);
        charged++;

      } catch (stripeError) {
        // Stripe threw — record the failure, do NOT retry (attemptedAt already set)
        logger.error(`[NoShowCharge] ❌ Stripe charge failed for booking ${booking._id}: ${stripeError.message}`);
        failed++;

        booking.noShowFee.error = stripeError.message;
        booking.noShowChargeFailed = true;
        await booking.save().catch(saveErr =>
          logger.error(`[NoShowCharge] Failed to persist error state on booking ${booking._id}:`, saveErr.message)
        );

        // Log to ErrorLog for CEO dashboard visibility
        ErrorLog.logError({
          type: 'error',
          message: `NoShowCharge: Stripe charge failed for booking ${booking._id}: ${stripeError.message}`,
          source: 'worker',
          salonId: booking.salonId,
          details: JSON.stringify({ bookingId: booking._id, stripeError: stripeError.message }),
          stackTrace: stripeError.stack
        }).catch(e => logger.error('[NoShowCharge] ErrorLog write failed:', e.message));
      }
    }

    logger.info(`[NoShowCharge] Finished: ${charged} charged, ${failed} failed`);

  } catch (error) {
    logger.error('[NoShowCharge] Fatal error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `NoShowCharge worker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[NoShowCharge] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
}

/**
 * Start the no-show charge worker
 * Runs every hour at minute 10 (offset from other hourly workers)
 */
export function startNoShowChargeWorker() {
  logger.info('[NoShowCharge] Initializing no-show charge worker (runs every hour)...');

  // Run immediately on startup
  processNoShowCharges();

  // Schedule to run every hour at :10
  cronTask = cron.schedule('10 * * * *', () => {
    processNoShowCharges();
  });

  logger.info('[NoShowCharge] Worker scheduled ✅');
}

export function stopNoShowChargeWorker() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[NoShowCharge] Worker stopped');
  }
}

export default startNoShowChargeWorker;
