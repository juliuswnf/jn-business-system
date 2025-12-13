import logger from '../utils/logger.js';
/**
 * CEO Subscription Controller
 * Admin management of salon subscriptions
 */

import Salon from '../models/Salon.js';
import stripeService from '../services/stripeService.js';

/**
 * Get all salons with subscription info
 * GET /api/ceo/subscriptions
 */
export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (status) {
      filter['subscription.status'] = status;
    }

    const skip = (page - 1) * limit;

    const salons = await Salon.find(filter)
      .populate('owner', 'name email').lean().maxTimeMS(5000)
      .select('name slug email subscription isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Salon.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: salons.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      salons: salons.map(salon => ({
        id: salon._id,
        name: salon.name,
        slug: salon.slug,
        email: salon.email,
        owner: salon.owner,
        isActive: salon.isActive,
        subscription: {
          status: salon.subscription?.status || 'none',
          planId: salon.subscription?.planId,
          trialEndsAt: salon.subscription?.trialEndsAt,
          currentPeriodEnd: salon.subscription?.currentPeriodEnd,
          cancelAtPeriodEnd: salon.subscription?.cancelAtPeriodEnd,
          stripeCustomerId: salon.subscription?.stripeCustomerId,
          stripeSubscriptionId: salon.subscription?.stripeSubscriptionId
        },
        createdAt: salon.createdAt,
        bookingUrl: `/s/${salon.slug}`
      }))
    });
  } catch (error) {
    logger.error('GetAllSubscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get subscription statistics
 * GET /api/ceo/subscriptions/stats
 */
export const getSubscriptionStats = async (req, res) => {
  try {
    const total = await Salon.countDocuments();
    const active = await Salon.countDocuments({ 'subscription.status': 'active' });
    const trial = await Salon.countDocuments({ 'subscription.status': 'trial' });
    const pastDue = await Salon.countDocuments({ 'subscription.status': 'past_due' });
    const canceled = await Salon.countDocuments({ 'subscription.status': 'canceled' });
    const inactive = await Salon.countDocuments({ 'subscription.status': 'inactive' });

    // Calculate MRR (Monthly Recurring Revenue)
    // TODO: Get actual price from Stripe for MRR calculation

    res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        trial,
        pastDue,
        canceled,
        inactive,
        activePercentage: total > 0 ? ((active / total) * 100).toFixed(2) : 0,
        trialPercentage: total > 0 ? ((trial / total) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    logger.error('GetSubscriptionStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get single salon subscription details
 * GET /api/ceo/subscriptions/:salonId
 */
export const getSalonSubscription = async (req, res) => {
  try {
    const { salonId } = req.params;

    const salon = await Salon.findById(salonId)
      .populate('owner', 'name email phone').maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get live status from Stripe if subscription exists
    let stripeStatus = null;
    if (salon.subscription?.stripeSubscriptionId) {
      try {
        stripeStatus = await stripeService.getSubscriptionStatus(salon);
      } catch (error) {
        logger.error('Error fetching Stripe status:', error);
      }
    }

    res.status(200).json({
      success: true,
      salon: {
        id: salon._id,
        name: salon.name,
        slug: salon.slug,
        email: salon.email,
        phone: salon.phone,
        owner: salon.owner,
        isActive: salon.isActive,
        subscription: salon.subscription,
        stripeStatus,
        createdAt: salon.createdAt,
        bookingUrl: `/s/${salon.slug}`
      }
    });
  } catch (error) {
    logger.error('GetSalonSubscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Activate/Deactivate salon
 * PATCH /api/ceo/subscriptions/:salonId/toggle
 */
export const toggleSalonStatus = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { isActive } = req.body;

    const salon = await Salon.findById(salonId).maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    salon.isActive = isActive;
    await salon.save();

    res.status(200).json({
      success: true,
      message: `Salon ${isActive ? 'activated' : 'deactivated'} successfully`,
      salon: {
        id: salon._id,
        name: salon.name,
        isActive: salon.isActive
      }
    });
  } catch (error) {
    logger.error('ToggleSalonStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Manually update subscription status (admin override)
 * PATCH /api/ceo/subscriptions/:salonId/status
 */
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { status } = req.body;

    const validStatuses = ['trial', 'active', 'past_due', 'canceled', 'inactive'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const salon = await Salon.findById(salonId).maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    salon.subscription.status = status;
    await salon.save();

    res.status(200).json({
      success: true,
      message: 'Subscription status updated',
      salon: {
        id: salon._id,
        name: salon.name,
        subscription: salon.subscription
      }
    });
  } catch (error) {
    logger.error('UpdateSubscriptionStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get salons expiring soon (trial ending or subscription ending)
 * GET /api/ceo/subscriptions/expiring
 */
export const getExpiringSoon = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Find trials ending soon
    const trialsExpiring = await Salon.find({
      'subscription.status': 'trial',
      'subscription.trialEndsAt': {
        $gte: now,
        $lte: futureDate
      }
    }).populate('owner', 'name email').lean().maxTimeMS(5000);

    // Find subscriptions ending soon
    const subscriptionsExpiring = await Salon.find({
      'subscription.status': 'active',
      'subscription.cancelAtPeriodEnd': true,
      'subscription.currentPeriodEnd': {
        $gte: now,
        $lte: futureDate
      }
    }).populate('owner', 'name email').lean().maxTimeMS(5000);

    res.status(200).json({
      success: true,
      expiringIn: `${days} days`,
      trialsExpiring: trialsExpiring.length,
      subscriptionsExpiring: subscriptionsExpiring.length,
      salons: {
        trials: trialsExpiring.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          owner: s.owner,
          expiresAt: s.subscription.trialEndsAt
        })),
        subscriptions: subscriptionsExpiring.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          owner: s.owner,
          expiresAt: s.subscription.currentPeriodEnd
        }))
      }
    });
  } catch (error) {
    logger.error('GetExpiringSoon Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export default {
  getAllSubscriptions,
  getSubscriptionStats,
  getSalonSubscription,
  toggleSalonStatus,
  updateSubscriptionStatus,
  getExpiringSoon
};


