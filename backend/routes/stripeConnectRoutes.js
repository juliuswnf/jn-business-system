/**
 * Stripe Connect Routes
 * Handles Stripe Connect account creation and management
 */

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import stripeConnectService from '../services/stripeConnectService.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

/**
 * POST /api/v1/stripe-connect/create-account
 * Create Stripe Connect Account for Salon
 */
router.post('/create-account', securityMiddleware.validateCSRFToken, async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });

    if (!salon) {
      return res.status(404).json({ 
        success: false, 
        message: 'Salon nicht gefunden' 
      });
    }

    if (salon.stripe?.connectedAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Stripe-Konto existiert bereits'
      });
    }

    const accountId = await stripeConnectService.createConnectedAccount(salon, req.user);
    const onboardingUrl = await stripeConnectService.createAccountLink(accountId);

    res.json({
      success: true,
      accountId,
      onboardingUrl,
      message: 'Stripe-Konto erstellt. Bitte Onboarding abschließen, um zu aktivieren.'
    });
  } catch (error) {
    logger.error('❌ Create Stripe Connect Account Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Fehler beim Erstellen des Stripe-Kontos' 
    });
  }
});

/**
 * GET /api/v1/stripe-connect/account-status
 * Get current Stripe account status
 */
router.get('/account-status', async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });

    if (!salon || !salon.stripe?.connectedAccountId) {
      return res.json({
        success: true,
        hasAccount: false,
        status: 'not_created'
      });
    }

    const status = await stripeConnectService.checkAccountStatus(
      salon.stripe.connectedAccountId
    );

    // Update salon status
    salon.stripe.accountStatus = status.detailsSubmitted ? 'active' : 'pending';
    salon.stripe.chargesEnabled = status.chargesEnabled;
    salon.stripe.payoutsEnabled = status.payoutsEnabled;

    if (status.chargesEnabled && !salon.stripe.onboardingCompletedAt) {
      salon.stripe.onboardingCompletedAt = new Date();
    }

    await salon.save();

    res.json({
      success: true,
      hasAccount: true,
      accountId: salon.stripe.connectedAccountId,
      ...status
    });
  } catch (error) {
    logger.error('❌ Get Account Status Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Fehler beim Abrufen des Kontostatus' 
    });
  }
});

/**
 * POST /api/v1/stripe-connect/refresh-onboarding
 * Get new onboarding link
 */
router.post('/refresh-onboarding', securityMiddleware.validateCSRFToken, async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });

    if (!salon || !salon.stripe?.connectedAccountId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kein Stripe-Konto gefunden' 
      });
    }

    const onboardingUrl = await stripeConnectService.createAccountLink(
      salon.stripe.connectedAccountId
    );

    res.json({
      success: true,
      onboardingUrl
    });
  } catch (error) {
    logger.error('❌ Refresh Onboarding Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Fehler beim Erstellen des Onboarding-Links' 
    });
  }
});

export default router;

