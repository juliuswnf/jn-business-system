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

const { protect } = authMiddleware;

const router = express.Router();

// ==================== ROUTES ====================

// Create progress entry (Protected - Trainer only)
router.post('/', protect, createProgressEntry);

// Upload progress photos (Protected - Trainer only)
// ? SECURITY FIX: Uses centralized file upload validation with Sharp dimension check
router.post('/:id/photos', protect, upload.single('photo'), handleUploadError, async (req, res, next) => {
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
router.get('/client/:customerId', protect, getClientProgressHistory);

// Get progress summary (Protected)
router.get('/client/:customerId/summary', protect, getProgressSummary);

// Update progress entry (Protected - Trainer only)
router.patch('/:id', protect, updateProgressEntry);

// Delete progress entry (Protected - Trainer only)
router.delete('/:id', protect, deleteProgressEntry);

// Get weight trend (Protected)
router.get('/client/:customerId/weight-trend', protect, getWeightTrend);

// Get performance trend (Protected)
router.get('/client/:customerId/performance-trend', protect, getPerformanceTrend);

// Get trainer statistics (Protected - Trainer only)
router.get('/trainer/:trainerId/statistics', protect, getTrainerStatistics);

export default router;

