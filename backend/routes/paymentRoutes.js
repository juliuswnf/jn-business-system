import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import paymentController from '../controllers/paymentController.js';
import { paymentLimiter } from '../middleware/rateLimiterMiddleware.js';

const router = express.Router();

// ==================== PAYMENT INTENT (Booking Payments) ====================

// Create payment intent for booking
router.post(
  '/intent',
  authMiddleware.protect,
  paymentLimiter,
  securityMiddleware.validateContentType,
  paymentController.createPaymentIntent
);

// Process payment after successful payment intent
router.post(
  '/process',
  authMiddleware.protect,
  paymentLimiter,
  securityMiddleware.validateContentType,
  paymentController.processPayment
);

// ==================== PAYMENT HISTORY ====================

// Get payment history (with filters)
router.get(
  '/history',
  authMiddleware.protect,
  paymentController.getPaymentHistory
);

// Get specific payment details
router.get(
  '/:paymentId',
  authMiddleware.protect,
  paymentController.getPaymentDetails
);

// ==================== REFUNDS ====================

// Refund a payment
router.post(
  '/refund',
  authMiddleware.protect,
  paymentLimiter,
  securityMiddleware.validateContentType,
  paymentController.refundPayment
);

// ==================== ANALYTICS ====================

// Get revenue analytics
router.get(
  '/analytics/revenue',
  authMiddleware.protect,
  paymentController.getRevenueAnalytics
);

// ==================== WEBHOOK (Public) ====================

// Stripe webhook handler (public, no auth)
router.post(
  '/webhook/stripe',
  paymentController.handleStripeWebhook
);

export default router;
