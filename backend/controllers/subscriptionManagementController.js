import stripePaymentService from '../services/stripePaymentService.js';
import { PRICING_TIERS, compareTiers } from '../config/pricing.js';

/**
 * Subscription Management Controller
 *
 * Handles subscription management:
 * - Create subscription (monthly/yearly)
 * - Upgrade subscription
 * - Downgrade subscription
 * - Cancel subscription
 * - SEPA setup (Enterprise only)
 * - Invoice creation (Enterprise only)
 * - Trial conversion
 */

// Create new subscription
export const createSubscription = async (req, res) => {
  try {
    const { salon } = req;
    const { tier, billingCycle, paymentMethodId, email, trial } = req.body;

    // Validate inputs
    if (!tier || !billingCycle) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Tier and billing cycle are required'
      });
    }

    if (!PRICING_TIERS[tier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
        message: `Tier must be one of: starter, professional, enterprise`
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid billing cycle',
        message: 'Billing cycle must be monthly or yearly'
      });
    }

    // Create subscription
    const result = await stripePaymentService.createSubscription({
      salon,
      tier,
      billingCycle,
      paymentMethodId,
      email: email || salon.email,
      trial: trial || false
    });

    res.json({
      success: true,
      subscription: result,
      message: trial
        ? 'Trial subscription created successfully'
        : 'Subscription created successfully'
    });
  } catch (error) {
    console.error('[Subscription Controller] Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription',
      message: error.message
    });
  }
};

// Upgrade subscription
export const upgradeSubscription = async (req, res) => {
  try {
    const { salon } = req;
    const { newTier, billingCycle } = req.body;

    // Validate inputs
    if (!newTier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'New tier is required'
      });
    }

    if (!PRICING_TIERS[newTier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
        message: `Tier must be one of: starter, professional, enterprise`
      });
    }

    // Check if it's actually an upgrade
    const currentTier = salon.subscription.tier;
    const comparison = compareTiers(currentTier, newTier);

    if (comparison >= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid upgrade',
        message: 'New tier must be higher than current tier',
        currentTier,
        newTier
      });
    }

    // Upgrade subscription
    const result = await stripePaymentService.upgradeSubscription({
      salon,
      newTier,
      billingCycle: billingCycle || salon.subscription.billingCycle
    });

    res.json({
      success: true,
      subscription: result,
      message: `Successfully upgraded from ${currentTier} to ${newTier}`,
      proratedAmount: result.proratedAmount / 100 // Convert to euros
    });
  } catch (error) {
    console.error('[Subscription Controller] Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription',
      message: error.message
    });
  }
};

// Downgrade subscription
export const downgradeSubscription = async (req, res) => {
  try {
    const { salon } = req;
    const { newTier, billingCycle, immediate } = req.body;

    // Validate inputs
    if (!newTier) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field',
        message: 'New tier is required'
      });
    }

    if (!PRICING_TIERS[newTier]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
        message: `Tier must be one of: starter, professional, enterprise`
      });
    }

    // Check if it's actually a downgrade
    const currentTier = salon.subscription.tier;
    const comparison = compareTiers(currentTier, newTier);

    if (comparison <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid downgrade',
        message: 'New tier must be lower than current tier',
        currentTier,
        newTier
      });
    }

    // Get features that will be lost
    const currentFeatures = PRICING_TIERS[currentTier].features;
    const newFeatures = PRICING_TIERS[newTier].features;
    const lostFeatures = Object.keys(currentFeatures).filter(
      (feature) => currentFeatures[feature] && !newFeatures[feature]
    );

    // Downgrade subscription
    const result = await stripePaymentService.downgradeSubscription({
      salon,
      newTier,
      billingCycle: billingCycle || salon.subscription.billingCycle,
      immediate: immediate || false
    });

    res.json({
      success: true,
      subscription: result,
      message: immediate
        ? `Successfully downgraded from ${currentTier} to ${newTier}`
        : `Downgrade to ${newTier} scheduled for end of billing period`,
      lostFeatures,
      warning: lostFeatures.length > 0
        ? `You will lose access to: ${lostFeatures.join(', ')}`
        : null
    });
  } catch (error) {
    console.error('[Subscription Controller] Error downgrading subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to downgrade subscription',
      message: error.message
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { salon } = req;
    const { immediately } = req.body;

    // Cancel subscription
    const result = await stripePaymentService.cancelSubscription(
      salon,
      immediately || false
    );

    res.json({
      success: true,
      cancellation: result,
      message: immediately
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    console.error('[Subscription Controller] Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    });
  }
};

// Setup SEPA Direct Debit (Enterprise only)
export const setupSEPA = async (req, res) => {
  try {
    const { salon } = req;
    const { email, name, iban } = req.body;

    // Validate Enterprise tier
    if (salon.subscription.tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Feature not available',
        message: 'SEPA payments are only available for Enterprise tier',
        currentTier: salon.subscription.tier,
        requiredTier: 'enterprise',
        upgradeUrl: '/pricing'
      });
    }

    // Validate inputs
    if (!email || !name || !iban) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, name, and IBAN are required'
      });
    }

    // Setup SEPA
    const result = await stripePaymentService.setupSEPA({
      salon,
      email,
      name,
      iban
    });

    res.json({
      success: true,
      setup: result,
      message: 'SEPA Direct Debit setup initiated'
    });
  } catch (error) {
    console.error('[Subscription Controller] Error setting up SEPA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup SEPA',
      message: error.message
    });
  }
};

// Create invoice (Enterprise only)
export const createInvoice = async (req, res) => {
  try {
    const { salon } = req;
    const { amount, description, dueDate } = req.body;

    // Validate Enterprise tier
    if (salon.subscription.tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Feature not available',
        message: 'Invoice payments are only available for Enterprise tier',
        currentTier: salon.subscription.tier,
        requiredTier: 'enterprise',
        upgradeUrl: '/pricing'
      });
    }

    // Validate inputs
    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Amount and description are required'
      });
    }

    // Create invoice
    const result = await stripePaymentService.createInvoice({
      salon,
      amount: Math.round(amount * 100), // Convert to cents
      description,
      dueDate: dueDate || 14
    });

    res.json({
      success: true,
      invoice: result,
      message: 'Invoice created and sent successfully'
    });
  } catch (error) {
    console.error('[Subscription Controller] Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice',
      message: error.message
    });
  }
};

// Convert trial to paid
export const convertTrialToPaid = async (req, res) => {
  try {
    const { salon } = req;
    const { selectedTier } = req.body;

    // Check if on trial
    if (salon.subscription.status !== 'trial') {
      return res.status(400).json({
        success: false,
        error: 'Not on trial',
        message: 'Salon is not currently on a trial subscription',
        currentStatus: salon.subscription.status
      });
    }

    // Convert trial
    const result = await stripePaymentService.convertTrialToPaid(salon, selectedTier);

    res.json({
      success: true,
      subscription: result,
      message: 'Trial converted to paid subscription successfully'
    });
  } catch (error) {
    console.error('[Subscription Controller] Error converting trial:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert trial',
      message: error.message
    });
  }
};

// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { salon } = req;

    const tierConfig = PRICING_TIERS[salon.subscription.tier];

    res.json({
      success: true,
      subscription: {
        tier: salon.subscription.tier,
        tierName: tierConfig.name,
        billingCycle: salon.subscription.billingCycle,
        status: salon.subscription.status,
        currentPeriodStart: salon.subscription.currentPeriodStart,
        currentPeriodEnd: salon.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: salon.subscription.cancelAtPeriodEnd,
        trialEndsAt: salon.subscription.trialEndsAt,
        paymentMethod: salon.subscription.paymentMethod,
        price: {
          monthly: tierConfig.priceMonthly,
          yearly: tierConfig.priceYearly,
          current:
            salon.subscription.billingCycle === 'yearly'
              ? tierConfig.priceYearly
              : tierConfig.priceMonthly
        }
      }
    });
  } catch (error) {
    console.error('[Subscription Controller] Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status',
      message: error.message
    });
  }
};

export default {
  createSubscription,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  setupSEPA,
  createInvoice,
  convertTrialToPaid,
  getSubscriptionStatus
};

