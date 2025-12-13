import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import authController from '../controllers/authController.js';
import {
  authLimiter,
  ceoLoginLimiter,
  passwordResetLimiter,
  registrationLimiter,
  emailLimiter
} from '../middleware/rateLimiterMiddleware.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Register - Rate limited to prevent spam
router.post('/register', registrationLimiter, authController.register);

// Login - Standard (Customer/Admin) - Rate limited
router.post('/login', authLimiter, authController.login);

// CEO Login - Extra strict rate limiting
router.post('/ceo-login', ceoLoginLimiter, authController.ceoLogin);

// Employee Login - Rate limited
router.post('/employee-login', authLimiter, authController.employeeLogin);

// Password Management - Strict rate limiting
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// Refresh Token (public - accepts expired token)
router.post('/refresh-token', authController.refreshToken);

// Email Verification (public - token in body)
router.post('/verify-email', authController.verifyEmail);

// Health Check
router.get('/health', authController.healthCheck);

// ==================== PROTECTED ROUTES ====================

// Profile
router.get('/profile', authMiddleware.protect, authController.getProfile);
router.put('/profile', authMiddleware.protect, authController.updateProfile);

// Password
router.post('/change-password', authMiddleware.protect, authController.changePassword);

// Logout
router.post('/logout', authMiddleware.protect, authController.logout);

// Token Verification
router.get('/verify-token', authMiddleware.protect, authController.verifyToken);

// Email Verification Request (protected - requires login)
router.post('/send-verification-email', authMiddleware.protect, emailLimiter, authController.sendVerificationEmail);

// ==================== 2FA ROUTES (Protected) ====================

// Enable 2FA - Returns QR code and secret
router.post('/2fa/enable', authMiddleware.protect, authController.enable2FA);

// Verify 2FA - Confirms setup or verifies login
router.post('/2fa/verify', authMiddleware.protect, authController.verify2FA);

// Disable 2FA - Requires password
router.post('/2fa/disable', authMiddleware.protect, authController.disable2FA);

// Get 2FA Status
router.get('/2fa/status', authMiddleware.protect, authController.get2FAStatus);

// Regenerate Backup Codes
router.post('/2fa/regenerate-backup-codes', authMiddleware.protect, authController.regenerateBackupCodes);

// ==================== CEO-ONLY ROUTES ====================

// CEO Stats (example of CEO-protected route)
router.get('/ceo/stats', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getCEOStats);

// CEO Audit Logs
router.get('/ceo/audit-logs', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getAuditLog);

export default router;
