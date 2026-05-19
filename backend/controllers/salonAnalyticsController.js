/**
 * Salon Analytics Controller
 * Provides success metrics and KPIs for salon owners
 * Shows them the value they get from JN Business System
 */

import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const resolveScopedSalonId = (req, res) => {
  if (req.user?.role === 'ceo') {
    const rawSalonId = req.query?.salonId || req.params?.salonId;
    if (!rawSalonId) {
      res.status(400).json({ success: false, message: 'salonId query parameter is required for CEO analytics' });
      return null;
    }
    if (!mongoose.isValidObjectId(rawSalonId)) {
      res.status(400).json({ success: false, message: 'Invalid salonId format' });
      return null;
    }
    return new mongoose.Types.ObjectId(rawSalonId);
  }

  if (!req.user?.salonId) {
    res.status(400).json({ success: false, message: 'No salon associated with user' });
    return null;
  }

  if (!mongoose.isValidObjectId(req.user.salonId)) {
    res.status(400).json({ success: false, message: 'Invalid authenticated salonId' });
    return null;
  }

  return new mongoose.Types.ObjectId(req.user.salonId);
};

const resolveTrendRange = (req, res, period) => {
  const rawStartDate = req.query?.startDate;
  const rawEndDate = req.query?.endDate;

  if (rawStartDate || rawEndDate) {
    if (typeof rawStartDate !== 'string' || typeof rawEndDate !== 'string') {
      res.status(400).json({ success: false, message: 'startDate and endDate must be strings in YYYY-MM-DD format' });
      return null;
    }

    const startDate = new Date(rawStartDate);
    const endDate = new Date(rawEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid startDate or endDate format' });
      return null;
    }

    if (endDate < startDate) {
      res.status(400).json({ success: false, message: 'endDate must be greater than or equal to startDate' });
      return null;
    }

    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      res.status(400).json({ success: false, message: 'Date range cannot exceed 1 year' });
      return null;
    }

    return { startDate, groupBy: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, normalizedPeriod: 'custom' };
  }

  const now = new Date();
  switch (period) {
  case '7d':
    return {
      startDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
      groupBy: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      normalizedPeriod: period
    };
  case '30d':
    return {
      startDate: new Date(now - 30 * 24 * 60 * 60 * 1000),
      groupBy: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      normalizedPeriod: period
    };
  case '90d':
    return {
      startDate: new Date(now - 90 * 24 * 60 * 60 * 1000),
      groupBy: { $dateToString: { format: '%Y-%W', date: '$createdAt' } },
      normalizedPeriod: period
    };
  case '1y':
  default:
    return {
      startDate: new Date(now - 365 * 24 * 60 * 60 * 1000),
      groupBy: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      normalizedPeriod: '1y'
    };
  }
};

// ==================== GET SALON METRICS OVERVIEW ====================
export const getMetricsOverview = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res);
    if (!salonId) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Run all count queries in parallel
    const [
      thisMonthBookings,
      lastMonthBookings,
      thisWeekBookings,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      noShowBookings
    ] = await Promise.all([
      Booking.countDocuments({ salonId, createdAt: { $gte: startOfMonth } }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, createdAt: { $gte: startOfWeek } }).maxTimeMS(10000),
      Booking.countDocuments({ salonId }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, status: 'confirmed' }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, status: 'cancelled' }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, status: 'completed' }).maxTimeMS(10000),
      Booking.countDocuments({ salonId, status: 'no_show' }).maxTimeMS(10000)
    ]);

    // Revenue calculation
    const revenueAggregation = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      { $limit: 1 }
    ]).maxTimeMS(10000);
    const totalRevenue = revenueAggregation[0]?.total || 0;

    // This month revenue
    const thisMonthRevenueAgg = await Booking.aggregate([
      {
        $match: {
          salonId: salonId,
          status: { $in: ['confirmed', 'completed'] },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      { $limit: 1 }
    ]).maxTimeMS(10000);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;

    // Unique customers
    const uniqueCustomers = await Booking.distinct('customerEmail', { salonId }).maxTimeMS(10000);
    const totalCustomers = uniqueCustomers.length;

    // New customers this month
    const newCustomersThisMonth = await Booking.distinct('customerEmail', {
      salonId,
      createdAt: { $gte: startOfMonth }
    }).maxTimeMS(10000);

    // Calculate averages
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const bookingGrowth = lastMonthBookings > 0
      ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : thisMonthBookings > 0 ? 100 : 0;

    // No-show rate (no_show status / total)
    const noShowRate = totalBookings > 0
      ? Math.round((noShowBookings / totalBookings) * 100)
      : 0;

    // Time saved estimate (average 5 min per phone booking)
    const timeSavedMinutes = totalBookings * 5;
    const timeSavedHours = Math.round(timeSavedMinutes / 60);

    res.status(200).json({
      success: true,
      metrics: {
        // Booking stats
        totalBookings,
        thisMonthBookings,
        lastMonthBookings,
        thisWeekBookings,
        bookingGrowth,

        // Status breakdown
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        noShowRate,

        // Revenue
        totalRevenue,
        thisMonthRevenue,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,

        // Customers
        totalCustomers,
        newCustomersThisMonth: newCustomersThisMonth.length,

        // Value metrics
        timeSavedHours,
        timeSavedMinutes
      }
    });
  } catch (error) {
    logger.error('GetMetricsOverview Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET BOOKING TRENDS ====================
export const getBookingTrends = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res);
    const { period = '30d' } = req.query;

    if (!salonId) return;

    const trendRange = resolveTrendRange(req, res, period);
    if (!trendRange) return;
    const { startDate, groupBy, normalizedPeriod } = trendRange;

    const trendLimitByPeriod = {
      '7d': 8,
      '30d': 31,
      '90d': 14,
      '1y': 13
    };

    const bookingTrend = await Booking.aggregate([
      { $match: { salonId: salonId, createdAt: { $gte: startDate } } },
      { $group: {
        _id: groupBy,
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }},
      { $sort: { _id: 1 } },
      { $limit: Math.min(trendLimitByPeriod[normalizedPeriod] || 31, 10000) }
    ]).maxTimeMS(10000);

    res.status(200).json({
      success: true,
      period: normalizedPeriod,
      data: bookingTrend.map(item => ({
        date: item._id,
        bookings: item.bookings,
        revenue: item.revenue || 0
      }))
    });
  } catch (error) {
    logger.error('GetBookingTrends Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET TOP SERVICES ====================
export const getTopServices = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res);
    const { limit = 5 } = req.query;

    if (!salonId) return;

    const parsedLimit = Number.parseInt(String(limit), 10);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 5;

    const topServices = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: '$serviceId',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }},
      { $sort: { bookings: -1 } },
      { $limit: safeLimit },
      { $lookup: {
        from: 'services',
        let: {
          serviceId: '$_id',
          bookingSalonId: salonId
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$_id', '$$serviceId'] },
                  { $eq: ['$salonId', '$$bookingSalonId'] }
                ]
              }
            }
          },
          { $project: { name: 1 } }
        ],
        as: 'service'
      }},
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } }
    ]).maxTimeMS(10000);

    res.status(200).json({
      success: true,
      services: topServices.map(item => ({
        id: item._id,
        name: item.service?.name || 'Unbekannt',
        bookings: item.bookings,
        revenue: item.revenue || 0,
        percentage: 0 // Will be calculated on frontend
      }))
    });
  } catch (error) {
    logger.error('GetTopServices Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET PEAK HOURS ====================
export const getPeakHours = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res);
    if (!salonId) return;

    // Get booking distribution by hour
    const hourlyDistribution = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: { $hour: '$bookingDate' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 24 }
    ]).maxTimeMS(10000);

    // Get booking distribution by day of week
    const dailyDistribution = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: { $dayOfWeek: '$bookingDate' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]).maxTimeMS(10000);

    const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

    res.status(200).json({
      success: true,
      hourly: hourlyDistribution.map(item => ({
        hour: item._id,
        label: `${item._id}:00`,
        bookings: item.count
      })),
      daily: dailyDistribution.map(item => ({
        day: item._id,
        label: dayNames[item._id - 1] || 'N/A',
        bookings: item.count
      }))
    });
  } catch (error) {
    logger.error('GetPeakHours Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET CUSTOMER INSIGHTS ====================
export const getCustomerInsights = async (req, res) => {
  try {
    const salonId = resolveScopedSalonId(req, res);
    if (!salonId) return;

    const [summaryResult, topCustomersRaw] = await Promise.all([
      Booking.aggregate([
        { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
        {
          $group: {
            _id: '$customerEmail',
            bookingCount: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' }
          }
        },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            repeatCustomers: {
              $sum: {
                $cond: [{ $gt: ['$bookingCount', 1] }, 1, 0]
              }
            },
            totalSpentAll: { $sum: '$totalSpent' }
          }
        },
        { $limit: 1 }
      ]).maxTimeMS(10000),
      Booking.aggregate([
        { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
        {
          $group: {
            _id: '$customerEmail',
            bookingCount: { $sum: 1 },
            totalSpent: { $sum: '$totalPrice' },
            lastBooking: { $max: '$bookingDate' },
            firstName: { $first: '$customerName' }
          }
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 5 }
      ]).maxTimeMS(10000)
    ]);

    const summary = summaryResult[0] || {
      totalCustomers: 0,
      repeatCustomers: 0,
      totalSpentAll: 0
    };

    const totalCustomers = summary.totalCustomers;
    const repeatCustomers = summary.repeatCustomers;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    const topCustomers = topCustomersRaw.map(c => ({
      name: c.firstName || c._id?.split('@')[0] || 'Anonym',
      email: c._id,
      bookings: c.bookingCount,
      totalSpent: c.totalSpent || 0,
      lastVisit: c.lastBooking
    }));

    // Average customer lifetime value
    const avgLifetimeValue = totalCustomers > 0
      ? Math.round(summary.totalSpentAll / totalCustomers)
      : 0;

    res.status(200).json({
      success: true,
      insights: {
        totalCustomers,
        repeatCustomers,
        repeatRate,
        avgLifetimeValue,
        topCustomers
      }
    });
  } catch (error) {
    logger.error('GetCustomerInsights Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getMetricsOverview,
  getBookingTrends,
  getTopServices,
  getPeakHours,
  getCustomerInsights
};
