import express from 'express';
import {
  getQuestions,
  getRecommendation,
  saveResponse,
  getAnalytics
} from '../controllers/pricingWizardController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/pricing-wizard/questions
 * Get wizard questions (public)
 */
router.get('/questions', getQuestions);

/**
 * POST /api/pricing-wizard/recommend
 * Get tier recommendation (public - works without auth)
 */
router.post('/recommend', getRecommendation);

/**
 * POST /api/pricing-wizard/save
 * Save user selection (optional auth)
 */
router.post('/save', saveResponse);

/**
 * GET /api/pricing-wizard/analytics
 * Get wizard analytics (admin only)
 */
router.get(
  '/analytics',
  authMiddleware.protect,
  authMiddleware.authorize('ceo', 'admin'),
  getAnalytics
);

export default router;
