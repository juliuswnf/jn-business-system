import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import { mutationLimiter } from '../middleware/rateLimiterMiddleware.js';
import noShowController from '../controllers/noShowController.js';

const router = express.Router();

// Public one-click confirmation route
router.get('/confirm/:token', noShowController.confirmBookingByToken);

// Protected no-show management routes
router.use(authMiddleware.protect);
router.use(authMiddleware.requireActiveSubscription);
router.use(authMiddleware.requireRole('salon_owner', 'employee', 'ceo'));

router.get('/dashboard', noShowController.getNoShowDashboard);
router.get('/risk', noShowController.getNoShowRisk);
router.get('/settings', noShowController.getNoShowSettings);
router.get('/analytics', noShowController.getNoShowAnalytics);

router.post(
  '/remind/:bookingId',
  securityMiddleware.validateCSRFToken,
  mutationLimiter,
  noShowController.sendManualReminder
);

router.patch(
  '/manual-reminder/:bookingId',
  securityMiddleware.validateCSRFToken,
  mutationLimiter,
  noShowController.sendManualReminder
);

router.patch(
  '/mark/:bookingId',
  securityMiddleware.validateCSRFToken,
  mutationLimiter,
  noShowController.markBookingNoShow
);

router.patch(
  '/mark-no-show/:bookingId',
  securityMiddleware.validateCSRFToken,
  mutationLimiter,
  noShowController.markBookingNoShow
);

router.put(
  '/settings',
  securityMiddleware.validateCSRFToken,
  mutationLimiter,
  noShowController.updateNoShowSettings
);

export default router;
