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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname));
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
