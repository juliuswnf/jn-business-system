import express from 'express';
import multer from 'multer';
import path from 'path';
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
router.post('/upload', protect, upload.single('image'), uploadPortfolioItem);

// Get public portfolio for a salon
router.get('/salon/:salonId', getPublicPortfolio);

// Get artist-specific portfolio
router.get('/artist/:artistId', getArtistPortfolio);

// Update portfolio item (Protected - Artist only)
router.patch('/:id', protect, updatePortfolioItem);

// Delete portfolio item (Protected - Artist only)
router.delete('/:id', protect, deletePortfolioItem);

// Toggle featured status (Protected - Artist only)
router.patch('/:id/feature', protect, toggleFeatured);

// Increment view count (Public)
router.post('/:id/view', incrementViews);

// Increment likes (Public)
router.post('/:id/like', incrementLikes);

export default router;
