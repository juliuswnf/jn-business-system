/**
 * Multi-Location Controller
 *
 * Provides consolidated dashboard for Enterprise users with multiple locations.
 *
 * @module controllers/multiLocationController
 */

import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Get all locations for the current user
 * GET /api/locations
 */
export const getLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate('salonId', 'name slug address businessType subscription.tier isActive')
      .populate('additionalSalonIds', 'name slug address businessType subscription.tier isActive')
      .maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Check if user has Enterprise tier on primary salon
    const primarySalon = user.salonId;
    const tier = primarySalon?.subscription?.tier || 'starter';

    if (tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Multi-Location ist nur im Enterprise-Tarif verfÃ¼gbar.',
        upgradeRequired: true
      });
    }

    // Combine primary and additional salons
    const locations = [];

    if (primarySalon) {
      locations.push({
        id: primarySalon._id,
        name: primarySalon.name,
        slug: primarySalon.slug,
        address: primarySalon.address,
        businessType: primarySalon.businessType,
        isPrimary: true,
        isActive: primarySalon.isActive
      });
    }

    if (user.additionalSalonIds && user.additionalSalonIds.length > 0) {
      user.additionalSalonIds.forEach(salon => {
        if (salon) {
          locations.push({
            id: salon._id,
            name: salon.name,
            slug: salon.slug,
            address: salon.address,
            businessType: salon.businessType,
            isPrimary: false,
            isActive: salon.isActive
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      count: locations.length,
      maxLocations: 5, // Enterprise limit
      locations
    });
  } catch (error) {
    logger.error('MultiLocation getLocations Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Standorte'
    });
  }
};

/**
 * Get consolidated dashboard data for all locations
 * GET /api/locations/dashboard
 */
export const getConsolidatedDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Get all salon IDs
    const salonIds = [user.salonId];
    if (user.additionalSalonIds) {
      salonIds.push(...user.additionalSalonIds);
    }

    // Filter out null values
    const validSalonIds = salonIds.filter(id => id);

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate data across all locations
    const [
      todayBookings,
      monthlyBookings,
      monthlyRevenue,
      locationBreakdown
    ] = await Promise.all([
      // Today's bookings across all locations
      Booking.countDocuments({
        salonId: { $in: validSalonIds },
        bookingDate: { $gte: startOfToday, $lte: endOfToday },
        status: { $in: ['pending', 'confirmed'] }
      }).maxTimeMS(5000),

      // This month's bookings
      Booking.countDocuments({
        salonId: { $in: validSalonIds },
        bookingDate: { $gte: startOfMonth },
        status: { $ne: 'cancelled' }
      }).maxTimeMS(5000),

      // Monthly revenue
      Booking.aggregate([
        {
          $match: {
            salonId: { $in: validSalonIds },
            bookingDate: { $gte: startOfMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]).maxTimeMS(5000),

      // Breakdown by location
      Booking.aggregate([
        {
          $match: {
            salonId: { $in: validSalonIds },
            bookingDate: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: '$salonId',
            bookings: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalPrice', 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        }
      ]).maxTimeMS(5000)
    ]);

    // Get salon names for breakdown
    const salons = await Salon.find({ _id: { $in: validSalonIds } })
      .select('name')
      .maxTimeMS(5000);

    const salonMap = {};
    salons.forEach(s => { salonMap[s._id.toString()] = s.name; });

    res.status(200).json({
      success: true,
      dashboard: {
        overview: {
          todayBookings,
          monthlyBookings,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          locationCount: validSalonIds.length
        },
        byLocation: locationBreakdown.map(loc => ({
          salonId: loc._id,
          name: salonMap[loc._id.toString()] || 'Unbekannt',
          bookings: loc.bookings,
          revenue: loc.revenue,
          completed: loc.completed,
          cancelled: loc.cancelled
        }))
      }
    });
  } catch (error) {
    logger.error('MultiLocation getConsolidatedDashboard Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Dashboards'
    });
  }
};

/**
 * Add a new location (salon) to user's account
 * POST /api/locations
 */
export const addLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, businessType, address } = req.body;

    const user = await User.findById(userId)
      .populate('salonId', 'subscription.tier')
      .maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Check Enterprise tier
    const tier = user.salonId?.subscription?.tier || 'starter';
    if (tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Multi-Location ist nur im Enterprise-Tarif verfÃ¼gbar.'
      });
    }

    // Check location limit (5 for Enterprise)
    const currentLocationCount = 1 + (user.additionalSalonIds?.length || 0);
    if (currentLocationCount >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximale Anzahl von 5 Standorten erreicht.'
      });
    }

    // Generate slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    // Create new salon
    const newSalon = await Salon.create({
      name,
      slug,
      email,
      owner: userId,
      businessType: businessType || user.salonId?.businessType || 'hair-salon',
      address,
      subscription: {
        status: 'active',
        tier: 'enterprise', // Inherit Enterprise tier
        billingCycle: user.salonId?.subscription?.billingCycle || 'monthly'
      },
      isActive: true
    });

    // Add to user's additional salons
    await User.findByIdAndUpdate(userId, {
      $push: { additionalSalonIds: newSalon._id }
    }).maxTimeMS(5000);

    logger.info(`New location added for user ${userId}: ${newSalon._id}`);

    res.status(201).json({
      success: true,
      message: 'Neuer Standort erfolgreich hinzugefÃ¼gt',
      location: {
        id: newSalon._id,
        name: newSalon.name,
        slug: newSalon.slug
      }
    });
  } catch (error) {
    logger.error('MultiLocation addLocation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim HinzufÃ¼gen des Standorts'
    });
  }
};

/**
 * Switch active location context
 * POST /api/locations/:salonId/switch
 */
export const switchLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId } = req.params;

    const user = await User.findById(userId).maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Check if salon belongs to user
    const allSalonIds = [user.salonId?.toString(), ...(user.additionalSalonIds?.map(id => id.toString()) || [])];

    if (!allSalonIds.includes(salonId)) {
      return res.status(403).json({
        success: false,
        error: 'Kein Zugriff auf diesen Standort'
      });
    }

    // Note: The actual context switch happens on the frontend
    // This endpoint validates access and could be used for logging/analytics

    const salon = await Salon.findById(salonId).select('name slug').maxTimeMS(5000);

    logger.info(`User ${userId} switched to location ${salonId}`);

    res.status(200).json({
      success: true,
      message: `Gewechselt zu ${salon?.name || 'Standort'}`,
      location: {
        id: salonId,
        name: salon?.name,
        slug: salon?.slug
      }
    });
  } catch (error) {
    logger.error('MultiLocation switchLocation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Wechseln des Standorts'
    });
  }
};

/**
 * Remove a location from user's account
 * DELETE /api/locations/:salonId
 */
export const removeLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId } = req.params;

    const user = await User.findById(userId).maxTimeMS(5000);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Cannot remove primary salon
    if (user.salonId?.toString() === salonId) {
      return res.status(400).json({
        success: false,
        error: 'Der Hauptstandort kann nicht entfernt werden.'
      });
    }

    // Check if salon is in additional salons
    if (!user.additionalSalonIds?.map(id => id.toString()).includes(salonId)) {
      return res.status(404).json({
        success: false,
        error: 'Standort nicht gefunden'
      });
    }

    // Remove from user's additional salons
    await User.findByIdAndUpdate(userId, {
      $pull: { additionalSalonIds: salonId }
    }).maxTimeMS(5000);

    // Soft delete the salon
    await Salon.findByIdAndUpdate(salonId, {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    }).maxTimeMS(5000);

    logger.info(`Location ${salonId} removed by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Standort wurde entfernt'
    });
  } catch (error) {
    logger.error('MultiLocation removeLocation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Entfernen des Standorts'
    });
  }
};

export default {
  getLocations,
  getConsolidatedDashboard,
  addLocation,
  switchLocation,
  removeLocation
};
