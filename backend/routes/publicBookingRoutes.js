/**
 * Public Booking Routes
 * No authentication required - for customer-facing booking
 */

import express from 'express';
import publicBookingController from '../controllers/publicBookingController.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import { strictLimiter } from '../middleware/rateLimiterMiddleware.js';

const router = express.Router();

// Get salon info by slug
// GET /api/public/s/:slug
router.get(
  '/s/:slug',
  strictLimiter,
  publicBookingController.getSalonBySlug
);

// Get available time slots for a specific date and service
// POST /api/public/s/:slug/available-slots
router.post(
  '/s/:slug/available-slots',
  securityMiddleware.validateContentType,
  strictLimiter,
  publicBookingController.getAvailableSlots
);

// Create public booking (no auth required)
// POST /api/public/s/:slug/book
router.post(
  '/s/:slug/book',
  securityMiddleware.validateContentType,
  strictLimiter,
  publicBookingController.createPublicBooking
);

export default router;
