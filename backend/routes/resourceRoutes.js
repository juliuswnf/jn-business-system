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

const { protect } = authMiddleware;

const router = express.Router();

// ==================== ROUTES ====================

// Create resource (Protected - Salon owner only)
router.post('/', protect, createResource);

// Get all resources for a salon (Public/Protected)
router.get('/salon/:salonId', getSalonResources);

// Get resource by ID (Public/Protected)
router.get('/:id', getResourceById);

// Check resource availability (Public - For booking flow)
router.get('/:id/availability', checkResourceAvailability);

// Update resource (Protected - Salon owner only)
router.patch('/:id', protect, updateResource);

// Schedule maintenance (Protected - Salon owner only)
router.post('/:id/maintenance', protect, scheduleMaintenance);

// Delete resource (Protected - Salon owner only)
router.delete('/:id', protect, deleteResource);

// Get resource utilization (Protected - Salon owner only)
router.get('/:id/utilization', protect, getResourceUtilization);

// Get available resources for a specific service (Public - For booking flow)
router.get('/salon/:salonId/service/:serviceId/available', getAvailableResourcesForService);

export default router;

