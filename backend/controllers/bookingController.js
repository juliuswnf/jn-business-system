import logger from '../utils/logger.js';
import cacheService from '../services/cacheService.js';
import mongoose from 'mongoose';
import timezoneHelpers from '../utils/timezoneHelpers.js';
import Salon from '../models/Salon.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
import {
  parseValidDate,
  isValidObjectId,
  sanitizeErrorMessage
} from '../utils/validation.js';
/**
 * Booking Controller - MVP Simplified
 * Essential booking operations only
 */

import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';

const ALLOWED_BOOKING_STATUSES = ['pending', 'booked', 'confirmed', 'completed', 'cancelled', 'no_show'];

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['pending', 'booked', 'confirmed', 'cancelled', 'no_show'],
  booked: ['booked', 'confirmed', 'cancelled', 'no_show'],
  confirmed: ['confirmed', 'completed', 'cancelled', 'no_show'],
  completed: ['completed'],
  cancelled: ['cancelled'],
  no_show: ['no_show']
};

const canTransitionBookingStatus = (currentStatus, nextStatus) => {
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedNext.includes(nextStatus);
};

const getAuthenticatedCustomerReference = (req) => {
  return req.user?.customerId || req.user?.id || req.user?._id || null;
};

const hasCustomerBookingAccess = (req, booking) => {
  const bookingCustomerId = booking?.customerId?.toString();
  const bookingCustomerEmail = (booking?.customerEmail || '').toLowerCase().trim();
  const authenticatedCustomerRef = getAuthenticatedCustomerReference(req)?.toString();
  const authenticatedCustomerEmail = (req.user?.email || '').toLowerCase().trim();

  // Prefer strong ID match when booking has a linked customerId.
  if (bookingCustomerId) {
    return Boolean(authenticatedCustomerRef) && bookingCustomerId === authenticatedCustomerRef;
  }

  // Fallback for legacy bookings created without customerId.
  return Boolean(authenticatedCustomerEmail) && bookingCustomerEmail === authenticatedCustomerEmail;
};

const hasSalonBookingAccess = (req, booking) => {
  if (req.user?.role === 'ceo') {
    return true;
  }

  const bookingSalonId = booking?.salonId?._id
    ? booking.salonId._id.toString()
    : booking?.salonId?.toString();

  return bookingSalonId === req.user?.salonId?.toString();
};

const ensureBookingAccess = (req, res, booking) => {
  if (!booking) {
    return false;
  }

  if (req.user?.role === 'customer') {
    if (!hasCustomerBookingAccess(req, booking)) {
      res.status(403).json({
        success: false,
        message: 'Access denied - Booking belongs to another customer'
      });
      return false;
    }

    return true;
  }

  if (!hasSalonBookingAccess(req, booking)) {
    res.status(403).json({
      success: false,
      message: 'Access denied - Resource belongs to another salon'
    });
    return false;
  }

  return true;
};

// ==================== CREATE BOOKING ====================

export const createBooking = async (req, res) => {
  try {
    const { salonId, serviceId, employeeId, bookingDate, customerName, customerEmail, customerPhone, notes, idempotencyKey } = req.body;

    const effectiveSalonId = req.user?.role === 'ceo' ? salonId : req.user?.salonId;

    if (!effectiveSalonId || !serviceId || !bookingDate || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Bitte geben Sie alle erforderlichen Felder an: serviceId, bookingDate, customerEmail'
      });
    }

    if (req.user?.role !== 'ceo' && salonId && salonId.toString() !== req.user?.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - salonId must match authenticated tenant'
      });
    }

    // Validate ObjectIds BEFORE any DB queries (including idempotency check) to
    // avoid unnecessary DB load from malformed / adversarial requests.
    if (!isValidObjectId(effectiveSalonId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Salon-ID-Format' });
    }
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Service-ID-Format' });
    }
    if (employeeId && !isValidObjectId(employeeId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Mitarbeiter-ID-Format' });
    }

    const salonObjectId = new mongoose.Types.ObjectId(effectiveSalonId);
    const serviceObjectId = new mongoose.Types.ObjectId(serviceId);
    const employeeObjectId = employeeId ? new mongoose.Types.ObjectId(employeeId) : null;

    // ? SRE FIX #30: Idempotency check - prevent double bookings from double-clicks
    if (idempotencyKey) {
      if (typeof idempotencyKey !== 'string' || idempotencyKey.length > 512) {
        return res.status(400).json({ success: false, message: 'Invalid idempotency key' });
      }
      const existingBooking = await Booking.findOne({ idempotencyKey: String(idempotencyKey) }).maxTimeMS(5000);

      if (existingBooking) {
        logger.info(`?? Duplicate booking attempt detected: ${idempotencyKey}`);
        return res.status(200).json({
          success: true,
          message: 'Buchung existiert bereits',
          booking: existingBooking,
          duplicate: true
        });
      }
    }

    // ? AUDIT FIX: Parse and validate date with timezone support
    let parsedDate;

    // Support new { date, time } format OR legacy ISO string.
    // For the new format, timezone validation is deferred to inside the transaction
    // so the same session-bound salon fetch covers both validation and capacity check.
    if (typeof bookingDate === 'object' && bookingDate.date && bookingDate.time) {
      // parsedDate will be resolved inside the transaction using the session-bound salon
    } else {
      // Legacy format: ISO string
      parsedDate = parseValidDate(bookingDate);
      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
    }

    const service = await Service.findOne({ _id: serviceObjectId, salonId: salonObjectId }).maxTimeMS(5000);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service nicht gefunden'
      });
    }

    // Use MongoDB transaction to prevent race condition (double booking)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ? HIGH FIX #8: Check salon capacity (prevent overbooking)
      const salon = await Salon.findById(salonObjectId).maxTimeMS(5000).session(session);
      if (!salon) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Salon not found'
        });
      }

      // Resolve parsedDate for new { date, time } format using the session-bound salon
      if (typeof bookingDate === 'object' && bookingDate.date && bookingDate.time) {
        const validation = timezoneHelpers.validateBookingTime(
          bookingDate.date,
          bookingDate.time,
          salon.timezone
        );
        if (!validation.valid) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: validation.error
          });
        }
        parsedDate = timezoneHelpers.toUTC(
          bookingDate.date,
          bookingDate.time,
          salon.timezone
        );
      }

      // Calculate booking time window
      const startTime = new Date(parsedDate);
      const serviceDuration = service.duration || 60;
      const endTime = new Date(startTime.getTime() + serviceDuration * 60 * 1000);

      // ? HIGH FIX #8: Check concurrent bookings against salon capacity
      // ? AUDIT FIX: Use service duration as buffer (not fixed 30 min)
      const bufferMs = serviceDuration * 60 * 1000;
      const concurrentBookings = await Booking.countDocuments({
        salonId: salonObjectId,
        bookingDate: {
          $gte: new Date(startTime.getTime() - bufferMs),
          $lt: new Date(endTime.getTime() + bufferMs)
        },
        status: { $nin: ['cancelled', 'no_show'] }
      }).session(session).maxTimeMS(5000);

      // Get salon capacity (default 5 if not set)
      const maxConcurrentBookings = salon.settings?.maxConcurrentBookings || salon.capacity || 5;

      if (concurrentBookings >= maxConcurrentBookings) {
        await session.abortTransaction();
        logger.warn(`⚠️ Capacity exceeded: ${concurrentBookings}/${maxConcurrentBookings} for salon ${effectiveSalonId}`);
        return res.status(409).json({
          success: false,
          message: `Kapazität erreicht. Maximal ${maxConcurrentBookings} gleichzeitige Buchungen möglich.`,
          capacity: {
            current: concurrentBookings,
            max: maxConcurrentBookings
          }
        });
      }

      // Check slot availability inside the transaction so the read is snapshot-isolated.
      // checkAvailability uses .session(session) internally, preventing concurrent
      // requests from both seeing a free slot and double-booking.
      const isAvailable = await Booking.checkAvailability(
        salonObjectId,
        parsedDate,
        serviceDuration,
        employeeObjectId,
        session
      );
      if (!isAvailable) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }

      // Create booking within transaction
      const bookingData = {
        salonId: salonObjectId,
        serviceId: serviceObjectId,
        employeeId: employeeObjectId,
        bookingDate: parsedDate,
        duration: serviceDuration,
        customerName,
        customerEmail: String(customerEmail).toLowerCase().trim(),
        customerPhone,
        notes,
        status: 'pending'
      };

      // Preserve ownership for authenticated customers to prevent IDOR on cancellation/update.
      if (req.user?.role === 'customer') {
        const customerRef = getAuthenticatedCustomerReference(req);
        if (customerRef && mongoose.isValidObjectId(customerRef)) {
          bookingData.customerId = new mongoose.Types.ObjectId(customerRef);
        }
      }

      // Persist idempotency key only when it is a non-empty string.
      if (typeof idempotencyKey === 'string' && idempotencyKey.trim()) {
        bookingData.idempotencyKey = idempotencyKey.trim();
      }

      const [booking] = await Booking.create([bookingData], { session });
      await session.commitTransaction();

      await booking.populate('serviceId');

      // Invalidate related caches
      cacheService.invalidate('bookings', booking.salonId?.toString());

      res.status(201).json({
        success: true,
        booking
      });
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error('CreateBooking Error:', error);
    res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error, 'Failed to create booking')
    });
  }
};

// ==================== GET ALL BOOKINGS ====================

export const getBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, salonId } = req.query;
    const { page, limit, skip } = req.pagination;
    let filter = { ...(req.tenantFilter || {}) };

    // Optional salon filter for CEO only
    if (req.user?.role === 'ceo' && salonId) {
      if (!isValidObjectId(salonId)) {
        return res.status(400).json({ success: false, message: 'Invalid salonId format' });
      }
      filter.salonId = new mongoose.Types.ObjectId(salonId);
    }

    // .find() returns the value from the static array, breaking the taint chain
    const normalizedStatus = typeof status === 'string' ? status.replace('no-show', 'no_show') : undefined;
    const safeStatus = typeof normalizedStatus === 'string'
      ? ALLOWED_BOOKING_STATUSES.find(s => s === normalizedStatus)
      : undefined;
    if (safeStatus) filter.status = safeStatus;

    if (startDate || endDate) {
      // typeof guards prevent object-operator injection via nested query strings
      if (startDate && typeof startDate !== 'string') {
        return res.status(400).json({ success: false, message: 'Ungültiges startDate-Format' });
      }
      if (endDate && typeof endDate !== 'string') {
        return res.status(400).json({ success: false, message: 'Ungültiges endDate-Format' });
      }
      const dateRange = {};
      if (startDate) {
        const parsedStart = parseValidDate(startDate);
        if (!parsedStart) {
          return res.status(400).json({ success: false, message: 'Ungültiges startDate-Format' });
        }
        dateRange.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = parseValidDate(endDate);
        if (!parsedEnd) {
          return res.status(400).json({ success: false, message: 'Ungültiges endDate-Format' });
        }
        dateRange.$lte = parsedEnd;
      }
      filter.bookingDate = dateRange;
    }

    const total = await Booking.countDocuments(filter).maxTimeMS(5000);
    const bookings = await Booking.find(filter).maxTimeMS(5000)
      .populate('serviceId', 'name price duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ? NO-SHOW-KILLER: Add confirmation status to each booking (performance optimized)
    const bookingIds = bookings.map(b => b._id);
    const confirmations = bookingIds.length > 0
      ? await BookingConfirmation.find({
        bookingId: { $in: bookingIds }
      }).select('bookingId status reminderSentAt confirmedAt confirmationDeadline autoCancelledAt').lean().maxTimeMS(5000)
      : [];

    // Create lookup map for O(1) access
    const confirmationMap = new Map(
      confirmations.map(c => [c.bookingId.toString(), c])
    );

    // Merge confirmation data into bookings
    const bookingsWithConfirmations = bookings.map(booking => ({
      ...booking,
      confirmation: confirmationMap.get(booking._id.toString()) || null
    }));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: bookingsWithConfirmations.length,
      total,
      page,
      limit,
      totalPages,
      bookings: bookingsWithConfirmations
    });
  } catch (error) {
    logger.error('GetBookings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== GET SINGLE BOOKING ====================

export const getBooking = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('serviceId').maxTimeMS(5000)
      .populate('employeeId', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    logger.error('GetBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== UPDATE BOOKING ====================

export const updateBooking = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const { bookingDate, status, notes } = req.body;

    // Load booking first
    const booking = await Booking.findById(req.params.id).maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    // Build update data with validation
    if (status) {
      const normalizedStatus = String(status).trim();
      const safeStatus = ['pending', 'booked', 'confirmed'].find(s => s === normalizedStatus);
      if (!safeStatus) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
          allowedStatuses: ['pending', 'booked', 'confirmed']
        });
      }

      if (!canTransitionBookingStatus(booking.status, safeStatus)) {
        return res.status(409).json({
          success: false,
          message: `Ungültiger Statuswechsel von '${booking.status}' zu '${safeStatus}'`
        });
      }

      booking.status = safeStatus;
    }
    if (notes !== undefined) booking.notes = notes;

    if (bookingDate) {
      // ? AUDIT FIX: Parse and validate date with timezone support
      let parsedDate;

      // Support new { date, time } format OR legacy ISO string
      if (typeof bookingDate === 'object' && bookingDate.date && bookingDate.time) {
        // New format: { date: "2025-12-15", time: "14:00" }
        const salon = await Salon.findById(booking.salonId).maxTimeMS(5000);
        if (!salon) {
          return res.status(404).json({
            success: false,
            message: 'Salon not found'
          });
        }

        // Validate booking time (DST check)
        const validation = timezoneHelpers.validateBookingTime(
          bookingDate.date,
          bookingDate.time,
          salon.timezone
        );

        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.error
          });
        }

        // Convert to UTC for storage
        parsedDate = timezoneHelpers.toUTC(
          bookingDate.date,
          bookingDate.time,
          salon.timezone
        );
      } else {
        // Legacy format: ISO string
        parsedDate = parseValidDate(bookingDate);
        if (!parsedDate) {
          return res.status(400).json({
            success: false,
            message: 'Invalid date format'
          });
        }
      }

      // Check availability under a transaction to prevent the same race condition
      // that createBooking protects against — two concurrent reschedules cannot
      // both land on the same slot.
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const isAvailable = await Booking.checkAvailability(
          booking.salonId,
          parsedDate,
          booking.duration || 60,
          booking.employeeId || null,
          session,
          booking._id  // exclude this booking so it doesn't conflict with itself
        );
        if (!isAvailable) {
          await session.abortTransaction();
          return res.status(409).json({
            success: false,
            message: 'Dieser Zeitslot ist bereits belegt'
          });
        }
        booking.bookingDate = parsedDate;
        await booking.save({ session });
        await session.commitTransaction();
      } catch (txError) {
        await session.abortTransaction();
        throw txError;
      } finally {
        session.endSession();
      }
    } else {
      await booking.save();
    }

    await booking.populate('serviceId');

    return res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    logger.error('UpdateBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== CONFIRM BOOKING ====================

export const confirmBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(req.params.id).maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    if (!canTransitionBookingStatus(booking.status, 'confirmed')) {
      return res.status(409).json({
        success: false,
        message: `Buchung im Status '${booking.status}' kann nicht bestätigt werden`
      });
    }

    booking.status = 'confirmed';
    booking.confirmedAt = Date.now();
    await booking.save();
    await booking.populate('serviceId');

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed',
      booking
    });
  } catch (error) {
    logger.error('ConfirmBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== CANCEL BOOKING ====================

export const cancelBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(req.params.id).maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    if (!canTransitionBookingStatus(booking.status, 'cancelled')) {
      return res.status(409).json({
        success: false,
        message: `Buchung im Status '${booking.status}' kann nicht storniert werden`
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = Date.now();
    await booking.save();
    await booking.populate('serviceId');

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    logger.error('CancelBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== COMPLETE BOOKING ====================

export const completeBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(req.params.id).maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    if (!canTransitionBookingStatus(booking.status, 'completed')) {
      return res.status(409).json({
        success: false,
        message: `Buchung im Status '${booking.status}' kann nicht abgeschlossen werden`
      });
    }

    booking.status = 'completed';
    booking.completedAt = Date.now();
    await booking.save();
    await booking.populate('serviceId');

    return res.status(200).json({
      success: true,
      message: 'Booking completed',
      booking
    });
  } catch (error) {
    logger.error('CompleteBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== DELETE BOOKING ====================

export const deleteBooking = async (req, res) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const booking = await Booking.findById(req.params.id).maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    // ? SOFT DELETE instead of hard delete
    await booking.softDelete(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    logger.error('DeleteBooking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== NO-SHOW HELPERS ====================

async function chargeNoShowFee(booking) {
  const feeAmount = booking.salonId.noShowKiller.feeAmount || 1500;
  if (booking.salonId.stripe?.connectedAccountId && booking.salonId.stripe?.chargesEnabled) {
    const { chargeNoShowFeeConnect } = await import('../services/stripeConnectService.js');
    const chargeResult = await chargeNoShowFeeConnect(booking, booking.salonId);
    await Booking.findByIdAndUpdate(booking._id, { $set: { 'noShowFee.charged': true, 'noShowFee.amount': feeAmount, 'noShowFee.chargeId': chargeResult.chargeId, 'noShowFee.transferId': chargeResult.transferId || null, 'noShowFee.chargedAt': new Date(), 'noShowFee.breakdown': chargeResult.breakdown } }).maxTimeMS(5000);
  } else {
    const { chargeNoShowFee: chargeFn } = await import('../services/stripeService.js');
    const paymentIntent = await chargeFn(booking.stripeCustomerId, booking.paymentMethodId, feeAmount, `No-Show-Gebühr - ${booking.salonId.name}`, { bookingId: booking._id.toString(), salonId: booking.salonId._id.toString(), type: 'no_show_fee' });
    const stripeFee = Math.round(25 + (feeAmount * 0.014));
    await Booking.findByIdAndUpdate(booking._id, { $set: { 'noShowFee.charged': true, 'noShowFee.amount': feeAmount, 'noShowFee.chargeId': paymentIntent.id, 'noShowFee.chargedAt': new Date(), 'noShowFee.breakdown': { totalCharged: feeAmount, stripeFee, salonReceives: feeAmount - stripeFee, platformCommission: 0 } } }).maxTimeMS(5000);
  }
  return feeAmount;
}

async function sendNoShowFeeEmail(booking, feeAmount) {
  const emailService = (await import('../services/emailService.js')).default;
  const dateStr = new Date(booking.bookingDate).toLocaleDateString('de-DE');
  const timeStr = new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  await emailService.sendEmail({
    to: booking.customerEmail,
    subject: `No-Show-Gebühr wurde berechnet - ${booking.salonId.name}`,
    text: `Hallo ${booking.customerName},\n\nSie sind nicht zu Ihrem Termin erschienen:\n\nTermin: ${dateStr} um ${timeStr}\nSalon: ${booking.salonId.name}\n\nNo-Show-Gebühr: €${(feeAmount / 100).toFixed(2)}\nDie Gebühr wurde von Ihrer hinterlegten Kreditkarte abgebucht.\n\nBei Fragen kontaktieren Sie bitte:\n${booking.salonId.email} | ${booking.salonId.phone || ''}\n\nMit freundlichen Grüßen\n${booking.salonId.name}`,
    html: `<h2>No-Show-Gebühr wurde berechnet</h2><p>Hallo ${booking.customerName},</p><p>Sie sind nicht zu Ihrem Termin erschienen:</p><ul><li><strong>Termin:</strong> ${dateStr} um ${timeStr}</li><li><strong>Salon:</strong> ${booking.salonId.name}</li></ul><p><strong>No-Show-Gebühr: €${(feeAmount / 100).toFixed(2)}</strong></p><p>Die Gebühr wurde von Ihrer hinterlegten Kreditkarte abgebucht.</p><p>Bei Fragen kontaktieren Sie bitte:<br>${booking.salonId.email}${booking.salonId.phone ? ` | ${booking.salonId.phone}` : ''}</p>`
  });
}

async function sendNoShowFeeFailureEmail(booking, errorMessage) {
  const emailService = (await import('../services/emailService.js')).default;
  await emailService.sendEmail({
    to: booking.salonId.email,
    subject: '⚠️ No-Show-Gebühr konnte nicht abgebucht werden',
    text: `Die No-Show-Gebühr für ${booking.customerName} (${booking.customerEmail}) konnte nicht abgebucht werden.\n\nGrund: ${errorMessage}\n\nBitte kontaktieren Sie den Kunden für manuelle Abrechnung.`,
    html: `<h2>⚠️ No-Show-Gebühr konnte nicht abgebucht werden</h2><p>Die No-Show-Gebühr für <strong>${booking.customerName}</strong> (${booking.customerEmail}) konnte nicht abgebucht werden.</p><p><strong>Grund:</strong> ${errorMessage}</p><p>Bitte kontaktieren Sie den Kunden für manuelle Abrechnung.</p>`
  });
}


export const markAsNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Buchungs-ID'
      });
    }

    // Load booking with salon
    const booking = await Booking.findById(id)
      .populate('salonId')
      .maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Buchung nicht gefunden'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    if (!canTransitionBookingStatus(booking.status, 'no_show')) {
      return res.status(409).json({
        success: false,
        message: `Buchung im Status '${booking.status}' kann nicht als No-Show markiert werden`
      });
    }

    // Check if already marked as no-show
    if (booking.status === 'no_show') {
      return res.status(400).json({
        success: false,
        message: 'Buchung wurde bereits als No-Show markiert'
      });
    }

    // Save previous status so undoNoShow can restore it
    booking.statusBeforeNoShow = booking.status;

    // Update booking status
    booking.status = 'no_show';
    booking.noShowMarkedAt = new Date();
    booking.noShowMarkedBy = req.user._id;

    // Persist the status change BEFORE any Stripe call. If the charge succeeds
    // but the subsequent DB write fails, the status is already recorded and the
    // charge can be traced via Stripe metadata (bookingId).
    await booking.save();

    // Attempt to charge No-Show-Fee if enabled
    let feeCharged = false;
    if (booking.salonId?.noShowKiller?.enabled && booking.paymentMethodId) {
      try {
        const feeAmount = await chargeNoShowFee(booking);
        feeCharged = true;
        logger.info(`✅ No-Show-Fee charged: €${feeAmount / 100} for booking ${booking._id}`);
        await sendNoShowFeeEmail(booking, feeAmount);
      } catch (error) {
        await Booking.findByIdAndUpdate(booking._id, {
          $set: {
            'noShowFee.charged': false,
            'noShowFee.error': error.message,
            'noShowFee.attemptedAt': new Date()
          }
        }).maxTimeMS(5000);
        logger.error(`❌ Failed to charge No-Show-Fee: ${error.message}`);
        await sendNoShowFeeFailureEmail(booking, error.message);
      }
    } else if (booking.salonId?.noShowKiller?.enabled && !booking.paymentMethodId) {
      // No payment method available
      logger.warn(`⚠️ No payment method available for No-Show-Fee: Booking ${booking._id}`);
    }

    // Reload to reflect any noShowFee updates applied via findByIdAndUpdate
    const updatedBooking = await Booking.findById(booking._id).populate('salonId').maxTimeMS(5000);
    res.json({
      success: true,
      message: 'Als No-Show markiert',
      feeCharged: feeCharged,
      booking: updatedBooking
    });
  } catch (error) {
    logger.error('MarkAsNoShow Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Markieren als No-Show'
    });
  }
};

// ==================== UNDO NO-SHOW ====================

export const undoNoShow = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Buchungs-ID'
      });
    }

    // Load booking
    const booking = await Booking.findById(id)
      .populate('salonId')
      .maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Buchung nicht gefunden'
      });
    }

    if (!ensureBookingAccess(req, res, booking)) {
      return;
    }

    // Check if marked as no-show
    if (booking.status !== 'no_show') {
      return res.status(400).json({
        success: false,
        message: 'Buchung wurde nicht als No-Show markiert'
      });
    }

    // Refund if fee was charged
    if (booking.noShowFee?.charged && booking.noShowFee.chargeId) {
      try {
        let refund;
        if (booking.noShowFee.transferId) {
          // Charge was made via Stripe Connect — must refund through the Connect
          // service so the transfer reversal is handled correctly.
          const { refundNoShowFee: connectRefundFn } = await import('../services/stripeConnectService.js');
          const connectRefund = await connectRefundFn(
            booking.noShowFee.chargeId,
            booking.noShowFee.amount
          );
          refund = { id: connectRefund.refundId };
        } else {
          const { refundNoShowFee } = await import('../services/stripeService.js');
          refund = await refundNoShowFee(booking.noShowFee.chargeId);
        }

        booking.noShowFee.refunded = true;
        booking.noShowFee.refundedAt = new Date();
        booking.noShowFee.refundId = refund.id;

        // Email customer about refund
        const emailService = (await import('../services/emailService.js')).default;
        await emailService.sendEmail({
          to: booking.customerEmail,
          subject: `No-Show-Gebühr erstattet - ${booking.salonId.name}`,
          text: `Hallo ${booking.customerName},\n\nDie No-Show-Gebühr von €${(booking.noShowFee.amount / 100).toFixed(2)} wurde erstattet.\n\nDas Geld wird in 5-10 Werktagen auf Ihrer Karte gutgeschrieben.\n\nMit freundlichen Grüßen\n${booking.salonId.name}`,
          html: `<h2>No-Show-Gebühr erstattet</h2><p>Hallo ${booking.customerName},</p><p>Die No-Show-Gebühr von <strong>€${(booking.noShowFee.amount / 100).toFixed(2)}</strong> wurde erstattet.</p><p>Das Geld wird in 5-10 Werktagen auf Ihrer Karte gutgeschrieben.</p>`
        });

        logger.info(`✅ No-Show-Fee refunded: Refund ID ${refund.id}`);
      } catch (error) {
        logger.error(`❌ Failed to refund No-Show-Fee: ${error.message}`);
        // Continue with status update even if refund fails
      }
    }

    // Revert to status that was set before no-show marking
    booking.status = booking.statusBeforeNoShow || 'confirmed';
    booking.statusBeforeNoShow = null;
    booking.noShowMarkedAt = null;
    booking.noShowMarkedBy = null;

    await booking.save();

    res.json({
      success: true,
      message: 'No-Show rückgängig gemacht',
      booking: booking
    });
  } catch (error) {
    logger.error('UndoNoShow Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Rückgängigmachen der No-Show-Markierung'
    });
  }
};

// ==================== GET BOOKING STATS ====================

export const getBookingStats = async (req, res) => {
  try {
    const { salonId } = req.query;
    let filter = { ...(req.tenantFilter || {}) };

    // Optional salon filter for CEO only
    if (req.user?.role === 'ceo' && salonId) {
      if (!isValidObjectId(salonId)) {
        return res.status(400).json({ success: false, message: 'Invalid salonId format' });
      }
      filter.salonId = new mongoose.Types.ObjectId(salonId);
    }

    const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, completedBookings, bookedBookings] = await Promise.all([
      Booking.countDocuments(filter).maxTimeMS(5000),
      Booking.countDocuments({ ...filter, status: 'confirmed' }).maxTimeMS(5000),
      Booking.countDocuments({ ...filter, status: 'pending' }).maxTimeMS(5000),
      Booking.countDocuments({ ...filter, status: 'cancelled' }).maxTimeMS(5000),
      Booking.countDocuments({ ...filter, status: 'completed' }).maxTimeMS(5000),
      // 'booked' is set by createAppointment (walk-in/manual entries)
      Booking.countDocuments({ ...filter, status: 'booked' }).maxTimeMS(5000)
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        bookedBookings
      }
    });
  } catch (error) {
    logger.error('GetBookingStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== GET APPOINTMENT DASHBOARD STATS ====================

export const getDashboardStats = async (req, res) => {
  try {
    const studioId = req.user?.salonId;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: 'Kein Studio im Benutzerkontext gefunden'
      });
    }

    const endOfToday = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    endOfToday.setHours(23, 59, 59, 999);

    const todayFilter = {
      salonId: studioId,
      bookingDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['booked', 'pending', 'confirmed', 'completed'] }
    };

    const completedTodayFilter = {
      salonId: studioId,
      bookingDate: { $gte: startOfToday, $lte: endOfToday },
      status: 'completed'
    };

    const [todayAppointments, totalCustomers, revenueResult] = await Promise.all([
      Booking.countDocuments(todayFilter).maxTimeMS(5000),
      Customer.countDocuments({ salonId: studioId, status: { $ne: 'blocked' } }).maxTimeMS(5000),
      Booking.aggregate([
        { $match: completedTodayFilter },
        {
          $lookup: {
            from: 'services',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'primaryService'
          }
        },
        {
          $addFields: {
            primaryServiceRevenue: {
              $ifNull: [{ $arrayElemAt: ['$primaryService.price', 0] }, 0]
            },
            multiServiceRevenue: {
              $sum: {
                $map: {
                  input: { $ifNull: ['$services', []] },
                  as: 'svc',
                  in: { $ifNull: ['$$svc.price', 0] }
                }
              }
            }
          }
        },
        {
          $project: {
            revenue: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$services', []] } }, 0] },
                '$multiServiceRevenue',
                '$primaryServiceRevenue'
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenueToday: { $sum: '$revenue' }
          }
        }
      ]).maxTimeMS(5000)
    ]);

    res.status(200).json({
      success: true,
      studioId,
      stats: {
        todayAppointments,
        // Service.price is stored in euros (decimal). The aggregation sums
        // euros directly — no cent conversion needed.
        totalRevenueTodayEur: revenueResult[0]?.totalRevenueToday || 0,
        totalCustomers
      }
    });
  } catch (error) {
    logger.error('GetDashboardStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== GET TODAY'S UPCOMING APPOINTMENTS ====================

export const getTodayAppointments = async (req, res) => {
  try {
    const studioId = req.user?.salonId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: 'Kein Studio im Benutzerkontext gefunden'
      });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const filter = {
      salonId: studioId,
      bookingDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['booked', 'pending', 'confirmed'] }
    };

    const total = await Booking.countDocuments(filter).maxTimeMS(5000);

    const appointments = await Booking.find(filter)
      .populate('customerId', 'firstName lastName')
      .populate('serviceId', 'name duration')
      .sort({ bookingDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(5000);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    logger.error('GetTodayAppointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== UPDATE APPOINTMENT STATUS ====================

export const updateAppointmentStatus = async (req, res) => {
  try {
    const studioId = req.user?.salonId;
    const { id } = req.params;
    const { status } = req.body;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: 'Kein Studio im Benutzerkontext gefunden'
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Termin-ID'
      });
    }

    const normalizedStatus = String(status || '').trim();
    const safeStatus = ALLOWED_BOOKING_STATUSES.find(s => s === normalizedStatus);
    if (!safeStatus) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiger Statuswert',
        allowedStatuses: ALLOWED_BOOKING_STATUSES
      });
    }

    const appointment = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(id),
      salonId: studioId
    }).maxTimeMS(5000);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Termin nicht gefunden oder kein Zugriff'
      });
    }

    if (!ensureBookingAccess(req, res, appointment)) {
      return;
    }

    if (!canTransitionBookingStatus(appointment.status, safeStatus)) {
      return res.status(409).json({
        success: false,
        message: `Ungültiger Statuswechsel von '${appointment.status}' zu '${safeStatus}'`
      });
    }

    appointment.status = safeStatus;
    await appointment.save();

    cacheService.invalidate('bookings', studioId?.toString());

    return res.status(200).json({
      success: true,
      message: 'Terminstatus aktualisiert',
      appointment
    });
  } catch (error) {
    logger.error('UpdateAppointmentStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== CREATE APPOINTMENT (MANUAL ENTRY) ====================

export const createAppointment = async (req, res) => {
  try {
    const studioId = req.user?.salonId;
    const {
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      startTime,
      bookingDate,
      notes
    } = req.body;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: 'Kein Studio im Benutzerkontext gefunden'
      });
    }

    if (!serviceId || !customerName || !(startTime || bookingDate)) {
      return res.status(400).json({
        success: false,
        message: 'serviceId, customerName und startTime oder bookingDate sind erforderlich'
      });
    }

    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Service-ID'
      });
    }

    const service = await Service.findOne({
      _id: new mongoose.Types.ObjectId(serviceId),
      salonId: studioId
    }).maxTimeMS(5000);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Dienstleistung nicht gefunden oder kein Zugriff'
      });
    }

    const parsedStartTime = parseValidDate(startTime || bookingDate);
    if (!parsedStartTime) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat für startTime/bookingDate'
      });
    }

    const sanitizedCustomerName = customerName.trim();
    if (!sanitizedCustomerName) {
      return res.status(400).json({
        success: false,
        message: 'customerName darf nicht leer sein'
      });
    }

    const fallbackEmail = `walkin+${Date.now()}@noreply.internal`;

    // Check availability under a transaction so manual (walk-in) entries respect
    // the same slot locks as public createBooking.
    const session = await mongoose.startSession();
    session.startTransaction();
    let appointment;
    try {
      const isAvailable = await Booking.checkAvailability(
        studioId, parsedStartTime, service.duration || 30, null, session
      );
      if (!isAvailable) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Dieser Zeitslot ist bereits belegt'
        });
      }

      [appointment] = await Booking.create([{
        salonId: studioId,
        serviceId: service._id,
        bookingDate: parsedStartTime,
        duration: service.duration || 30,
        customerName: sanitizedCustomerName,
        customerEmail: (customerEmail || fallbackEmail).toLowerCase().trim(),
        customerPhone: customerPhone || null,
        notes: notes || '',
        status: 'booked'
      }], { session });

      await session.commitTransaction();
    } catch (txError) {
      await session.abortTransaction();
      throw txError;
    } finally {
      session.endSession();
    }

    await appointment.populate('serviceId', 'name duration price');

    cacheService.invalidate('bookings', studioId?.toString());

    return res.status(201).json({
      success: true,
      message: 'Termin erfolgreich erstellt',
      appointment
    });
  } catch (error) {
    logger.error('CreateAppointment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== GET BOOKINGS BY DATE ====================

export const getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const salonId = req.query.salonId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    if (salonId && !isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Bitte geben Sie ein Datum an'
      });
    }

    // Validate YYYY-MM-DD format before using as timezone input
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Datum muss im Format YYYY-MM-DD sein'
      });
    }

    // Compute start/end in the salon's local timezone so "today" is always
    // the correct calendar day regardless of server UTC offset.
    // CEO must supply an explicit salonId — silently falling back to UTC would
    // return wrong results for non-UTC salons.
    if (req.user?.role === 'ceo' && !salonId) {
      return res.status(400).json({
        success: false,
        message: 'CEO: salonId query parameter ist für getBookingsByDate erforderlich'
      });
    }
    const effectiveSalonId = req.user?.salonId || salonId || null;
    let salonTimezone = 'UTC';
    if (effectiveSalonId) {
      const salonDoc = await Salon.findById(effectiveSalonId).select('timezone').maxTimeMS(5000).lean();
      salonTimezone = salonDoc?.timezone || 'UTC';
    }
    const startDate = timezoneHelpers.toUTC(date, '00:00', salonTimezone);
    const endDate = timezoneHelpers.toUTC(date, '23:59', salonTimezone);
    endDate.setSeconds(59, 999);

    let filter = {
      ...(req.tenantFilter || {}),
      bookingDate: { $gte: startDate, $lte: endDate }
    };

    // Optional salon filter for CEO only
    if (req.user?.role === 'ceo' && salonId) {
      if (!isValidObjectId(salonId)) {
        return res.status(400).json({ success: false, message: 'Invalid salonId format' });
      }
      filter.salonId = new mongoose.Types.ObjectId(salonId);
    }

    const total = await Booking.countDocuments(filter).maxTimeMS(5000);

    const bookings = await Booking.find(filter).lean().maxTimeMS(5000)
      .populate('serviceId', 'name duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: 1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    logger.error('GetBookingsByDate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Interner Serverfehler'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  markAsNoShow,
  undoNoShow,
  deleteBooking,
  getBookingStats,
  getDashboardStats,
  getTodayAppointments,
  createAppointment,
  updateAppointmentStatus,
  getBookingsByDate
};

