import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
const { protect, authorize } = authMiddleware;
import {
  exportUserData,
  deleteUserData,
  getDataRetentionInfo,
  exportCustomerData,
  deleteCustomerData
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

const deleteCustomerSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required().messages({
    'any.required': 'Löschgrund ist erforderlich',
    'string.min': 'Löschgrund muss mindestens 3 Zeichen lang sein'
  }),
  additionalDetails: Joi.string().trim().max(2000).allow('', null)
});

// @route   GET /api/gdpr/export
// @desc    Export all user data (Right to Access)
// @access  Private
router.get('/export', protect, exportUserData);

// @route   POST /api/gdpr/delete
// @desc    Delete/Anonymize user data (Right to be Forgotten)
// @access  Private
router.post('/delete', protect, authorize('customer', 'employee', 'salon_owner', 'admin', 'ceo', 'business'), securityMiddleware.validateCSRFToken, validateBody(deleteAccountSchema), deleteUserData);

// @route   GET /api/gdpr/retention-info
// @desc    Get data retention policy information
// @access  Private
router.get('/retention-info', protect, getDataRetentionInfo);

// @route   GET /api/gdpr/customers/:customerId/export
// @desc    Export complete customer data package (GDPR Art. 20)
// @access  Private (salon_owner, ceo)
router.get('/customers/:customerId/export', protect, authorize('salon_owner', 'ceo'), exportCustomerData);

// @route   POST /api/gdpr/customers/:customerId/delete
// @desc    Delete/anonymize customer data incl. deletion request tracking (GDPR Art. 17)
// @access  Private (salon_owner, ceo)
router.post(
  '/customers/:customerId/delete',
  protect,
  authorize('salon_owner', 'ceo'),
  securityMiddleware.validateCSRFToken,
  validateBody(deleteCustomerSchema),
  deleteCustomerData
);

export default router;
