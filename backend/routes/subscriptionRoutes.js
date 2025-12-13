import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
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
  subscriptionController.createCheckout
);

// Create billing portal session for managing subscription
router.post(
  '/portal',
  authMiddleware.protect,
  subscriptionController.createPortal
);

// Get current subscription status
router.get(
  '/status',
  authMiddleware.protect,
  subscriptionController.getSubscriptionStatus
);

export default router;
