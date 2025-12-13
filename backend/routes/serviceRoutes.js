import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkTenantAccess, enforceTenantFilter } from '../middleware/tenantMiddleware.js';
import { mutationLimiter } from '../middleware/rateLimiterMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// Apply tenant filter
router.use(enforceTenantFilter);

// Get all services for salon (filtered by tenant)
router.get('/', async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);

    // Use tenantFilter from middleware (CEO can see all if no filter)
    const filter = req.tenantFilter.salonId
      ? { salonId: req.tenantFilter.salonId }
      : {};

    const services = await Service.find(filter)
      .select('-__v')
      .limit(100);

    return res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get service by ID (with tenant check)
router.get('/:id', checkTenantAccess('service'), async (req, res) => {
  try {
    // Resource already loaded by middleware
    return res.json({ success: true, data: req.resource });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ? HIGH FIX #10: Create service with rate limiter
router.post('/', mutationLimiter, async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);

    // Use salonId from tenant filter (user's salon)
    const salonId = req.tenantFilter.salonId || req.user.salonId || req.user._id;

    const service = new Service({
      ...req.body,
      salonId
    });

    await service.save();
    logger.log(`? Service created: ${service.name} for salon ${salonId}`);
    return res.status(201).json({ success: true, data: service });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ? HIGH FIX #10: Update service with rate limiter
router.put('/:id', mutationLimiter, checkTenantAccess('service'), async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);

    // Prevent changing salonId - extract and discard it from the update
    // eslint-disable-next-line no-unused-vars
    const { salonId, ...updateData } = req.body;

    // ? OPTIMISTIC LOCKING - load, check version, update, save
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check version if client provided it (prevents lost updates)
    if (updateData.__v !== undefined && updateData.__v !== service.__v) {
      return res.status(409).json({
        success: false,
        message: 'Conflict - Service was modified by another user. Please refresh and try again.',
        currentVersion: service.__v
      });
    }

    // Apply updates
    Object.assign(service, updateData);

    // Save with version increment
    await service.save();

    logger.log(`? Service updated: ${service.name} (version ${service.__v})`);
    return res.json({ success: true, data: service });
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({
        success: false,
        message: 'Conflict - Service was modified by another user. Please refresh and try again.'
      });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ? HIGH FIX #10: Delete service with rate limiter
router.delete('/:id', mutationLimiter, checkTenantAccess('service'), async (req, res) => {
  try {
    const { Service } = await import('../models/index.js').then(m => m.default);

    // ? SOFT DELETE - load first, then soft delete with audit trail
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Soft delete with user ID for audit trail
    await service.softDelete(req.user._id);

    logger.log(`??? Service soft-deleted: ${service.name} by user ${req.user._id}`);
    return res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
