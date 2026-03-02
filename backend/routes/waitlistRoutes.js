import express from 'express';
import Waitlist from '../models/Waitlist.js';
import Salon from '../models/Salon.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import { tierHasFeature } from '../config/pricing.js';
import logger from '../utils/logger.js';

const router = express.Router();

const isPrivilegedRole = (role) => ['ceo', 'admin'].includes(role);

const hasSalonAccess = (req, salonId) => {
  if (isPrivilegedRole(req.user?.role)) {
    return true;
  }

  return req.user?.salonId?.toString() === salonId?.toString();
};

const canAccessWaitlistEntry = (req, waitlistEntry) => {
  if (isPrivilegedRole(req.user?.role)) {
    return true;
  }

  if (req.user?.salonId?.toString() === waitlistEntry?.salonId?.toString()) {
    return true;
  }

  const userCustomerId = req.user?.customerId || req.user?.id || req.user?._id;
  return req.user?.role === 'customer' && waitlistEntry?.customerId?.toString() === userCustomerId?.toString();
};

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

const normalizeTier = (salon) => {
  const explicitTier = salon?.subscription?.tier;
  if (explicitTier) {
    return explicitTier;
  }

  const planId = (salon?.subscription?.planId || '').toLowerCase();
  if (planId.includes('enterprise')) {
    return 'enterprise';
  }
  if (planId.includes('professional') || planId.includes('pro')) {
    return 'professional';
  }

  return 'starter';
};

const hasActiveSubscription = (salon) => {
  const status = salon?.subscription?.status;
  return ['active', 'trial', 'trialing'].includes(status);
};

const resolveSalonFromReference = async (salonReference) => {
  if (!salonReference) {
    return null;
  }

  if (isObjectId(salonReference)) {
    return Salon.findById(salonReference)
      .select('_id slug businessName subscription')
      .lean();
  }

  return Salon.findOne({ slug: salonReference })
    .select('_id slug businessName subscription')
    .lean();
};

const requirePublicWaitlistFeature = async (req, res, next) => {
  try {
    const salonReference = req.body.salonId || req.body.studioId;

    if (!salonReference) {
      return res.status(400).json({
        success: false,
        message: 'salonId oder studioId ist erforderlich',
        code: 'SALON_ID_MISSING'
      });
    }

    const salon = await resolveSalonFromReference(salonReference);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon nicht gefunden',
        code: 'SALON_NOT_FOUND'
      });
    }

    if (!hasActiveSubscription(salon)) {
      return res.status(403).json({
        success: false,
        message: 'Warteliste ist für dieses Studio aktuell nicht verfügbar',
        code: 'SUBSCRIPTION_INACTIVE'
      });
    }

    const currentTier = normalizeTier(salon);
    const hasFeature = tierHasFeature(currentTier, 'waitlistManagement');

    if (!hasFeature) {
      return res.status(403).json({
        success: false,
        message: 'Warteliste ist in diesem Plan nicht enthalten',
        code: 'FEATURE_NOT_AVAILABLE',
        feature: 'waitlistManagement',
        currentTier,
        requiredTier: 'professional'
      });
    }

    req.body.salonId = salon._id.toString();
    req.resolvedSalon = salon;
    return next();
  } catch (error) {
    logger.error('Public waitlist feature access check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Feature-Zugriff konnte nicht geprüft werden',
      code: 'FEATURE_CHECK_FAILED'
    });
  }
};

const requireWaitlistFeature = async (req, res, next) => {
  try {
    let salonId = req.params.salonId || req.body.salonId;

    if (!salonId && req.params.id) {
      const waitlistEntry = await Waitlist.findById(req.params.id)
        .select('salonId')
        .lean();
      salonId = waitlistEntry?.salonId?.toString();
    }

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID required for waitlist feature check',
        code: 'SALON_ID_MISSING'
      });
    }

    req.params.salonId = salonId;
    return checkFeatureAccess('waitlistManagement')(req, res, next);
  } catch (error) {
    logger.error('Waitlist feature access check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify waitlist access',
      code: 'FEATURE_CHECK_FAILED'
    });
  }
};

/**
 * @route   POST /api/waitlist
 * @desc    Join waitlist for a preferred time slot
 * @access  Public (can be called during booking flow)
 */
router.post('/', requirePublicWaitlistFeature, async (req, res) => {
  try {
    const {
      customerId,
      salonId,
      preferredService,
      preferredDate,
      preferredTime,
      flexibleTimes,
      notes
    } = req.body;

    // Validation
    if (!customerId || !salonId || !preferredService) {
      return res.status(400).json({
        success: false,
        message: 'customerId, salonId, and preferredService are required'
      });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({
      customerId,
      salonId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Customer is already on the waitlist for this salon',
        waitlistEntry: existing
      });
    }

    // Create waitlist entry
    const waitlistEntry = await Waitlist.create({
      customerId,
      salonId,
      preferredService,
      preferredDate,
      preferredTime,
      flexibleTimes: flexibleTimes || [],
      notes,
      status: 'active'
    });

    // Calculate initial priority score
    await waitlistEntry.calculatePriorityScore();

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      waitlistEntry: {
        id: waitlistEntry._id,
        customerId: waitlistEntry.customerId,
        salonId: waitlistEntry.salonId,
        preferredService: waitlistEntry.preferredService,
        preferredDate: waitlistEntry.preferredDate,
        preferredTime: waitlistEntry.preferredTime,
        priorityScore: waitlistEntry.priorityScore,
        status: waitlistEntry.status
      }
    });

  } catch (error) {
    logger.error('Error joining waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/waitlist/:salonId
 * @desc    Get all active waitlist entries for a salon (sorted by priority)
 * @access  Private (salon owner only)
 */
router.get('/:salonId', authMiddleware.protect, requireWaitlistFeature, async (req, res) => {
  try {
    const { salonId } = req.params;

    // Validate salonId
    if (!salonId || salonId === 'null' || salonId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon ID'
      });
    }

    if (!hasSalonAccess(req, salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const waitlist = await Waitlist.find({ salonId, status: 'active' })
      .populate('customerId', 'firstName lastName phone email')
      .populate('preferredService', 'name duration price')
      .sort({ priorityScore: -1 }); // Highest priority first

    const stats = {
      total: waitlist.length,
      highPriority: waitlist.filter(w => w.priorityScore > 80).length,
      mediumPriority: waitlist.filter(w => w.priorityScore >= 50 && w.priorityScore <= 80).length,
      lowPriority: waitlist.filter(w => w.priorityScore < 50).length
    };

    res.status(200).json({
      success: true,
      stats,
      waitlist
    });

  } catch (error) {
    logger.error('Error fetching waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/waitlist/customer/:customerId/:salonId
 * @desc    Get waitlist entry for a specific customer
 * @access  Public (customer can check their own status)
 */
router.get('/customer/:customerId/:salonId', async (req, res) => {
  try {
    const { customerId, salonId } = req.params;

    const waitlistEntry = await Waitlist.findOne({
      customerId,
      salonId,
      status: 'active'
    })
      .populate('preferredService', 'name duration price');

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'No active waitlist entry found'
      });
    }

    res.status(200).json({
      success: true,
      waitlistEntry: {
        id: waitlistEntry._id,
        preferredService: waitlistEntry.preferredService,
        preferredDate: waitlistEntry.preferredDate,
        preferredTime: waitlistEntry.preferredTime,
        priorityScore: waitlistEntry.priorityScore,
        notificationsSent: waitlistEntry.notificationsSent,
        lastNotificationSent: waitlistEntry.lastNotificationSent,
        createdAt: waitlistEntry.createdAt
      }
    });

  } catch (error) {
    logger.error('Error fetching customer waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist entry',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/waitlist/:id
 * @desc    Update waitlist entry (e.g., change preferred time)
 * @access  Private (customer or salon owner)
 */
router.put('/:id', authMiddleware.protect, requireWaitlistFeature, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      preferredDate,
      preferredTime,
      flexibleTimes,
      notes
    } = req.body;

    // Find waitlist entry
    const waitlistEntry = await Waitlist.findById(id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    if (!canAccessWaitlistEntry(req, waitlistEntry)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You are not allowed to update this waitlist entry'
      });
    }

    // Update fields
    if (preferredDate) waitlistEntry.preferredDate = preferredDate;
    if (preferredTime) waitlistEntry.preferredTime = preferredTime;
    if (flexibleTimes) waitlistEntry.flexibleTimes = flexibleTimes;
    if (notes) waitlistEntry.notes = notes;

    await waitlistEntry.save();

    // Recalculate priority score
    await waitlistEntry.calculatePriorityScore();

    res.status(200).json({
      success: true,
      message: 'Waitlist entry updated successfully',
      waitlistEntry
    });

  } catch (error) {
    logger.error('Error updating waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update waitlist entry',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/waitlist/:id
 * @desc    Remove customer from waitlist
 * @access  Private (customer or salon owner)
 */
router.delete('/:id', authMiddleware.protect, requireWaitlistFeature, async (req, res) => {
  try {
    const { id } = req.params;

    // Find waitlist entry
    const waitlistEntry = await Waitlist.findById(id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    if (!canAccessWaitlistEntry(req, waitlistEntry)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You are not allowed to remove this waitlist entry'
      });
    }

    // Mark as removed
    waitlistEntry.status = 'removed';
    await waitlistEntry.save();

    res.status(200).json({
      success: true,
      message: 'Successfully removed from waitlist',
      waitlistEntry: {
        id: waitlistEntry._id,
        status: waitlistEntry.status
      }
    });

  } catch (error) {
    logger.error('Error removing from waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from waitlist',
      error: error.message
    });
  }
});

export default router;
