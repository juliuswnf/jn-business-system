import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import ceoController from '../controllers/ceoController.js';
import ceoSubscriptionController from '../controllers/ceoSubscriptionController.js';

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware.protect);
router.use(authMiddleware.authorize('ceo'));

// CEO Dashboard
router.get('/dashboard', ceoMiddleware.verifyCEOAuth, ceoController.getCEODashboard);
router.get('/dashboard/overview', ceoMiddleware.verifyCEOAuth, ceoController.getSystemOverview);

// Businesses Management (Salons)
router.get('/businesses', ceoMiddleware.validateCEOBusinessAccess, ceoController.getAllBusinesses);
router.post('/businesses', securityMiddleware.validateContentType, ceoController.createBusiness);
router.put('/businesses/:businessId', securityMiddleware.validateContentType, ceoController.updateBusiness);
router.delete('/businesses/:businessId', securityMiddleware.validateContentType, ceoController.deleteBusiness);
router.post('/businesses/:businessId/suspend', securityMiddleware.validateContentType, ceoController.suspendBusiness);
router.post('/businesses/:businessId/reactivate', securityMiddleware.validateContentType, ceoController.reactivateBusiness);

// ==================== MVP SUBSCRIPTION MANAGEMENT ====================

// Get all subscriptions with filtering
router.get('/subscriptions', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getAllSubscriptions);

// Get subscription statistics
router.get('/subscriptions/stats', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getSubscriptionStats);

// Get salons expiring soon
router.get('/subscriptions/expiring', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getExpiringSoon);

// Get single salon subscription details
router.get('/subscriptions/:salonId', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getSalonSubscription);

// Toggle salon active status
router.patch('/subscriptions/:salonId/toggle', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.toggleSalonStatus);

// Manually update subscription status (admin override)
router.patch('/subscriptions/:salonId/status', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.updateSubscriptionStatus);

// ==================== LEGACY ROUTES ====================

// Old subscription route (kept for compatibility)
router.get('/subscription-info', ceoMiddleware.verifyCEOAuth, ceoController.getSubscriptionInfo);

// Revenue reporting
router.get('/revenue', ceoMiddleware.verifyCEOAuth, ceoController.getRevenueReport);

// System Settings (Email Templates, etc)
router.get('/settings', ceoMiddleware.verifyCEOAuth, ceoController.getSystemSettings);
router.put('/settings', securityMiddleware.validateContentType, ceoController.updateSystemSettings);

// ==================== CEO HIDDEN LOGIN ROUTE ====================
// Nur über spezielle URL erreichbar
router.get('/hidden-login', (req, res) => {
  res.json({
    success: true,
    message: 'CEO Login bereit. Bitte Token eingeben.',
    route: '/api/ceo/login'
  });
});

// ==================== CEO STATUS ROUTE ====================
// Für System-Überwachung
router.get('/status', ceoMiddleware.verifyCEOAuth, (req, res) => {
  res.json({
    success: true,
    status: 'Online',
    version: '2.0.0',
    uptime: process.uptime()
  });
});

export default router;
