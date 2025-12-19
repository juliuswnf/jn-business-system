import express from 'express';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { validateBooking } from '../middleware/validationMiddleware.js';
import { widgetLimiter, publicBookingLimiter } from '../middleware/rateLimiterMiddleware.js';
import widgetCorsMiddleware from '../middleware/widgetCorsMiddleware.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';
import { generateSecurePassword, isValidObjectId } from '../utils/validation.js';

const router = express.Router();

/**
 * Widget Routes - Embeddable Booking Widget API
 * Public endpoints für externe Salon-Websites
 * Kein Auth erforderlich - Slug-basiert
 * Rate-Limited für Spam-Schutz
 */

// ? HIGH FIX #12: Apply CORS middleware (allowedDomains whitelist)
router.use(widgetCorsMiddleware);

// Apply widget rate limiter to all routes
router.use(widgetLimiter);

// ? HIGH FIX #12: Validate slug format (prevent injection)
const isValidSlug = (slug) => {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 50;
};

// ? HIGH FIX #12: Sanitize input strings (prevent XSS)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .trim()
    .substring(0, 500); // Limit length
};

// ==================== GET WIDGET CONFIG ====================
router.get('/config/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // ? HIGH FIX #12: Validate slug format
    if (!isValidSlug(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon identifier format'
      });
    }

    const salon = await Salon.findOne({ slug })
      .select('name logo primaryColor secondaryColor openingHours address phone email');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    return res.status(200).json({
      success: true,
      config: {
        salonName: salon.name,
        logo: salon.logo,
        primaryColor: salon.primaryColor || '#3B82F6',
        secondaryColor: salon.secondaryColor || '#1E40AF',
        openingHours: salon.openingHours,
        address: salon.address,
        phone: salon.phone,
        email: salon.email
      }
    });
  } catch (error) {
    logger.error('Widget Config Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading widget configuration'
    });
  }
});

// ==================== GET AVAILABLE SERVICES ====================
router.get('/services/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // ? HIGH FIX #12: Validate slug format
    if (!isValidSlug(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon identifier format'
      });
    }

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const services = await Service.find({
      salonId: salon._id,
      isActive: true
    }).select('name description price duration category');

    return res.status(200).json({
      success: true,
      services
    });
  } catch (error) {
    logger.error('Widget Services Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading services'
    });
  }
});

// ==================== GET AVAILABLE TIME SLOTS ====================
router.get('/timeslots/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, serviceId } = req.query;

    // ? HIGH FIX #12: Validate slug format
    if (!isValidSlug(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon identifier format'
      });
    }

    // ? HIGH FIX #12: Validate serviceId format
    if (!serviceId || !isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date required'
      });
    }

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    const existingBookings = await Booking.find({
      salonId: salon._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('date duration');

    const dayOfWeek = requestedDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const openingHours = salon.openingHours?.[dayName];

    if (!openingHours?.isOpen) {
      return res.status(200).json({
        success: true,
        timeSlots: []
      });
    }

    const [openTime, closeTime] = openingHours.hours.split('-');
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const timeSlots = [];
    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      const slotTime = new Date(requestedDate);
      slotTime.setHours(currentHour, currentMinute, 0, 0);

      const isAvailable = !existingBookings.some(booking => {
        const bookingEnd = new Date(booking.date.getTime() + booking.duration * 60000);
        const slotEnd = new Date(slotTime.getTime() + service.duration * 60000);
        return (
          (slotTime >= booking.date && slotTime < bookingEnd) ||
          (slotEnd > booking.date && slotEnd <= bookingEnd)
        );
      });

      if (isAvailable) {
        timeSlots.push(timeString);
      }

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    return res.status(200).json({
      success: true,
      timeSlots
    });
  } catch (error) {
    logger.error('Widget Timeslots Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error loading time slots'
    });
  }
});

// ==================== CREATE BOOKING (NO AUTH) ====================
// Extra strict rate limiting for booking creation
router.post('/book/:slug', publicBookingLimiter, validateBooking, async (req, res) => {
  try {
    const { slug } = req.params;
    const { customerName, customerEmail, customerPhone, serviceId, date, time, notes } = req.body;

    // ? HIGH FIX #12: Validate slug format
    if (!isValidSlug(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon identifier format'
      });
    }

    // ? HIGH FIX #12: Validate and sanitize inputs
    if (!serviceId || !isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    // ? HIGH FIX #12: Sanitize user inputs (XSS prevention)
    const sanitizedData = {
      customerName: sanitizeInput(customerName),
      customerEmail: sanitizeInput(customerEmail),
      customerPhone: sanitizeInput(customerPhone),
      notes: sanitizeInput(notes)
    };

    // Validate email format
    if (!sanitizedData.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const salon = await Salon.findOne({ slug });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    let customer = await User.findOne({ email: customerEmail });

    if (!customer) {
      customer = await User.create({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        role: 'customer',
        emailVerified: false,
        password: generateSecurePassword(16) // Crypto-secure password, 16 chars
      });
    }

    const [hours, minutes] = time.split(':').map(Number);
    const bookingDate = new Date(date);
    bookingDate.setHours(hours, minutes, 0, 0);

    const booking = await Booking.create({
      salonId: salon._id,
      customerId: customer._id,
      serviceId: service._id,
      date: bookingDate,
      duration: service.duration,
      price: service.price,
      status: 'pending',
      notes,
      customerName,
      customerEmail,
      customerPhone
    });

    try {
      await emailService.sendBookingConfirmation(booking._id);
    } catch (emailError) {
      logger.error('Email sending failed:', emailError);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        salonName: salon.name,
        serviceName: service.name,
        date: bookingDate,
        customerName,
        customerEmail,
        status: booking.status
      }
    });
  } catch (error) {
    logger.error('Widget Booking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
});

export default router;
