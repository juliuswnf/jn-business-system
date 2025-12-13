import { tierHasFeature, getRequiredTierForFeature, compareTiers } from '../config/pricing.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';

/**
 * Feature Access Middleware
 * Checks if salon's subscription tier has access to requested feature
 * 
 * Usage:
 * router.post('/send-sms', authenticateToken, checkFeatureAccess('smsNotifications'), smsController.send);
 * router.post('/portfolio', authenticateToken, checkFeatureAccess('portfolioManagement'), portfolioController.create);
 */

export const checkFeatureAccess = (featureName, options = {}) => {
  return async (req, res, next) => {
    try {
      // Get salon from database
      const salonId = req.user.salonId || req.body.salonId || req.params.salonId;
      
      if (!salonId) {
        return res.status(400).json({
          success: false,
          error: 'Salon ID required',
          code: 'SALON_ID_MISSING'
        });
      }

      const salon = await Salon.findById(salonId)
        .select('subscription businessName')
        .lean();

      if (!salon) {
        return res.status(404).json({
          success: false,
          error: 'Salon not found',
          code: 'SALON_NOT_FOUND'
        });
      }

      // Get subscription tier
      const currentTier = salon.subscription?.tier || 'starter';
      const subscriptionStatus = salon.subscription?.status || 'inactive';

      // Check if subscription is active
      if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
        return res.status(403).json({
          success: false,
          error: 'Subscription inactive',
          code: 'SUBSCRIPTION_INACTIVE',
          currentTier,
          subscriptionStatus,
          message: 'Your subscription is inactive. Please update your payment method.',
          upgradeUrl: '/settings/billing'
        });
      }

      // Check if tier has feature access
      const hasFeature = tierHasFeature(currentTier, featureName);

      if (!hasFeature) {
        const requiredTier = getRequiredTierForFeature(featureName);
        
        logger.warn('Feature access denied', {
          salonId,
          salonName: salon.businessName,
          feature: featureName,
          currentTier,
          requiredTier,
          userId: req.user.id
        });

        return res.status(403).json({
          success: false,
          error: `Feature not available in ${currentTier} tier`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName,
          currentTier,
          requiredTier,
          message: getFeatureUnavailableMessage(featureName, currentTier, requiredTier),
          upgradeUrl: '/pricing',
          learnMoreUrl: `/features/${featureName}`
        });
      }

      // Feature check passed
      logger.info('Feature access granted', {
        salonId,
        feature: featureName,
        tier: currentTier
      });

      // Attach salon and tier info to request for controller use
      req.salon = salon;
      req.subscription = {
        tier: currentTier,
        status: subscriptionStatus
      };

      next();

    } catch (error) {
      logger.error('Feature access check failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check feature access',
        code: 'FEATURE_CHECK_FAILED'
      });
    }
  };
};

/**
 * Check multiple features (OR condition - at least one must be available)
 */
export const checkAnyFeatureAccess = (featureNames = [], options = {}) => {
  return async (req, res, next) => {
    try {
      const salonId = req.user.salonId || req.body.salonId || req.params.salonId;
      
      if (!salonId) {
        return res.status(400).json({
          success: false,
          error: 'Salon ID required',
          code: 'SALON_ID_MISSING'
        });
      }

      const salon = await Salon.findById(salonId)
        .select('subscription businessName')
        .lean();

      if (!salon) {
        return res.status(404).json({
          success: false,
          error: 'Salon not found',
          code: 'SALON_NOT_FOUND'
        });
      }

      const currentTier = salon.subscription?.tier || 'starter';
      const subscriptionStatus = salon.subscription?.status || 'inactive';

      if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
        return res.status(403).json({
          success: false,
          error: 'Subscription inactive',
          code: 'SUBSCRIPTION_INACTIVE'
        });
      }

      // Check if any feature is available
      const hasAnyFeature = featureNames.some(feature => 
        tierHasFeature(currentTier, feature)
      );

      if (!hasAnyFeature) {
        return res.status(403).json({
          success: false,
          error: 'None of the required features are available',
          code: 'FEATURES_NOT_AVAILABLE',
          features: featureNames,
          currentTier,
          upgradeUrl: '/pricing'
        });
      }

      req.salon = salon;
      req.subscription = { tier: currentTier, status: subscriptionStatus };
      next();

    } catch (error) {
      logger.error('Feature access check failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check feature access'
      });
    }
  };
};

/**
 * Check if subscription is active (any tier)
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const salonId = req.user.salonId;
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Salon ID required'
      });
    }

    const salon = await Salon.findById(salonId)
      .select('subscription')
      .lean();

    if (!salon) {
      return res.status(404).json({
        success: false,
        error: 'Salon not found'
      });
    }

    const status = salon.subscription?.status;

    if (status !== 'active' && status !== 'trialing') {
      return res.status(403).json({
        success: false,
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionStatus: status,
        upgradeUrl: '/pricing'
      });
    }

    req.salon = salon;
    next();

  } catch (error) {
    logger.error('Subscription check failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check subscription status'
    });
  }
};

/**
 * Check if tier meets minimum requirement
 */
export const requireMinimumTier = (minimumTier) => {
  return async (req, res, next) => {
    try {
      const salonId = req.user.salonId;
      
      const salon = await Salon.findById(salonId)
        .select('subscription businessName')
        .lean();

      if (!salon) {
        return res.status(404).json({
          success: false,
          error: 'Salon not found'
        });
      }

      const currentTier = salon.subscription?.tier || 'starter';
      const tierComparison = compareTiers(currentTier, minimumTier);

      if (tierComparison < 0) {
        return res.status(403).json({
          success: false,
          error: `This feature requires at least ${minimumTier} tier`,
          code: 'INSUFFICIENT_TIER',
          currentTier,
          requiredTier: minimumTier,
          upgradeUrl: '/pricing'
        });
      }

      req.salon = salon;
      req.subscription = { tier: currentTier };
      next();

    } catch (error) {
      logger.error('Tier check failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check tier requirement'
      });
    }
  };
};

/**
 * Generate user-friendly error message for feature unavailability
 */
function getFeatureUnavailableMessage(featureName, currentTier, requiredTier) {
  const messages = {
    smsNotifications: `SMS notifications are only available in Enterprise tier. Upgrade to send appointment reminders via SMS and reduce no-shows.`,
    
    portfolioManagement: `Portfolio management is available in Professional and Enterprise tiers. Upgrade to showcase your work and attract more clients.`,
    
    apiAccess: `API access is exclusive to Enterprise tier. Upgrade to integrate with your existing tools and build custom workflows.`,
    
    multiLocation: `Multi-location support is available in Enterprise tier. Upgrade to manage multiple salons from one dashboard.`,
    
    whiteLabel: `White-label branding is exclusive to Enterprise tier. Upgrade to remove JN Automation branding and use your own logo.`,
    
    customDomain: `Custom domains are available in Enterprise tier. Upgrade to use your own domain (e.g., bookings.yoursalon.com).`,
    
    advancedAnalytics: `Advanced analytics are available in Professional and Enterprise tiers. Upgrade to get detailed insights into your business performance.`,
    
    marketingAutomation: `Marketing automation is available in Professional and Enterprise tiers. Upgrade to send automated email campaigns and win-back sequences.`,
    
    hipaaCompliance: `HIPAA compliance features are exclusive to Enterprise tier. Upgrade to handle medical data securely and meet regulatory requirements.`
  };

  return messages[featureName] || 
    `This feature is not available in ${currentTier} tier. Upgrade to ${requiredTier} to unlock this feature.`;
}

/**
 * Soft feature gate (shows warning but allows access)
 * Useful for beta features or gradual rollouts
 */
export const softFeatureGate = (featureName) => {
  return async (req, res, next) => {
    try {
      const salonId = req.user.salonId;
      const salon = await Salon.findById(salonId).select('subscription').lean();
      
      if (!salon) {
        return next();
      }

      const currentTier = salon.subscription?.tier || 'starter';
      const hasFeature = tierHasFeature(currentTier, featureName);

      if (!hasFeature) {
        logger.warn('Soft feature gate triggered', {
          salonId,
          feature: featureName,
          tier: currentTier
        });
        
        // Set warning in response (controller can display upgrade banner)
        req.featureWarning = {
          feature: featureName,
          message: 'This feature will be locked in the future. Please upgrade to continue using it.',
          upgradeUrl: '/pricing'
        };
      }

      next();

    } catch (error) {
      logger.error('Soft feature gate failed:', error);
      next(); // Allow access on error
    }
  };
};

export default {
  checkFeatureAccess,
  checkAnyFeatureAccess,
  requireActiveSubscription,
  requireMinimumTier,
  softFeatureGate
};
