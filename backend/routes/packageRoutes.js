import express from 'express';
import {
  createPackage,
  getAvailablePackages,
  purchasePackage,
  getCustomerPackages,
  usePackageSession,
  cancelPackage,
  updatePackage,
  deletePackage,
  getPackageStatistics
} from '../controllers/packageController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const { protect } = authMiddleware;

const router = express.Router();

// ==================== ROUTES ====================

// Create package (Protected - Salon owner only)
router.post('/', protect, createPackage);

// Get available packages for a salon (Public)
router.get('/salon/:salonId', getAvailablePackages);

// Purchase package (Public/Protected)
router.post('/:id/purchase', purchasePackage);

// Get customer's purchased packages (Public/Protected)
router.get('/customer/:customerId', getCustomerPackages);

// Use session from package (Protected)
router.post('/customer-package/:id/use', protect, usePackageSession);

// Cancel package (Protected)
router.post('/customer-package/:id/cancel', protect, cancelPackage);

// Update package (Protected - Salon owner only)
router.patch('/:id', protect, updatePackage);

// Delete package (Protected - Salon owner only)
router.delete('/:id', protect, deletePackage);

// Get package statistics (Protected - Salon owner only)
router.get('/salon/:salonId/statistics', protect, getPackageStatistics);

export default router;

