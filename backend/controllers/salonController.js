/**
 * Salon Controller - MVP
 * Salon owner operations for their salon
 */

import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';

// ==================== GET SALON INFO ====================

export const getSalonInfo = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;

    const salon = await Salon.findById(salonId)
      .populate('owner', 'name email')
      .populate('services');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      salon
    });
  } catch (error) {
    console.error('GetSalonInfo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UPDATE SALON ====================

export const updateSalon = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;
    const { name, phone, address, description, openingHours } = req.body;

    const salon = await Salon.findByIdAndUpdate(
      salonId,
      { name, phone, address, description, openingHours },
      { new: true, runValidators: true }
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salon updated successfully',
      salon
    });
  } catch (error) {
    console.error('UpdateSalon Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SALON SERVICES ====================

export const getSalonServices = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;

    const services = await Service.find({ salonId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('GetSalonServices Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SALON BOOKINGS ====================

export const getSalonBookings = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;
    const { status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let filter = { salonId };

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
    const skip = (page - 1) * limit;

    const bookings = await Booking.find(filter)
      .populate('serviceId', 'name price duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      totalPages,
      bookings
    });
  } catch (error) {
    console.error('GetSalonBookings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SALON STATS ====================

export const getSalonStats = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;

    const totalBookings = await Booking.countDocuments({ salonId });
    const confirmedBookings = await Booking.countDocuments({ salonId, status: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ salonId, status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ salonId, status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ salonId, status: 'completed' });

    const totalServices = await Service.countDocuments({ salonId });

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        completedBookings,
        totalServices
      }
    });
  } catch (error) {
    console.error('GetSalonStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  getSalonInfo,
  updateSalon,
  getSalonServices,
  getSalonBookings,
  getSalonStats
};
