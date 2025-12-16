import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  exportUserData,
  deleteUserData,
  getDataRetentionInfo
} from '../controllers/gdprController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import Joi from 'joi';

const router = express.Router();

/**
 * GDPR Compliance Routes
 * All routes require authentication
 */

// Validation schema for account deletion
const deleteAccountSchema = Joi.object({
  confirmPassword: Joi.string().required().messages({
    'any.required': 'Passwort zur Bestätigung erforderlich'
  })
});

// @route   GET /api/gdpr/export
// @desc    Export all user data (Right to Access)
// @access  Private
router.get('/export', protect, exportUserData);

// @route   POST /api/gdpr/delete
// @desc    Delete/Anonymize user data (Right to be Forgotten)
// @access  Private
router.post('/delete', protect, validateBody(deleteAccountSchema), deleteUserData);

// @route   GET /api/gdpr/retention-info
// @desc    Get data retention policy information
// @access  Private
router.get('/retention-info', protect, getDataRetentionInfo);

export default router;
