import { PRICING_TIERS, FEATURE_NAMES, compareTiers } from '../config/pricing.js';
import smsService from '../services/smsService.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import Salon from '../models/Salon.js';

const ALLOWED_TIERS = Object.keys(PRICING_TIERS);
const ALLOWED_FEATURES = Object.keys(FEATURE_NAMES);

const resolveScopedSalon = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Nicht authentifiziert' });
    return null;
  }

  let targetSalonId;

  if (req.user.role === 'ceo') {
    const rawSalonId = req.query?.salonId;

    if (!rawSalonId) {
      res.status(400).json({
        success: false,
        message: 'salonId query parameter is required for CEO requests'
      });
      return null;
    }

    if (!mongoose.isValidObjectId(rawSalonId)) {
      res.status(400).json({ success: false, message: 'Invalid salonId format' });
      return null;
    }

    targetSalonId = new mongoose.Types.ObjectId(rawSalonId);
  } else {
    const trustedSalonId = req.user.salonId;

    if (!trustedSalonId) {
      res.status(403).json({
        success: false,
        message: 'Access denied - No salon assigned to your account'
      });
      return null;
    }

    targetSalonId = new mongoose.Types.ObjectId(trustedSalonId);
  }

  const salon = await Salon.findById(targetSalonId).maxTimeMS(5000);

  if (!salon) {
    res.status(404).json({ success: false, message: 'Salon not found' });
    return null;
  }

  return salon;
};

/**
 * Pricing Controller - Handle pricing tier and feature access
 *
 * Routes:
 * - GET /pricing/tiers - Get all pricing tiers
 * - GET /pricing/current - Get current salon tier and features
 * - GET /pricing/features - Get feature comparison
 * - GET /pricing/sms-usage - Get SMS usage stats (Enterprise only)
 * - POST /pricing/check-feature - Check if salon has access to feature
 */

// Get all pricing tiers (public)
export const getPricingTiers = async (req, res) => {
  try {
    // Return pricing tiers without internal fields
    const tiers = Object.entries(PRICING_TIERS).map(([slug, config]) => ({
      slug,
      name: config.name,
      priceMonthly: config.priceMonthly,
      priceYearly: config.priceYearly,
      yearlyDiscount: ((config.priceMonthly * 12 - config.priceYearly) / (config.priceMonthly * 12) * 100).toFixed(0),
      limits: config.limits,
      features: Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => ({
          key: feature,
          name: FEATURE_NAMES[feature] || feature
        })),
      popular: slug === 'professional', // Mark Professional as popular
      enterprise: slug === 'enterprise'
    }));

    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    logger.error('[Pricing Controller] Error getting pricing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pricing tiers',
      message: error.message
    });
  }
};

// Get current salon tier and features (authenticated)
export const getCurrentTier = async (req, res) => {
  try {
    const salon = await resolveScopedSalon(req, res);
    if (!salon) return;

    // Get tier configuration
    const tierConfig = PRICING_TIERS[salon.subscription.tier || 'starter'];

    // Get enabled features
    const enabledFeatures = Object.entries(tierConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => ({
        key: feature,
        name: FEATURE_NAMES[feature] || feature
      }));

    // Get subscription status
    const hasActiveSubscription = salon.hasActiveSubscription();

    res.json({
      success: true,
      subscription: {
        tier: salon.subscription.tier || 'starter',
        tierName: salon.getTierName(),
        status: salon.subscription.status,
        billingCycle: salon.subscription.billingCycle || 'monthly',
        paymentMethod: salon.subscription.paymentMethod || 'stripe',
        hasActiveSubscription,
        trialEndsAt: salon.subscription.trialEndsAt,
        currentPeriodEnd: salon.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: salon.subscription.cancelAtPeriodEnd,
        grandfathered: salon.subscription.grandfathered || false
      },
      pricing: {
        priceMonthly: tierConfig.priceMonthly,
        priceYearly: tierConfig.priceYearly,
        currentPrice: salon.subscription.billingCycle === 'yearly'
          ? tierConfig.priceYearly
          : tierConfig.priceMonthly
      },
      limits: tierConfig.limits,
      features: enabledFeatures
    });
  } catch (error) {
    logger.error('[Pricing Controller] Error getting current tier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current tier',
      message: error.message
    });
  }
};

// Get feature comparison (public)
export const getFeatureComparison = async (req, res) => {
  try {
    // Build feature comparison matrix
    const allFeatures = Object.keys(FEATURE_NAMES);

    const comparison = allFeatures.map(featureKey => ({
      key: featureKey,
      name: FEATURE_NAMES[featureKey],
      starter: PRICING_TIERS.starter.features[featureKey] || false,
      professional: PRICING_TIERS.professional.features[featureKey] || false,
      enterprise: PRICING_TIERS.enterprise.features[featureKey] || false
    }));

    res.json({
      success: true,
      features: comparison
    });
  } catch (error) {
    logger.error('[Pricing Controller] Error getting feature comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get feature comparison',
      message: error.message
    });
  }
};

// Get SMS usage stats (authenticated, Enterprise only)
export const getSMSUsage = async (req, res) => {
  try {
    const salon = await resolveScopedSalon(req, res);
    if (!salon) return;

    // Check if salon has SMS feature
    if (!salon.hasFeature('smsNotifications')) {
      return res.status(403).json({
        success: false,
        error: 'Feature not available',
        message: 'SMS notifications are only available in Enterprise tier',
        currentTier: salon.subscription.tier,
        requiredTier: 'enterprise',
        upgradeUrl: '/pricing'
      });
    }

    // Get SMS usage statistics
    const stats = await smsService.getSMSUsageStats(salon);

    res.json({
      success: true,
      smsUsage: stats
    });
  } catch (error) {
    logger.error('[Pricing Controller] Error getting SMS usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS usage',
      message: error.message
    });
  }
};

// Check if salon has access to feature (authenticated)
export const checkFeatureAccess = async (req, res) => {
  try {
    const salon = await resolveScopedSalon(req, res);
    if (!salon) return;

    const rawFeature = req.body?.feature;

    if (!rawFeature || typeof rawFeature !== 'string' || rawFeature.length > 64) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter',
        message: 'Feature name is required'
      });
    }

    // Resolve from static allow-list to avoid tainted dynamic lookups.
    const feature = ALLOWED_FEATURES.find((allowedFeature) => allowedFeature === rawFeature);

    if (!feature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature key'
      });
    }

    // Check if salon has feature
    const hasAccess = salon.hasFeature(feature);

    if (hasAccess) {
      res.json({
        success: true,
        hasAccess: true,
        feature,
        currentTier: salon.subscription.tier
      });
    } else {
      // Get required tier for feature
      const requiredTier = salon.getRequiredTierForFeature(feature);

      res.json({
        success: true,
        hasAccess: false,
        feature,
        currentTier: salon.subscription.tier,
        requiredTier,
        message: `This feature requires ${requiredTier} tier`,
        upgradeUrl: '/pricing'
      });
    }
  } catch (error) {
    logger.error('[Pricing Controller] Error checking feature access:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check feature access',
      message: error.message
    });
  }
};

// Get tier comparison (which tier is higher)
export const compareTiersEndpoint = async (req, res) => {
  try {
    const { tier1: rawTier1, tier2: rawTier2 } = req.query;

    if (!rawTier1 || !rawTier2 || typeof rawTier1 !== 'string' || typeof rawTier2 !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'Both tier1 and tier2 are required'
      });
    }

    const tier1 = ALLOWED_TIERS.find((tier) => tier === rawTier1);
    const tier2 = ALLOWED_TIERS.find((tier) => tier === rawTier2);

    if (!tier1 || !tier2) {
      return res.status(400).json({ success: false, message: 'Invalid tier value' });
    }

    const comparison = compareTiers(tier1, tier2);

    res.json({
      success: true,
      tier1,
      tier2,
      comparison, // -1, 0, or 1
      tier1IsHigher: comparison < 0,
      tier2IsHigher: comparison > 0,
      tiersEqual: comparison === 0
    });
  } catch (error) {
    logger.error('[Pricing Controller] Error comparing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare tiers',
      message: error.message
    });
  }
};
