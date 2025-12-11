import logger from '../utils/logger.js';
import cacheService from '../services/cacheService.js';
import mongoose from 'mongoose';
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
    const { salonId, serviceId, employeeId, bookingDate, customerName, customerEmail, customerPhone, notes } = req.body;

    if (!salonId || !serviceId || !bookingDate || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: salonId, serviceId, bookingDate, customerEmail'
      });
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

    // Validate and parse date
    const parsedDate = parseValidDate(bookingDate);
    if (!parsedDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
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
        status: 'pending'
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

    // Build update data with validation
    let updateData = { status, notes, updatedAt: Date.now() };
    
    if (bookingDate) {
      const parsedDate = parseValidDate(bookingDate);
      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      updateData.bookingDate = parsedDate;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('serviceId');

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
    logger.error('UpdateBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CONFIRM BOOKING ====================

export const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', confirmedAt: Date.now() },
      { new: true }
    ).populate('serviceId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking confirmed',
      booking
    });
  } catch (error) {
    logger.error('ConfirmBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CANCEL BOOKING ====================

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelledAt: Date.now() },
      { new: true }
    ).populate('serviceId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    logger.error('CancelBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== COMPLETE BOOKING ====================

export const completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: Date.now() },
      { new: true }
    ).populate('serviceId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking completed',
      booking
    });
  } catch (error) {
    logger.error('CompleteBooking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DELETE BOOKING ====================

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted'
    });
  } catch (error) {
    logger.error('DeleteBooking Error:', error);
    res.status(500).json({
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

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
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
