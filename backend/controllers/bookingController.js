import logger from '../utils/logger.js';
import cacheService from '../services/cacheService.js';
import mongoose from 'mongoose';
import timezoneHelpers from '../utils/timezoneHelpers.js';
import Salon from '../models/Salon.js';
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
        message: 'Please provide all required fields: salonId, serviceId, bookingDate, customerEmail'
      });
    }

    // ? SRE FIX #30: Idempotency check - prevent double bookings from double-clicks
    if (idempotencyKey) {
      const existingBooking = await Booking.findOne({ idempotencyKey });
      
      if (existingBooking) {
        logger.info(`?? Duplicate booking attempt detected: ${idempotencyKey}`);
        return res.status(200).json({
          success: true,
          message: 'Booking already exists',
          booking: existingBooking,
          duplicate: true
        });
      }
    }

    // Validate ObjectIds
    if (!isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
    }
    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID format' });
    }
    if (employeeId && !isValidObjectId(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID format' });
    }

    // ? AUDIT FIX: Parse and validate date with timezone support
    let parsedDate;
    
    // Support new { date, time } format OR legacy ISO string
    if (typeof bookingDate === 'object' && bookingDate.date && bookingDate.time) {
      // New format: { date: "2025-12-15", time: "14:00" }
      const salon = await Salon.findById(salonId);
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

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Use MongoDB transaction to prevent race condition (double booking)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ? HIGH FIX #8: Check salon capacity (prevent overbooking)
      const salon = await Salon.findById(salonId).session(session);
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
        logger.warn(`?? Capacity exceeded: ${concurrentBookings}/${maxConcurrentBookings} for salon ${salonId}`);
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
      }).session(session);

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

    let filter = {};

    // Filter by salon if not CEO
    if (req.user && req.user.role !== 'ceo') {
      filter.salonId = req.user.salonId || salonId;
    } else if (salonId) {
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
    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name price duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      limit,
      totalPages,
      bookings
    });
  } catch (error) {
    logger.error('GetBookings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
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
      .populate('serviceId')
      .populate('employeeId', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
      message: 'Internal Server Error'
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
    const booking = await Booking.findById(req.params.id);

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
        const salon = await Salon.findById(booking.salonId);
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
      message: 'Internal Server Error'
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

    const booking = await Booking.findById(req.params.id);

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
      message: 'Internal Server Error'
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

    const booking = await Booking.findById(req.params.id);

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
      message: 'Internal Server Error'
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

    const booking = await Booking.findById(req.params.id);

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
      message: 'Internal Server Error'
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

    const booking = await Booking.findById(req.params.id);

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
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET BOOKING STATS ====================

export const getBookingStats = async (req, res) => {
  try {
    const { salonId } = req.query;
    let filter = {};

    if (req.user && req.user.role !== 'ceo') {
      filter.salonId = req.user.salonId || salonId;
    } else if (salonId) {
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
      message: 'Internal Server Error'
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
        message: 'Please provide a date'
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let filter = {
      bookingDate: { $gte: startDate, $lte: endDate }
    };

    if (req.user && req.user.role !== 'ceo') {
      filter.salonId = req.user.salonId || salonId;
    } else if (salonId) {
      filter.salonId = salonId;
    }

    // ? PAGINATION - single day should be reasonable, but limit for safety
    const limit = Math.min(500, parseInt(req.query.limit) || 500); // Max 500 bookings per day

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: 1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
      // Warning if limit reached
      ...(bookings.length === limit && { warning: 'Result limit reached, some bookings may not be shown' })
    });
  } catch (error) {
    logger.error('GetBookingsByDate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
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
  deleteBooking,
  getBookingStats,
  getBookingsByDate
};
