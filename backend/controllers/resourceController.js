import Resource from '../models/Resource.js';
import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';

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

    // Verify salon ownership
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const resource = await Resource.create({
      salonId,
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
    console.error('Error creating resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET SALON RESOURCES ====================
export const getSalonResources = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { type, category, status } = req.query;

    const query = {
      salonId,
      deletedAt: null
    };

    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;

    const resources = await Resource.find(query)
      .populate('compatibleServices', 'name duration')
      .sort({ type: 1, name: 1 })
      .lean();

    return res.json({
      success: true,
      resources
    });
  } catch (error) {
    console.error('Error getting resources:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET RESOURCE BY ID ====================
export const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id)
      .populate('compatibleServices', 'name duration price')
      .lean();

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    return res.json({
      success: true,
      resource
    });
  } catch (error) {
    console.error('Error getting resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== CHECK RESOURCE AVAILABILITY ====================
export const checkResourceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateTime, duration } = req.query;

    if (!dateTime) {
      return res.status(400).json({
        success: false,
        message: 'dateTime is required'
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const requestedDateTime = new Date(dateTime);
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
    endDateTime.setMinutes(endDateTime.getMinutes() + (parseInt(duration) || 60));

    const overlappingBookings = await Booking.countDocuments({
      resourceId: id,
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
    console.error('Error checking resource availability:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE RESOURCE ====================
export const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId);
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
    console.error('Error updating resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== SCHEDULE MAINTENANCE ====================
export const scheduleMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason, isRecurring, recurringPattern } = req.body;
    const userId = req.user.id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId);
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
    console.error('Error scheduling maintenance:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE RESOURCE ====================
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(resource.salonId);
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check for future bookings
    const futureBookings = await Booking.countDocuments({
      resourceId: id,
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
    console.error('Error deleting resource:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET RESOURCE UTILIZATION ====================
export const getResourceUtilization = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Count bookings in date range
    const bookings = await Booking.find({
      resourceId: id,
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $nin: ['cancelled'] },
      deletedAt: null
    }).select('bookingDate duration');

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
    console.error('Error getting resource utilization:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET AVAILABLE RESOURCES FOR SERVICE ====================
export const getAvailableResourcesForService = async (req, res) => {
  try {
    const { salonId, serviceId } = req.params;
    const { dateTime, duration } = req.query;

    const resources = await Resource.find({
      salonId,
      compatibleServices: serviceId,
      isAvailable: true,
      status: 'active',
      deletedAt: null
    }).lean();

    if (!dateTime) {
      return res.json({
        success: true,
        resources
      });
    }

    // Check availability for each resource
    const availableResources = [];
    for (const resource of resources) {
      const resourceDoc = await Resource.findById(resource._id);
      const isAvailable = resourceDoc.isAvailableAt(new Date(dateTime));

      if (isAvailable) {
        // Check capacity
        const endDateTime = new Date(dateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + (parseInt(duration) || 60));

        const overlappingBookings = await Booking.countDocuments({
          resourceId: resource._id,
          bookingDate: {
            $gte: new Date(dateTime),
            $lt: endDateTime
          },
          status: { $nin: ['cancelled'] },
          deletedAt: null
        });

        if (overlappingBookings < resource.capacity) {
          availableResources.push({
            ...resource,
            currentBookings: overlappingBookings,
            availableCapacity: resource.capacity - overlappingBookings
          });
        }
      }
    }

    return res.json({
      success: true,
      resources: availableResources
    });
  } catch (error) {
    console.error('Error getting available resources:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
