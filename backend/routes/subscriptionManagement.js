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

/**
 * Subscription Management Routes
 *
 * All routes require authentication
 */

// Get current subscription status
router.get('/status', authenticateSalon, getSubscriptionStatus);

// Create new subscription
router.post('/create', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), createSubscription);

// Upgrade subscription
router.post('/upgrade', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), upgradeSubscription);

// Downgrade subscription
router.post('/downgrade', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), downgradeSubscription);

// Cancel subscription
router.post('/cancel', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), cancelSubscription);

// Setup SEPA Direct Debit (Enterprise only)
router.post('/sepa/setup', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), setupSEPA);

// Create invoice (Enterprise only)
router.post('/invoice/create', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), createInvoice);

// Convert trial to paid
router.post('/trial/convert', authenticateSalon, authMiddleware.requireRole('salon_owner', 'ceo'), convertTrialToPaid);

export default router;
