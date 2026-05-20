import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();
const requireSubscriptionRole = authMiddleware.requireRole('salon_owner', 'employee', 'admin', 'ceo');

// ==================== PUBLIC ====================

// Get available plans (public - no auth needed)
router.get('/plans', subscriptionController.getPlans);

// ==================== PROTECTED ====================

// Create checkout session for new subscription
router.post(
  '/checkout',
  authMiddleware.protect,
  requireSubscriptionRole,
  securityMiddleware.validateCSRFToken, // ? SECURITY FIX: CSRF protection for subscriptions
  subscriptionController.createCheckout
);

// Create billing portal session for managing subscription
router.post(
  '/portal',
  authMiddleware.protect,
  requireSubscriptionRole,
  securityMiddleware.validateCSRFToken, // ? SECURITY FIX: CSRF protection for subscriptions
  subscriptionController.createPortal
);

// Get current subscription status
router.get(
  '/status',
  authMiddleware.protect,
  requireSubscriptionRole,
  subscriptionController.getSubscriptionStatus
);

export default router;
