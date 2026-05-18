import Resource from '../models/Resource.js';
import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const ALLOWED_RESOURCE_TYPES = ['room', 'equipment', 'staff', 'vehicle', 'chair', 'bed', 'table', 'other'];
const ALLOWED_RESOURCE_CATEGORIES = ['general', 'medical', 'beauty', 'fitness', 'specialized', 'wellness'];
const ALLOWED_RESOURCE_STATUSES = ['available', 'unavailable', 'maintenance', 'retired', 'active', 'inactive'];
const hasSalonAccess = (req, salonId) => {
  return req.user?.role === 'ceo' || salonId?.toString() === req.user?.salonId?.toString();
};

/**
 * Resource Controller
 * For Spa/Wellness - Room/Equipment management
 */

// ==================== CREATE RESOURCE ====================
export const createResource = async (req, res) => {
  try {
    const {
      salonId,
      name,
      type,
      category,
      description,
      capacity,
      customHours,
      useSalonHours,
      compatibleServices,
      location,
      amenities
    } = req.body;

    const userId = req.user.id;

    if (!salonId || !mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
    }
    const safeSalonId = new mongoose.Types.ObjectId(salonId);

    // Verify salon ownership
    const salon = await Salon.findById(safeSalonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const resource = await Resource.create({
      salonId: safeSalonId,
      name,
      type,
      category,
      description,
      capacity: capacity || 1,
      customHours: customHours ? JSON.parse(customHours) : undefined,
      useSalonHours: useSalonHours !== 'false',
      compatibleServices: compatibleServices ? JSON.parse(compatibleServices) : [],
      location: location ? JSON.parse(location) : undefined,
      amenities: amenities ? JSON.parse(amenities) : [],
      isAvailable: true,
      status: 'active',
      requiresBooking: true
    });

    return res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    logger.error('Error creating resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET SALON RESOURCES ====================
export const getSalonResources = async (req, res) => {
  try {
    const { salonId: rawSalonId } = req.params;
    const { type, category, status } = req.query;

    if (!rawSalonId || !mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
    }
    const safeSalonId = new mongoose.Types.ObjectId(rawSalonId);

    if (!hasSalonAccess(req, safeSalonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const query = {
      salonId: safeSalonId,
      deletedAt: null
    };

    if (type && ALLOWED_RESOURCE_TYPES.includes(String(type))) query.type = String(type);
    if (category && ALLOWED_RESOURCE_CATEGORIES.includes(String(category))) query.category = String(category);
    if (status && ALLOWED_RESOURCE_STATUSES.includes(String(status))) query.status = String(status);

    const resources = await Resource.find(query)
      .populate('compatibleServices', 'name duration')
      .sort({ type: 1, name: 1 })
      .maxTimeMS(5000)
      .lean();

    return res.json({
      success: true,
      resources
    });
  } catch (error) {
    logger.error('Error getting resources:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET RESOURCE BY ID ====================
export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    const resource = await Resource.findById(safeResourceId)
      .populate('compatibleServices', 'name duration price')
      .maxTimeMS(5000)
      .lean();

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // ? SECURITY FIX: Authorization check - prevent IDOR
    if (userRole !== 'ceo' && resource.salonId.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    return res.json({
      success: true,
      resource
    });
  } catch (error) {
    logger.error('Error getting resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== CHECK RESOURCE AVAILABILITY ====================
export const checkResourceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateTime, duration } = req.query;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    if (!dateTime) {
      return res.status(400).json({
        success: false,
        message: 'dateTime is required'
      });
    }

    const resource = await Resource.findById(safeResourceId).maxTimeMS(5000);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const requestedDateTime = new Date(dateTime);
    if (isNaN(requestedDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dateTime format' });
    }
    const isAvailable = resource.isAvailableAt(requestedDateTime);

    if (!isAvailable) {
      return res.json({
        success: true,
        available: false,
        reason: 'Resource not available at this time'
      });
    }

    // Check for overlapping bookings
    const endDateTime = new Date(requestedDateTime);
    const safeDuration = Math.max(1, Math.min(1440, parseInt(duration, 10) || 60));
    endDateTime.setMinutes(endDateTime.getMinutes() + safeDuration);

    const overlappingBookings = await Booking.countDocuments({
      resourceId: safeResourceId,
      bookingDate: {
        $gte: requestedDateTime,
        $lt: endDateTime
      },
      status: { $nin: ['cancelled'] },
      deletedAt: null
    });

    const capacityAvailable = overlappingBookings < resource.capacity;

    return res.json({
      success: true,
      available: capacityAvailable,
      currentBookings: overlappingBookings,
      maxCapacity: resource.capacity
    });
  } catch (error) {
    logger.error('Error checking resource availability:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE RESOURCE ====================
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    const resource = await Resource.findById(safeResourceId).maxTimeMS(5000);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!hasSalonAccess(req, resource.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'salonId') {
        if (typeof updateData[key] === 'string' && (key === 'customHours' || key === 'compatibleServices' || key === 'location' || key === 'amenities')) {
          resource[key] = JSON.parse(updateData[key]);
        } else {
          resource[key] = updateData[key];
        }
      }
    });

    await resource.save();

    return res.json({
      success: true,
      message: 'Resource updated',
      resource
    });
  } catch (error) {
    logger.error('Error updating resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== SCHEDULE MAINTENANCE ====================
export const scheduleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    const resource = await Resource.findById(safeResourceId).maxTimeMS(5000);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!hasSalonAccess(req, resource.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await resource.scheduleMaintenance(
      new Date(startDate),
      new Date(endDate),
      reason
    );

    return res.json({
      success: true,
      message: 'Maintenance scheduled',
      resource
    });
  } catch (error) {
    logger.error('Error scheduling maintenance:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE RESOURCE ====================
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    const resource = await Resource.findById(safeResourceId).maxTimeMS(5000);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!hasSalonAccess(req, resource.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check for future bookings
    const futureBookings = await Booking.countDocuments({
      resourceId: safeResourceId,
      bookingDate: { $gte: new Date() },
      status: { $nin: ['cancelled'] },
      deletedAt: null
    });

    if (futureBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete resource with ${futureBookings} future bookings`
      });
    }

    // Soft delete
    resource.deletedAt = new Date();
    resource.deletedBy = userId;
    await resource.save();

    return res.json({
      success: true,
      message: 'Resource deleted'
    });
  } catch (error) {
    logger.error('Error deleting resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET RESOURCE UTILIZATION ====================
export const getResourceUtilization = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    const safeResourceId = new mongoose.Types.ObjectId(id);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const resource = await Resource.findById(safeResourceId).maxTimeMS(5000);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (!hasSalonAccess(req, resource.salonId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    const salon = await Salon.findById(resource.salonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const safeStartDate = new Date(startDate);
    const safeEndDate = new Date(endDate);
    if (isNaN(safeStartDate.getTime()) || isNaN(safeEndDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    // Count bookings in date range
    const bookings = await Booking.find({
      resourceId: safeResourceId,
      bookingDate: {
        $gte: safeStartDate,
        $lte: safeEndDate
      },
      status: { $nin: ['cancelled'] },
      deletedAt: null
    }).select('bookingDate duration').lean().maxTimeMS(5000);

    // Calculate total booked hours
    const totalBookedMinutes = bookings.reduce((sum, booking) => sum + booking.duration, 0);
    const totalBookedHours = (totalBookedMinutes / 60).toFixed(2);

    // Calculate total available hours in date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const avgHoursPerDay = 8; // Assume 8 hour workdays
    const totalAvailableHours = totalDays * avgHoursPerDay;

    const utilizationRate = ((totalBookedHours / totalAvailableHours) * 100).toFixed(2);

    return res.json({
      success: true,
      utilization: {
        totalBookings: bookings.length,
        totalBookedHours: parseFloat(totalBookedHours),
        totalAvailableHours,
        utilizationRate: parseFloat(utilizationRate)
      }
    });
  } catch (error) {
    logger.error('Error getting resource utilization:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET AVAILABLE RESOURCES FOR SERVICE ====================
export const getAvailableResourcesForService = async (req, res) => {
  try {
    const { salonId: rawSalonId, serviceId: rawServiceId } = req.params;
    const { dateTime, duration } = req.query;

    if (!mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salon ID format' });
    }
    if (!mongoose.isValidObjectId(rawServiceId)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID format' });
    }
    const safeSalonId = new mongoose.Types.ObjectId(rawSalonId);
    const safeServiceId = new mongoose.Types.ObjectId(rawServiceId);

    const resources = await Resource.find({
      salonId: safeSalonId,
      compatibleServices: safeServiceId,
      isAvailable: true,
      status: 'active',
      deletedAt: null
    }).maxTimeMS(5000); // lean removed so Mongoose doc methods are available

    if (!dateTime) {
      return res.json({
        success: true,
        resources
      });
    }

    if (typeof dateTime !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid dateTime format' });
    }
    const requestedDateTime = new Date(dateTime);
    if (isNaN(requestedDateTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid dateTime format' });
    }

    // Compute time window once outside the loop
    const safeDuration = Math.max(1, Math.min(1440, parseInt(duration, 10) || 60));
    const endDateTime = new Date(requestedDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + safeDuration);

    // Batch all countDocuments queries in parallel to avoid N+1
    const overlappingCounts = await Promise.all(
      resources.map(r =>
        Booking.countDocuments({
          resourceId: r._id,
          bookingDate: { $gte: requestedDateTime, $lt: endDateTime },
          status: { $nin: ['cancelled'] },
          deletedAt: null
        })
      )
    );

    const availableResources = [];
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const isAvailable = resource.isAvailableAt(requestedDateTime);
      const overlappingBookings = overlappingCounts[i];

      if (isAvailable && overlappingBookings < resource.capacity) {
        availableResources.push({
          ...resource.toObject(),
          currentBookings: overlappingBookings,
          availableCapacity: resource.capacity - overlappingBookings
        });
      }
    }

    return res.json({
      success: true,
      resources: availableResources
    });
  } catch (error) {
    logger.error('Error getting available resources:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


