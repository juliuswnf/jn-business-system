import logger from '../utils/logger.js';
import mongoose from 'mongoose';
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
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import emailTemplateService from '../services/emailTemplateService.js';
import emailQueueWorker from '../workers/emailQueueWorker.js';

const isPublicBookingAvailable = (salon) => {
  if (!salon) return false;

  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return typeof salon.hasActiveSubscription === 'function'
    ? salon.hasActiveSubscription()
    : false;
};

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

    // Get all salons (show all for now, can filter by subscription later)
    // For production: filter by subscription.status: 'active' or 'trialing'
    const salons = await Salon.find({}).lean().maxTimeMS(5000)
      .select('name slug address city phone businessHours createdAt subscription')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    logger.info(`Found ${salons.length} salons after query`);

    const total = await Salon.countDocuments({});

    // Get service counts in a single aggregation to avoid N+1 DB queries
    const salonIds = salons.map(s => s._id);
    const serviceCounts = await Service.aggregate([
      { $match: { salonId: { $in: salonIds }, isActive: true } },
      { $group: { _id: '$salonId', count: { $sum: 1 } } }
    ]);
    const serviceCountMap = Object.fromEntries(serviceCounts.map(r => [r._id.toString(), r.count]));
    const salonsWithServices = salons.map(salon => ({
      ...salon,
      serviceCount: serviceCountMap[salon._id.toString()] || 0
    }));

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

    // Escape regex special characters and limit length to prevent ReDoS attacks
    const searchRegex = new RegExp(escapeRegex(String(q).slice(0, 100)), 'i');

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

    // Escape regex special characters and limit length to prevent ReDoS attacks
    const cityRegex = new RegExp(`^${escapeRegex(String(city).slice(0, 100))}$`, 'i');

    // Find salons in this city
    const salons = await Salon.find({
      $or: [
        { city: cityRegex },
        { 'address.city': cityRegex }
      ]
    }).lean().maxTimeMS(5000)
      .select('name slug address city phone businessHours')
      .sort({ name: 1 });

    // Get service counts in a single aggregation to avoid N+1 DB queries
    const salonIdsCity = salons.map(s => s._id);
    const serviceCountsCity = await Service.aggregate([
      { $match: { salonId: { $in: salonIdsCity }, isActive: true } },
      { $group: { _id: '$salonId', count: { $sum: 1 } } }
    ]);
    const serviceCountMapCity = Object.fromEntries(serviceCountsCity.map(r => [r._id.toString(), r.count]));
    const salonsWithServices = salons.map(salon => ({
      ...salon,
      serviceCount: serviceCountMapCity[salon._id.toString()] || 0
    }));

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
    if (!isPublicBookingAvailable(salon)) {
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

    if (!salon || !isPublicBookingAvailable(salon)) {
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
      bookingDate: { $gte: startUTC, $lte: endUTC },
      status: { $nin: ['cancelled', 'no_show'] }
    };

    if (employeeId) {
      if (!isValidObjectId(employeeId)) {
        return res.status(400).json({ success: false, message: 'Invalid employeeId format' });
      }
      bookingFilter.employeeId = new mongoose.Types.ObjectId(employeeId);
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

// ----- createPublicBooking helpers -----

function validatePublicBookingInputs({ serviceId, bookingDate, customerName, customerEmail, customerPhone, employeeId }) {
  if (!serviceId || !bookingDate || !customerName || !customerEmail) {
    return 'Bitte geben Sie alle erforderlichen Felder an: serviceId, bookingDate, customerName, customerEmail';
  }
  if (!isValidObjectId(serviceId)) return 'Ungültiges Service-ID-Format';
  if (employeeId && !isValidObjectId(employeeId)) return 'Ungültiges Mitarbeiter-ID-Format';
  if (!isValidEmail(customerEmail)) return 'Ungültige E-Mail-Adresse';
  if (customerPhone) {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(customerPhone)) return 'Ungültige Telefonnummer';
  }
  if (typeof bookingDate !== 'string' && !(bookingDate?.date && bookingDate?.time)) {
    return 'Ungültiges bookingDate-Format. Verwenden Sie { date: "YYYY-MM-DD", time: "HH:mm" }';
  }
  return null;
}

function checkPublicBookingLimits(salon, bookingsThisMonth) {
  const planId = (salon.subscription?.planId || '').toLowerCase();
  const isStarter = planId.includes('starter') || (!planId.includes('pro') && salon.subscription?.status !== 'trial');
  if (!(isStarter || salon.subscription?.status === 'trial')) return null;
  const limit = salon.subscription?.status === 'trial' ? 50 : 100;
  if (bookingsThisMonth >= limit) return 'BOOKING_LIMIT_EXCEEDED';
  return null;
}

async function handleNoShowKillerPayment(salon, body, customerEmail, customerName, customerPhone) {
  if (!salon.noShowKiller?.enabled) return { stripeCustomerId: null, paymentMethodId: null };
  if (!body.gdprConsentAccepted) throw Object.assign(new Error('GDPR_CONSENT_REQUIRED'), { status: 400, message: 'DSGVO-Einwilligung zur Speicherung der Zahlungsdaten ist erforderlich' });
  const { paymentMethodId: reqPaymentMethodId } = body;
  if (!reqPaymentMethodId) throw Object.assign(new Error('PAYMENT_METHOD_REQUIRED'), { status: 400, message: 'Kreditkarte erforderlich. Bitte hinterlegen Sie eine Kreditkarte für den No-Show-Schutz.' });

  const stripeService = await import('../services/stripeService.js');
  const CustomerModel = (await import('../models/Customer.js')).default;

  let existingCustomerRecord = await CustomerModel.findOne({ email: customerEmail.toLowerCase(), salonId: salon._id }).select('stripeCustomerId').lean().maxTimeMS(5000);
  let stripeCustomerId;
  if (existingCustomerRecord?.stripeCustomerId) {
    stripeCustomerId = existingCustomerRecord.stripeCustomerId;
  } else {
    stripeCustomerId = await stripeService.getOrCreateBookingCustomer(customerEmail.toLowerCase(), customerName, customerPhone, salon._id.toString());
  }

  await stripeService.attachPaymentMethodToCustomer(stripeCustomerId, reqPaymentMethodId);

  let customer = await CustomerModel.findOne({ email: customerEmail.toLowerCase(), salonId: salon._id });
  if (!customer) {
    const [firstName, ...lastNameParts] = customerName.split(' ');
    customer = await CustomerModel.create({ salonId: salon._id, firstName: firstName || customerName, lastName: lastNameParts.join(' ') || '', email: customerEmail.toLowerCase(), phone: customerPhone || '', stripeCustomerId, gdprConsent: { paymentDataStorage: { accepted: body.gdprConsentAccepted || false, acceptedAt: body.gdprConsentAccepted ? new Date() : null, ipAddress: body._ip || 'unknown' } } });
  } else {
    if (!customer.stripeCustomerId) customer.stripeCustomerId = stripeCustomerId;
    if (body.gdprConsentAccepted && !customer.gdprConsent?.paymentDataStorage?.accepted) {
      customer.gdprConsent = { paymentDataStorage: { accepted: true, acceptedAt: new Date(), ipAddress: body._ip || 'unknown' } };
    }
  }

  const stripe = stripeService.getStripe ? stripeService.getStripe() : await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
  const paymentMethod = await stripe.paymentMethods.retrieve(reqPaymentMethodId);
  const scheduledDeletionAt = new Date();
  scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 90);
  customer.paymentMethods.push({ paymentMethodId: reqPaymentMethodId, last4: paymentMethod.card?.last4 || '****', brand: paymentMethod.card?.brand || 'unknown', expiryMonth: paymentMethod.card?.exp_month || 0, expiryYear: paymentMethod.card?.exp_year || 0, createdAt: new Date(), scheduledDeletionAt });
  await customer.save();

  logger.log(`✅ Payment method attached for booking customer: ${customerEmail}`);
  return { stripeCustomerId, paymentMethodId: reqPaymentMethodId };
}

export const createPublicBooking = async (req, res) => {
  let stage = 'start';
  try {
    stage = 'parse_request';
    const { slug } = req.params;
    const {
      serviceId, employeeId, bookingDate,
      customerName, customerEmail, customerPhone,
      notes, language, idempotencyKey
    } = req.body;

    // Validation
    stage = 'validate_required_fields';
    const validationError = validatePublicBookingInputs({ serviceId, bookingDate, customerName, customerEmail, customerPhone, employeeId });
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    // Idempotency check
    stage = 'idempotency_check';
    if (idempotencyKey) {
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length > 512) {
        return res.status(400).json({ success: false, message: 'Invalid idempotency key' });
      }
      const existingBooking = await Booking.findOne({ idempotencyKey: String(idempotencyKey) }).maxTimeMS(5000);
      if (existingBooking) {
        logger.info(`?? Duplicate public booking: ${idempotencyKey}`);
        const warnings = [];
        if (!existingBooking.emailsSent?.confirmation) warnings.push('Bestätigungs-E-Mail ist verzögert. Sie erhalten sie innerhalb von 15 Minuten.');
        return res.status(200).json({ success: true, message: 'Buchung existiert bereits', booking: existingBooking, duplicate: true, warnings });
      }
    }

    // Parse date (legacy ISO string path; new format resolved after salon load)
    stage = 'parse_booking_date';
    let parsedBookingDate = null;
    if (typeof bookingDate === 'string') {
      parsedBookingDate = parseValidDate(bookingDate);
      if (!parsedBookingDate) return res.status(400).json({ success: false, message: 'Ungültiges Datumsformat' });
    }

    // Get salon
    stage = 'load_salon';
    const salon = await Salon.findBySlug(slug);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });

    // Convert new { date, time } format to UTC using salon timezone
    stage = 'convert_booking_date_timezone';
    if (!parsedBookingDate && bookingDate.date && bookingDate.time) {
      const validation = timezoneHelpers.validateBookingTime(bookingDate.date, bookingDate.time, salon.timezone || 'Europe/Berlin');
      if (!validation.valid) return res.status(400).json({ success: false, message: validation.error || 'Ungültige Buchungszeit' });
      parsedBookingDate = timezoneHelpers.toUTC(bookingDate.date, bookingDate.time, salon.timezone || 'Europe/Berlin');
    }

    // Subscription check
    stage = 'check_subscription';
    if (!isPublicBookingAvailable(salon)) return res.status(403).json({ success: false, message: 'Buchungen sind derzeit nicht verfügbar' });

    // Booking limits check
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const bookingsThisMonth = await Booking.countDocuments({ salonId: salon._id, createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } });
    const limitError = checkPublicBookingLimits(salon, bookingsThisMonth);
    if (limitError) return res.status(403).json({ success: false, message: 'Monatliches Buchungslimit erreicht. Der Saloninhaber muss upgraden.', code: limitError });

    // Get service
    stage = 'load_service';
    const service = await Service.findById(serviceId).maxTimeMS(5000);
    if (!service) return res.status(404).json({ success: false, message: 'Service nicht gefunden' });

    // No-Show-Killer payment method handling
    stage = 'handle_payment_method';
    let stripeCustomerId = null;
    let paymentMethodId = null;
    try {
      ({ stripeCustomerId, paymentMethodId } = await handleNoShowKillerPayment(
        salon, { ...req.body, _ip: req.ip || req.headers['x-forwarded-for'] || 'unknown' },
        customerEmail, customerName, customerPhone
      ));
    } catch (pmErr) {
      if (pmErr.status) return res.status(pmErr.status).json({ success: false, message: pmErr.message });
      logger.error('Error handling payment method:', pmErr);
      return res.status(400).json({ success: false, message: 'Fehler beim Speichern der Kreditkarte. Bitte versuchen Sie es erneut.' });
    }

    // Create booking
    stage = 'create_booking';
    const bookingData = {
      salonId: salon._id, customerName, customerEmail: customerEmail.toLowerCase(), customerPhone,
      serviceId, employeeId: employeeId || null, bookingDate: parsedBookingDate,
      duration: service.duration, notes,
      language: language || salon.defaultLanguage || 'de',
      status: 'confirmed', confirmedAt: new Date(),
      stripeCustomerId: stripeCustomerId || null,
      paymentMethodId: paymentMethodId || null,
      noShowFeeAcceptance: req.body.noShowFeeAcceptance ? { accepted: req.body.noShowFeeAcceptance.accepted || false, acceptedAt: req.body.noShowFeeAcceptance.accepted ? new Date() : null, ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown', userAgent: req.headers['user-agent'] || 'unknown', terms: req.body.noShowFeeAcceptance.terms || null, checkboxText: req.body.noShowFeeAcceptance.checkboxText || null } : undefined,
      disputeEvidence: { bookingCreatedAt: new Date(), cancellationDeadline: new Date(parsedBookingDate.getTime() - 24 * 60 * 60 * 1000), serviceDescription: service.name || 'Service' }
    };
    if (typeof idempotencyKey === 'string' && idempotencyKey.trim()) bookingData.idempotencyKey = idempotencyKey.trim();

    let booking;
    const txSession = await mongoose.startSession();
    txSession.startTransaction();
    try {
      const isAvailable = await Booking.checkAvailability(salon._id, parsedBookingDate, service.duration, employeeId || null, txSession);
      if (!isAvailable) {
        await txSession.abortTransaction();
        return res.status(409).json({ success: false, message: 'Dieser Zeitraum ist nicht mehr verfügbar' });
      }
      [booking] = await Booking.create([bookingData], { session: txSession });
      await txSession.commitTransaction();
    } catch (txErr) {
      await txSession.abortTransaction();
      throw txErr;
    } finally {
      txSession.endSession();
    }

    stage = 'populate_booking';
    await booking.populate('serviceId');
    if (employeeId) await booking.populate('employeeId');

    const bookingForEmail = { ...booking.toObject(), service: booking.serviceId, employee: booking.employeeId };

    stage = 'trigger_emails';
    Promise.resolve()
      .then(() => emailTemplateService.renderConfirmationEmail(salon, bookingForEmail, booking.language))
      .then((emailData) => emailService.sendEmail({ to: customerEmail, subject: emailData.subject, text: emailData.body, html: emailData.body.replace(/\n/g, '<br>') }))
      .then(() => booking.markEmailSent('confirmation'))
      .then(() => logger.log(`✉️  Sent confirmation email to ${customerEmail}`))
      .catch((emailError) => logger.error('Error sending confirmation email:', emailError));

    emailQueueWorker.scheduleReminderEmail(booking, salon).catch(error => logger.error('Error scheduling reminder email:', error));
    emailQueueWorker.scheduleReviewEmail(booking, salon).catch(error => logger.error('Error scheduling review email:', error));
    emailService.sendEmail({ to: salon.email, subject: `New Booking: ${customerName}`, text: `New booking received:\n\nCustomer: ${customerName}\nEmail: ${customerEmail}\nService: ${service.name}\nDate: ${parsedBookingDate.toLocaleString('de-DE')}`, html: `<h2>New Booking</h2><p><strong>Customer:</strong> ${customerName}<br><strong>Email:</strong> ${customerEmail}<br><strong>Service:</strong> ${service.name}<br><strong>Date:</strong> ${parsedBookingDate.toLocaleString('de-DE')}</p>` }).catch(error => logger.error('Error sending salon notification:', error));

    res.status(201).json({
      success: true,
      message: 'Buchung erfolgreich erstellt! Bitte überprüfen Sie Ihre E-Mails für die Bestätigung.',
      booking: { id: booking._id, bookingDate: booking.bookingDate, service: service.name, status: booking.status }
    });
  } catch (error) {
    logger.error('CreatePublicBooking Error:', { requestId: req.id, stage, path: req.originalUrl, errorName: error?.name, errorMessage: error?.message, errorCode: error?.code });
    res.status(500).json({ success: false, message: sanitizeErrorMessage(error, 'Buchung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'), requestId: req.id });
  }
};

/**
 * Get public booking base data for a studio slug
 * GET /api/public/booking/:studioSlug
 */
export const getPublicBookingData = async (req, res) => {
  try {
    const { studioSlug } = req.params;

    const salon = await Salon.findBySlug(studioSlug);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Studio nicht gefunden'
      });
    }

    const services = await Service.find({
      salonId: salon._id,
      isActive: true
    })
      .select('_id name description price duration category')
      .sort({ name: 1 })
      .lean()
      .maxTimeMS(5000);

    return res.status(200).json({
      success: true,
      studio: {
        id: salon._id,
        slug: salon.slug,
        businessName: salon.name,
        address: salon.address || null
      },
      services
    });
  } catch (error) {
    logger.error('GetPublicBookingData Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

/**
 * Create public appointment for a studio slug
 * POST /api/public/booking/:studioSlug/appointments
 */
export const createPublicAppointment = async (req, res) => {
  try {
    const { studioSlug } = req.params;
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      startTime
    } = req.body;

    if (!serviceId || !customerName || !customerEmail || !customerPhone || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, customerName, customerEmail, customerPhone und startTime sind erforderlich'
      });
    }

    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Service-ID'
      });
    }

    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige E-Mail-Adresse'
      });
    }

    const parsedStartTime = parseValidDate(startTime);
    if (!parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat für startTime'
      });
    }

    const salon = await Salon.findBySlug(studioSlug);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Studio nicht gefunden'
      });
    }

    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      salonId: salon._id,
      isActive: true
    }).maxTimeMS(5000);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dienstleistung nicht gefunden'
      });
    }

    const normalizedEmail = customerEmail.toLowerCase().trim();
    let customer = await Customer.findOne({
      salonId: salon._id,
      email: normalizedEmail
    }).maxTimeMS(5000);

    if (!customer) {
      const [firstName, ...lastNameParts] = customerName.trim().split(' ');
      customer = await Customer.create({
        salonId: salon._id,
        firstName: firstName || customerName.trim(),
        lastName: lastNameParts.join(' ') || 'Walk-in',
        email: normalizedEmail,
        phone: customerPhone.trim()
      });
    }

    // Check availability + create inside a transaction to prevent double-booking
    let booking;
    const txSession = await mongoose.startSession();
    txSession.startTransaction();
    try {
      const isAvailable = await Booking.checkAvailability(
        salon._id, parsedStartTime, service.duration || 30, null, txSession
      );
      if (!isAvailable) {
        await txSession.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Dieser Zeitslot ist bereits belegt'
        });
      }
      [booking] = await Booking.create([{
        salonId: salon._id,
        serviceId: service._id,
        customerId: customer._id,
        customerName: customerName.trim(),
        customerEmail: normalizedEmail,
        customerPhone: customerPhone.trim(),
        bookingDate: parsedStartTime,
        duration: service.duration || 30,
        status: 'pending'
      }], { session: txSession });
      await txSession.commitTransaction();
    } catch (txErr) {
      await txSession.abortTransaction();
      throw txErr;
    } finally {
      txSession.endSession();
    }

    await booking.populate('serviceId', 'name duration price');

    return res.status(201).json({
      success: true,
      message: 'Termin erfolgreich erstellt',
      appointment: booking
    });
  } catch (error) {
    logger.error('CreatePublicAppointment Error:', error);
    return res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'Termin konnte nicht erstellt werden')
    });
  }
};

export default {
  getAllSalons,
  searchSalons,
  getSalonsByCity,
  getSalonBySlug,
  getAvailableSlots,
  createPublicBooking,
  getPublicBookingData,
  createPublicAppointment
};


