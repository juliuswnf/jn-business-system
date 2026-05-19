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
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const getUserAndOwnedSalons = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    return { user: null, ownedSalons: [], ownedSalonIds: [] };
  }

  const user = await User.findById(userId)
    .select('salonId additionalSalonIds')
    .lean()
    .maxTimeMS(5000);

  if (!user) {
    return { user: null, ownedSalons: [], ownedSalonIds: [] };
  }

  const scopedSalonIds = [user.salonId, ...(user.additionalSalonIds || [])].filter(Boolean);
  if (scopedSalonIds.length === 0) {
    return { user, ownedSalons: [], ownedSalonIds: [] };
  }

  const ownedSalons = await Salon.find({
    _id: { $in: scopedSalonIds },
    owner: new mongoose.Types.ObjectId(userId)
  })
    .select('name slug address businessType subscription.tier isActive')
    .lean()
    .maxTimeMS(5000);

  const ownedSalonIds = ownedSalons.map((salon) => String(salon._id));

  return {
    user,
    ownedSalons,
    ownedSalonIds
  };
};

/**
 * Get all locations for the current user
 * GET /api/locations
 */
export const getLocations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user, ownedSalons } = await getUserAndOwnedSalons(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Check if user has Enterprise tier on primary salon
    const primarySalon = ownedSalons.find((salon) => String(salon._id) === String(user.salonId));
    if (!primarySalon) {
      return res.status(403).json({
        success: false,
        error: 'Kein gültiger Hauptstandort im Eigentum des Benutzers gefunden.'
      });
    }

    const tier = primarySalon?.subscription?.tier || 'starter';

    if (tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Multi-Location ist nur im Enterprise-Tarif verfügbar.',
        upgradeRequired: true
      });
    }

    // Combine primary and additional salons
    const locations = [];

    const sortedSalons = [...ownedSalons].sort((a, b) => {
      if (String(a._id) === String(primarySalon._id)) return -1;
      if (String(b._id) === String(primarySalon._id)) return 1;
      return 0;
    });

    sortedSalons.forEach((salon) => {
      locations.push({
        id: salon._id,
        name: salon.name,
        slug: salon.slug,
        address: salon.address,
        businessType: salon.businessType,
        isPrimary: String(salon._id) === String(primarySalon._id),
        isActive: salon.isActive
      });
    });

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
    const { user, ownedSalons } = await getUserAndOwnedSalons(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    const primarySalon = ownedSalons.find((salon) => String(salon._id) === String(user.salonId));
    if (!primarySalon) {
      return res.status(403).json({
        success: false,
        error: 'Kein gültiger Hauptstandort im Eigentum des Benutzers gefunden.'
      });
    }

    const tier = primarySalon?.subscription?.tier || 'starter';
    if (tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Multi-Location ist nur im Enterprise-Tarif verfügbar.',
        upgradeRequired: true
      });
    }

    // Get all salon IDs
    const validSalonIds = ownedSalons.map((salon) => salon._id);
    if (validSalonIds.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Keine gültigen Standorte für diesen Benutzer gefunden'
      });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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

    const salonMap = {};
    ownedSalons.forEach((salon) => {
      salonMap[salon._id.toString()] = salon.name;
    });

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

    const { user, ownedSalons } = await getUserAndOwnedSalons(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    const primarySalon = ownedSalons.find((salon) => String(salon._id) === String(user.salonId));
    if (!primarySalon) {
      return res.status(403).json({
        success: false,
        error: 'Der Hauptstandort gehört nicht zum authentifizierten Benutzer.'
      });
    }

    // Check Enterprise tier
    const tier = primarySalon?.subscription?.tier || 'starter';
    if (tier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Multi-Location ist nur im Enterprise-Tarif verfügbar.'
      });
    }

    // Check location limit (5 for Enterprise)
    const currentLocationCount = ownedSalons.length;
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
      businessType: businessType || primarySalon?.businessType || 'hair-salon',
      address,
      subscription: {
        status: 'active',
        tier: 'enterprise', // Inherit Enterprise tier
        billingCycle: primarySalon?.subscription?.billingCycle || 'monthly'
      },
      isActive: true
    });

    // Add to user's additional salons
    await User.findByIdAndUpdate(userId, {
      $addToSet: { additionalSalonIds: newSalon._id }
    }).maxTimeMS(5000);

    logger.info(`New location added for user ${userId}: ${newSalon._id}`);

    res.status(201).json({
      success: true,
      message: 'Neuer Standort erfolgreich hinzugefügt',
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
      error: 'Fehler beim Hinzufügen des Standorts'
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
    const { salonId: rawSalonId } = req.params;

    if (!mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige salonId'
      });
    }

    const salonId = new mongoose.Types.ObjectId(rawSalonId);

    const { user, ownedSalons, ownedSalonIds } = await getUserAndOwnedSalons(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    if (!ownedSalonIds.includes(rawSalonId)) {
      return res.status(403).json({
        success: false,
        error: 'Kein Zugriff auf diesen Standort'
      });
    }

    // Note: The actual context switch happens on the frontend
    // This endpoint validates access and could be used for logging/analytics

    const salon = ownedSalons.find((location) => String(location._id) === String(salonId));

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
    const { salonId: rawSalonId } = req.params;

    if (!mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige salonId'
      });
    }

    const salonId = new mongoose.Types.ObjectId(rawSalonId);

    const { user, ownedSalonIds } = await getUserAndOwnedSalons(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Cannot remove primary salon
    if (String(user.salonId) === rawSalonId) {
      return res.status(400).json({
        success: false,
        error: 'Der Hauptstandort kann nicht entfernt werden.'
      });
    }

    // Check if salon is in additional salons and owned by the same parent account
    if (!user.additionalSalonIds?.map(id => id.toString()).includes(rawSalonId) || !ownedSalonIds.includes(rawSalonId)) {
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
    await Salon.findOneAndUpdate({ _id: salonId, owner: userId }, {
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
