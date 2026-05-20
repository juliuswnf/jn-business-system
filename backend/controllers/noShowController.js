import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import {
  sendReminder,
  parseConfirmationToken,
  hashConfirmationToken
} from '../services/reminderService.js';

const NO_SHOW_SETTING_KEYS = ['enabled72h', 'enabled24h', 'enabled2h'];

const getDefaultNoShowSettings = () => {
  return {
    reminders: {
      enabled72h: true,
      enabled24h: true,
      enabled2h: true
    },
    autoMarkNoShowAfterMinutes: 30,
    highRiskThreshold: 3,
    depositPercentage: 30
  };
};

const normalizeNoShowSettings = (settingsInput = {}) => {
  const defaults = getDefaultNoShowSettings();
  const remindersInput = settingsInput.reminders || {};

  return {
    reminders: {
      enabled72h: remindersInput.enabled72h !== false,
      enabled24h: remindersInput.enabled24h !== false,
      enabled2h: remindersInput.enabled2h !== false
    },
    autoMarkNoShowAfterMinutes: Number(settingsInput.autoMarkNoShowAfterMinutes) || defaults.autoMarkNoShowAfterMinutes,
    highRiskThreshold: Number(settingsInput.highRiskThreshold) || defaults.highRiskThreshold,
    depositPercentage: Number(settingsInput.depositPercentage) || defaults.depositPercentage
  };
};

const resolveScope = (req, { requireSalon = false } = {}) => {
  const role = req.user?.role;

  if (role === 'ceo') {
    const rawSalonId = typeof req.query.salonId === 'string' ? req.query.salonId.trim() : '';

    if (!rawSalonId) {
      if (requireSalon) {
        return { error: { status: 400, message: 'salonId query parameter is required for CEO scope' } };
      }
      return {
        filter: {},
        aggregateFilter: {},
        salonId: null
      };
    }

    if (!mongoose.isValidObjectId(rawSalonId)) {
      return { error: { status: 400, message: 'Invalid salonId' } };
    }

    const scopedSalonId = new mongoose.Types.ObjectId(rawSalonId);
    return {
      filter: { salonId: scopedSalonId },
      aggregateFilter: { salonId: scopedSalonId },
      salonId: scopedSalonId
    };
  }

  const trustedSalonId = req.user?.salonId;
  if (!trustedSalonId) {
    return { error: { status: 400, message: 'Missing salon context' } };
  }

  return {
    filter: { salonId: trustedSalonId },
    aggregateFilter: { salonId: new mongoose.Types.ObjectId(trustedSalonId) },
    salonId: trustedSalonId
  };
};

const canManageNoShowSettings = (role) => ['salon_owner', 'ceo'].includes(role);

const parseRangeDate = (rawDate, fallback) => {
  if (!rawDate) {
    return fallback;
  }

  const parsed = new Date(rawDate);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const sanitizeBookingSummary = (booking) => {
  if (!booking) {
    return null;
  }

  return {
    id: booking._id,
    status: booking.status,
    confirmationStatus: booking.confirmationStatus,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    bookingDate: booking.bookingDate,
    noShowMarkedAt: booking.noShowMarkedAt,
    service: booking.serviceId?.name ? { name: booking.serviceId.name } : undefined,
    salon: booking.salonId?.name ? { name: booking.salonId.name } : undefined
  };
};

export const getNoShowDashboard = async (req, res) => {
  try {
    const scope = resolveScope(req);
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let highRiskThreshold = 3;
    if (scope.salonId) {
      const salon = await Salon.findById(scope.salonId).select('noShowSettings').maxTimeMS(5000);
      const normalizedSettings = normalizeNoShowSettings(salon?.noShowSettings || {});
      highRiskThreshold = normalizedSettings.highRiskThreshold;
    }

    const [
      noShowsThisMonth,
      pendingConfirmations,
      highRiskCustomers,
      depositRequiredUpcoming,
      recentNoShows
    ] = await Promise.all([
      Booking.countDocuments({
        ...scope.filter,
        status: 'no_show',
        bookingDate: { $gte: monthStart, $lte: now }
      }).maxTimeMS(5000),
      Booking.countDocuments({
        ...scope.filter,
        status: 'confirmed',
        confirmationStatus: { $in: ['pending', null] },
        bookingDate: { $gte: now }
      }).maxTimeMS(5000),
      Customer.countDocuments({
        ...scope.filter,
        noShowScore: { $gte: highRiskThreshold }
      }).maxTimeMS(5000),
      Booking.countDocuments({
        ...scope.filter,
        status: { $in: ['pending', 'booked', 'confirmed'] },
        bookingDate: { $gte: now },
        depositRequired: true
      }).maxTimeMS(5000),
      Booking.find({
        ...scope.filter,
        status: 'no_show'
      })
        .sort({ noShowMarkedAt: -1, bookingDate: -1 })
        .limit(10)
        .select('customerName bookingDate noShowMarkedAt serviceId')
        .populate('serviceId', 'name')
        .lean()
        .maxTimeMS(5000)
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        noShowsThisMonth,
        pendingConfirmations,
        highRiskCustomers,
        depositRequiredUpcoming,
        highRiskThreshold,
        recentNoShows: recentNoShows.map((booking) => ({
          id: booking._id,
          customerName: booking.customerName,
          bookingDate: booking.bookingDate,
          noShowMarkedAt: booking.noShowMarkedAt,
          serviceName: booking.serviceId?.name || 'Service'
        }))
      }
    });
  } catch (error) {
    logger.error('getNoShowDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getNoShowRisk = async (req, res) => {
  try {
    const scope = resolveScope(req);
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    let threshold = parseInt(req.query.threshold, 10);

    if (!Number.isFinite(threshold)) {
      if (scope.salonId) {
        const salon = await Salon.findById(scope.salonId).select('noShowSettings').maxTimeMS(5000);
        const normalizedSettings = normalizeNoShowSettings(salon?.noShowSettings || {});
        threshold = normalizedSettings.highRiskThreshold;
      } else {
        threshold = 3;
      }
    }

    threshold = Math.min(20, Math.max(1, threshold));

    const customers = await Customer.find({
      ...scope.filter,
      noShowScore: { $gte: threshold }
    })
      .sort({ noShowScore: -1, totalNoShows: -1, updatedAt: -1 })
      .limit(limit)
      .select('firstName lastName email phone noShowScore totalNoShows totalBookings lastVisit noShowHistory')
      .lean()
      .maxTimeMS(5000);

    return res.status(200).json({
      success: true,
      threshold,
      count: customers.length,
      customers: customers.map((customer) => ({
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        noShowScore: customer.noShowScore || 0,
        totalNoShows: customer.totalNoShows || 0,
        totalBookings: customer.totalBookings || 0,
        lastVisit: customer.lastVisit,
        riskLevel: (customer.noShowScore || 0) >= (threshold + 3) ? 'high' : 'medium'
      }))
    });
  } catch (error) {
    logger.error('getNoShowRisk error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const sendManualReminder = async (req, res) => {
  try {
    const rawBookingId = req.params.bookingId;
    if (!mongoose.isValidObjectId(rawBookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const scope = resolveScope(req);
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const bookingFilter = { _id: new mongoose.Types.ObjectId(rawBookingId) };
    if (scope.filter.salonId) {
      bookingFilter.salonId = scope.filter.salonId;
    }

    const booking = await Booking.findOne(bookingFilter).maxTimeMS(5000);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot receive reminders in current status' });
    }

    const allowedReminderTypes = ['72h', '24h', '2h', 'manual'];
    const requestedType = typeof req.body?.type === 'string' ? req.body.type : 'manual';
    const reminderType = allowedReminderTypes.find((item) => item === requestedType) || 'manual';

    const result = await sendReminder(booking._id, reminderType);
    if (!result.sent) {
      return res.status(400).json({
        success: false,
        message: 'No delivery channel available for this booking'
      });
    }

    await Booking.updateOne(
      { _id: booking._id },
      {
        $push: {
          remindersSent: {
            type: reminderType,
            sentAt: new Date(),
            channel: result.channel || 'email'
          }
        }
      }
    ).maxTimeMS(5000);

    return res.status(200).json({
      success: true,
      message: 'Manual reminder sent',
      reminder: {
        type: reminderType,
        channel: result.channel
      }
    });
  } catch (error) {
    logger.error('sendManualReminder error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const markBookingNoShow = async (req, res) => {
  try {
    const rawBookingId = req.params.bookingId;
    if (!mongoose.isValidObjectId(rawBookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingId' });
    }

    const scope = resolveScope(req);
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const bookingFilter = { _id: new mongoose.Types.ObjectId(rawBookingId) };
    if (scope.filter.salonId) {
      bookingFilter.salonId = scope.filter.salonId;
    }

    const booking = await Booking.findOne(bookingFilter).maxTimeMS(5000);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'no_show') {
      return res.status(200).json({
        success: true,
        message: 'Booking already marked as no-show',
        booking: sanitizeBookingSummary(booking)
      });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark cancelled/completed booking as no-show'
      });
    }

    const now = new Date();
    booking.status = 'no_show';
    booking.confirmationStatus = 'no_response';
    booking.noShowMarkedAt = now;
    await booking.save();

    if (booking.customerId) {
      await Customer.updateOne(
        { _id: booking.customerId },
        {
          $inc: {
            noShowScore: 1,
            noShowCount: 1,
            totalNoShows: 1
          },
          $push: {
            noShowHistory: {
              bookingId: booking._id,
              date: now
            }
          }
        }
      ).maxTimeMS(5000);
    }

    return res.status(200).json({
      success: true,
      message: 'Booking marked as no-show',
      booking: sanitizeBookingSummary(booking)
    });
  } catch (error) {
    logger.error('markBookingNoShow error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const confirmBookingByToken = async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    const parsedToken = parseConfirmationToken(token);

    if (!parsedToken) {
      return res.status(400).json({ success: false, message: 'Invalid confirmation token' });
    }

    if (parsedToken.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ success: false, message: 'Confirmation token expired' });
    }

    const hashedToken = hashConfirmationToken(token);

    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(parsedToken.bookingId),
      confirmationToken: hashedToken,
      confirmationTokenExpiry: { $gt: new Date() }
    })
      .select('+confirmationToken')
      .populate('salonId', 'name')
      .populate('serviceId', 'name')
      .maxTimeMS(5000);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Token invalid, expired, or already used'
      });
    }

    if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Booking can no longer be confirmed'
      });
    }

    if (booking.status === 'pending' || booking.status === 'booked') {
      booking.status = 'confirmed';
    }

    booking.confirmationStatus = 'confirmed';
    booking.confirmedAt = new Date();
    booking.confirmationToken = null;
    booking.confirmationTokenExpiry = null;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking: sanitizeBookingSummary(booking)
    });
  } catch (error) {
    logger.error('confirmBookingByToken error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getNoShowSettings = async (req, res) => {
  try {
    if (!canManageNoShowSettings(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const scope = resolveScope(req, { requireSalon: true });
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const salon = await Salon.findById(scope.salonId)
      .select('name noShowSettings')
      .maxTimeMS(5000);

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const settings = normalizeNoShowSettings(salon.noShowSettings || {});

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    logger.error('getNoShowSettings error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateNoShowSettings = async (req, res) => {
  try {
    if (!canManageNoShowSettings(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.body?.salonId !== undefined) {
      return res.status(400).json({ success: false, message: 'salonId in request body is not allowed' });
    }

    const scope = resolveScope(req, { requireSalon: true });
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const salon = await Salon.findById(scope.salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const current = normalizeNoShowSettings(salon.noShowSettings || {});
    const payload = req.body || {};

    const nextSettings = {
      reminders: { ...current.reminders },
      autoMarkNoShowAfterMinutes: current.autoMarkNoShowAfterMinutes,
      highRiskThreshold: current.highRiskThreshold,
      depositPercentage: current.depositPercentage
    };

    if (payload.reminders !== undefined) {
      if (!payload.reminders || typeof payload.reminders !== 'object' || Array.isArray(payload.reminders)) {
        return res.status(400).json({ success: false, message: 'Invalid reminders payload' });
      }

      for (const key of NO_SHOW_SETTING_KEYS) {
        if (payload.reminders[key] !== undefined) {
          nextSettings.reminders[key] = Boolean(payload.reminders[key]);
        }
      }
    }

    if (payload.autoMarkNoShowAfterMinutes !== undefined) {
      const minutes = Number(payload.autoMarkNoShowAfterMinutes);
      if (!Number.isFinite(minutes) || minutes < 5 || minutes > 240) {
        return res.status(400).json({
          success: false,
          message: 'autoMarkNoShowAfterMinutes must be between 5 and 240'
        });
      }
      nextSettings.autoMarkNoShowAfterMinutes = Math.round(minutes);
    }

    if (payload.highRiskThreshold !== undefined) {
      const threshold = Number(payload.highRiskThreshold);
      if (!Number.isFinite(threshold) || threshold < 1 || threshold > 20) {
        return res.status(400).json({
          success: false,
          message: 'highRiskThreshold must be between 1 and 20'
        });
      }
      nextSettings.highRiskThreshold = Math.round(threshold);
    }

    if (payload.depositPercentage !== undefined) {
      const percentage = Number(payload.depositPercentage);
      if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({
          success: false,
          message: 'depositPercentage must be between 0 and 100'
        });
      }
      nextSettings.depositPercentage = Math.round(percentage);
    }

    salon.noShowSettings = nextSettings;
    await salon.save();

    return res.status(200).json({
      success: true,
      message: 'No-show settings updated',
      settings: normalizeNoShowSettings(salon.noShowSettings || {})
    });
  } catch (error) {
    logger.error('updateNoShowSettings error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getNoShowAnalytics = async (req, res) => {
  try {
    if (!canManageNoShowSettings(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const scope = resolveScope(req);
    if (scope.error) {
      return res.status(scope.error.status).json({ success: false, message: scope.error.message });
    }

    const now = new Date();
    const defaultFromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const fromDate = parseRangeDate(req.query.from, defaultFromDate);
    const toDate = parseRangeDate(req.query.to, now);

    if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const dateFilter = { bookingDate: { $gte: fromDate, $lte: toDate } };
    const findFilter = { ...scope.filter, ...dateFilter };
    const aggregateMatch = { ...scope.aggregateFilter, ...dateFilter };

    const [statusCounts, dailyTrend, noShowRevenue, topRiskCustomers] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            ...aggregateMatch,
            status: { $in: ['completed', 'no_show'] }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).maxTimeMS(5000),
      Booking.aggregate([
        {
          $match: {
            ...aggregateMatch,
            status: { $in: ['completed', 'no_show'] }
          }
        },
        {
          $project: {
            day: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$bookingDate'
              }
            },
            isNoShow: {
              $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0]
            },
            isCompleted: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          }
        },
        {
          $group: {
            _id: '$day',
            noShows: { $sum: '$isNoShow' },
            completed: { $sum: '$isCompleted' },
            total: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).maxTimeMS(5000),
      Booking.aggregate([
        {
          $match: {
            ...aggregateMatch,
            status: 'no_show',
            'noShowFee.charged': true
          }
        },
        {
          $group: {
            _id: null,
            totalCents: { $sum: '$noShowFee.amount' }
          }
        }
      ]).maxTimeMS(5000),
      Customer.find({
        ...scope.filter,
        noShowScore: { $gte: 1 }
      })
        .sort({ noShowScore: -1, totalNoShows: -1 })
        .limit(10)
        .select('firstName lastName noShowScore totalNoShows')
        .lean()
        .maxTimeMS(5000)
    ]);

    const counts = {
      completed: 0,
      no_show: 0
    };

    for (const item of statusCounts) {
      if (item._id === 'completed' || item._id === 'no_show') {
        counts[item._id] = item.count;
      }
    }

    const totalRelevantBookings = counts.completed + counts.no_show;
    const noShowRate = totalRelevantBookings > 0
      ? Number(((counts.no_show / totalRelevantBookings) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      range: {
        from: fromDate,
        to: toDate
      },
      overview: {
        totalRelevantBookings,
        completedBookings: counts.completed,
        noShows: counts.no_show,
        noShowRate,
        protectedRevenueCents: noShowRevenue[0]?.totalCents || 0
      },
      dailyTrend: dailyTrend.map((entry) => ({
        day: entry._id,
        total: entry.total,
        noShows: entry.noShows,
        completed: entry.completed,
        noShowRate: entry.total > 0 ? Number(((entry.noShows / entry.total) * 100).toFixed(2)) : 0
      })),
      topRiskCustomers: topRiskCustomers.map((customer) => ({
        id: customer._id,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        noShowScore: customer.noShowScore || 0,
        totalNoShows: customer.totalNoShows || 0
      }))
    });
  } catch (error) {
    logger.error('getNoShowAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getNoShowDashboard,
  getNoShowRisk,
  sendManualReminder,
  markBookingNoShow,
  confirmBookingByToken,
  getNoShowSettings,
  updateNoShowSettings,
  getNoShowAnalytics
};
