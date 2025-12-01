/**
 * CEO Controller - MVP Optimized
 * Essential CEO dashboard and salon management only
 */

import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// ==================== GET CEO DASHBOARD ====================

export const getCEODashboard = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const totalSalons = await Salon.countDocuments();
    const activeSalons = await Salon.countDocuments({ isActive: true });
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    // Active subscriptions (trial or paid)
    const activeSubscriptions = await Salon.countDocuments({
      'subscription.status': { $in: ['trial', 'active'] }
    });

    // Trial subscriptions
    const trialSubscriptions = await Salon.countDocuments({
      'subscription.status': 'trial'
    });

    // Recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('salonId', 'name slug')
      .populate('serviceId', 'name');

    res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          totalSalons,
          activeSalons,
          totalBookings,
          confirmedBookings,
          activeSubscriptions,
          trialSubscriptions
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('GetCEODashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SYSTEM OVERVIEW ====================

export const getSystemOverview = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const totalSalons = await Salon.countDocuments();
    const activeSalons = await Salon.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalSalons,
        activeSalons,
        totalUsers,
        totalBookings,
        bookingsByStatus
      }
    });
  } catch (error) {
    console.error('GetSystemOverview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET ALL BUSINESSES (Salons) ====================

export const getAllBusinesses = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    
    let filter = {};
    if (status) {
      filter['subscription.status'] = status;
    }

    const skip = (page - 1) * limit;
    const total = await Salon.countDocuments(filter);

    const salons = await Salon.find(filter)
      .populate('owner', 'name email')
      .select('name slug email phone address isActive subscription createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: salons.length,
      total,
      page: parseInt(page),
      totalPages,
      businesses: salons
    });
  } catch (error) {
    console.error('GetAllBusinesses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CREATE BUSINESS (Salon) ====================

export const createBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { name, email, phone, address, ownerEmail, ownerName, ownerPassword } = req.body;

    if (!name || !email || !ownerEmail || !ownerName || !ownerPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create owner user
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      role: 'salon_owner'
    });

    // Create salon
    const salon = await Salon.create({
      name,
      email,
      phone,
      address,
      owner: owner._id,
      isActive: true,
      subscription: {
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      }
    });

    res.status(201).json({
      success: true,
      message: 'Salon created successfully',
      salon,
      owner: {
        name: owner.name,
        email: owner.email
      }
    });
  } catch (error) {
    console.error('CreateBusiness Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UPDATE BUSINESS (Salon) ====================

export const updateBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { businessId } = req.params;
    const { name, email, phone, address } = req.body;

    const salon = await Salon.findByIdAndUpdate(
      businessId,
      { name, email, phone, address },
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
    console.error('UpdateBusiness Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DELETE BUSINESS (Salon) ====================

export const deleteBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { businessId } = req.params;

    const salon = await Salon.findByIdAndDelete(businessId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salon deleted successfully'
    });
  } catch (error) {
    console.error('DeleteBusiness Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== SUSPEND BUSINESS ====================

export const suspendBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { businessId } = req.params;

    const salon = await Salon.findByIdAndUpdate(
      businessId,
      { isActive: false },
      { new: true }
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salon suspended successfully',
      salon
    });
  } catch (error) {
    console.error('SuspendBusiness Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== REACTIVATE BUSINESS ====================

export const reactivateBusiness = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { businessId } = req.params;

    const salon = await Salon.findByIdAndUpdate(
      businessId,
      { isActive: true },
      { new: true }
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Salon reactivated successfully',
      salon
    });
  } catch (error) {
    console.error('ReactivateBusiness Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET REVENUE REPORT ====================

export const getRevenueReport = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalBookings = await Booking.countDocuments({
      ...dateFilter,
      status: 'confirmed'
    });

    const salonRevenue = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$salonId',
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'salons',
          localField: '_id',
          foreignField: '_id',
          as: 'salon'
        }
      },
      {
        $unwind: '$salon'
      },
      {
        $project: {
          salonName: '$salon.name',
          bookingCount: 1
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      report: {
        totalBookings,
        topSalons: salonRevenue
      }
    });
  } catch (error) {
    console.error('GetRevenueReport Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SUBSCRIPTION INFO ====================

export const getSubscriptionInfo = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const totalSalons = await Salon.countDocuments();
    const activeSubscriptions = await Salon.countDocuments({
      'subscription.status': 'active'
    });
    const trialSubscriptions = await Salon.countDocuments({
      'subscription.status': 'trial'
    });
    const inactiveSubscriptions = await Salon.countDocuments({
      'subscription.status': { $in: ['inactive', 'canceled', 'past_due'] }
    });

    res.status(200).json({
      success: true,
      subscriptions: {
        total: totalSalons,
        active: activeSubscriptions,
        trial: trialSubscriptions,
        inactive: inactiveSubscriptions
      }
    });
  } catch (error) {
    console.error('GetSubscriptionInfo Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET SYSTEM SETTINGS ====================

export const getSystemSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    // Simple MVP settings
    const settings = {
      trialPeriodDays: 14,
      maxSalonsPerOwner: 1,
      emailNotificationsEnabled: true
    };

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('GetSystemSettings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UPDATE SYSTEM SETTINGS ====================

export const updateSystemSettings = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { trialPeriodDays, emailNotificationsEnabled } = req.body;

    // In MVP, we just acknowledge the update
    // In production, save to database

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        trialPeriodDays,
        emailNotificationsEnabled
      }
    });
  } catch (error) {
    console.error('UpdateSystemSettings Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CEO STATUS ====================
// Für System-Überwachung
export const getCEOStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    res.status(200).json({
      success: true,
      status: 'Online',
      version: '2.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('GetCEOStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  getCEODashboard,
  getSystemOverview,
  getAllBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  suspendBusiness,
  reactivateBusiness,
  getRevenueReport,
  getSubscriptionInfo,
  getSystemSettings,
  updateSystemSettings,
  getCEOStatus
};
