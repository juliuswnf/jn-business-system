import express from 'express';
import SMSConsent from '../models/SMSConsent.js';
import authMiddleware from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

const isPrivilegedRole = (role) => ['ceo', 'admin'].includes(role);

const hasSalonAccess = (req, salonId) => {
  if (isPrivilegedRole(req.user?.role)) {
    return true;
  }

  return req.user?.salonId?.toString() === salonId?.toString();
};

/**
 * @route   POST /api/sms-consent/opt-in
 * @desc    Customer opts in for SMS notifications (GDPR compliant)
 * @access  Public (can be called during booking flow)
 */
router.post('/opt-in', async (req, res) => {
  try {
    const { customerId, salonId, phoneNumber } = req.body;

    // Validation
    if (!customerId || !salonId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'customerId, salonId, and phoneNumber are required'
      });
    }

    // Check if consent already exists
    let consent = await SMSConsent.findOne({ customerId, salonId });

    if (consent) {
      // Reactivate if previously opted out
      if (!consent.active) {
        await consent.optIn();
      }
    } else {
      // Create new consent
      consent = await SMSConsent.create({
        customerId,
        salonId,
        phoneNumber,
        active: true,
        optInDate: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully opted in for SMS notifications',
      consent: {
        customerId: consent.customerId,
        salonId: consent.salonId,
        active: consent.active,
        optInDate: consent.optInDate
      }
    });

  } catch (error) {
    logger.error('Error in SMS opt-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to opt in for SMS notifications',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sms-consent/opt-out
 * @desc    Customer opts out of SMS notifications (GDPR right to withdraw)
 * @access  Public (can be triggered via STOP reply or customer dashboard)
 */
router.post('/opt-out', async (req, res) => {
  try {
    const { customerId, salonId } = req.body;

    // Validation
    if (!customerId || !salonId) {
      return res.status(400).json({
        success: false,
        message: 'customerId and salonId are required'
      });
    }

    // Find consent
    const consent = await SMSConsent.findOne({ customerId, salonId });

    if (!consent) {
      return res.status(404).json({
        success: false,
        message: 'No SMS consent found for this customer and salon'
      });
    }

    // Opt out
    await consent.optOut();

    res.status(200).json({
      success: true,
      message: 'Successfully opted out of SMS notifications',
      consent: {
        customerId: consent.customerId,
        salonId: consent.salonId,
        active: consent.active,
        optOutDate: consent.optOutDate
      }
    });

  } catch (error) {
    logger.error('Error in SMS opt-out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to opt out of SMS notifications',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sms-consent/:customerId/:salonId
 * @desc    Check SMS consent status for a customer
 * @access  Private (authenticated)
 */
router.get('/:customerId/:salonId', authMiddleware.protect, async (req, res) => {
  try {
    const { customerId, salonId } = req.params;

    // Find consent
    const consent = await SMSConsent.findOne({ customerId, salonId });

    if (!consent) {
      return res.status(200).json({
        success: true,
        hasConsent: false,
        message: 'No SMS consent found'
      });
    }

    // Check if can send now (respects DND hours)
    const canSendNow = consent.canSendNow();

    res.status(200).json({
      success: true,
      hasConsent: true,
      consent: {
        customerId: consent.customerId,
        salonId: consent.salonId,
        phoneNumber: consent.phoneNumber,
        active: consent.active,
        canSendNow,
        optInDate: consent.optInDate,
        optOutDate: consent.optOutDate,
        totalSent: consent.totalSent,
        lastSentAt: consent.lastSentAt
      }
    });

  } catch (error) {
    logger.error('Error checking SMS consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check SMS consent status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sms-consent/salon/:salonId
 * @desc    Get all SMS consents for a salon (admin dashboard)
 * @access  Private (salon owner only)
 */
router.get('/salon/:salonId', authMiddleware.protect, async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!hasSalonAccess(req, salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const consents = await SMSConsent.find({ salonId })
      .populate('customerId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    const stats = {
      total: consents.length,
      active: consents.filter(c => c.active).length,
      optedOut: consents.filter(c => !c.active).length
    };

    res.status(200).json({
      success: true,
      stats,
      consents
    });

  } catch (error) {
    logger.error('Error fetching salon SMS consents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMS consents',
      error: error.message
    });
  }
});

export default router;
