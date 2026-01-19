import logger from '../utils/logger.js';
import cacheService from '../services/cacheService.js';
import mongoose from 'mongoose';
import timezoneHelpers from '../utils/timezoneHelpers.js';
import Salon from '../models/Salon.js';
import BookingConfirmation from '../models/BookingConfirmation.js';
import {
  parseValidDate,
  isValidObjectId,
  sanitizePagination,
  sanitizeErrorMessage
} from '../utils/validation.js';
/**
 * Booking Controller - MVP Simplified
 * Essential booking operations only
 */

import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

// ==================== CREATE BOOKING ====================

export const createBooking = async (req, res) => {
  try {
    const { salonId, serviceId, employeeId, bookingDate, customerName, customerEmail, customerPhone, notes, idempotencyKey } = req.body;

    if (!salonId || !serviceId || !bookingDate || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Bitte geben Sie alle erforderlichen Felder an: salonId, serviceId, bookingDate, customerEmail'
      });
    }

    // ? SRE FIX #30: Idempotency check - prevent double bookings from double-clicks
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey }).maxTimeMS(5000);

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

    // Validate ObjectIds
    if (!isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Salon-ID-Format' });
    }
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Service-ID-Format' });
    }
    if (employeeId && !isValidObjectId(employeeId)) {
      return res.status(400).json({ success: false, message: 'Ungültiges Mitarbeiter-ID-Format' });
    }

    // ? AUDIT FIX: Parse and validate date with timezone support
    let parsedDate;

    // Support new { date, time } format OR legacy ISO string
    if (typeof bookingDate === 'object' && bookingDate.date && bookingDate.time) {
      // New format: { date: "2025-12-15", time: "14:00" }
      const salon = await Salon.findById(salonId).maxTimeMS(5000);
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

    const service = await Service.findById(serviceId).maxTimeMS(5000);
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
      const salon = await Salon.findById(salonId).maxTimeMS(5000).session(session);
      if (!salon) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Salon not found'
        });
      }

      // Calculate booking time window
      const startTime = new Date(parsedDate);
      const serviceDuration = service.duration || 60;
      const endTime = new Date(startTime.getTime() + serviceDuration * 60 * 1000);

      // ? HIGH FIX #8: Check concurrent bookings against salon capacity
      // ? AUDIT FIX: Use service duration as buffer (not fixed 30 min)
      const bufferMs = serviceDuration * 60 * 1000;
      const concurrentBookings = await Booking.countDocuments({
        salonId,
        bookingDate: {
          $gte: new Date(startTime.getTime() - bufferMs),
          $lt: new Date(endTime.getTime() + bufferMs)
        },
        status: { $nin: ['cancelled', 'no_show'] }
      }).session(session);

      // Get salon capacity (default 5 if not set)
      const maxConcurrentBookings = salon.settings?.maxConcurrentBookings || salon.capacity || 5;

      if (concurrentBookings >= maxConcurrentBookings) {
        await session.abortTransaction();
        logger.warn(`⚠️ Capacity exceeded: ${concurrentBookings}/${maxConcurrentBookings} for salon ${salonId}`);
        return res.status(409).json({
          success: false,
          message: `Kapazität erreicht. Maximal ${maxConcurrentBookings} gleichzeitige Buchungen möglich.`,
          capacity: {
            current: concurrentBookings,
            max: maxConcurrentBookings
          }
        });
      }

      // Check for conflicts with session lock
      const existingBooking = await Booking.findOne({
        salonId,
        serviceId,
        employeeId: employeeId || null,
        bookingDate: parsedDate,
        status: { $nin: ['cancelled'] }
      }).maxTimeMS(5000).session(session);

      if (existingBooking) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }

      // Create booking within transaction
      const bookingData = {
        salonId,
        serviceId,
        employeeId: employeeId || null,
        bookingDate: parsedDate,
        customerName,
        customerEmail: customerEmail.toLowerCase(),
        customerPhone,
        notes,
        status: 'pending',
        idempotencyKey: idempotencyKey || null // ? SRE FIX #30: Store idempotency key
      };

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
    const { page, limit, skip } = sanitizePagination(
      req.query.page,
      req.query.limit,
      100 // Maximum 100 items per page
    );

    let filter = { ...(req.tenantFilter || {}) };

    // Optional salon filter for CEO only
    if (req.user?.role === 'ceo' && salonId) {
      filter.salonId = salonId;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.bookingDate = {};
      if (startDate) {
        filter.bookingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.bookingDate.$lte = new Date(endDate);
      }
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter).maxTimeMS(5000)
      .populate('serviceId', 'name price duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // ? NO-SHOW-KILLER: Add confirmation status to each booking (performance optimized)
    const bookingIds = bookings.map(b => b._id);
    const confirmations = await BookingConfirmation.find({
      bookingId: { $in: bookingIds }
    }).select('bookingId status reminderSentAt confirmedAt confirmationDeadline autoCancelledAt').lean();

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

    // ? SECURITY FIX: Authorization check - prevent IDOR
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Build update data with validation
    if (status) booking.status = status;
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

      booking.bookingDate = parsedDate;
    }

    booking.updatedAt = Date.now();

    await booking.save();
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
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

// ==================== MARK AS NO-SHOW ====================

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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert - Ressource gehört zu einem anderen Salon'
      });
    }

    // Check if already marked as no-show
    if (booking.status === 'no_show') {
      return res.status(400).json({
        success: false,
        message: 'Buchung wurde bereits als No-Show markiert'
      });
    }

    // Update booking status
    booking.status = 'no_show';
    booking.noShowMarkedAt = new Date();
    booking.noShowMarkedBy = req.user._id;

    // Attempt to charge No-Show-Fee if enabled
    let feeCharged = false;
    if (booking.salonId?.noShowKiller?.enabled && booking.paymentMethodId) {
      try {
        const feeAmount = booking.salonId.noShowKiller.feeAmount || 1500; // Default €15.00

        // ✅ Use Stripe Connect if available, otherwise fallback to regular Stripe
        let chargeResult;
        if (booking.salonId.stripe?.connectedAccountId && booking.salonId.stripe?.chargesEnabled) {
          // Use Stripe Connect (direct payout to salon)
          const stripeConnectService = await import('../services/stripeConnectService.js');
          chargeResult = await stripeConnectService.chargeNoShowFeeConnect(booking, booking.salonId);

          booking.noShowFee = {
            charged: true,
            amount: feeAmount,
            chargeId: chargeResult.chargeId,
            transferId: chargeResult.transferId || null,
            chargedAt: new Date(),
            breakdown: chargeResult.breakdown
          };
        } else {
          // Fallback to regular Stripe (platform account)
          const stripeService = await import('../services/stripeService.js');
          const paymentIntent = await stripeService.chargeNoShowFee(
            booking.stripeCustomerId,
            booking.paymentMethodId,
            feeAmount,
            `No-Show-Gebühr - ${booking.salonId.name}`,
            {
              bookingId: booking._id.toString(),
              salonId: booking.salonId._id.toString(),
              type: 'no_show_fee'
            }
          );

          // Calculate breakdown for regular Stripe
          const stripeFee = Math.round(25 + (feeAmount * 0.014)); // €0.25 + 1.4%
          const salonReceives = feeAmount - stripeFee;

          booking.noShowFee = {
            charged: true,
            amount: feeAmount,
            chargeId: paymentIntent.id,
            chargedAt: new Date(),
            breakdown: {
              totalCharged: feeAmount,
              stripeFee: stripeFee,
              salonReceives: salonReceives,
              platformCommission: 0
            }
          };
        }

        feeCharged = true;
        logger.info(`✅ No-Show-Fee charged: €${feeAmount / 100} for booking ${booking._id}`);

        // Send email to customer about No-Show-Fee
        const emailService = (await import('../services/emailService.js')).default;
        await emailService.sendEmail({
          to: booking.customerEmail,
          subject: `No-Show-Gebühr wurde berechnet - ${booking.salonId.name}`,
          text: `Hallo ${booking.customerName},\n\nSie sind nicht zu Ihrem Termin erschienen:\n\nTermin: ${new Date(booking.bookingDate).toLocaleDateString('de-DE')} um ${new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}\nSalon: ${booking.salonId.name}\n\nNo-Show-Gebühr: €${(feeAmount / 100).toFixed(2)}\nDie Gebühr wurde von Ihrer hinterlegten Kreditkarte abgebucht.\n\nBei Fragen kontaktieren Sie bitte:\n${booking.salonId.email} | ${booking.salonId.phone || ''}\n\nMit freundlichen Grüßen\n${booking.salonId.name}`,
          html: `
            <h2>No-Show-Gebühr wurde berechnet</h2>
            <p>Hallo ${booking.customerName},</p>
            <p>Sie sind nicht zu Ihrem Termin erschienen:</p>
            <ul>
              <li><strong>Termin:</strong> ${new Date(booking.bookingDate).toLocaleDateString('de-DE')} um ${new Date(booking.bookingDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</li>
              <li><strong>Salon:</strong> ${booking.salonId.name}</li>
            </ul>
            <p><strong>No-Show-Gebühr: €${(feeAmount / 100).toFixed(2)}</strong></p>
            <p>Die Gebühr wurde von Ihrer hinterlegten Kreditkarte abgebucht.</p>
            <p>Bei Fragen kontaktieren Sie bitte:<br>${booking.salonId.email}${booking.salonId.phone ? ` | ${booking.salonId.phone}` : ''}</p>
          `
        });

      } catch (error) {
        booking.noShowFee = {
          charged: false,
          error: error.message,
          attemptedAt: new Date()
        };

        logger.error(`❌ Failed to charge No-Show-Fee: ${error.message}`);

        // Notify salon about failed charge
        const emailService = (await import('../services/emailService.js')).default;
        await emailService.sendEmail({
          to: booking.salonId.email,
          subject: '⚠️ No-Show-Gebühr konnte nicht abgebucht werden',
          text: `Die No-Show-Gebühr für ${booking.customerName} (${booking.customerEmail}) konnte nicht abgebucht werden.\n\nGrund: ${error.message}\n\nBitte kontaktieren Sie den Kunden für manuelle Abrechnung.`,
          html: `<h2>⚠️ No-Show-Gebühr konnte nicht abgebucht werden</h2><p>Die No-Show-Gebühr für <strong>${booking.customerName}</strong> (${booking.customerEmail}) konnte nicht abgebucht werden.</p><p><strong>Grund:</strong> ${error.message}</p><p>Bitte kontaktieren Sie den Kunden für manuelle Abrechnung.</p>`
        });
      }
    } else if (booking.salonId?.noShowKiller?.enabled && !booking.paymentMethodId) {
      // No payment method available
      logger.warn(`⚠️ No payment method available for No-Show-Fee: Booking ${booking._id}`);
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Als No-Show markiert',
      feeCharged: feeCharged,
      booking: booking
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

    // ? TENANT ISOLATION CHECK
    if (req.user.role !== 'ceo' && booking.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Zugriff verweigert - Ressource gehört zu einem anderen Salon'
      });
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
        const stripeService = await import('../services/stripeService.js');
        const refund = await stripeService.refundNoShowFee(booking.noShowFee.chargeId);

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

    // Revert status
    booking.status = 'completed';
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
      filter.salonId = salonId;
    }

    const totalBookings = await Booking.countDocuments(filter);
    const confirmedBookings = await Booking.countDocuments({ ...filter, status: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ ...filter, status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ ...filter, status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ ...filter, status: 'completed' });

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings
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

// ==================== GET BOOKINGS BY DATE ====================

export const getBookingsByDate = async (req, res) => {
  try {
    const { date, salonId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Bitte geben Sie ein Datum an'
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let filter = {
      ...(req.tenantFilter || {}),
      bookingDate: { $gte: startDate, $lte: endDate }
    };

    // Optional salon filter for CEO only
    if (req.user?.role === 'ceo' && salonId) {
      filter.salonId = salonId;
    }

    // ? PAGINATION - single day should be reasonable, but limit for safety
    const limit = Math.min(500, parseInt(req.query.limit) || 500); // Max 500 bookings per day

    const bookings = await Booking.find(filter).lean().maxTimeMS(5000)
      .populate('serviceId', 'name duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
      // Warning if limit reached
      ...(bookings.length === limit && { warning: 'Ergebnislimit erreicht, einige Buchungen werden möglicherweise nicht angezeigt' })
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
  getBookingsByDate
};

