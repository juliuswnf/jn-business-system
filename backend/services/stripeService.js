import logger from '../utils/logger.js';
/**
 * Stripe Subscription Service
 * Handles Stripe integration for salon subscriptions
 */

import Stripe from 'stripe';
import Salon from '../models/Salon.js';

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
 * Create Stripe customer for salon
 * @param {Object} salon - Salon document
 * @param {Object} ownerData - Owner user data
 * @returns {String} - Stripe customer ID
 */
export const createStripeCustomer = async (salon, ownerData) => {
  try {
    const customer = await getStripe().customers.create({
      email: salon.email,
      name: salon.name,
      metadata: {
        salonId: salon._id.toString(),
        salonSlug: salon.slug,
        ownerId: ownerData._id?.toString() || 'unknown'
      }
    });

    logger.log(`✅ Created Stripe customer: ${customer.id}`);
    return customer.id;
  } catch (error) {
    logger.error('Error creating Stripe customer:', error);
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
      const customer = await getStripe().customers.create({
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
    const subscription = await getStripe().subscriptions.create({
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

    logger.log(`✅ Created subscription for salon ${salon.slug}`);

    return subscription;
  } catch (error) {
    logger.error('Error creating subscription:', error);
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
      subscription = await getStripe().subscriptions.cancel(subscriptionId);
      salon.subscription.status = 'canceled';
    } else {
      // Cancel at period end
      subscription = await getStripe().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
      salon.subscription.cancelAtPeriodEnd = true;
    }

    await salon.save();

    logger.log(`✅ Cancelled subscription for salon ${salon.slug}`);

    return subscription;
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
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

    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });

    salon.subscription.cancelAtPeriodEnd = false;
    salon.subscription.status = 'active';
    await salon.save();

    logger.log(`✅ Reactivated subscription for salon ${salon.slug}`);

    return subscription;
  } catch (error) {
    logger.error('Error reactivating subscription:', error);
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

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }],
      proration_behavior: 'create_prorations'
    });

    salon.subscription.planId = newPriceId;
    await salon.save();

    logger.log(`✅ Updated subscription plan for salon ${salon.slug}`);

    return updatedSubscription;
  } catch (error) {
    logger.error('Error updating subscription plan:', error);
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

    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

    return {
      hasSubscription: true,
      status: subscription.status,
      isActive: ['active', 'trialing'].includes(subscription.status),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
    };
  } catch (error) {
    logger.error('Error getting subscription status:', error);
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
      logger.warn('Invoice has no subscription ID');
      return;
    }

    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }

    // Update subscription status
    salon.subscription.status = 'active';
    salon.subscription.currentPeriodStart = new Date(invoice.period_start * 1000);
    salon.subscription.currentPeriodEnd = new Date(invoice.period_end * 1000);

    await salon.save();

    logger.log(`✅ Updated subscription after successful payment for salon ${salon.slug}`);
  } catch (error) {
    logger.error('Error handling successful payment:', error);
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
      logger.warn('Invoice has no subscription ID');
      return;
    }

    const salon = await Salon.findOne({
      'subscription.stripeSubscriptionId': subscriptionId
    });

    if (!salon) {
      logger.warn(`No salon found for subscription: ${subscriptionId}`);
      return;
    }

    // Update subscription status to past_due
    salon.subscription.status = 'past_due';

    await salon.save();

    logger.log(`⚠️ Updated subscription after failed payment for salon ${salon.slug}`);

    // TODO: Send email notification to salon owner
  } catch (error) {
    logger.error('Error handling failed payment:', error);
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
      const customer = await getStripe().customers.create({
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

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 30,
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
      },
      // German locale for SEPA
      locale: 'de'
    });

    logger.log(`✅ Created checkout session for salon ${salon.slug}`);

    return session;
  } catch (error) {
    logger.error('Error creating checkout session:', error);
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

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session;
  } catch (error) {
    logger.error('Error creating billing portal session:', error);
    throw error;
  }
};

/**
 * Get or create Stripe customer for booking customer (not salon)
 * Used for No-Show-Killer payment method storage
 * @param {String} email - Customer email
 * @param {String} name - Customer name
 * @param {String} phone - Customer phone (optional)
 * @param {String} salonId - Salon ID for metadata
 * @returns {String} - Stripe customer ID
 */
export const getOrCreateBookingCustomer = async (email, name, phone, salonId) => {
  try {
    const stripe = getStripe();

    // Search for existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      logger.log(`✅ Found existing Stripe customer: ${customer.id}`);
      return customer.id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email.toLowerCase(),
      name: name,
      phone: phone || undefined,
      metadata: {
        type: 'booking_customer',
        salonId: salonId?.toString() || 'unknown'
      }
    });

    logger.log(`✅ Created Stripe customer for booking: ${customer.id}`);
    return customer.id;
  } catch (error) {
    logger.error('Error getting/creating booking customer:', error);
    throw error;
  }
};

/**
 * Attach payment method to customer and set as default
 * @param {String} customerId - Stripe customer ID
 * @param {String} paymentMethodId - Stripe payment method ID
 * @returns {Object} - Updated customer
 */
export const attachPaymentMethodToCustomer = async (customerId, paymentMethodId) => {
  try {
    const stripe = getStripe();

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    logger.log(`✅ Attached payment method ${paymentMethodId} to customer ${customerId}`);
    return { success: true };
  } catch (error) {
    logger.error('Error attaching payment method:', error);
    throw error;
  }
};

/**
 * Charge No-Show-Fee from saved payment method
 * @param {String} customerId - Stripe customer ID
 * @param {String} paymentMethodId - Stripe payment method ID
 * @param {Number} amount - Amount in cents
 * @param {String} description - Payment description
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Payment Intent
 */
export const chargeNoShowFee = async (customerId, paymentMethodId, amount, description, metadata = {}) => {
  try {
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: description,
      metadata: {
        type: 'no_show_fee',
        ...metadata
      }
    });

    logger.log(`✅ Charged No-Show-Fee: €${amount / 100} - Payment Intent: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    logger.error('Error charging No-Show-Fee:', error);
    throw error;
  }
};

/**
 * Refund No-Show-Fee
 * @param {String} paymentIntentId - Stripe Payment Intent ID
 * @returns {Object} - Refund object
 */
export const refundNoShowFee = async (paymentIntentId) => {
  try {
    const stripe = getStripe();

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer'
    });

    logger.log(`✅ Refunded No-Show-Fee: Refund ID ${refund.id}`);
    return refund;
  } catch (error) {
    logger.error('Error refunding No-Show-Fee:', error);
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
  createBillingPortalSession,
  getOrCreateBookingCustomer,
  attachPaymentMethodToCustomer,
  chargeNoShowFee,
  refundNoShowFee
};
