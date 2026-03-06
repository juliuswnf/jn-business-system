import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { enforceTenantFilter } from '../middleware/tenantMiddleware.js';
import bookingController from '../controllers/bookingController.js';

const router = express.Router();

router.use(authMiddleware.protect);
router.use(enforceTenantFilter);

// Core dashboard KPI endpoint for booking flow
router.get('/dashboard-stats', bookingController.getDashboardStats);
router.get('/today', bookingController.getTodayAppointments);
router.post('/', bookingController.createAppointment);
router.patch('/:id/status', bookingController.updateAppointmentStatus);

export default router;