import express from 'express';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Widget from '../models/Widget.js';
import { validateBooking } from '../middleware/validationMiddleware.js';
import { widgetLimiter, publicBookingLimiter } from '../middleware/rateLimiterMiddleware.js';
import widgetCorsMiddleware from '../middleware/widgetCorsMiddleware.js';
import emailService from '../services/emailService.js';
import logger from '../utils/logger.js';
import { generateSecurePassword, isValidObjectId } from '../utils/validation.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { tierHasFeature } from '../config/pricing.js';

const router = express.Router();

/**
 * Widget Routes - Embeddable Booking Widget API
 * Mixed: Public endpoints (slug-based) + Protected endpoints (auth required)
 */

// ==================== PROTECTED ROUTES (Auth Required) ====================
// Get widget config for authenticated user's salon
router.get('/config', authMiddleware.protect, async (req, res) => {
  try {
    let salonId = req.user.salonId;

    // If salonId not in user, try to find salon by owner
    if (!salonId && req.user.role === 'salon_owner') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (salon) {
        salonId = salon._id;
        // Update user with salonId for future requests
        req.user.salonId = salonId;
        await req.user.save();
      }
    }

    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'No salon associated with this account'
      });
    }

    // Get or create widget
    let widget = await Widget.findOne({ salonId });

    if (!widget) {
      // Create default widget if it doesn't exist
      try {
        widget = await Widget.createForSalon(salonId, {});
      } catch (error) {
        // If widget was created by another request, fetch it
        if (error.message === 'Widget already exists for this salon') {
          widget = await Widget.findOne({ salonId });
        } else {
          throw error;
        }
      }
    }

    // Get salon info for widget config
    const salon = await Salon.findById(salonId)
      .select('name slug logo branding businessType subscription.tier');

    const hasApiAccess = tierHasFeature(salon?.subscription?.tier || 'starter', 'apiAccess');

    return res.status(200).json({
      success: true,
      config: {
        primaryColor: widget.theme?.primaryColor || salon?.branding?.primaryColor || '#ffffff',
        backgroundColor: widget.theme?.secondaryColor || salon?.branding?.secondaryColor || '#000000',
        accentColor: widget.theme?.primaryColor || salon?.branding?.accentColor || '#3b82f6',
        borderRadius: widget.theme?.borderRadius?.replace('px', '') || '12',
        fontFamily: widget.theme?.fontFamily?.split(',')[0] || 'Inter',
        buttonText: widget.settings?.buttonText || 'Termin buchen',
        headerText: widget.settings?.headerText || 'Online Terminbuchung',
        showLogo: widget.settings?.showLogo !== false,
        selectedServices: widget.settings?.selectedServices || [],
        embedCode: widget.embedCode,
        apiKey: hasApiAccess ? widget.apiKey : null
      },
      permissions: {
        hasApiAccess,
        tier: salon?.subscription?.tier || 'starter'
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

// Update widget config for authenticated user's salon
router.put('/config', authMiddleware.protect, async (req, res) => {
  try {
    let salonId = req.user.salonId;

    // If salonId not in user, try to find salon by owner
    if (!salonId && req.user.role === 'salon_owner') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (salon) {
        salonId = salon._id;
        // Update user with salonId for future requests
        req.user.salonId = salonId;
        await req.user.save();
      }
    }

    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'No salon associated with this account'
      });
    }

    // Get or create widget
    let widget = await Widget.findOne({ salonId });

    if (!widget) {
      try {
        widget = await Widget.createForSalon(salonId, {});
      } catch (error) {
        // If widget was created by another request, fetch it
        if (error.message === 'Widget already exists for this salon') {
          widget = await Widget.findOne({ salonId });
        } else {
          throw error;
        }
      }
    }

    // Update widget configuration
    const { primaryColor, backgroundColor, accentColor, borderRadius, fontFamily, buttonText, headerText, showLogo, selectedServices } = req.body;

    if (primaryColor || backgroundColor || accentColor || borderRadius || fontFamily) {
      widget.theme = {
        ...widget.theme.toObject(),
        primaryColor: accentColor || primaryColor || widget.theme?.primaryColor,
        secondaryColor: backgroundColor || widget.theme?.secondaryColor,
        borderRadius: borderRadius ? `${borderRadius}px` : widget.theme?.borderRadius,
        fontFamily: fontFamily || widget.theme?.fontFamily
      };
    }

    if (buttonText || headerText || showLogo !== undefined || selectedServices) {
      widget.settings = {
        ...widget.settings,
        buttonText: buttonText || widget.settings?.buttonText,
        headerText: headerText || widget.settings?.headerText,
        showLogo: showLogo !== undefined ? showLogo : widget.settings?.showLogo,
        selectedServices: selectedServices || widget.settings?.selectedServices
      };
    }

    await widget.save();

    return res.status(200).json({
      success: true,
      message: 'Widget configuration updated successfully',
      config: {
        primaryColor: widget.theme?.primaryColor,
        backgroundColor: widget.theme?.backgroundColor,
        accentColor: widget.theme?.accentColor,
        borderRadius: widget.theme?.borderRadius,
        fontFamily: widget.theme?.fontFamily,
        buttonText: widget.settings?.buttonText,
        headerText: widget.settings?.headerText,
        showLogo: widget.settings?.showLogo,
        selectedServices: widget.settings?.selectedServices
      }
    });
  } catch (error) {
    logger.error('Widget Update Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating widget configuration'
    });
  }
});

// ==================== PUBLIC ROUTES (No Auth Required) ====================
// Create a separate router for public routes to apply middleware correctly
const publicRouter = express.Router();

// ? HIGH FIX #12: Apply CORS middleware (allowedDomains whitelist)
publicRouter.use(widgetCorsMiddleware);

// Apply widget rate limiter to public routes
publicRouter.use(widgetLimiter);

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

// ==================== GET PUBLIC WIDGET CONFIG (by slug) ====================
publicRouter.get('/config/:slug', async (req, res) => {
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

// ==================== GET PUBLIC AVAILABLE SERVICES ====================
publicRouter.get('/services/:slug', async (req, res) => {
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

// ==================== GET PUBLIC AVAILABLE TIME SLOTS ====================
publicRouter.get('/timeslots/:slug', async (req, res) => {
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

// ==================== CREATE PUBLIC BOOKING (NO AUTH) ====================
// Extra strict rate limiting for booking creation
publicRouter.post('/book/:slug', publicBookingLimiter, validateBooking, async (req, res) => {
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

// Mount public router under /public path
router.use('/public', publicRouter);

export default router;
