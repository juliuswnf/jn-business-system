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
import { checkSubscriptionStatus } from '../middleware/subscriptionMiddleware.js';

const router = express.Router();

// Use protect middleware for authentication
const authenticateSalon = [authMiddleware.protect, checkSubscriptionStatus];
const authenticateSubscriptionMutation = [
  authMiddleware.protect,
  authMiddleware.requireRole('salon_owner', 'ceo'),
  checkSubscriptionStatus
];

/**
 * Subscription Management Routes
 *
 * All routes require authentication
 */

// Get current subscription status
router.get('/status', authenticateSalon, getSubscriptionStatus);

// Create new subscription
router.post('/create', authenticateSubscriptionMutation, createSubscription);

// Upgrade subscription
router.post('/upgrade', authenticateSubscriptionMutation, upgradeSubscription);

// Downgrade subscription
router.post('/downgrade', authenticateSubscriptionMutation, downgradeSubscription);

// Cancel subscription
router.post('/cancel', authenticateSubscriptionMutation, cancelSubscription);

// Setup SEPA Direct Debit (Enterprise only)
router.post('/sepa/setup', authenticateSubscriptionMutation, setupSEPA);

// Create invoice (Enterprise only)
router.post('/invoice/create', authenticateSubscriptionMutation, createInvoice);

// Convert trial to paid
router.post('/trial/convert', authenticateSubscriptionMutation, convertTrialToPaid);

export default router;
