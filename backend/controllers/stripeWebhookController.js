/**
 * Stripe Webhook Controller
 * Handles Stripe webhook events for subscription management
 */

import Stripe from 'stripe';
import stripeService from '../services/stripeService.js';
import Salon from '../models/Salon.js';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_51SNcw8Cfgv8Lqc0aIuiqkWJTF6gC8ibUitGgjuMvZTusB42OBdCUAXar25ToIazQQKbbNKwIb3PerXQu4sAmrpLa00ddDk0Ify'
);

/**
 * Handle Stripe Webhooks
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      console.error('❌ Missing Stripe signature header');
      return res.status(401).json({
        success: false,
        message: 'Missing signature'
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }

    console.log(`✅ Stripe webhook received: ${event.type}`);

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
        console.log('✅ Invoice paid successfully');
        break;
      
      case 'invoice.payment_failed':
        await stripeService.handleFailedPayment(event.data.object);
        console.log('❌ Invoice payment failed');
        break;
      
      case 'invoice.payment_action_required':
        await handlePaymentActionRequired(event.data.object);
        break;
      
      // ==================== PAYMENT EVENTS ====================
      
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      case 'charge.refunded':
        console.log('💰 Charge refunded:', event.data.object.id);
        break;
      
      // ==================== CUSTOMER EVENTS ====================
      
      case 'customer.created':
        console.log('👤 Customer created:', event.data.object.id);
        break;
      
      case 'customer.updated':
        console.log('👤 Customer updated:', event.data.object.id);
        break;
      
      case 'customer.deleted':
        console.log('👤 Customer deleted:', event.data.object.id);
        break;

      default:
        console.log(`⚠️ Unhandled webhook event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Stripe Webhook Error:', error);
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
      console.warn('Subscription has no salonId in metadata');
      return;
    }
    
    const salon = await Salon.findById(salonId);
    
    if (!salon) {
      console.warn(`Salon not found: ${salonId}`);
      return;
    }
    
    salon.subscription.stripeSubscriptionId = subscription.id;
    salon.subscription.status = subscription.status === 'trialing' ? 'trial' : 'active';
    salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    if (subscription.trial_end) {
      salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
    }
    
    await salon.save();
    
    console.log(`✅ Subscription created for salon: ${salon.slug}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
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
      console.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }
    
    // Update subscription status
    salon.subscription.status = subscription.status === 'trialing' ? 'trial' : subscription.status;
    salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    salon.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
    
    if (subscription.trial_end) {
      salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
    }
    
    await salon.save();
    
    console.log(`✅ Subscription updated for salon: ${salon.slug}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
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
      console.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }
    
    salon.subscription.status = 'canceled';
    await salon.save();
    
    console.log(`✅ Subscription deleted for salon: ${salon.slug}`);
    
    // TODO: Send email notification to salon owner
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
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
      console.warn(`No salon found for subscription: ${subscription.id}`);
      return;
    }
    
    console.log(`⚠️ Trial ending soon for salon: ${salon.slug}`);
    
    // TODO: Send email notification to salon owner about trial ending
  } catch (error) {
    console.error('Error handling trial will end:', error);
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
      console.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }
    
    console.log(`⚠️ Payment action required for salon: ${salon.slug}`);
    
    // TODO: Send email notification to salon owner about payment action required
  } catch (error) {
    console.error('Error handling payment action required:', error);
  }
};

export default {
  handleStripeWebhook
};
