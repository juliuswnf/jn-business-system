import logger from '../utils/logger.js';
import Salon from '../models/Salon.js';
import { createCheckoutSession, createBillingPortalSession } from '../services/stripeService.js';

/**
 * Subscription Controller
 * Handles Stripe subscription checkout and billing portal
 */

// Price mapping from plan ID to env variable (monthly)
const PRICE_MAP_MONTHLY = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  professional: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY
};

// Price mapping from plan ID to env variable (yearly)
const PRICE_MAP_YEARLY = {
  starter: process.env.STRIPE_PRICE_STARTER_YEARLY,
  professional: process.env.STRIPE_PRICE_PRO_YEARLY,
  pro: process.env.STRIPE_PRICE_PRO_YEARLY,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY
};

/**
 * Create Stripe Checkout Session
 * POST /api/subscriptions/checkout
 */
export const createCheckout = async (req, res) => {
  try {
    const { planId, billing = 'monthly' } = req.body;
    const salonId = req.user.salonId;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get price ID from environment based on billing cycle
    const priceMap = billing === 'yearly' ? PRICE_MAP_YEARLY : PRICE_MAP_MONTHLY;
    const priceId = priceMap[planId.toLowerCase()];

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan: ${planId}. Available plans: starter, professional, enterprise`
      });
    }

    // Get salon
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Build URLs
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/dashboard?subscription=success&plan=${planId}&billing=${billing}`;
    const cancelUrl = `${baseUrl}/pricing?subscription=cancelled`;

    // Create Stripe checkout session
    const session = await createCheckoutSession(salon, priceId, successUrl, cancelUrl);

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('CreateCheckout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
};

/**
 * Create Stripe Billing Portal Session
 * POST /api/subscriptions/portal
 */
export const createPortal = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    if (!salon.subscription?.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found. Please subscribe first.'
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard/settings`;

    const session = await createBillingPortalSession(salon, returnUrl);

    res.status(200).json({
      success: true,
      url: session.url
    });

  } catch (error) {
    logger.error('CreatePortal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create billing portal session'
    });
  }
};

/**
 * Get current subscription status
 * GET /api/subscriptions/status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    const salon = await Salon.findById(salonId).select('subscription');
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const subscription = salon.subscription || {};

    res.status(200).json({
      success: true,
      subscription: {
        status: subscription.status || 'none',
        planId: subscription.planId || null,
        trialEndsAt: subscription.trialEndsAt || null,
        currentPeriodEnd: subscription.currentPeriodEnd || null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false
      }
    });

  } catch (error) {
    logger.error('GetSubscriptionStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
};

/**
 * Get available plans with prices
 * GET /api/subscriptions/plans
 */
export const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 49,
        yearlyPrice: 39,
        description: 'Perfekt für Solo-Studios & Einzelunternehmer',
        priceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
        priceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
        features: [
          '150 Termine pro Monat',
          '1 Mitarbeiter-Account',
          'Online-Buchungswidget',
          'E-Mail-Erinnerungen',
          'Google-Review Integration',
          'E-Mail Support'
        ]
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 99,
        yearlyPrice: 79,
        description: 'Für wachsende Teams',
        priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
        priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
        highlighted: true,
        features: [
          'Unbegrenzte Termine',
          'Bis zu 10 Mitarbeiter',
          'Eigenes Branding',
          'Bis zu 3 Standorte',
          'WhatsApp-Benachrichtigungen',
          'Priorisierter Support'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        yearlyPrice: 159,
        description: 'Für Salon-Ketten',
        priceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        priceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
        features: [
          'Unbegrenzte Termine',
          'Unbegrenzte Mitarbeiter',
          'Unbegrenzte Standorte',
          'DATEV-Export',
          'Dedicated Account Manager',
          'Custom Integrationen'
        ]
      }
    ];

    res.status(200).json({
      success: true,
      plans
    });

  } catch (error) {
    logger.error('GetPlans Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get plans'
    });
  }
};

export default {
  createCheckout,
  createPortal,
  getSubscriptionStatus,
  getPlans
};
