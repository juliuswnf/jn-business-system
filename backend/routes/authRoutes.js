import express from 'express';
import Joi from 'joi';
import authMiddleware from '../middleware/authMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import authController from '../controllers/authController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  authLimiter,
  loginIPLimiter,
  ceoLoginLimiter,
  passwordResetLimiter,
  tokenVerifyLimiter,
  registrationLimiter,
  emailLimiter
} from '../middleware/rateLimiterMiddleware.js';

// ==================== AUTH ROUTE SCHEMAS ====================

const registerSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().min(8).max(72).required(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  businessName: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9+\-()\s]{7,20}$/).optional(),
  salonName: Joi.string().min(1).max(100).optional(),
  role: Joi.string().valid('salon_owner', 'employee').optional()
}).options({ allowUnknown: false });

const loginSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  password: Joi.string().max(72).required()
}).options({ allowUnknown: false });

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().max(254).required()
}).options({ allowUnknown: false });

const resetPasswordSchema = Joi.object({
  token: Joi.string().max(512).required(),
  password: Joi.string().min(8).max(72).required()
}).options({ allowUnknown: false });

const verifyEmailSchema = Joi.object({
  token: Joi.string().max(512).required()
}).options({ allowUnknown: false });

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Register - Rate limited to prevent spam
router.post('/register', registrationLimiter, validateBody(registerSchema), authController.register);

// Login - Standard (Customer/Admin) - Rate limited
// ? SECURITY FIX: Apply both email-based and IP-based rate limiting
router.post('/login', loginIPLimiter, authLimiter, validateBody(loginSchema), authController.login);

// CEO Login - Extra strict rate limiting
router.post('/ceo-login', ceoLoginLimiter, authController.ceoLogin);

// Employee Login - Rate limited
// ? SECURITY FIX: Apply both email-based and IP-based rate limiting
router.post('/employee-login', loginIPLimiter, authLimiter, authController.employeeLogin);

// Password Management - Strict rate limiting
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-token', tokenVerifyLimiter, authController.verifyPasswordResetToken);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

// Refresh Token (public - accepts expired token)
router.post('/refresh-token', authController.refreshToken);

// Email Verification (public - token in body)
router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);

// Health Check
router.get('/health', authController.healthCheck);

// ==================== PROTECTED ROUTES ====================

// Profile
router.get('/profile', authMiddleware.protect, authController.getProfile);
router.put('/profile', authMiddleware.protect, authController.updateProfile);

// Password
router.post('/change-password', authMiddleware.protect, authController.changePassword);

// Logout (must work even when access token is expired, using refresh cookie)
router.post('/logout', authController.logout);

// Token Verification
router.get('/verify-token', authMiddleware.protect, authController.verifyToken);

// Email Verification Request (protected - requires login)
router.post('/send-verification-email', authMiddleware.protect, emailLimiter, authController.sendVerificationEmail);

// ==================== 2FA ROUTES (Protected) ====================

// Enable 2FA - Returns QR code and secret
router.post('/2fa/enable', authMiddleware.protect, checkFeatureAccess('twoFactorAuth'), authController.enable2FA);

// Verify 2FA - Confirms setup or verifies login
router.post('/2fa/verify', authMiddleware.protect, checkFeatureAccess('twoFactorAuth'), authController.verify2FA);

// Disable 2FA - Requires password
router.post('/2fa/disable', authMiddleware.protect, checkFeatureAccess('twoFactorAuth'), authController.disable2FA);

// Get 2FA Status
router.get('/2fa/status', authMiddleware.protect, checkFeatureAccess('twoFactorAuth'), authController.get2FAStatus);

// Regenerate Backup Codes
router.post('/2fa/regenerate-backup-codes', authMiddleware.protect, checkFeatureAccess('twoFactorAuth'), authController.regenerateBackupCodes);

// ==================== CEO-ONLY ROUTES ====================

// CEO Stats (example of CEO-protected route)
router.get('/ceo/stats', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getCEOStats);

// CEO Audit Logs
router.get('/ceo/audit-logs', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getAuditLog);

export default router;
