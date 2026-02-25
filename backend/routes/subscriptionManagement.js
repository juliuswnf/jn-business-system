import express from 'express';
import {
  createSubscription,
  upgradeSubscription,
  downgradeSubscription,
  cancelSubscription,
  setupSEPA,
  createInvoice,
  convertTrialToPaid,
  getSubscriptionStatus
} from '../controllers/subscriptionManagementController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Use protect middleware for authentication
const authenticateSalon = authMiddleware.protect;

/**
 * Subscription Management Routes
 *
 * All routes require authentication
 */

// Get current subscription status
router.get('/status', authenticateSalon, getSubscriptionStatus);

// Create new subscription
router.post('/create', authenticateSalon, createSubscription);

// Upgrade subscription
router.post('/upgrade', authenticateSalon, upgradeSubscription);

// Downgrade subscription
router.post('/downgrade', authenticateSalon, downgradeSubscription);

// Cancel subscription
router.post('/cancel', authenticateSalon, cancelSubscription);

// Setup SEPA Direct Debit (Enterprise only)
router.post('/sepa/setup', authenticateSalon, setupSEPA);

// Create invoice (Enterprise only)
router.post('/invoice/create', authenticateSalon, createInvoice);

// Convert trial to paid
router.post('/trial/convert', authenticateSalon, convertTrialToPaid);

export default router;
