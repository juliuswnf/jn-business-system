import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkTenantAccess, enforceTenantFilter } from '../middleware/tenantMiddleware.js';
import { bookingCreationLimiter, mutationLimiter } from '../middleware/rateLimiterMiddleware.js';
import bookingController from '../controllers/bookingController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Apply tenant filter to all list/query operations
router.use(enforceTenantFilter);

// Get all bookings for salon (filtered by tenant)
router.get('/', bookingController.getBookings);

// Get booking stats (filtered by tenant)
router.get('/stats', bookingController.getBookingStats);

// Get bookings by date (filtered by tenant)
router.get('/by-date', bookingController.getBookingsByDate);

// Get booking by ID (tenant access check)
router.get('/:id', checkTenantAccess('booking'), bookingController.getBooking);

// ? HIGH FIX #10: Create booking with rate limiter (DoS protection)
router.post('/', bookingCreationLimiter, bookingController.createBooking);

// ? HIGH FIX #10: Update booking with rate limiter
router.put('/:id', mutationLimiter, checkTenantAccess('booking'), bookingController.updateBooking);

// ? HIGH FIX #10: Confirm/Cancel/Complete/Delete with rate limiter
router.patch('/:id/confirm', mutationLimiter, checkTenantAccess('booking'), bookingController.confirmBooking);
router.patch('/:id/cancel', mutationLimiter, checkTenantAccess('booking'), bookingController.cancelBooking);
router.patch('/:id/complete', mutationLimiter, checkTenantAccess('booking'), bookingController.completeBooking);
router.delete('/:id', mutationLimiter, checkTenantAccess('booking'), bookingController.deleteBooking);

export default router;
