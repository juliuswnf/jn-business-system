import express from 'express';
import salonController from '../controllers/salonController.js';
import salonAnalyticsController from '../controllers/salonAnalyticsController.js';
import { checkSalonOwnership, enforceTenantFilter } from '../middleware/tenantMiddleware.js';

const router = express.Router();

// All routes require authentication (handled by server.js)
// Routes are protected by authMiddleware.protect in server.js

// Apply tenant filter to all operations
router.use(enforceTenantFilter);

// ==================== DASHBOARD ====================

// Salon dashboard - returns complete dashboard with stats, recent bookings
router.get('/dashboard', salonController.getSalonDashboard);

// ==================== SUCCESS METRICS / ANALYTICS ====================

// Overview metrics (KPIs)
router.get('/analytics/overview', salonAnalyticsController.getMetricsOverview);

// Booking trends chart
router.get('/analytics/trends', salonAnalyticsController.getBookingTrends);

// Top performing services
router.get('/analytics/top-services', salonAnalyticsController.getTopServices);

// Peak hours analysis
router.get('/analytics/peak-hours', salonAnalyticsController.getPeakHours);

// Customer insights
router.get('/analytics/customers', salonAnalyticsController.getCustomerInsights);

// ==================== SALON MANAGEMENT ====================

// Get salon info (own salon only, or CEO can access any)
router.get('/info', salonController.getSalonInfo);
router.get('/:salonId/info', checkSalonOwnership, salonController.getSalonInfo);

// Update salon (own salon only, or CEO can update any)
router.put('/update', salonController.updateSalon);
router.put('/:salonId/update', checkSalonOwnership, salonController.updateSalon);

// Get salon services (own salon only)
router.get('/services', salonController.getSalonServices);
router.get('/:salonId/services', checkSalonOwnership, salonController.getSalonServices);

// Get salon bookings (own salon only)
router.get('/bookings', salonController.getSalonBookings);
router.get('/:salonId/bookings', checkSalonOwnership, salonController.getSalonBookings);

// Get salon stats (own salon only)
router.get('/stats', salonController.getSalonStats);
router.get('/:salonId/stats', checkSalonOwnership, salonController.getSalonStats);

export default router;
