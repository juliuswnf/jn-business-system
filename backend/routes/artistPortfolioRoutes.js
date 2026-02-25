import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import {
  uploadPortfolioItem,
  getPublicPortfolio,
  getArtistPortfolio,
  updatePortfolioItem,
  deletePortfolioItem,
  toggleFeatured,
  incrementViews,
  incrementLikes
} from '../controllers/artistPortfolioController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';

const { protect } = authMiddleware;

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/portfolios/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Security: Strict file validation
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Only one file per request
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
    }

    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }

    // Validate filename (prevent path traversal)
    const filename = path.basename(file.originalname);
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return cb(new Error('Invalid filename'), false);
    }

    cb(null, true);
  }
});

// ==================== ROUTES ====================

// Create/Upload portfolio item (Protected - Artist only)
// ? SECURITY FIX: Uses centralized file upload validation with Sharp dimension check
router.post('/upload', protect, checkFeatureAccess('portfolioManagement'), upload.single('image'), async (req, res, next) => {
  try {
    // ? SECURITY FIX: Validate image dimensions with Sharp
    if (req.file) {
      const { validateImageDimensions } = await import('../middleware/fileUploadMiddleware.js');
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
}, uploadPortfolioItem);

// Get public portfolio for a salon
router.get('/salon/:salonId', getPublicPortfolio);

// Get artist-specific portfolio
router.get('/artist/:artistId', getArtistPortfolio);

// Update portfolio item (Protected - Artist only)
router.patch('/:id', protect, checkFeatureAccess('portfolioManagement'), updatePortfolioItem);

// Delete portfolio item (Protected - Artist only)
router.delete('/:id', protect, checkFeatureAccess('portfolioManagement'), deletePortfolioItem);

// Toggle featured status (Protected - Artist only)
router.patch('/:id/feature', protect, checkFeatureAccess('portfolioManagement'), toggleFeatured);

// Increment view count (Public)
router.post('/:id/view', incrementViews);

// Increment likes (Public)
router.post('/:id/like', incrementLikes);

export default router;
