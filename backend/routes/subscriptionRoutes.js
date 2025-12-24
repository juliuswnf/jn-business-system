import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import subscriptionController from '../controllers/subscriptionController.js';

const router = express.Router();

// ==================== PUBLIC ====================

// Get available plans (public - no auth needed)
router.get('/plans', subscriptionController.getPlans);

// ==================== PROTECTED ====================

// Create checkout session for new subscription
router.post(
  '/checkout',
  authMiddleware.protect,
  securityMiddleware.validateCSRFToken, // ? SECURITY FIX: CSRF protection for subscriptions
  subscriptionController.createCheckout
);

// Create billing portal session for managing subscription
router.post(
  '/portal',
  authMiddleware.protect,
  securityMiddleware.validateCSRFToken, // ? SECURITY FIX: CSRF protection for subscriptions
  subscriptionController.createPortal
);

// Get current subscription status
router.get(
  '/status',
  authMiddleware.protect,
  subscriptionController.getSubscriptionStatus
);

export default router;
