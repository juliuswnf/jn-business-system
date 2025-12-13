import express from 'express';
import {
  getPricingTiers,
  getCurrentTier,
  getFeatureComparison,
  getSMSUsage,
  checkFeatureAccess,
  compareTiersEndpoint
} from '../controllers/pricingController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Use protect middleware for authentication
const authenticateSalon = authMiddleware.protect;

/**
 * Pricing Routes
 *
 * Public routes:
 * - GET /pricing/tiers - Get all pricing tiers
 * - GET /pricing/features - Get feature comparison matrix
 * - GET /pricing/compare - Compare two tiers
 *
 * Authenticated routes (require salon login):
 * - GET /pricing/current - Get current salon tier and subscription
 * - GET /pricing/sms-usage - Get SMS usage stats (Enterprise only)
 * - POST /pricing/check-feature - Check if salon has access to feature
 */

// ==================== PUBLIC ROUTES ====================

// Get all pricing tiers (public)
router.get('/tiers', getPricingTiers);

// Get feature comparison matrix (public)
router.get('/features', getFeatureComparison);

// Compare two tiers (public)
router.get('/compare', compareTiersEndpoint);

// ==================== AUTHENTICATED ROUTES ====================

// Get current salon tier and subscription (authenticated)
router.get('/current', authenticateSalon, getCurrentTier);

// Get SMS usage stats (authenticated, Enterprise only)
router.get('/sms-usage', authenticateSalon, getSMSUsage);

// Check if salon has access to feature (authenticated)
router.post('/check-feature', authenticateSalon, checkFeatureAccess);

export default router;
