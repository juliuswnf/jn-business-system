import logger from '../utils/logger.js';
/**
 * CEO Controller - MVP Optimized
 * Essential CEO dashboard and salon management only
 */

import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import ErrorLog from '../models/ErrorLog.js';

// ==================== PRICING CONSTANTS ====================
const PRICING = {
  starter: 29,  // €29/Monat
  pro: 69       // €69/Monat
};

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
    logger.error('GetCEODashboard Error:', error);
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
    logger.error('GetSystemOverview Error:', error);
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
    logger.error('GetAllBusinesses Error:', error);
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
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
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
    logger.error('CreateBusiness Error:', error);
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
    logger.error('UpdateBusiness Error:', error);
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

    // Load salon to check existence
    const salon = await Salon.findById(businessId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // ? SOFT DELETE WITH CASCADE - preserves data and handles related records
    await salon.softDeleteWithCascade(req.user._id);

    logger.info(`Salon soft-deleted with cascade: ${salon.name} (ID: ${businessId}) by CEO ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Salon deleted successfully (soft delete with cascade)'
    });
  } catch (error) {
    logger.error('DeleteBusiness Error:', error);
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
    logger.error('SuspendBusiness Error:', error);
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
    logger.error('ReactivateBusiness Error:', error);
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
    logger.error('GetRevenueReport Error:', error);
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
    logger.error('GetSubscriptionInfo Error:', error);
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
    logger.error('GetSystemSettings Error:', error);
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
    logger.error('UpdateSystemSettings Error:', error);
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
    logger.error('GetCEOStatus Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CEO DASHBOARD STATS (NEW) ====================
// Für das neue CEO Dashboard mit Echtzeit-Daten
export const getCEOStats = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    // Gesamte Kunden (Salons/Unternehmen)
    const totalCustomers = await Salon.countDocuments();

    // Starter Abos (planId enthält 'starter' oder subscription.planId)
    const starterAbos = await Salon.countDocuments({
      'subscription.status': 'active',
      $or: [
        { 'subscription.planId': { $regex: /starter/i } },
        { 'subscription.planId': 'price_starter' },
        { isPremium: false, 'subscription.status': 'active' }
      ]
    });

    // Pro Abos
    const proAbos = await Salon.countDocuments({
      'subscription.status': 'active',
      $or: [
        { 'subscription.planId': { $regex: /pro|premium/i } },
        { 'subscription.planId': 'price_pro' },
        { isPremium: true }
      ]
    });

    // Trial Abos
    const trialAbos = await Salon.countDocuments({
      'subscription.status': 'trial'
    });

    // Berechne tatsächliche Starter/Pro basierend auf verfügbaren Daten
    const activeSalons = await Salon.find({ 'subscription.status': 'active' });
    let calculatedStarter = 0;
    let calculatedPro = 0;

    activeSalons.forEach(salon => {
      if (salon.isPremium || (salon.subscription?.planId && salon.subscription.planId.toLowerCase().includes('pro'))) {
        calculatedPro++;
      } else {
        calculatedStarter++;
      }
    });

    // Fallback: wenn keine planId gesetzt, alle aktiven als Starter zählen
    const finalStarter = calculatedStarter || starterAbos || (activeSalons.length - calculatedPro);
    const finalPro = calculatedPro || proAbos;

    // MRR Berechnung (Monthly Recurring Revenue)
    const totalRevenue = (finalStarter * PRICING.starter) + (finalPro * PRICING.pro);

    // Ungelöste Fehler
    const unresolvedErrors = await ErrorLog.countDocuments({ resolved: false });

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        starterAbos: finalStarter,
        proAbos: finalPro,
        trialAbos,
        totalRevenue,
        unresolvedErrors
      }
    });
  } catch (error) {
    logger.error('GetCEOStats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET ERROR LOGS ====================
export const getErrorLogs = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { resolved, type, limit = 50, page = 1 } = req.query;

    let filter = {};

    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }

    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;
    const total = await ErrorLog.countDocuments(filter);

    const errors = await ErrorLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('salonId', 'name')
      .populate('userId', 'name email')
      .populate('resolvedBy', 'name');

    res.status(200).json({
      success: true,
      count: errors.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      errors: errors.map(e => ({
        id: e._id,
        type: e.type,
        message: e.message,
        details: e.details,
        source: e.source,
        salon: e.salonId ? { id: e.salonId._id, name: e.salonId.name } : null,
        user: e.userId ? { id: e.userId._id, name: e.userId.name, email: e.userId.email } : null,
        resolved: e.resolved,
        resolvedAt: e.resolvedAt,
        resolvedBy: e.resolvedBy ? e.resolvedBy.name : null,
        resolutionNotes: e.resolutionNotes,
        timestamp: e.createdAt
      }))
    });
  } catch (error) {
    logger.error('GetErrorLogs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== RESOLVE ERROR ====================
export const resolveError = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { errorId } = req.params;
    const { notes } = req.body;

    const errorLog = await ErrorLog.findById(errorId);

    if (!errorLog) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    await errorLog.resolve(req.user._id, notes || '');

    res.status(200).json({
      success: true,
      message: 'Error marked as resolved',
      error: {
        id: errorLog._id,
        resolved: true,
        resolvedAt: errorLog.resolvedAt
      }
    });
  } catch (error) {
    logger.error('ResolveError Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== CREATE ERROR LOG (for testing/manual) ====================
export const createErrorLog = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { type, message, details, source, salonId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Error message is required'
      });
    }

    const errorLog = await ErrorLog.logError({
      type: type || 'error',
      message,
      details,
      source: source || 'system',
      salonId
    });

    res.status(201).json({
      success: true,
      message: 'Error log created',
      error: {
        id: errorLog._id,
        type: errorLog.type,
        message: errorLog.message,
        source: errorLog.source,
        timestamp: errorLog.createdAt
      }
    });
  } catch (error) {
    logger.error('CreateErrorLog Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET ALL CUSTOMERS (Unternehmen) ====================
export const getAllCustomers = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { status, plan, search, page = 1, limit = 20 } = req.query;

    let filter = {};

    // Filter by subscription status
    if (status === 'active') {
      filter['subscription.status'] = 'active';
    } else if (status === 'trial') {
      filter['subscription.status'] = 'trial';
    } else if (status === 'inactive') {
      filter['subscription.status'] = { $in: ['inactive', 'canceled', 'past_due'] };
    }

    // Filter by plan type
    if (plan === 'starter') {
      filter.$or = [
        { 'subscription.planId': { $regex: /starter/i } },
        { isPremium: false }
      ];
    } else if (plan === 'pro') {
      filter.$or = [
        { 'subscription.planId': { $regex: /pro|premium/i } },
        { isPremium: true }
      ];
    }

    // Search by name or email
    if (search) {
      const searchFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      filter = { ...filter, ...searchFilter };
    }

    const skip = (page - 1) * limit;
    const total = await Salon.countDocuments(filter);

    const customers = await Salon.find(filter)
      .populate('owner', 'name email')
      .select('name email phone address isActive isPremium subscription createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      customers: customers.map(c => {
        // Determine plan type
        let planType = 'starter';
        if (c.isPremium || (c.subscription?.planId && c.subscription.planId.toLowerCase().includes('pro'))) {
          planType = 'pro';
        }

        // Determine status
        let customerStatus = 'inactive';
        if (c.subscription?.status === 'active') {
          customerStatus = 'active';
        } else if (c.subscription?.status === 'trial') {
          customerStatus = 'trial';
        }

        return {
          id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          owner: c.owner ? { name: c.owner.name, email: c.owner.email } : null,
          plan: planType,
          status: customerStatus,
          isActive: c.isActive,
          subscription: c.subscription,
          since: c.createdAt
        };
      })
    });
  } catch (error) {
    logger.error('GetAllCustomers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET ALL SUBSCRIPTIONS FOR CEO DASHBOARD ====================
export const getCEOSubscriptions = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (status === 'active') {
      filter['subscription.status'] = 'active';
    } else if (status === 'trial') {
      filter['subscription.status'] = 'trial';
    }

    const skip = (page - 1) * limit;
    const total = await Salon.countDocuments(filter);

    const salons = await Salon.find(filter)
      .populate('owner', 'name email')
      .select('name email isPremium subscription createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate MRR
    let totalMRR = 0;

    const subscriptions = salons.map(s => {
      const isPro = s.isPremium || (s.subscription?.planId && s.subscription.planId.toLowerCase().includes('pro'));
      const planName = isPro ? 'Pro' : 'Starter';
      const amount = s.subscription?.status === 'active' ? (isPro ? PRICING.pro : PRICING.starter) : 0;

      if (s.subscription?.status === 'active') {
        totalMRR += amount;
      }

      // Calculate next billing date
      let nextBilling = null;
      if (s.subscription?.currentPeriodEnd) {
        nextBilling = s.subscription.currentPeriodEnd;
      } else if (s.subscription?.status === 'trial' && s.subscription?.trialEndsAt) {
        nextBilling = s.subscription.trialEndsAt;
      }

      return {
        id: s._id,
        customer: s.name,
        email: s.email,
        plan: planName,
        amount,
        status: s.subscription?.status || 'inactive',
        startDate: s.createdAt,
        nextBilling,
        stripeSubscriptionId: s.subscription?.stripeSubscriptionId
      };
    });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalMRR,
      subscriptions
    });
  } catch (error) {
    logger.error('GetCEOSubscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET ALL USERS ====================
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { role, search, page = 1, limit = 20 } = req.query;

    let filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select('name email role companyName isActive isBanned createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Count by role
    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const counts = {
      total: await User.countDocuments(),
      admins: 0,
      employees: 0,
      customers: 0,
      salon_owners: 0,
      ceo: 0
    };

    roleCounts.forEach(rc => {
      if (rc._id === 'admin') {counts.admins = rc.count;}
      else if (rc._id === 'employee') {counts.employees = rc.count;}
      else if (rc._id === 'customer') {counts.customers = rc.count;}
      else if (rc._id === 'salon_owner') {counts.salon_owners = rc.count;}
      else if (rc._id === 'ceo') {counts.ceo = rc.count;}
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      counts,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyName: u.companyName,
        isActive: u.isActive,
        banned: u.isBanned || false,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin
      }))
    });
  } catch (error) {
    logger.error('GetAllUsers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== BAN USER ====================
export const banUser = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'ceo') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban CEO user'
      });
    }

    user.isBanned = true;
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      user: {
        id: user._id,
        name: user.name,
        banned: true
      }
    });
  } catch (error) {
    logger.error('BanUser Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== UNBAN USER ====================
export const unbanUser = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - CEO only'
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = false;
    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully',
      user: {
        id: user._id,
        name: user.name,
        banned: false
      }
    });
  } catch (error) {
    logger.error('UnbanUser Error:', error);
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
  getCEOStatus,
  // New endpoints for real-time dashboard
  getCEOStats,
  getErrorLogs,
  resolveError,
  createErrorLog,
  getAllCustomers,
  getCEOSubscriptions,
  // User management
  getAllUsers,
  banUser,
  unbanUser
};
