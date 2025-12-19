/**
 * CRM Controller - Customer Relationship Management
 *
 * Provides customer management functionality for salon owners.
 * Aggregates customer data from bookings and provides CRM features.
 *
 * @module controllers/crmController
 */

import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

/**
 * Get all customers for a salon (aggregated from bookings)
 * GET /api/crm/customers
 */
export const getCustomers = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    const { search, sortBy = 'lastBooking', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

    // Aggregate customers from bookings
    const aggregation = [
      { $match: { salonId } },
      {
        $group: {
          _id: { $toLower: '$customerEmail' },
          customerName: { $last: '$customerName' },
          customerEmail: { $first: '$customerEmail' },
          customerPhone: { $last: '$customerPhone' },
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalPrice', 0] } },
          firstBooking: { $min: '$bookingDate' },
          lastBooking: { $max: '$bookingDate' },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShows: {
            $sum: { $cond: [{ $eq: ['$status', 'no-show'] }, 1, 0] }
          }
        }
      }
    ];

    // Add search filter
    if (search) {
      aggregation.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { customerEmail: { $regex: search, $options: 'i' } },
            { customerPhone: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Calculate customer score/tier
    aggregation.push({
      $addFields: {
        tier: {
          $switch: {
            branches: [
              { case: { $gte: ['$totalSpent', 1000] }, then: 'vip' },
              { case: { $gte: ['$totalSpent', 500] }, then: 'gold' },
              { case: { $gte: ['$bookingCount', 5] }, then: 'regular' }
            ],
            default: 'new'
          }
        }
      }
    });

    // Sorting
    const sortField = sortBy === 'totalSpent' ? 'totalSpent' :
      sortBy === 'bookingCount' ? 'bookingCount' :
        sortBy === 'name' ? 'customerName' : 'lastBooking';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    aggregation.push({ $sort: { [sortField]: sortDirection } });

    // Pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    aggregation.push({ $skip: skip });
    aggregation.push({ $limit: parseInt(limit, 10) });

    const customers = await Booking.aggregate(aggregation).maxTimeMS(5000);

    // Get total count
    const countAggregation = [
      { $match: { salonId } },
      { $group: { _id: '$customerEmail' } },
      { $count: 'total' }
    ];
    const countResult = await Booking.aggregate(countAggregation).maxTimeMS(5000);
    const totalCount = countResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: customers.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10),
      customers: customers.map(c => ({
        id: c._id,
        name: c.customerName,
        email: c.customerEmail,
        phone: c.customerPhone || null,
        bookingCount: c.bookingCount,
        completedBookings: c.completedBookings,
        cancelledBookings: c.cancelledBookings,
        noShows: c.noShows,
        totalSpent: c.totalSpent,
        firstBooking: c.firstBooking,
        lastBooking: c.lastBooking,
        tier: c.tier
      }))
    });
  } catch (error) {
    logger.error('CRM getCustomers Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Kunden'
    });
  }
};

/**
 * Get customer details with booking history
 * GET /api/crm/customers/:email
 */
export const getCustomerDetails = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { email } = req.params;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    // Get all bookings for this customer
    const bookings = await Booking.find({
      salonId,
      customerEmail: { $regex: new RegExp(`^${email}$`, 'i') }
    })
      .populate('serviceId', 'name price duration')
      .populate('employeeId', 'name')
      .sort({ bookingDate: -1 })
      .maxTimeMS(5000);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Kunde nicht gefunden'
      });
    }

    // Calculate customer stats
    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      noShows: bookings.filter(b => b.status === 'no-show').length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      averageSpent: 0,
      firstBooking: bookings[bookings.length - 1]?.bookingDate,
      lastBooking: bookings[0]?.bookingDate
    };
    stats.averageSpent = stats.completedBookings > 0
      ? Math.round(stats.totalSpent / stats.completedBookings)
      : 0;

    // Determine tier
    let tier = 'new';
    if (stats.totalSpent >= 1000) tier = 'vip';
    else if (stats.totalSpent >= 500) tier = 'gold';
    else if (stats.totalBookings >= 5) tier = 'regular';

    // Most booked services
    const serviceCount = {};
    bookings.forEach(b => {
      if (b.serviceId?.name) {
        serviceCount[b.serviceId.name] = (serviceCount[b.serviceId.name] || 0) + 1;
      }
    });
    const favoriteServices = Object.entries(serviceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Get customer info from latest booking
    const latestBooking = bookings[0];

    res.status(200).json({
      success: true,
      customer: {
        email: latestBooking.customerEmail,
        name: latestBooking.customerName,
        phone: latestBooking.customerPhone || null,
        tier,
        stats,
        favoriteServices,
        bookings: bookings.map(b => ({
          id: b._id,
          date: b.bookingDate,
          service: b.serviceId?.name || 'Unbekannt',
          employee: b.employeeId?.name || null,
          status: b.status,
          price: b.totalPrice || 0,
          notes: b.notes || null
        }))
      }
    });
  } catch (error) {
    logger.error('CRM getCustomerDetails Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Kundendetails'
    });
  }
};

/**
 * Get CRM statistics overview
 * GET /api/crm/stats
 */
export const getCRMStats = async (req, res) => {
  try {
    const salonId = req.user.salonId;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        error: 'Kein Salon zugeordnet'
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total unique customers
    const totalCustomers = await Booking.distinct('customerEmail', { salonId }).maxTimeMS(5000);

    // New customers this month
    const newThisMonth = await Booking.aggregate([
      { $match: { salonId } },
      { $group: { _id: '$customerEmail', firstBooking: { $min: '$bookingDate' } } },
      { $match: { firstBooking: { $gte: startOfMonth } } },
      { $count: 'count' }
    ]).maxTimeMS(5000);

    // New customers last month
    const newLastMonth = await Booking.aggregate([
      { $match: { salonId } },
      { $group: { _id: '$customerEmail', firstBooking: { $min: '$bookingDate' } } },
      { $match: { firstBooking: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $count: 'count' }
    ]).maxTimeMS(5000);

    // Customer tiers breakdown
    const tierBreakdown = await Booking.aggregate([
      { $match: { salonId } },
      {
        $group: {
          _id: '$customerEmail',
          totalSpent: { $sum: { $ifNull: ['$totalPrice', 0] } },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          tier: {
            $switch: {
              branches: [
                { case: { $gte: ['$totalSpent', 1000] }, then: 'vip' },
                { case: { $gte: ['$totalSpent', 500] }, then: 'gold' },
                { case: { $gte: ['$bookingCount', 5] }, then: 'regular' }
              ],
              default: 'new'
            }
          }
        }
      },
      { $group: { _id: '$tier', count: { $sum: 1 } } }
    ]).maxTimeMS(5000);

    const tiers = { vip: 0, gold: 0, regular: 0, new: 0 };
    tierBreakdown.forEach(t => { tiers[t._id] = t.count; });

    // Average customer lifetime value
    const avgLTV = await Booking.aggregate([
      { $match: { salonId, status: 'completed' } },
      { $group: { _id: '$customerEmail', totalSpent: { $sum: '$totalPrice' } } },
      { $group: { _id: null, avgLTV: { $avg: '$totalSpent' } } }
    ]).maxTimeMS(5000);

    // Top 5 customers by revenue
    const topCustomers = await Booking.aggregate([
      { $match: { salonId, status: 'completed' } },
      {
        $group: {
          _id: '$customerEmail',
          name: { $last: '$customerName' },
          totalSpent: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]).maxTimeMS(5000);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers: totalCustomers.length,
        newThisMonth: newThisMonth[0]?.count || 0,
        newLastMonth: newLastMonth[0]?.count || 0,
        customerGrowth: newLastMonth[0]?.count > 0
          ? Math.round(((newThisMonth[0]?.count || 0) - newLastMonth[0].count) / newLastMonth[0].count * 100)
          : 100,
        avgLifetimeValue: Math.round(avgLTV[0]?.avgLTV || 0),
        tiers,
        topCustomers: topCustomers.map(c => ({
          email: c._id,
          name: c.name,
          totalSpent: c.totalSpent,
          bookingCount: c.bookingCount
        }))
      }
    });
  } catch (error) {
    logger.error('CRM getCRMStats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der CRM-Statistiken'
    });
  }
};

/**
 * Add note to customer (stored in separate collection or booking)
 * POST /api/crm/customers/:email/notes
 */
export const addCustomerNote = async (req, res) => {
  try {
    const salonId = req.user.salonId;
    const { email } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Notiz darf nicht leer sein'
      });
    }

    // Find the most recent booking and add note
    const booking = await Booking.findOneAndUpdate(
      {
        salonId,
        customerEmail: { $regex: new RegExp(`^${email}$`, 'i') }
      },
      {
        $push: {
          internalNotes: {
            note: note.trim(),
            createdBy: req.user.id,
            createdAt: new Date()
          }
        }
      },
      { new: true, sort: { bookingDate: -1 } }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Kunde nicht gefunden'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notiz hinzugefügt'
    });
  } catch (error) {
    logger.error('CRM addCustomerNote Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Hinzufügen der Notiz'
    });
  }
};

export default {
  getCustomers,
  getCustomerDetails,
  getCRMStats,
  addCustomerNote
};
