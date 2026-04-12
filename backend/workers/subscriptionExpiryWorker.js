import cron from 'node-cron';
import Salon from '../models/Salon.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

/**
 * Subscription Expiry Worker
 *
 * Runs every hour at minute 30.
 * Finds salons where:
 *   - subscription.status === 'trial'  (only act on trials)
 *   - subscription.trialEndsAt < now   (trial has ended)
 *
 * For each, atomically sets subscription.status = 'inactive' AND isActive = false
 * in a single updateOne to avoid partial updates.
 *
 * Sends a trial-expired notification email — if email fails the error is
 * caught and logged; the worker does NOT crash.
 *
 * Salons with subscription.status === 'active' are intentionally skipped —
 * Stripe webhooks already handle active subscription management.
 */

let isRunning = false;

async function processSubscriptionExpiry() {
  if (isRunning) {
    logger.info('[SubscriptionExpiry] Already running, skipping...');
    return;
  }

  isRunning = true;
  logger.info('[SubscriptionExpiry] Starting subscription expiry worker...');

  try {
    const now = new Date();

    // Find expired trials: status must be 'trial' AND trialEndsAt must be in the past.
    // Never touch salons with status 'active' — those are managed by Stripe webhooks.
    const expiredSalons = await Salon.find({
      'subscription.status': 'trial',
      'subscription.trialEndsAt': { $lt: now }
    })
      .select('_id name email subscription isActive')
      .limit(200)
      .maxTimeMS(5000);

    logger.info(`[SubscriptionExpiry] Found ${expiredSalons.length} expired trials to process`);

    let expired = 0;
    let errors = 0;

    // Atomically expire all matching trial salons in a single bulk write
    const expireOps = expiredSalons.map(salon => ({
      updateOne: {
        filter: {
          _id: salon._id,
          'subscription.status': 'trial'
        },
        update: {
          $set: {
            'subscription.status': 'inactive',
            isActive: false
          }
        }
      }
    }));

    if (expireOps.length > 0) {
      const bulkResult = await Salon.bulkWrite(expireOps);
      expired = bulkResult.modifiedCount || 0;
    }

    // Send trial-expired notification — fire-and-forget, must not crash worker
    for (const salon of expiredSalons) {
      logger.info(`[SubscriptionExpiry] ✅ Expired trial for salon ${salon._id} (${salon.name || salon.email})`);
      sendEmail({
        to: salon.email,
        subject: 'Ihr Testzeitraum ist abgelaufen',
        body: `Hallo,\n\nIhr kostenloser Testzeitraum für JN Business System ist abgelaufen.\n\nUm weiter Zugang zu Ihrem Konto zu erhalten, wählen Sie bitte einen kostenpflichtigen Tarif.\n\nMit freundlichen Grüßen,\nDas JN Business System Team`,
        html: `<p>Hallo,</p><p>Ihr kostenloser Testzeitraum für <strong>JN Business System</strong> ist abgelaufen.</p><p>Um weiter Zugang zu Ihrem Konto zu erhalten, wählen Sie bitte einen <a href="${process.env.FRONTEND_URL}/billing">kostenpflichtigen Tarif</a>.</p><p>Mit freundlichen Grüßen,<br>Das JN Business System Team</p>`
      }).catch(emailErr => {
        logger.error(`[SubscriptionExpiry] Failed to send expiry email to salon ${salon._id}: ${emailErr.message}`);
        ErrorLog.logError({
          type: 'error',
          message: `SubscriptionExpiry: email send failed for salon ${salon._id}: ${emailErr.message}`,
          source: 'worker',
          salonId: salon._id,
          stackTrace: emailErr.stack
        }).catch(e => logger.error('[SubscriptionExpiry] ErrorLog write failed:', e.message));
      });
    }

    logger.info(`[SubscriptionExpiry] Finished: ${expired} expired, ${errors} errors`);

  } catch (error) {
    logger.error('[SubscriptionExpiry] Fatal error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `SubscriptionExpiry worker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[SubscriptionExpiry] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
}

/**
 * Start the subscription expiry worker
 * Runs every hour at minute 30 (offset from other hourly workers)
 */
export function startSubscriptionExpiryWorker() {
  logger.info('[SubscriptionExpiry] Initializing subscription expiry worker (runs every hour)...');

  // Run immediately on startup
  processSubscriptionExpiry();

  // Schedule to run every hour at :30
  cron.schedule('30 * * * *', () => {
    processSubscriptionExpiry();
  });

  logger.info('[SubscriptionExpiry] Worker scheduled ✅');
}

export default startSubscriptionExpiryWorker;
