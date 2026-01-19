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
    const salons = await Salon.find({}).lean().maxTimeMS(5000)
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
          ...salon,
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
      message: 'Interner Serverfehler'
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
        message: 'Suchbegriff muss mindestens 2 Zeichen lang sein'
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
    }).lean().maxTimeMS(5000)
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
      message: 'Interner Serverfehler'
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
        message: 'Stadt-Parameter ist erforderlich'
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
    }).lean().maxTimeMS(5000)
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
          ...salon,
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
      message: 'Interner Serverfehler'
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
        message: 'Salon nicht gefunden'
      });
    }

    // Check if salon has active subscription
    if (!salon.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Buchungen sind derzeit nicht verfügbar'
      });
    }

    // Get services for this salon
    const services = await Service.find({
      salonId: salon._id,
      isActive: true
    }).lean().maxTimeMS(5000).select('name description price duration category');

    // Get employees (users with role=employee for this salon)
    const employees = await User.find({
      salonId: salon._id,
      role: 'employee',
      isActive: true
    }).lean().maxTimeMS(5000).select('name avatar');

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
      message: 'Interner Serverfehler'
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
        message: 'Bitte geben Sie Datum und Service-ID an'
      });
    }

    const salon = await Salon.findBySlug(slug);

    if (!salon || !salon.hasActiveSubscription()) {
      return res.status(404).json({
        success: false,
        message: 'Salon nicht gefunden oder Buchungen nicht verfügbar'
      });
    }

    const service = await Service.findById(serviceId).maxTimeMS(5000);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service nicht gefunden'
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
        message: 'Der Salon ist an diesem Tag geschlossen'
      });
    }

    const timezone = salon.timezone || 'Europe/Berlin';

    // Get existing bookings for this date (timezone-aware, stored in UTC)
    const { startUTC, endUTC } = timezoneHelpers.getDayRangeUTC(date, timezone);

    let bookingFilter = {
      salonId: salon._id,
      serviceId,
      bookingDate: { $gte: startUTC, $lte: endUTC },
      status: { $nin: ['cancelled'] }
    };

    if (employeeId) {
      bookingFilter.employeeId = employeeId;
    }

    const existingBookings = await Booking.find(bookingFilter)
      .select('bookingDate')
      .lean()
      .maxTimeMS(5000);

    const bookedSlots = existingBookings
      .map(b => timezoneHelpers.fromUTC(b.bookingDate, timezone).time)
      .filter(Boolean);

    // Generate time slots based on business hours (in salon timezone)
    const slots = [];
    // Some salons may only store { closed: false } without open/close.
    // Use a safe default window to avoid returning empty slots.
    const openTime = businessHours.open || '09:00';
    const closeTime = businessHours.close || '18:00';

    const serviceDuration = service.duration || 60;
    const buffer = salon.bookingBuffer || 0;
    const slotInterval = serviceDuration + buffer;

    // Iterate in local time (DST-safe via Luxon inside timezoneHelpers)
    // Build a list of HH:mm strings so frontend can render directly.
    let currentMinutes = 0;
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const openTotal = openHour * 60 + openMin;
    const closeTotal = closeHour * 60 + closeMin;

    currentMinutes = openTotal;
    while (currentMinutes + serviceDuration <= closeTotal) {
      const h = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
      const m = String(currentMinutes % 60).padStart(2, '0');
      const timeStr = `${h}:${m}`;

      const isBooked = bookedSlots.includes(timeStr);
      const isPast = timezoneHelpers.isInPast(date, timeStr, timezone);

      if (!isBooked && !isPast) {
        slots.push(timeStr);
      }

      currentMinutes += slotInterval;
    }

    res.status(200).json({
      success: true,
      date,
      slots,
      bookedSlots
    });
  } catch (error) {
    logger.error('GetAvailableSlots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

/**
 * Create a public booking (no auth required)
 * POST /api/public/s/:slug/book
 */
export const createPublicBooking = async (req, res) => {
  let stage = 'start';
  try {
    stage = 'parse_request';
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
    stage = 'validate_required_fields';
    if (!serviceId || !bookingDate || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Bitte geben Sie alle erforderlichen Felder an: serviceId, bookingDate, customerName, customerEmail'
      });
    }

    // ? SRE FIX #30: Idempotency check
    stage = 'idempotency_check';
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey }).maxTimeMS(5000);

      if (existingBooking) {
        logger.info(`?? Duplicate public booking: ${idempotencyKey}`);

        // ? SRE FIX #38: Email status feedback
        const warnings = [];
        if (!existingBooking.emailsSent?.confirmation) {
          warnings.push('Bestätigungs-E-Mail ist verzögert. Sie erhalten sie innerhalb von 15 Minuten.');
        }

        return res.status(200).json({
          success: true,
          message: 'Buchung existiert bereits',
          booking: existingBooking,
          duplicate: true,
          warnings
        });
      }
    }

    // Validate ObjectIds
    stage = 'validate_object_ids';
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Service-ID-Format'
      });
    }
    if (employeeId && !isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Mitarbeiter-ID-Format'
      });
    }

    // Validate and parse date
    // ? AUDIT FIX: Support both legacy ISO string and new { date, time } format
    stage = 'parse_booking_date';
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
        message: 'Ungültiges bookingDate-Format. Verwenden Sie { date: "YYYY-MM-DD", time: "HH:mm" }'
      });
    }

    if (!parsedBookingDate && typeof bookingDate === 'string') {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat'
      });
    }

    // Validate email
    stage = 'validate_email';
    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige E-Mail-Adresse'
      });
    }

    // Validate phone if provided
    if (customerPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(customerPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Ungültige Telefonnummer'
        });
      }
    }

    // Get salon
    stage = 'load_salon';
    const salon = await Salon.findBySlug(slug);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon nicht gefunden'
      });
    }

    // ? AUDIT FIX: Convert bookingDate to UTC using salon timezone
  stage = 'convert_booking_date_timezone';
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
          message: validation.error || 'Ungültige Buchungszeit'
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
    stage = 'check_subscription';
    if (!salon.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Buchungen sind derzeit nicht verfügbar'
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
    stage = 'load_service';
    const service = await Service.findById(serviceId).maxTimeMS(5000);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service nicht gefunden'
      });
    }

    // Check if slot is still available
    stage = 'check_slot_conflict';
    const existingBooking = await Booking.findOne({
      salonId: salon._id,
      serviceId,
      employeeId: employeeId || null,
      bookingDate: parsedBookingDate,
      status: { $nin: ['cancelled'] }
    }).maxTimeMS(5000);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Dieser Zeitraum ist nicht mehr verfügbar'
      });
    }

    // ==================== NO-SHOW-KILLER: Payment Method Handling ====================
    stage = 'handle_payment_method';
    let stripeCustomerId = null;
    let paymentMethodId = null;

    if (salon.noShowKiller?.enabled) {
      const { paymentMethodId: reqPaymentMethodId } = req.body;

      // Payment Method is required when No-Show-Killer is enabled
      if (!reqPaymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Kreditkarte erforderlich. Bitte hinterlegen Sie eine Kreditkarte für den No-Show-Schutz.'
        });
      }

      try {
        // Import Stripe service
        const stripeService = await import('../services/stripeService.js');

        // Get or create Stripe customer for booking customer
        stripeCustomerId = await stripeService.getOrCreateBookingCustomer(
          customerEmail.toLowerCase(),
          customerName,
          customerPhone,
          salon._id.toString()
        );

        // Attach payment method to customer
        await stripeService.attachPaymentMethodToCustomer(stripeCustomerId, reqPaymentMethodId);
        paymentMethodId = reqPaymentMethodId;

        // ✅ Store payment method details in Customer model (for DSGVO auto-delete)
        const Customer = (await import('../models/Customer.js')).default;
        let customer = await Customer.findOne({
          email: customerEmail.toLowerCase(),
          salonId: salon._id
        });

        if (!customer) {
          // Create customer record if doesn't exist
          const [firstName, ...lastNameParts] = customerName.split(' ');
          customer = await Customer.create({
            salonId: salon._id,
            firstName: firstName || customerName,
            lastName: lastNameParts.join(' ') || '',
            email: customerEmail.toLowerCase(),
            phone: customerPhone || '',
            stripeCustomerId: stripeCustomerId,
            gdprConsent: {
              paymentDataStorage: {
                accepted: req.body.gdprConsentAccepted || false,
                acceptedAt: req.body.gdprConsentAccepted ? new Date() : null,
                ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
              }
            }
          });
        } else {
          // Update existing customer
          if (!customer.stripeCustomerId) {
            customer.stripeCustomerId = stripeCustomerId;
          }
          if (req.body.gdprConsentAccepted && !customer.gdprConsent?.paymentDataStorage?.accepted) {
            customer.gdprConsent = {
              paymentDataStorage: {
                accepted: true,
                acceptedAt: new Date(),
                ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown'
              }
            };
          }
        }

        // Get payment method details from Stripe
        const stripe = stripeService.getStripe ? stripeService.getStripe() : await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
        const paymentMethod = await stripe.paymentMethods.retrieve(reqPaymentMethodId);

        // Add payment method to customer (with 90-day auto-delete schedule)
        const scheduledDeletionAt = new Date();
        scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 90); // 90 days from now

        customer.paymentMethods.push({
          paymentMethodId: reqPaymentMethodId,
          last4: paymentMethod.card?.last4 || '****',
          brand: paymentMethod.card?.brand || 'unknown',
          expiryMonth: paymentMethod.card?.exp_month || 0,
          expiryYear: paymentMethod.card?.exp_year || 0,
          createdAt: new Date(),
          scheduledDeletionAt: scheduledDeletionAt
        });

        await customer.save();

        logger.log(`✅ Payment method attached for booking customer: ${customerEmail}`);
      } catch (stripeError) {
        logger.error('Error handling payment method:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Fehler beim Speichern der Kreditkarte. Bitte versuchen Sie es erneut.'
        });
      }
    }

    // Create booking (no Customer model - data stored directly in Booking)
    stage = 'create_booking';
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
      idempotencyKey: idempotencyKey || null, // ? SRE FIX #30
      // NO-SHOW-KILLER fields
      stripeCustomerId: stripeCustomerId || null,
      paymentMethodId: paymentMethodId || null,
      // ✅ Legal compliance
      noShowFeeAcceptance: req.body.noShowFeeAcceptance ? {
        accepted: req.body.noShowFeeAcceptance.accepted || false,
        acceptedAt: req.body.noShowFeeAcceptance.accepted ? new Date() : null,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        terms: req.body.noShowFeeAcceptance.terms || null,
        checkboxText: req.body.noShowFeeAcceptance.checkboxText || null
      } : undefined,
      // ✅ Dispute evidence
      disputeEvidence: {
        bookingCreatedAt: new Date(),
        cancellationDeadline: new Date(parsedBookingDate.getTime() - 24 * 60 * 60 * 1000), // 24h before
        serviceDescription: service.name || 'Service'
      }
    });

    // Populate for email
    stage = 'populate_booking';
    await booking.populate('serviceId');
    if (employeeId) {
      await booking.populate('employeeId');
    }

    // Prepare booking object for email (use .toObject() because this is NOT .lean())
    const bookingForEmail = {
      ...booking.toObject(),
      service: booking.serviceId,
      employee: booking.employeeId
    };

    // Send confirmation email (Fire & Forget)
    // NOTE: renderConfirmationEmail is synchronous; wrap in Promise chain to avoid `.then is not a function`.
    stage = 'trigger_emails';
    Promise.resolve()
      .then(() => emailTemplateService.renderConfirmationEmail(salon, bookingForEmail, booking.language))
      .then((emailData) => {
        return emailService.sendEmail({
          to: customerEmail,
          subject: emailData.subject,
          text: emailData.body,
          html: emailData.body.replace(/\n/g, '<br>')
        });
      })
      .then(() => booking.markEmailSent('confirmation'))
      .then(() => {
        logger.log(`✉️  Sent confirmation email to ${customerEmail}`);
      })
      .catch((emailError) => {
        logger.error('Error sending confirmation email:', emailError);
      });

    // Schedule reminder email (Fire & Forget)
    emailQueueWorker.scheduleReminderEmail(booking, salon)
      .catch(error => logger.error('Error scheduling reminder email:', error));

    // Schedule review email (Fire & Forget)
    emailQueueWorker.scheduleReviewEmail(booking, salon)
      .catch(error => logger.error('Error scheduling review email:', error));

    // Notify salon owner (Fire & Forget)
    const salonOwnerEmail = salon.email;
    emailService.sendEmail({
      to: salonOwnerEmail,
      subject: `New Booking: ${customerName}`,
      text: `New booking received:\n\nCustomer: ${customerName}\nEmail: ${customerEmail}\nService: ${service.name}\nDate: ${new Date(bookingDate).toLocaleString('de-DE')}`,
      html: `<h2>New Booking</h2><p><strong>Customer:</strong> ${customerName}<br><strong>Email:</strong> ${customerEmail}<br><strong>Service:</strong> ${service.name}<br><strong>Date:</strong> ${new Date(bookingDate).toLocaleString('de-DE')}</p>`
    }).catch(error => {
      logger.error('Error sending salon notification:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Buchung erfolgreich erstellt! Bitte überprüfen Sie Ihre E-Mails für die Bestätigung.',
      booking: {
        id: booking._id,
        bookingDate: booking.bookingDate,
        service: service.name,
        status: booking.status
      }
    });
  } catch (error) {
    logger.error('CreatePublicBooking Error:', {
      requestId: req.id,
      stage,
      path: req.originalUrl,
      errorName: error?.name,
      errorMessage: error?.message,
      errorCode: error?.code
    });
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'Buchung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'),
      requestId: req.id,
      stage
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


