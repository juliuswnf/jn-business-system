import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';

/**
 * Tenant Isolation Middleware
 * Ensures users can only access resources belonging to their salon
 * CEO role has access to all resources
 */

// Model mapping for dynamic resource loading
const MODELS = {
  booking: Booking,
  service: Service,
  salon: Salon
};

// Field that contains salonId for each resource type
const SALON_ID_FIELD = {
  booking: 'salonId',
  service: 'salonId',
  salon: '_id' // Salon's own ID is the salonId
};

/**
 * Check if user has access to a specific resource
 * @param {string} resourceType - 'booking', 'service', or 'salon'
 * @param {string} idParam - URL parameter name containing the resource ID (default: 'id')
 */
export const checkTenantAccess = (resourceType, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      // CEO has access to everything
      if (req.user.role === 'ceo') {
        return next();
      }

      const resourceId = req.params[idParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      const Model = MODELS[resourceType];
      if (!Model) {
        logger.error(`Invalid resource type: ${resourceType}`);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }

      const resource = await Model.findById(resourceId).lean();

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
        });
      }

      // Get the salonId from the resource
      const salonIdField = SALON_ID_FIELD[resourceType];
      const resourceSalonId = resource[salonIdField]?.toString();
      const userSalonId = req.user.salonId?.toString();

      // Check if user's salon matches the resource's salon
      if (!userSalonId || resourceSalonId !== userSalonId) {
        logger.warn(`🚫 Tenant access denied: User ${req.user.id} (salon: ${userSalonId}) tried to access ${resourceType} ${resourceId} (salon: ${resourceSalonId})`);

        return res.status(403).json({
          success: false,
          message: 'Access denied - Resource belongs to another salon'
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      logger.error(`Tenant middleware error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

/**
 * Ensure salonId filter is applied to all queries
 * Adds salonId to req.tenantFilter for use in controllers
 */
export const enforceTenantFilter = (req, res, next) => {
  // CEO can optionally filter by salonId but isn't required to
  if (req.user.role === 'ceo') {
    req.tenantFilter = req.query.salonId ? { salonId: req.query.salonId } : {};
    return next();
  }

  // All other users MUST have a salonId
  if (!req.user.salonId) {
    logger.warn(`🚫 User ${req.user.id} has no salonId assigned`);
    return res.status(403).json({
      success: false,
      message: 'No salon assigned to your account'
    });
  }

  // Set tenant filter for use in queries
  req.tenantFilter = { salonId: req.user.salonId };
  next();
};

/**
 * Check if user owns the salon they're trying to access
 * For salon-specific operations (update, delete, settings)
 */
export const checkSalonOwnership = async (req, res, next) => {
  try {
    // CEO has access to all salons
    if (req.user.role === 'ceo') {
      return next();
    }

    const salonId = req.params.salonId || req.params.id;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    const userSalonId = req.user.salonId?.toString();

    // Check if user's salon matches the requested salon
    if (!userSalonId || salonId !== userSalonId) {
      logger.warn(`🚫 Salon ownership denied: User ${req.user.id} (salon: ${userSalonId}) tried to access salon ${salonId}`);

      return res.status(403).json({
        success: false,
        message: 'Access denied - Not your salon'
      });
    }

    next();
  } catch (error) {
    logger.error(`Salon ownership check error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware for employee-specific access
 * Employees can only see their own bookings/schedule
 */
export const checkEmployeeAccess = async (req, res, next) => {
  try {
    // CEO and salon_owner can access all employees' data
    if (req.user.role === 'ceo' || req.user.role === 'salon_owner') {
      return next();
    }

    // Employees can only access their own data
    if (req.user.role === 'employee') {
      const employeeId = req.params.employeeId || req.query.employeeId;

      // If requesting specific employee data, must be own data
      if (employeeId && employeeId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Can only access your own data'
        });
      }

      // Force filter to own employee ID
      req.employeeFilter = { employeeId: req.user.id };
    }

    next();
  } catch (error) {
    logger.error(`Employee access check error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  checkTenantAccess,
  enforceTenantFilter,
  checkSalonOwnership,
  checkEmployeeAccess
};
