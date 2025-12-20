/**
 * Branding Routes - Custom Styling & White-Label
 *
 * @route /api/branding
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
  resetBranding
} from '../controllers/brandingController.js';

const router = express.Router();

// Setup file upload for logos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/logos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `logo-${req.user.salonId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nur JPEG, PNG, SVG und WebP Dateien sind erlaubt'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter
});

// All routes require authentication (applied in server.js)

/**
 * @route   GET /api/branding
 * @desc    Get current branding settings
 * @access  Protected (salon_owner)
 */
router.get('/', getBranding);

/**
 * @route   PUT /api/branding
 * @desc    Update branding settings (colors, font, etc.)
 * @access  Protected (salon_owner, Professional+ tier)
 */
router.put('/', updateBranding);

/**
 * @route   POST /api/branding/logo
 * @desc    Upload salon logo
 * @access  Protected (salon_owner, Professional+ tier)
 */
router.post('/logo', upload.single('logo'), uploadLogo);

/**
 * @route   DELETE /api/branding/logo
 * @desc    Delete salon logo
 * @access  Protected (salon_owner)
 */
router.delete('/logo', deleteLogo);

/**
 * @route   POST /api/branding/reset
 * @desc    Reset branding to defaults
 * @access  Protected (salon_owner)
 */
router.post('/reset', resetBranding);

export default router;
