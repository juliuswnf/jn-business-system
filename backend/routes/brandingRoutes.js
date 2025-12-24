/**
 * Branding Routes - Custom Styling & White-Label
 *
 * @route /api/branding
 */

import express from 'express';
import {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
  resetBranding
} from '../controllers/brandingController.js';
// ? SECURITY FIX: Use centralized file upload middleware
import { upload, validateImageDimensions, handleUploadError } from '../middleware/fileUploadMiddleware.js';

const router = express.Router();

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
 * ? SECURITY FIX: Uses centralized file upload validation with Sharp dimension check
 */
router.post('/logo', upload.single('logo'), handleUploadError, async (req, res, next) => {
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
}, uploadLogo);

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
