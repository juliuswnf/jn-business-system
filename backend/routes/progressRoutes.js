import express from 'express';
import {
  createProgressEntry,
  uploadProgressPhotos,
  getClientProgressHistory,
  getProgressSummary,
  updateProgressEntry,
  deleteProgressEntry,
  getWeightTrend,
  getPerformanceTrend,
  getTrainerStatistics
} from '../controllers/progressController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// ? SECURITY FIX: Use centralized file upload middleware
import { upload, validateImageDimensions, handleUploadError } from '../middleware/fileUploadMiddleware.js';

const { protect, requireRole } = authMiddleware;
const requireProgressRole = requireRole('salon_owner', 'employee', 'admin', 'ceo');

const router = express.Router();

// ==================== ROUTES ====================

// Create progress entry (Protected - Trainer only)
router.post('/', protect, requireProgressRole, createProgressEntry);

// Upload progress photos (Protected - Trainer only)
// ? SECURITY FIX: Uses centralized file upload validation with Sharp dimension check
router.post('/:id/photos', protect, requireProgressRole, upload.single('photo'), handleUploadError, async (req, res, next) => {
  try {
    // ? SECURITY FIX: Validate image dimensions with Sharp
    if (req.file) {
      await validateImageDimensions(req.file.path);
    }
    next();
  } catch (error) {
    // Clean up invalid file
    if (req.file) {
      const fs = await import('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        // Ignore cleanup errors
      }
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Image validation failed'
    });
  }
}, uploadProgressPhotos);

// Get client progress history (Protected)
router.get('/client/:customerId', protect, requireProgressRole, getClientProgressHistory);

// Get progress summary (Protected)
router.get('/client/:customerId/summary', protect, requireProgressRole, getProgressSummary);

// Update progress entry (Protected - Trainer only)
router.patch('/:id', protect, requireProgressRole, updateProgressEntry);

// Delete progress entry (Protected - Trainer only)
router.delete('/:id', protect, requireProgressRole, deleteProgressEntry);

// Get weight trend (Protected)
router.get('/client/:customerId/weight-trend', protect, requireProgressRole, getWeightTrend);

// Get performance trend (Protected)
router.get('/client/:customerId/performance-trend', protect, requireProgressRole, getPerformanceTrend);

// Get trainer statistics (Protected - Trainer only)
router.get('/trainer/:trainerId/statistics', protect, requireProgressRole, getTrainerStatistics);

export default router;

