import logger from '../utils/logger.js';
import mongoose from 'mongoose';
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
    logger.error('GetSalonInfo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UPDATE SALON ====================

// ? HIGH FIX #11: Allowed fields whitelist (prevent subscription manipulation)
const ALLOWED_SALON_FIELDS = [
  'name', 'email', 'phone', 'address', 'description', 'openingHours',
  'businessHours', 'googleReviewUrl', 'defaultLanguage', 'timezone',
  'emailTemplates', 'settings', 'logo', 'cover', 'social'
];

export const updateSalon = async (req, res) => {
  try {
    const salonId = req.params.salonId || req.user.salonId;

    // Load salon first
    const salon = await Salon.findById(salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // ? HIGH FIX #11: Only update whitelisted fields
    const updateData = {};
    for (const field of ALLOWED_SALON_FIELDS) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Apply updates
    Object.assign(salon, updateData);
    await salon.save();

    logger.log(`? Salon updated: ${salon.name} (ID: ${salonId})`);

    res.status(200).json({
      success: true,
      message: 'Salon updated successfully',
      salon
    });
  } catch (error) {
    logger.error('UpdateSalon Error:', error);
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

    // ? PAGINATION - prevent unbounded queries (DoS protection)
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)); // Default 50, max 100
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const total = await Service.countDocuments({ salonId });

    const services = await Service.find({ salonId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: services.length,
      services,
      // ? Pagination metadata
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + services.length < total
      }
    });
  } catch (error) {
    logger.error('GetSalonServices Error:', error);
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
    logger.error('GetSalonBookings Error:', error);
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
    logger.error('GetSalonStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SALON DASHBOARD ====================

export const getSalonDashboard = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'No salon associated with this user'
      });
    }

    // Get salon info
    const salon = await Salon.findById(salonId)
      .populate('owner', 'name email')
      .populate('services');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      salonId,
      bookingDate: { $gte: today, $lt: tomorrow }
    });

    // Get upcoming bookings (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await Booking.countDocuments({
      salonId,
      bookingDate: { $gte: today, $lt: nextWeek },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Get stats
    const totalBookings = await Booking.countDocuments({ salonId });
    const totalServices = await Service.countDocuments({ salonId });
    const completedBookings = await Booking.countDocuments({ salonId, status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ salonId, status: 'cancelled' });

    // Get revenue (sum of completed bookings)
    const revenueData = await Booking.aggregate([
      { $match: { salonId: new mongoose.Types.ObjectId(salonId), status: 'completed' } },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      { $group: { _id: null, totalRevenue: { $sum: '$service.price' } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Calculate booking limits for Starter plan
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const bookingsThisMonth = await Booking.countDocuments({
      salonId,
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'cancelled' }
    });

    const planId = (salon.subscription?.planId || '').toLowerCase();
    const isPro = planId.includes('pro');
    const isStarter = !isPro && salon.subscription?.status !== 'trial';
    const isTrial = salon.subscription?.status === 'trial';

    let bookingLimits = null;
    if (!isPro) {
      const limit = isTrial ? 50 : 100;
      bookingLimits = {
        used: bookingsThisMonth,
        limit,
        remaining: Math.max(0, limit - bookingsThisMonth),
        percentUsed: Math.round((bookingsThisMonth / limit) * 100),
        planType: isTrial ? 'trial' : 'starter'
      };
    }

    // Get recent bookings
    const recentBookings = await Booking.find({ salonId })
      .populate('serviceId', 'name price')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      dashboard: {
        salon,
        stats: {
          todayBookings,
          upcomingBookings,
          totalBookings,
          totalServices,
          completedBookings,
          cancelledBookings,
          totalRevenue
        },
        recentBookings,
        bookingLimits,
        subscription: {
          status: salon.subscription?.status || 'none',
          planId: salon.subscription?.planId,
          trialEndsAt: salon.subscription?.trialEndsAt,
          isPro
        }
      }
    });
  } catch (error) {
    logger.error('GetSalonDashboard Error:', error);
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
  getSalonStats,
  getSalonDashboard
};
