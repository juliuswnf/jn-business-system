/**
 * Stripe Subscription Service
 * Handles Stripe integration for salon subscriptions
 */

import Stripe from 'stripe';
import Salon from '../models/Salon.js';

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_51SNcw8Cfgv8Lqc0aIuiqkWJTF6gC8ibUitGgjuMvZTusB42OBdCUAXar25ToIazQQKbbNKwIb3PerXQu4sAmrpLa00ddDk0Ify'
);

/**
 * Create Stripe customer for salon
 * @param {Object} salon - Salon document
 * @param {Object} ownerData - Owner user data
 * @returns {String} - Stripe customer ID
 */
export const createStripeCustomer = async (salon, ownerData) => {
  try {
    const customer = await stripe.customers.create({
      email: salon.email,
      name: salon.name,
      metadata: {
        salonId: salon._id.toString(),
        salonSlug: salon.slug,
        ownerId: ownerData._id?.toString() || 'unknown'
      }
    });
    
    console.log(`✅ Created Stripe customer: ${customer.id}`);
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

/**
 * Create subscription for salon
 * @param {Object} salon - Salon document
 * @param {String} priceId - Stripe price ID
 * @param {Number} trialDays - Trial period in days (default: 14)
 * @returns {Object} - Stripe subscription object
 */
export const createSubscription = async (salon, priceId, trialDays = 14) => {
  try {
    // Create Stripe customer if not exists
    let customerId = salon.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: salon.email,
        name: salon.name,
        metadata: {
          salonId: salon._id.toString(),
          salonSlug: salon.slug
        }
      });
      customerId = customer.id;
      
      // Update salon with customer ID
      salon.subscription.stripeCustomerId = customerId;
      await salon.save();
    }
    
    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      metadata: {
        salonId: salon._id.toString(),
        salonSlug: salon.slug
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });
    
    // Update salon subscription data
    salon.subscription.stripeSubscriptionId = subscription.id;
    salon.subscription.status = 'trial';
    salon.subscription.planId = priceId;
    salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
    salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    await salon.save();
    
    console.log(`✅ Created subscription for salon ${salon.slug}`);
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {Object} salon - Salon document
 * @param {Boolean} immediately - Cancel immediately or at period end
 * @returns {Object} - Updated subscription
 */
export const cancelSubscription = async (salon, immediately = false) => {
  try {
    const subscriptionId = salon.subscription?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      throw new Error('No active subscription found');
    }
    
    let subscription;
    
    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId);
      salon.subscription.status = 'canceled';
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
      salon.subscription.cancelAtPeriodEnd = true;
    }
    
    await salon.save();
    
    console.log(`✅ Cancelled subscription for salon ${salon.slug}`);
    
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Reactivate cancelled subscription
 * @param {Object} salon - Salon document
 * @returns {Object} - Updated subscription
 */
export const reactivateSubscription = async (salon) => {
  try {
    const subscriptionId = salon.subscription?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      throw new Error('No subscription found');
    }
    
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    
    salon.subscription.cancelAtPeriodEnd = false;
    salon.subscription.status = 'active';
    await salon.save();
    
    console.log(`✅ Reactivated subscription for salon ${salon.slug}`);
    
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
};

/**
 * Update subscription plan
 * @param {Object} salon - Salon document
 * @param {String} newPriceId - New Stripe price ID
 * @returns {Object} - Updated subscription
 */
export const updateSubscriptionPlan = async (salon, newPriceId) => {
  try {
    const subscriptionId = salon.subscription?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      throw new Error('No active subscription found');
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });
    
    salon.subscription.planId = newPriceId;
    await salon.save();
    
    console.log(`✅ Updated subscription plan for salon ${salon.slug}`);
    
    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    throw error;
  }
};

/**
 * Get subscription status
 * @param {Object} salon - Salon document
 * @returns {Object} - Subscription status info
 */
export const getSubscriptionStatus = async (salon) => {
  try {
    const subscriptionId = salon.subscription?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return {
        hasSubscription: false,
        status: 'none',
        isActive: false
      };
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return {
      hasSubscription: true,
      status: subscription.status,
      isActive: ['active', 'trialing'].includes(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
};

/**
 * Handle successful payment
 * @param {Object} invoice - Stripe invoice object
 */
export const handleSuccessfulPayment = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      console.warn('Invoice has no subscription ID');
      return;
    }
    
    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });
    
    if (!salon) {
      console.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }
    
    // Update subscription status
    salon.subscription.status = 'active';
    salon.subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);
    
    await salon.save();
    
    console.log(`✅ Updated subscription after successful payment for salon ${salon.slug}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 * @param {Object} invoice - Stripe invoice object
 */
export const handleFailedPayment = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      console.warn('Invoice has no subscription ID');
      return;
    }
    
    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });
    
    if (!salon) {
      console.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }
    
    // Update subscription status to past_due
    salon.subscription.status = 'past_due';
    
    await salon.save();
    
    console.log(`⚠️ Updated subscription after failed payment for salon ${salon.slug}`);
    
    // TODO: Send email notification to salon owner
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};

/**
 * Create checkout session for new subscription
 * @param {Object} salon - Salon document
 * @param {String} priceId - Stripe price ID
 * @param {String} successUrl - Success redirect URL
 * @param {String} cancelUrl - Cancel redirect URL
 * @returns {Object} - Checkout session
 */
export const createCheckoutSession = async (salon, priceId, successUrl, cancelUrl) => {
  try {
    let customerId = salon.subscription?.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: salon.email,
        name: salon.name,
        metadata: {
          salonId: salon._id.toString(),
          salonSlug: salon.slug
        }
      });
      customerId = customer.id;
      
      salon.subscription.stripeCustomerId = customerId;
      await salon.save();
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          salonId: salon._id.toString(),
          salonSlug: salon.slug
        }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        salonId: salon._id.toString(),
        salonSlug: salon.slug
      }
    });
    
    console.log(`✅ Created checkout session for salon ${salon.slug}`);
    
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Create billing portal session
 * @param {Object} salon - Salon document
 * @param {String} returnUrl - Return URL after portal
 * @returns {Object} - Portal session
 */
export const createBillingPortalSession = async (salon, returnUrl) => {
  try {
    const customerId = salon.subscription?.stripeCustomerId;
    
    if (!customerId) {
      throw new Error('No Stripe customer found for this salon');
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
    
    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
};

export default {
  createStripeCustomer,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateSubscriptionPlan,
  getSubscriptionStatus,
  handleSuccessfulPayment,
  handleFailedPayment,
  createCheckoutSession,
  createBillingPortalSession
};
