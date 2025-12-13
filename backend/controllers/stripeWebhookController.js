import logger from '../utils/logger.js';
/**
 * Stripe Webhook Controller
 * Handles Stripe webhook events for subscription management
 */

import Stripe from 'stripe';
import stripeService from '../services/stripeService.js';
import Salon from '../models/Salon.js';
import StripeEvent from '../models/StripeEvent.js';

// Lazy initialization of Stripe (after dotenv is loaded)
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Handle Stripe Webhooks
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('❌ Missing Stripe signature header');
      return res.status(401).json({
        success: false,
        message: 'Missing signature'
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }

    logger.log(`✅ Stripe webhook received: ${event.type} (ID: ${event.id})`);

    // ? IDEMPOTENCY CHECK - prevent duplicate processing
    const alreadyProcessed = await StripeEvent.hasBeenProcessed(event.id);
    if (alreadyProcessed) {
      logger.log(`� � Event ${event.id} already processed, skipping...`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Record event in database (idempotent)
    const stripeEventRecord = await StripeEvent.recordEvent(event.id, event.type, event.data.object);

    try {
      // Handle different event types
    switch (event.type) {
    // ==================== SUBSCRIPTION EVENTS ====================

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(event.data.object);
      break;

      // ==================== INVOICE EVENTS ====================

    case 'invoice.paid':
      await stripeService.handleSuccessfulPayment(event.data.object);
      logger.log('✅ Invoice paid successfully');
      break;

    case 'invoice.payment_failed':
      await stripeService.handleFailedPayment(event.data.object);
      logger.log('❌ Invoice payment failed');
      break;

    case 'invoice.payment_action_required':
      await handlePaymentActionRequired(event.data.object);
      break;

      // ==================== PAYMENT EVENTS ====================

    case 'payment_intent.succeeded':
      logger.log('✅ Payment succeeded:', event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      logger.log('❌ Payment failed:', event.data.object.id);
      break;

    case 'charge.refunded':
      logger.log('💰 Charge refunded:', event.data.object.id);
      break;

      // ==================== CUSTOMER EVENTS ====================

    case 'customer.created':
      logger.log('👤 Customer created:', event.data.object.id);
      break;

    case 'customer.updated':
      logger.log('👤 Customer updated:', event.data.object.id);
      break;

    case 'customer.deleted':
      logger.log('👤 Customer deleted:', event.data.object.id);
      break;

    default:
      logger.log(`� � Unhandled webhook event type: ${event.type}`);
    }

      // ? Mark event as successfully processed
      await stripeEventRecord.markProcessed();

      res.status(200).json({ received: true });
    } catch (processingError) {
      // Mark event as failed for retry
      await stripeEventRecord.markFailed(processingError.message);
      throw processingError; // Re-throw to outer catch block
    }
  } catch (error) {
    logger.error('� Stripe Webhook Error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook processing error',
      ...(process.env.NODE_ENV === 'development' && { debug: error.message })
    });
  }
};

/**
 * Handle subscription created event
 */
const handleSubscriptionCreated = async (subscription) => {
  try {
    const salonId = subscription.metadata?.salonId;

    if (!salonId) {
      logger.warn('Subscription has no salonId in metadata');
      return;
    }

    const salon = await Salon.findById(salonId);

    if (!salon) {
      logger.warn(`Salon not found: ${salonId}`);
      return;
    }

    salon.subscription.stripeSubscriptionId = subscription.id;
    salon.subscription.status = subscription.status === 'trialing' ? 'trial' : 'active';
    salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    // Set tier and billing cycle from metadata
    if (subscription.metadata.tier) {
      salon.subscription.tier = subscription.metadata.tier;
    }
    if (subscription.metadata.billingCycle) {
      salon.subscription.billingCycle = subscription.metadata.billingCycle;
    }

    if (subscription.trial_end) {
      salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
    }

    await salon.save();

    logger.log(`? Subscription created for salon: ${salon.slug} (${salon.subscription.tier} - ${salon.subscription.billingCycle})`);
  } catch (error) {
    logger.error('Error handling subscription created:', error);
  }
};

/**
 * Handle subscription updated event
 */
const handleSubscriptionUpdated = async (subscription) => {
  try {
    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }

    const oldStatus = salon.subscription.status;
    const oldTier = salon.subscription.tier;

    // Update subscription status
    salon.subscription.status = subscription.status === 'trialing' ? 'trial' : subscription.status;
    salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    salon.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

    // Update tier and billing cycle from metadata
    if (subscription.metadata.tier && subscription.metadata.tier !== salon.subscription.tier) {
      salon.subscription.tier = subscription.metadata.tier;
      logger.log(`?? Tier changed from ${oldTier} to ${subscription.metadata.tier} for salon: ${salon.slug}`);
    }
    if (subscription.metadata.billingCycle) {
      salon.subscription.billingCycle = subscription.metadata.billingCycle;
    }

    // Handle trial conversion
    if (oldStatus === 'trial' && salon.subscription.status === 'active') {
      salon.subscription.trialEndsAt = null;
      logger.log(`?? Trial converted to active for salon: ${salon.slug}`);
    }

    if (subscription.trial_end) {
      salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
    }

    await salon.save();

    logger.log(`? Subscription updated for salon: ${salon.slug} (${salon.subscription.tier} - ${salon.subscription.status})`);
  } catch (error) {
    logger.error('Error handling subscription updated:', error);
  }
};

/**
 * Handle subscription deleted event
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }

    salon.subscription.status = 'canceled';
    await salon.save();

    logger.log(`✅ Subscription deleted for salon: ${salon.slug}`);

    // Send email notification to salon owner
    try {
      const { sendEmail } = await import('../services/emailService.js');
      await sendEmail({
        to: salon.email,
        subject: 'Ihr Abonnement wurde gekündigt - JN Business',
        body: `Hallo,\n\nIhr JN Business Abonnement für "${salon.name}" wurde gekündigt.\n\nSie können jederzeit ein neues Abonnement abschließen, um alle Premium-Funktionen wieder zu nutzen.\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\nIhr JN Business Team`,
        type: 'subscription_canceled'
      });
    } catch (emailError) {
      logger.error('❌ Failed to send subscription canceled email:', emailError.message);
    }
  } catch (error) {
    logger.error('Error handling subscription deleted:', error);
  }
};

/**
 * Handle trial will end event (3 days before trial ends)
 */
const handleTrialWillEnd = async (subscription) => {
  try {
    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscription.id
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }

    logger.log(`⚠️ Trial ending soon for salon: ${salon.slug}`);

    // Send email notification about trial ending
    try {
      const { sendEmail } = await import('../services/emailService.js');
      const trialEndDate = new Date(subscription.trial_end * 1000).toLocaleDateString('de-DE');
      await sendEmail({
        to: salon.email,
        subject: 'Ihre Testphase endet bald - JN Business',
        body: `Hallo,\n\nIhre kostenlose Testphase für "${salon.name}" endet am ${trialEndDate}.\n\nUm alle Premium-Funktionen weiterhin nutzen zu können, stellen Sie bitte sicher, dass eine gültige Zahlungsmethode hinterlegt ist.\n\nNach Ende der Testphase wird Ihr gewähltes Abonnement automatisch aktiviert.\n\nMit freundlichen Grüßen,\nIhr JN Business Team`,
        type: 'trial_ending'
      });
    } catch (emailError) {
      logger.error('❌ Failed to send trial ending email:', emailError.message);
    }
  } catch (error) {
    logger.error('Error handling trial will end:', error);
  }
};

/**
 * Handle payment action required
 */
const handlePaymentActionRequired = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription;

    if (!subscriptionId) {
      return;
    }

    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }

    logger.log(`⚠️ Payment action required for salon: ${salon.slug}`);

    // Send email notification about payment action required
    try {
      const { sendEmail } = await import('../services/emailService.js');
      await sendEmail({
        to: salon.email,
        subject: 'Zahlungsaktion erforderlich - JN Business',
        body: `Hallo,\n\nFür Ihr JN Business Abonnement für "${salon.name}" ist eine Zahlungsaktion erforderlich.\n\nBitte überprüfen Sie Ihre Zahlungsmethode und bestätigen Sie die Zahlung, um eine Unterbrechung Ihres Services zu vermeiden.\n\nSie können dies in Ihren Kontoeinstellungen tun.\n\nMit freundlichen Grüßen,\nIhr JN Business Team`,
        type: 'payment_action_required'
      });
    } catch (emailError) {
      logger.error('❌ Failed to send payment action email:', emailError.message);
    }
  } catch (error) {
    logger.error('Error handling payment action required:', error);
  }
};

export default {
  handleStripeWebhook
};
