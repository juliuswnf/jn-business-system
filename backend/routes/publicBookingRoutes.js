/**
 * Public Booking Routes
 * No authentication required - for customer-facing booking
 * Rate-limited for spam protection
 */

import express from 'express';
import publicBookingController from '../controllers/publicBookingController.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import { widgetLimiter, publicBookingLimiter } from '../middleware/rateLimiterMiddleware.js';

const router = express.Router();

// Get all salons (public list for customer booking)
// GET /api/public/salons
router.get(
  '/salons',
  widgetLimiter,
  publicBookingController.getAllSalons
);

// Search salons by name, city, etc.
// GET /api/public/salons/search?q=...
router.get(
  '/salons/search',
  widgetLimiter,
  publicBookingController.searchSalons
);

// Get salons by city (for SEO city pages)
// GET /api/public/salons/city/:city
router.get(
  '/salons/city/:city',
  widgetLimiter,
  publicBookingController.getSalonsByCity
);

// Get salon info by slug
// GET /api/public/s/:slug
router.get(
  '/s/:slug',
  widgetLimiter,
  publicBookingController.getSalonBySlug
);

// Get available time slots for a specific date and service
// POST /api/public/s/:slug/available-slots
router.post(
  '/s/:slug/available-slots',
  securityMiddleware.validateContentType,
  widgetLimiter,
  publicBookingController.getAvailableSlots
);

// Create public booking (no auth required)
// POST /api/public/s/:slug/book - Extra strict rate limiting
router.post(
  '/s/:slug/book',
  securityMiddleware.validateContentType,
  publicBookingLimiter,
  publicBookingController.createPublicBooking
);

export default router;
