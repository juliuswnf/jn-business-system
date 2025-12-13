import logger from '../utils/logger.js';
import timezoneHelpers from '../utils/timezoneHelpers.js';
import { 
  escapeRegex, 
  sanitizePagination, 
  parseValidDate, 
  isValidObjectId, 
  isValidEmail,
  sanitizeErrorMessage 
} from '../utils/validation.js';
/**
 * Public Booking Controller
 * Handles booking creation without customer authentication
 * via salon slug (e.g. /s/salon-name)
 */

import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import emailTemplateService from '../services/emailTemplateService.js';
import emailQueueWorker from '../workers/emailQueueWorker.js';

/**
 * Get all salons for public listing
 * GET /api/public/salons
 */
export const getAllSalons = async (req, res) => {
  try {
    const { page, limit, skip } = sanitizePagination(
      req.query.page,
      req.query.limit,
      100 // Maximum 100 items per page to prevent DoS
    );

    // Debug: Log all salons count
    const allSalonsCount = await Salon.countDocuments({});
    logger.info(`Total salons in DB: ${allSalonsCount}`);

    // Get all salons (show all for now, can filter by subscription later)
    // For production: filter by subscription.status: 'active' or 'trialing'
    const salons = await Salon.find({})
      .select('name slug address city phone businessHours createdAt subscription')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Found ${salons.length} salons after query`);

    const total = await Salon.countDocuments({});

    // Get service count for each salon
    const salonsWithServices = await Promise.all(
      salons.map(async (salon) => {
        const serviceCount = await Service.countDocuments({
          salonId: salon._id,
          isActive: true
        });
        return {
          ...salon.toObject(),
          serviceCount
        };
      })
    );

    res.status(200).json({
      success: true,
      salons: salonsWithServices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GetAllSalons Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Search salons by name, city, address
 * GET /api/public/salons/search?q=...
 */
export const searchSalons = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    // Escape regex special characters to prevent ReDoS attacks
    const searchRegex = new RegExp(escapeRegex(q), 'i');

    const salons = await Salon.find({
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { 'address.street': searchRegex },
        { 'address.city': searchRegex }
      ]
    })
      .select('name slug address city phone subscription')
      .limit(10);

    res.status(200).json({
      success: true,
      salons
    });
  } catch (error) {
    logger.error('SearchSalons Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get salons by city (for SEO city pages)
 * GET /api/public/salons/city/:city
 */
export const getSalonsByCity = async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    // Escape regex special characters to prevent ReDoS attacks
    const cityRegex = new RegExp(`^${escapeRegex(city)}$`, 'i');

    // Find salons in this city
    const salons = await Salon.find({
      $or: [
        { city: cityRegex },
        { 'address.city': cityRegex }
      ]
    })
      .select('name slug address city phone businessHours')
      .sort({ name: 1 });

    // Get service count for each salon
    const salonsWithServices = await Promise.all(
      salons.map(async (salon) => {
        const serviceCount = await Service.countDocuments({
          salonId: salon._id,
          isActive: true
        });
        return {
          ...salon.toObject(),
          serviceCount
        };
      })
    );

    res.status(200).json({
      success: true,
      salons: salonsWithServices,
      city
    });
  } catch (error) {
    logger.error('GetSalonsByCity Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get salon by slug with services and availability info
 * GET /api/public/s/:slug
 */
export const getSalonBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const salon = await Salon.findBySlug(slug);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Check if salon has active subscription
    if (!salon.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Booking is currently unavailable'
      });
    }

    // Get services for this salon
    const services = await Service.find({
      salonId: salon._id,
      isActive: true
    }).select('name description price duration category');

    // Get employees (users with role=employee for this salon)
    const employees = await User.find({
      salonId: salon._id,
      role: 'employee',
      isActive: true
    }).select('name avatar');

    res.status(200).json({
      success: true,
      salon: {
        name: salon.name,
        slug: salon.slug,
        address: salon.address,
        phone: salon.phone,
        businessHours: salon.businessHours,
        bookingBuffer: salon.bookingBuffer,
        advanceBookingDays: salon.advanceBookingDays
      },
      services,
      employees
    });
  } catch (error) {
    logger.error('GetSalonBySlug Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Get available time slots for a specific date and service
 * POST /api/public/s/:slug/available-slots
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, serviceId, employeeId } = req.body;

    if (!date || !serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and serviceId'
      });
    }

    const salon = await Salon.findBySlug(slug);

    if (!salon || !salon.hasActiveSubscription()) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or booking unavailable'
      });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get day of week for business hours check
    const requestDate = new Date(date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[requestDate.getDay()];
    const businessHours = salon.businessHours[dayName];

    if (!businessHours || businessHours.closed) {
      return res.status(200).json({
        success: true,
        slots: [],
        message: 'Salon is closed on this day'
      });
    }

    // Get existing bookings for this date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let bookingFilter = {
      salonId: salon._id,
      serviceId,
      bookingDate: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] }
    };

    if (employeeId) {
      bookingFilter.employeeId = employeeId;
    }

    const existingBookings = await Booking.find(bookingFilter);

    // Generate time slots based on business hours
    const slots = [];
    const [openHour, openMin] = businessHours.open.split(':').map(Number);
    const [closeHour, closeMin] = businessHours.close.split(':').map(Number);

    let currentSlot = new Date(startDate);
    currentSlot.setHours(openHour, openMin, 0, 0);

    const closingTime = new Date(startDate);
    closingTime.setHours(closeHour, closeMin, 0, 0);

    const serviceDuration = service.duration || 60;
    const buffer = salon.bookingBuffer || 0;
    const slotInterval = serviceDuration + buffer;

    while (currentSlot < closingTime) {
      // Check if slot is already booked
      const isBooked = existingBookings.some(booking => {
        const bookingTime = new Date(booking.bookingDate).getTime();
        const slotTime = currentSlot.getTime();
        return Math.abs(bookingTime - slotTime) < 60000; // Within 1 minute
      });

      // Check if slot is in the past
      const isPast = currentSlot < new Date();

      if (!isBooked && !isPast) {
        slots.push({
          time: currentSlot.toISOString(),
          display: currentSlot.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          available: true
        });
      }

      // Move to next slot
      currentSlot = new Date(currentSlot.getTime() + slotInterval * 60000);
    }

    res.status(200).json({
      success: true,
      date: startDate.toISOString().split('T')[0],
      slots
    });
  } catch (error) {
    logger.error('GetAvailableSlots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

/**
 * Create a public booking (no auth required)
 * POST /api/public/s/:slug/book
 */
export const createPublicBooking = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      serviceId,
      employeeId,
      bookingDate,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      language,
      idempotencyKey  // ? SRE FIX #30
    } = req.body;

    // Validation
    if (!serviceId || !bookingDate || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: serviceId, bookingDate, customerName, customerEmail'
      });
    }

    // ? SRE FIX #30: Idempotency check
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey });
      
      if (existingBooking) {
        logger.info(`?? Duplicate public booking: ${idempotencyKey}`);
        
        // ? SRE FIX #38: Email status feedback
        const warnings = [];
        if (!existingBooking.emailsSent?.confirmation) {
          warnings.push('Confirmation email is delayed. You will receive it within 15 minutes.');
        }
        
        return res.status(200).json({
          success: true,
          message: 'Booking already exists',
          booking: existingBooking,
          duplicate: true,
          warnings
        });
      }
    }

    // Validate ObjectIds
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid service ID format' 
      });
    }
    if (employeeId && !isValidObjectId(employeeId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid employee ID format' 
      });
    }

    // Validate and parse date
    // ? AUDIT FIX: Support both legacy ISO string and new { date, time } format
    let parsedBookingDate;
    
    if (typeof bookingDate === 'string') {
      // Legacy format: ISO string
      parsedBookingDate = parseValidDate(bookingDate);
    } else if (bookingDate.date && bookingDate.time) {
      // ? NEW FORMAT: { date: "2025-12-11", time: "14:00" }
      // Salon loaded below, validate after getting salon
      parsedBookingDate = null; // Will be set after salon loaded
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingDate format. Use { date: "YYYY-MM-DD", time: "HH:mm" }'
      });
    }

    if (!parsedBookingDate && typeof bookingDate === 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Validate email
    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    // Validate phone if provided
    if (customerPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(customerPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number'
        });
      }
    }

    // Get salon
    const salon = await Salon.findBySlug(slug);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // ? AUDIT FIX: Convert bookingDate to UTC using salon timezone
    if (!parsedBookingDate && bookingDate.date && bookingDate.time) {
      // Validate booking time (DST check)
      const validation = timezoneHelpers.validateBookingTime(
        bookingDate.date,
        bookingDate.time,
        salon.timezone || 'Europe/Berlin'
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error || 'Invalid booking time'
        });
      }

      // Convert to UTC
      parsedBookingDate = timezoneHelpers.toUTC(
        bookingDate.date,
        bookingDate.time,
        salon.timezone || 'Europe/Berlin'
      );
    }

    // Check subscription
    if (!salon.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Booking is currently unavailable'
      });
    }

    // Check booking limits for Starter plan
    const planId = (salon.subscription?.planId || '').toLowerCase();
    const isStarterPlan = planId.includes('starter') || (!planId.includes('pro') && salon.subscription?.status !== 'trial');

    if (isStarterPlan || salon.subscription?.status === 'trial') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const bookingsThisMonth = await Booking.countDocuments({
        salonId: salon._id,
        createdAt: { $gte: startOfMonth },
        status: { $ne: 'cancelled' }
      });

      const limit = salon.subscription?.status === 'trial' ? 50 : 100;

      if (bookingsThisMonth >= limit) {
        return res.status(403).json({
          success: false,
          message: 'Monatliches Buchungslimit erreicht. Der Saloninhaber muss upgraden.',
          code: 'BOOKING_LIMIT_EXCEEDED'
        });
      }
    }

    // Get service
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if slot is still available
    const existingBooking = await Booking.findOne({
      salonId: salon._id,
      serviceId,
      employeeId: employeeId || null,
      bookingDate: parsedBookingDate,
      status: { $nin: ['cancelled'] }
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available'
      });
    }

    // Create booking (no Customer model - data stored directly in Booking)
    const booking = await Booking.create({
      salonId: salon._id,
      customerName,
      customerEmail: customerEmail.toLowerCase(),
      customerPhone,
      serviceId,
      employeeId: employeeId || null,
      bookingDate: parsedBookingDate,
      duration: service.duration,
      notes,
      language: language || salon.defaultLanguage || 'de',
      status: 'confirmed', // Auto-confirm public bookings
      confirmedAt: new Date(),
      idempotencyKey: idempotencyKey || null // ? SRE FIX #30
    });

    // Populate for email
    await booking.populate('serviceId');
    if (employeeId) {
      await booking.populate('employeeId');
    }

    // Prepare booking object for email
    const bookingForEmail = {
      ...booking.toObject(),
      service: booking.serviceId,
      employee: booking.employeeId
    };

    // Send confirmation email immediately
    try {
      const emailData = emailTemplateService.renderConfirmationEmail(
        salon,
        bookingForEmail,
        booking.language
      );

      await emailService.sendEmail({
        to: customerEmail,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.body.replace(/\n/g, '<br>')
      });

      // Mark email as sent
      await booking.markEmailSent('confirmation');

      logger.log(`✉️  Sent confirmation email to ${customerEmail}`);
    } catch (emailError) {
      logger.error('Error sending confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Schedule reminder email
    try {
      await emailQueueWorker.scheduleReminderEmail(booking, salon);
    } catch (error) {
      logger.error('Error scheduling reminder email:', error);
    }

    // Schedule review email
    try {
      await emailQueueWorker.scheduleReviewEmail(booking, salon);
    } catch (error) {
      logger.error('Error scheduling review email:', error);
    }

    // Notify salon owner
    try {
      const salonOwnerEmail = salon.email;

      await emailService.sendEmail({
        to: salonOwnerEmail,
        subject: `New Booking: ${customerName}`,
        text: `New booking received:\n\nCustomer: ${customerName}\nEmail: ${customerEmail}\nService: ${service.name}\nDate: ${new Date(bookingDate).toLocaleString('de-DE')}`,
        html: `<h2>New Booking</h2><p><strong>Customer:</strong> ${customerName}<br><strong>Email:</strong> ${customerEmail}<br><strong>Service:</strong> ${service.name}<br><strong>Date:</strong> ${new Date(bookingDate).toLocaleString('de-DE')}</p>`
      });
    } catch (error) {
      logger.error('Error sending salon notification:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully! Check your email for confirmation.',
      booking: {
        id: booking._id,
        bookingDate: booking.bookingDate,
        service: service.name,
        status: booking.status
      }
    });
  } catch (error) {
    logger.error('CreatePublicBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

export default {
  getAllSalons,
  searchSalons,
  getSalonsByCity,
  getSalonBySlug,
  getAvailableSlots,
  createPublicBooking
};
