import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import bookingController from '../controllers/bookingController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Get all bookings for salon
router.get('/', bookingController.getBookings);

// Get booking stats
router.get('/stats', bookingController.getBookingStats);

// Get bookings by date
router.get('/by-date', bookingController.getBookingsByDate);

// Get booking by ID
router.get('/:id', bookingController.getBooking);

// Create booking (authenticated)
router.post('/', bookingController.createBooking);

// Update booking
router.put('/:id', bookingController.updateBooking);

// Confirm booking
router.patch('/:id/confirm', bookingController.confirmBooking);

// Cancel booking
router.patch('/:id/cancel', bookingController.cancelBooking);

// Complete booking
router.patch('/:id/complete', bookingController.completeBooking);

// Delete booking
router.delete('/:id', bookingController.deleteBooking);

export default router;
