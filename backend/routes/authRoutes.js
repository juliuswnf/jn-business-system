import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import authController from '../controllers/authController.js';

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Register
router.post('/register', authController.register);

// Login - Standard (Customer/Admin)
router.post('/login', authController.login);

// CEO Login - Dedicated endpoint with role verification
router.post('/ceo-login', authController.ceoLogin);

// Employee Login - Dedicated endpoint with company verification
router.post('/employee-login', authController.employeeLogin);

// Password Management
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

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
router.post('/send-verification-email', authMiddleware.protect, authController.sendVerificationEmail);

// ==================== CEO-ONLY ROUTES ====================

// CEO Stats (example of CEO-protected route)
router.get('/ceo/stats', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getCEOStats);

// CEO Audit Logs
router.get('/ceo/audit-logs', authMiddleware.protect, ceoMiddleware.checkCEO, ceoMiddleware.getAuditLog);

export default router;
