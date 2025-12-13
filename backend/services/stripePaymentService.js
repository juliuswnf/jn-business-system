import Stripe from 'stripe';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { PRICING_TIERS } from '../config/pricing.js';

// Load environment variables
dotenv.config();

/**
 * Stripe Payment Service
 *
 * Handles:
 * - Subscription creation (monthly/yearly)
 * - Payment method management
 * - SEPA Direct Debit (Enterprise only)
 * - Invoice payments (Enterprise only)
 * - Upgrade/downgrade with proration
 * - Trial conversion
 * - Webhook processing
 */

class StripePaymentService {
  constructor() {
    // Initialize Stripe with API key
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('? STRIPE_SECRET_KEY is not defined in environment variables');
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Stripe Price IDs from .env
    this.priceIds = {
      starter: {
        monthly: process.env.STRIPE_STARTER_MONTHLY || 'price_1Sa2FXCfgv8Lqc0aJEHE6Y5r',
        yearly: process.env.STRIPE_STARTER_YEARLY || 'price_1SbpU9Cfgv8Lqc0a2UKslNdB'
      },
      professional: {
        monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY || 'price_1Sa2FzCfgv8Lqc0aU7erudfl',
        yearly: process.env.STRIPE_PROFESSIONAL_YEARLY || 'price_1SbpUTCfgv8Lqc0aMoJ2EBh4'
      },
      enterprise: {
        monthly: process.env.STRIPE_ENTERPRISE_MONTHLY || 'price_1SbpSeCfgv8Lqc0aOsHZx11S',
        yearly: process.env.STRIPE_ENTERPRISE_YEARLY || 'price_1SbpUmCfgv8Lqc0avzsttWvO'
      }
    };

    logger.info('? Stripe Payment Service initialized with Price IDs:', {
      starter_monthly: this.priceIds.starter.monthly,
      starter_yearly: this.priceIds.starter.yearly,
      professional_monthly: this.priceIds.professional.monthly,
      professional_yearly: this.priceIds.professional.yearly,
      enterprise_monthly: this.priceIds.enterprise.monthly,
      enterprise_yearly: this.priceIds.enterprise.yearly
    });
  }

  /**
   * Create or retrieve Stripe customer for salon
   *
   * @param {Object} salon - Salon document
   * @param {String} email - Customer email
   * @returns {String} - Stripe customer ID
   */
  async getOrCreateCustomer(salon, email) {
    // Return existing customer ID if available
    if (salon.subscription.stripeCustomerId) {
      return salon.subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      name: salon.name,
      metadata: {
        salonId: salon._id.toString(),
        salonSlug: salon.slug
      }
    });

    // Save customer ID to salon
    salon.subscription.stripeCustomerId = customer.id;
    await salon.save();

    logger.info(`[Stripe] Created customer ${customer.id} for salon ${salon._id}`);

    return customer.id;
  }

  /**
   * Create subscription (monthly or yearly)
   *
   * @param {Object} options - Subscription options
   * @param {Object} options.salon - Salon document
   * @param {String} options.tier - Tier slug (starter/professional/enterprise)
   * @param {String} options.billingCycle - Billing cycle (monthly/yearly)
   * @param {String} options.paymentMethodId - Stripe payment method ID
   * @param {String} options.email - Customer email
   * @param {Boolean} options.trial - Whether this is a trial (default: false)
   * @returns {Object} - Subscription object
   */
  async createSubscription({
    salon,
    tier,
    billingCycle = 'monthly',
    paymentMethodId,
    email,
    trial = false
  }) {
    try {
      // Validate tier
      if (!PRICING_TIERS[tier]) {
        throw new Error(`Invalid tier: ${tier}`);
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateCustomer(salon, email);

      // Attach payment method to customer
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId
        });

        // Set as default payment method
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      // Get price ID
      const priceId = this.priceIds[tier][billingCycle];
      if (!priceId) {
        throw new Error(`Price ID not configured for ${tier} ${billingCycle}`);
      }

      // Create subscription
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          salonId: salon._id.toString(),
          tier,
          billingCycle
        }
      };

      // Add trial period if requested (14 days for Enterprise trial)
      if (trial) {
        subscriptionData.trial_period_days = 14;
        subscriptionData.metadata.trial = 'true';
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      // Update salon subscription info
      salon.subscription.stripeSubscriptionId = subscription.id;
      salon.subscription.tier = tier;
      salon.subscription.billingCycle = billingCycle;
      salon.subscription.status = trial ? 'trial' : 'active';
      salon.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      salon.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      if (trial) {
        salon.subscription.trialEndsAt = new Date(subscription.trial_end * 1000);
      }

      await salon.save();

      logger.info(`[Stripe] Created subscription ${subscription.id} for salon ${salon._id}`);

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status
      };
    } catch (error) {
      logger.error('[Stripe] Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Upgrade subscription to higher tier
   *
   * @param {Object} options - Upgrade options
   * @param {Object} options.salon - Salon document
   * @param {String} options.newTier - New tier slug
   * @param {String} options.billingCycle - Billing cycle (monthly/yearly)
   * @returns {Object} - Updated subscription
   */
  async upgradeSubscription({ salon, newTier, billingCycle }) {
    try {
      const currentTier = salon.subscription.tier;

      // Validate tier upgrade
      const tierOrder = ['starter', 'professional', 'enterprise'];
      if (tierOrder.indexOf(newTier) <= tierOrder.indexOf(currentTier)) {
        throw new Error('Can only upgrade to a higher tier');
      }

      // Get subscription
      const subscription = await this.stripe.subscriptions.retrieve(
        salon.subscription.stripeSubscriptionId
      );

      // Get new price ID
      const newPriceId = this.priceIds[newTier][billingCycle];
      if (!newPriceId) {
        throw new Error(`Price ID not configured for ${newTier} ${billingCycle}`);
      }

      // Update subscription with proration
      const updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId
          }
        ],
        proration_behavior: 'always_invoice', // Create invoice for prorated amount
        metadata: {
          ...subscription.metadata,
          tier: newTier,
          billingCycle,
          previousTier: currentTier,
          upgradeDate: new Date().toISOString()
        }
      });

      // Update salon
      salon.subscription.tier = newTier;
      salon.subscription.billingCycle = billingCycle;
      salon.subscription.currentPeriodEnd = new Date(
        updatedSubscription.current_period_end * 1000
      );
      await salon.save();

      logger.info(
        `[Stripe] Upgraded salon ${salon._id} from ${currentTier} to ${newTier}`
      );

      return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        proratedAmount: updatedSubscription.latest_invoice?.amount_due || 0
      };
    } catch (error) {
      logger.error('[Stripe] Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Downgrade subscription to lower tier
   *
   * @param {Object} options - Downgrade options
   * @param {Object} options.salon - Salon document
   * @param {String} options.newTier - New tier slug
   * @param {String} options.billingCycle - Billing cycle (monthly/yearly)
   * @param {Boolean} options.immediate - Apply immediately (default: false, applies at period end)
   * @returns {Object} - Updated subscription
   */
  async downgradeSubscription({ salon, newTier, billingCycle, immediate = false }) {
    try {
      const currentTier = salon.subscription.tier;

      // Validate tier downgrade
      const tierOrder = ['starter', 'professional', 'enterprise'];
      if (tierOrder.indexOf(newTier) >= tierOrder.indexOf(currentTier)) {
        throw new Error('Can only downgrade to a lower tier');
      }

      // Get subscription
      const subscription = await this.stripe.subscriptions.retrieve(
        salon.subscription.stripeSubscriptionId
      );

      // Get new price ID
      const newPriceId = this.priceIds[newTier][billingCycle];
      if (!newPriceId) {
        throw new Error(`Price ID not configured for ${newTier} ${billingCycle}`);
      }

      let updatedSubscription;

      if (immediate) {
        // Apply downgrade immediately (no refund)
        updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId
            }
          ],
          proration_behavior: 'none', // No proration for downgrades
          metadata: {
            ...subscription.metadata,
            tier: newTier,
            billingCycle,
            previousTier: currentTier,
            downgradeDate: new Date().toISOString()
          }
        });

        // Update salon immediately
        salon.subscription.tier = newTier;
        salon.subscription.billingCycle = billingCycle;
      } else {
        // Schedule downgrade for end of period
        updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId
            }
          ],
          proration_behavior: 'none',
          billing_cycle_anchor: 'unchanged',
          metadata: {
            ...subscription.metadata,
            scheduledTier: newTier,
            scheduledBillingCycle: billingCycle,
            previousTier: currentTier,
            downgradeScheduledDate: new Date().toISOString()
          }
        });

        // Mark for downgrade at period end (keep current tier until then)
        salon.subscription.cancelAtPeriodEnd = false;
        // Store scheduled tier change
        salon.subscription.scheduledTierChange = {
          newTier,
          billingCycle,
          effectiveDate: new Date(subscription.current_period_end * 1000)
        };
      }

      await salon.save();

      logger.info(
        `[Stripe] Downgraded salon ${salon._id} from ${currentTier} to ${newTier} (${
          immediate ? 'immediate' : 'at period end'
        })`
      );

      return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        immediate,
        effectiveDate: immediate
          ? new Date()
          : new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      logger.error('[Stripe] Error downgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Setup SEPA Direct Debit (Enterprise only)
   *
   * @param {Object} options - SEPA setup options
   * @param {Object} options.salon - Salon document
   * @param {String} options.email - Customer email
   * @param {String} options.name - Customer name
   * @param {String} options.iban - IBAN number
   * @returns {Object} - Setup intent
   */
  async setupSEPA({ salon, email, name, iban }) {
    try {
      // Validate Enterprise tier
      if (salon.subscription.tier !== 'enterprise') {
        throw new Error('SEPA payments are only available for Enterprise tier');
      }

      // Get or create customer
      const customerId = await this.getOrCreateCustomer(salon, email);

      // Create SEPA setup intent
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['sepa_debit'],
        payment_method_data: {
          type: 'sepa_debit',
          billing_details: {
            name,
            email
          },
          sepa_debit: {
            iban
          }
        },
        metadata: {
          salonId: salon._id.toString(),
          paymentType: 'sepa'
        }
      });

      // Update salon payment method
      salon.subscription.paymentMethod = 'sepa';
      await salon.save();

      logger.info(`[Stripe] Created SEPA setup intent for salon ${salon._id}`);

      return {
        clientSecret: setupIntent.client_secret,
        status: setupIntent.status
      };
    } catch (error) {
      logger.error('[Stripe] Error setting up SEPA:', error);
      throw error;
    }
  }

  /**
   * Create invoice for Enterprise customers (manual payment)
   *
   * @param {Object} options - Invoice options
   * @param {Object} options.salon - Salon document
   * @param {Number} options.amount - Invoice amount in cents
   * @param {String} options.description - Invoice description
   * @param {Number} options.dueDate - Due date (days from now, default: 14)
   * @returns {Object} - Invoice
   */
  async createInvoice({ salon, amount, description, dueDate = 14 }) {
    try {
      // Validate Enterprise tier
      if (salon.subscription.tier !== 'enterprise') {
        throw new Error('Invoice payments are only available for Enterprise tier');
      }

      // Get or create customer
      const customerId = salon.subscription.stripeCustomerId;
      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      // Create invoice item
      await this.stripe.invoiceItems.create({
        customer: customerId,
        amount,
        currency: 'eur',
        description
      });

      // Create invoice
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: dueDate,
        auto_advance: true,
        metadata: {
          salonId: salon._id.toString(),
          paymentType: 'invoice'
        }
      });

      // Finalize and send invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
      await this.stripe.invoices.sendInvoice(invoice.id);

      // Update salon payment method
      salon.subscription.paymentMethod = 'invoice';
      await salon.save();

      logger.info(`[Stripe] Created invoice ${invoice.id} for salon ${salon._id}`);

      return {
        invoiceId: finalizedInvoice.id,
        invoiceUrl: finalizedInvoice.hosted_invoice_url,
        invoicePdf: finalizedInvoice.invoice_pdf,
        dueDate: new Date(finalizedInvoice.due_date * 1000),
        amount: finalizedInvoice.amount_due / 100
      };
    } catch (error) {
      logger.error('[Stripe] Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Convert trial to paid subscription
   *
   * @param {Object} salon - Salon document
   * @param {String} selectedTier - Tier to convert to (default: current tier)
   * @returns {Object} - Subscription status
   */
  async convertTrialToPaid(salon, selectedTier = null) {
    try {
      // Check if salon is on trial
      if (salon.subscription.status !== 'trial') {
        throw new Error('Salon is not on trial');
      }

      // Use current tier or selected tier
      const tier = selectedTier || salon.subscription.tier;

      // Get subscription
      const subscription = await this.stripe.subscriptions.retrieve(
        salon.subscription.stripeSubscriptionId
      );

      // End trial immediately (will charge customer)
      const updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
        trial_end: 'now',
        metadata: {
          ...subscription.metadata,
          trialConverted: 'true',
          trialConversionDate: new Date().toISOString(),
          tier
        }
      });

      // Update salon
      salon.subscription.status = 'active';
      salon.subscription.tier = tier;
      salon.subscription.trialEndsAt = null;
      await salon.save();

      logger.info(`[Stripe] Converted trial to paid for salon ${salon._id}`);

      return {
        subscriptionId: updatedSubscription.id,
        status: updatedSubscription.status,
        tier
      };
    } catch (error) {
      logger.error('[Stripe] Error converting trial to paid:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   *
   * @param {Object} salon - Salon document
   * @param {Boolean} immediately - Cancel immediately or at period end (default: false)
   * @returns {Object} - Cancellation status
   */
  async cancelSubscription(salon, immediately = false) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        salon.subscription.stripeSubscriptionId
      );

      let canceledSubscription;

      if (immediately) {
        // Cancel immediately
        canceledSubscription = await this.stripe.subscriptions.cancel(subscription.id);
        salon.subscription.status = 'canceled';
      } else {
        // Cancel at period end
        canceledSubscription = await this.stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        });
        salon.subscription.cancelAtPeriodEnd = true;
      }

      await salon.save();

      logger.info(
        `[Stripe] Canceled subscription for salon ${salon._id} (${
          immediately ? 'immediate' : 'at period end'
        })`
      );

      return {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status,
        canceledAt: immediately ? new Date() : new Date(subscription.current_period_end * 1000)
      };
    } catch (error) {
      logger.error('[Stripe] Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Get price ID for tier and billing cycle
   *
   * @param {String} tier - Tier slug
   * @param {String} billingCycle - Billing cycle (monthly/yearly)
   * @returns {String} - Price ID
   */
  getPriceId(tier, billingCycle) {
    return this.priceIds[tier]?.[billingCycle];
  }
}

// Singleton instance
export default new StripePaymentService();

