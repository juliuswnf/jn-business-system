/**
 * Salon Analytics Controller
 * Provides success metrics and KPIs for salon owners
 * Shows them the value they get from JN Automation
 */

import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

// ==================== GET SALON METRICS OVERVIEW ====================
export const getMetricsOverview = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    if (!salonId) {
      return res.status(400).json({ success: false, message: 'No salon associated with user' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // This month's bookings
    const thisMonthBookings = await Booking.countDocuments({
      salonId,
      createdAt: { $gte: startOfMonth }
    });

    // Last month's bookings
    const lastMonthBookings = await Booking.countDocuments({
      salonId,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // This week's bookings
    const thisWeekBookings = await Booking.countDocuments({
      salonId,
      createdAt: { $gte: startOfWeek }
    });

    // Total bookings all time
    const totalBookings = await Booking.countDocuments({ salonId });

    // Confirmed vs cancelled
    const confirmedBookings = await Booking.countDocuments({ salonId, status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ salonId, status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ salonId, status: 'completed' });

    // Revenue calculation
    const revenueAggregation = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
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
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueAgg[0]?.total || 0;

    // Unique customers
    const uniqueCustomers = await Booking.distinct('customerEmail', { salonId });
    const totalCustomers = uniqueCustomers.length;

    // New customers this month
    const newCustomersThisMonth = await Booking.distinct('customerEmail', {
      salonId,
      createdAt: { $gte: startOfMonth }
    });

    // Calculate averages
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const bookingGrowth = lastMonthBookings > 0
      ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : thisMonthBookings > 0 ? 100 : 0;

    // No-show rate (cancelled / total)
    const noShowRate = totalBookings > 0
      ? Math.round((cancelledBookings / totalBookings) * 100)
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
    const salonId = req.user.salonId;
    const { period = '30d' } = req.query;

    if (!salonId) {
      return res.status(400).json({ success: false, message: 'No salon associated with user' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    let groupBy;

    switch (period) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: '%Y-%W', date: '$createdAt' } };
        break;
      case '1y':
        startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const bookingTrend = await Booking.aggregate([
      { $match: { salonId: salonId, createdAt: { $gte: startDate } } },
      { $group: {
        _id: groupBy,
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      period,
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
    const salonId = req.user.salonId;
    const { limit = 5 } = req.query;

    if (!salonId) {
      return res.status(400).json({ success: false, message: 'No salon associated with user' });
    }

    const topServices = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: '$serviceId',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }},
      { $sort: { bookings: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'service'
      }},
      { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } }
    ]);

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
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({ success: false, message: 'No salon associated with user' });
    }

    // Get booking distribution by hour
    const hourlyDistribution = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: { $hour: '$bookingDate' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get booking distribution by day of week
    const dailyDistribution = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: { $dayOfWeek: '$bookingDate' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

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
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({ success: false, message: 'No salon associated with user' });
    }

    // Repeat customers (more than 1 booking)
    const customerBookings = await Booking.aggregate([
      { $match: { salonId: salonId, status: { $in: ['confirmed', 'completed'] } } },
      { $group: {
        _id: '$customerEmail',
        bookingCount: { $sum: 1 },
        totalSpent: { $sum: '$totalPrice' },
        lastBooking: { $max: '$bookingDate' },
        firstName: { $first: '$customerName' }
      }},
      { $sort: { bookingCount: -1 } }
    ]);

    const totalCustomers = customerBookings.length;
    const repeatCustomers = customerBookings.filter(c => c.bookingCount > 1).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // Top customers
    const topCustomers = customerBookings.slice(0, 5).map(c => ({
      name: c.firstName || c._id?.split('@')[0] || 'Anonym',
      email: c._id,
      bookings: c.bookingCount,
      totalSpent: c.totalSpent || 0,
      lastVisit: c.lastBooking
    }));

    // Average customer lifetime value
    const totalSpentAll = customerBookings.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgLifetimeValue = totalCustomers > 0 ? Math.round(totalSpentAll / totalCustomers) : 0;

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
