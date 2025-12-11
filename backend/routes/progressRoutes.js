import express from 'express';
import multer from 'multer';
import path from 'path';
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

const { protect } = authMiddleware;

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/progress/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'progress-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
    }
  }
});

// ==================== ROUTES ====================

// Create progress entry (Protected - Trainer only)
router.post('/', protect, createProgressEntry);

// Upload progress photos (Protected - Trainer only)
router.post('/:id/photos', protect, upload.single('photo'), uploadProgressPhotos);

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

