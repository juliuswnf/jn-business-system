/**
 * Subscription Middleware
 * Ensures salon has active subscription before allowing access
 */

import Salon from '../models/Salon.js';

/**
 * Verify salon has active subscription
 * Checks if subscription is active or in valid trial period
 */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    // Get salon ID from various sources
    let salonId = req.salon?._id || req.body.salonId || req.params.salonId;
    
    // For salon owners, get their salon
    if (!salonId && req.user && req.user.role === 'salon_owner') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (salon) {
        salonId = salon._id;
      }
    }
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID not provided'
      });
    }
    
    const salon = await Salon.findById(salonId);
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }
    
    // Check if subscription is active
    if (!salon.hasActiveSubscription()) {
      const trialEnded = salon.subscription?.trialEndsAt && new Date() > salon.subscription.trialEndsAt;
      
      return res.status(403).json({
        success: false,
        message: trialEnded 
          ? 'Your trial period has ended. Please subscribe to continue.' 
          : 'No active subscription found. Please subscribe to continue.',
        subscriptionStatus: salon.subscription?.status || 'none',
        trialEndsAt: salon.subscription?.trialEndsAt
      });
    }
    
    // Attach salon to request for use in controllers
    req.salon = salon;
    
    next();
  } catch (error) {
    console.error('Subscription middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

/**
 * Check subscription status without blocking
 * Adds subscription info to request but doesn't block access
 */
export const checkSubscriptionStatus = async (req, res, next) => {
  try {
    let salonId = req.salon?._id || req.body.salonId || req.params.salonId;
    
    if (!salonId && req.user && req.user.role === 'salon_owner') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (salon) {
        salonId = salon._id;
      }
    }
    
    if (salonId) {
      const salon = await Salon.findById(salonId);
      if (salon) {
        req.subscriptionStatus = {
          hasActiveSubscription: salon.hasActiveSubscription(),
          status: salon.subscription?.status || 'none',
          trialEndsAt: salon.subscription?.trialEndsAt,
          currentPeriodEnd: salon.subscription?.currentPeriodEnd,
          cancelAtPeriodEnd: salon.subscription?.cancelAtPeriodEnd
        };
        req.salon = salon;
      }
    }
    
    next();
  } catch (error) {
    console.error('Check subscription status error:', error);
    // Don't block on error, just continue
    next();
  }
};

/**
 * Require trial or active subscription
 * Allows access during trial period
 */
export const requireTrialOrActive = async (req, res, next) => {
  try {
    let salonId = req.salon?._id || req.body.salonId || req.params.salonId;
    
    if (!salonId && req.user && req.user.role === 'salon_owner') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (salon) {
        salonId = salon._id;
      }
    }
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID not provided'
      });
    }
    
    const salon = await Salon.findById(salonId);
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }
    
    const status = salon.subscription?.status;
    const isTrialOrActive = ['trial', 'active'].includes(status);
    
    // Check if trial is still valid
    if (status === 'trial') {
      const trialEndsAt = salon.subscription?.trialEndsAt;
      if (trialEndsAt && new Date() > trialEndsAt) {
        salon.subscription.status = 'inactive';
        await salon.save();
        
        return res.status(403).json({
          success: false,
          message: 'Your trial period has ended. Please subscribe to continue.',
          trialEnded: true
        });
      }
    }
    
    if (!isTrialOrActive) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        subscriptionStatus: status
      });
    }
    
    req.salon = salon;
    next();
  } catch (error) {
    console.error('Trial/Active check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

/**
 * Check if salon is in trial period
 */
export const isInTrial = async (req, res, next) => {
  try {
    const salon = req.salon;
    
    if (!salon) {
      return res.status(400).json({
        success: false,
        message: 'Salon not found in request'
      });
    }
    
    const inTrial = salon.subscription?.status === 'trial';
    req.isInTrial = inTrial;
    req.trialEndsAt = salon.subscription?.trialEndsAt;
    
    next();
  } catch (error) {
    console.error('Trial check error:', error);
    next();
  }
};

export default {
  requireActiveSubscription,
  checkSubscriptionStatus,
  requireTrialOrActive,
  isInTrial
};
