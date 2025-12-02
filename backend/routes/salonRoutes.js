import express from 'express';
import salonController from '../controllers/salonController.js';

const router = express.Router();

// All routes require authentication (handled by server.js)
// Routes are protected by authMiddleware.protect in server.js

// ==================== DASHBOARD ====================

// Salon dashboard - returns complete dashboard with stats, recent bookings
router.get('/dashboard', salonController.getSalonDashboard);

// ==================== SALON MANAGEMENT ====================

// Get salon info
router.get('/info', salonController.getSalonInfo);
router.get('/:salonId/info', salonController.getSalonInfo);

// Update salon
router.put('/update', salonController.updateSalon);
router.put('/:salonId/update', salonController.updateSalon);

// Get salon services
router.get('/services', salonController.getSalonServices);
router.get('/:salonId/services', salonController.getSalonServices);

// Get salon bookings
router.get('/bookings', salonController.getSalonBookings);
router.get('/:salonId/bookings', salonController.getSalonBookings);

// Get salon stats
router.get('/stats', salonController.getSalonStats);
router.get('/:salonId/stats', salonController.getSalonStats);

export default router;
