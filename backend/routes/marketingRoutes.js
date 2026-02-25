import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import {
  getTemplates,
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  runCampaign,
  previewCampaign,
  getRecipients,
  trackClick,
  getStats,
  getLimits
} from '../controllers/marketingController.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @route   GET /api/marketing/track/:trackingId
 * @desc    Track click and redirect (PUBLIC)
 * @access  Public
 */
router.get('/track/:trackingId', trackClick);

// ==================== PROTECTED ROUTES ====================

router.use(authMiddleware.protect);
router.use(checkFeatureAccess('marketingAutomation'));

/**
 * @route   GET /api/marketing/templates
 * @desc    Get available templates for user's tier
 * @access  Private (salon_owner)
 */
router.get('/templates', getTemplates);

/**
 * @route   POST /api/marketing/campaigns
 * @desc    Create campaign from template
 * @access  Private (salon_owner)
 */
router.post('/campaigns', createCampaign);

/**
 * @route   GET /api/marketing/campaigns
 * @desc    Get all campaigns for salon
 * @access  Private (salon_owner)
 */
router.get('/campaigns', getCampaigns);

/**
 * @route   GET /api/marketing/campaigns/:id
 * @desc    Get single campaign with stats
 * @access  Private (salon_owner)
 */
router.get('/campaigns/:id', getCampaign);

/**
 * @route   PUT /api/marketing/campaigns/:id
 * @desc    Update campaign
 * @access  Private (salon_owner)
 */
router.put('/campaigns/:id', updateCampaign);

/**
 * @route   DELETE /api/marketing/campaigns/:id
 * @desc    Delete campaign
 * @access  Private (salon_owner)
 */
router.delete('/campaigns/:id', deleteCampaign);

/**
 * @route   POST /api/marketing/campaigns/:id/run
 * @desc    Manually run campaign
 * @access  Private (salon_owner)
 */
router.post('/campaigns/:id/run', runCampaign);

/**
 * @route   GET /api/marketing/campaigns/:id/preview
 * @desc    Preview campaign recipients
 * @access  Private (salon_owner)
 */
router.get('/campaigns/:id/preview', previewCampaign);

/**
 * @route   GET /api/marketing/campaigns/:id/recipients
 * @desc    Get campaign recipients with stats
 * @access  Private (salon_owner)
 */
router.get('/campaigns/:id/recipients', getRecipients);

/**
 * @route   GET /api/marketing/stats
 * @desc    Get salon-wide marketing stats
 * @access  Private (salon_owner)
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/marketing/limits
 * @desc    Get user's tier limits
 * @access  Private (salon_owner)
 */
router.get('/limits', getLimits);

export default router;
