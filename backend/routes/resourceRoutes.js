import express from 'express';
import {
  createResource,
  getSalonResources,
  getResourceById,
  checkResourceAvailability,
  updateResource,
  scheduleMaintenance,
  deleteResource,
  getResourceUtilization,
  getAvailableResourcesForService
} from '../controllers/resourceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const { protect, requireRole } = authMiddleware;
const requireResourceRole = requireRole('salon_owner', 'employee', 'admin', 'ceo');

const router = express.Router();

// ==================== ROUTES ====================

// Create resource (Protected - Salon owner only)
router.post('/', protect, requireResourceRole, createResource);

// Get all resources for a salon (Protected - management)
router.get('/salon/:salonId', protect, requireResourceRole, getSalonResources);

// Get resource by ID (Protected - management)
router.get('/:id', protect, requireResourceRole, getResourceById);

// Check resource availability (Public - For booking flow)
router.get('/:id/availability', checkResourceAvailability);

// Update resource (Protected - Salon owner only)
router.patch('/:id', protect, requireResourceRole, updateResource);

// Schedule maintenance (Protected - Salon owner only)
router.post('/:id/maintenance', protect, requireResourceRole, scheduleMaintenance);

// Delete resource (Protected - Salon owner only)
router.delete('/:id', protect, requireResourceRole, deleteResource);

// Get resource utilization (Protected - Salon owner only)
router.get('/:id/utilization', protect, requireResourceRole, getResourceUtilization);

// Get available resources for a specific service (Public - For booking flow)
router.get('/salon/:salonId/service/:serviceId/available', getAvailableResourcesForService);

export default router;

