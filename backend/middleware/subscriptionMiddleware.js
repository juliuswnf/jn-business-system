import logger from '../utils/logger.js';
/**
 * Subscription Middleware
 * Ensures salon has active subscription before allowing access
 */

import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';

// Plan limits configuration
const PLAN_LIMITS = {
  starter: {
    monthlyBookings: 100,
    employees: 1
  },
  pro: {
    monthlyBookings: Infinity,
    employees: 10
  },
  trial: {
    monthlyBookings: 50, // Limited during trial
    employees: 3
  }
};

/**
 * Get plan type from subscription
 */
const getPlanType = (subscription) => {
  if (!subscription) return 'trial';

  const planId = (subscription.planId || '').toLowerCase();

  if (planId.includes('pro')) return 'pro';
  if (planId.includes('starter')) return 'starter';
  if (subscription.status === 'trial') return 'trial';

  return 'starter'; // Default to starter
};

/**
 * Check booking limits for Starter plan
 * Returns warning or blocks if limit exceeded
 */
export const checkBookingLimits = async (req, res, next) => {
  try {
    const salon = req.salon;

    if (!salon) {
      return next(); // Let other middleware handle missing salon
    }

    const planType = getPlanType(salon.subscription);
    const limits = PLAN_LIMITS[planType];

    // Pro plan has no limits
    if (planType === 'pro') {
      req.bookingLimits = { unlimited: true };
      return next();
    }

    // Count bookings this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bookingsThisMonth = await Booking.countDocuments({
      salonId: salon._id,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'cancelled' }
    });

    const remaining = limits.monthlyBookings - bookingsThisMonth;

    // Attach limits info to request
    req.bookingLimits = {
      used: bookingsThisMonth,
      limit: limits.monthlyBookings,
      remaining: Math.max(0, remaining),
      planType,
      percentUsed: Math.round((bookingsThisMonth / limits.monthlyBookings) * 100)
    };

    // Block if limit exceeded
    if (remaining <= 0) {
      return res.status(403).json({
        success: false,
        message: planType === 'starter'
          ? 'Monatliches Buchungslimit erreicht. Bitte auf Pro upgraden.'
          : 'Buchungslimit für Testphase erreicht.',
        code: 'BOOKING_LIMIT_EXCEEDED',
        bookingLimits: req.bookingLimits,
        upgradeUrl: '/pricing'
      });
    }

    // Warn if approaching limit (80%)
    if (remaining <= limits.monthlyBookings * 0.2 && remaining > 0) {
      res.set('X-Booking-Limit-Warning', `${remaining} Buchungen verbleibend`);
    }

    next();
  } catch (error) {
    logger.error('Check booking limits error:', error);
    next(); // Don't block on error
  }
};

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
    logger.error('Subscription middleware error:', error);
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
    logger.error('Check subscription status error:', error);
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
    logger.error('Trial/Active check error:', error);
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
    logger.error('Trial check error:', error);
    next();
  }
};

export default {
  requireActiveSubscription,
  checkSubscriptionStatus,
  requireTrialOrActive,
  isInTrial,
  checkBookingLimits,
  PLAN_LIMITS
};
