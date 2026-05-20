/**
 * Branding Routes - Custom Styling & White-Label
 *
 * @route /api/branding
 */

import express from 'express';
import path from 'path';
import {
  getBranding,
  updateBranding,
  uploadLogo,
  deleteLogo,
  resetBranding
} from '../controllers/brandingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
// ? SECURITY FIX: Use centralized file upload middleware
import { upload, validateImageDimensions, handleUploadError } from '../middleware/fileUploadMiddleware.js';

const router = express.Router();
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// All routes require authentication (applied in server.js)
router.use(authMiddleware.requireRole('salon_owner', 'ceo'));

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
    if (req.file) {
      if (!ALLOWED_LOGO_MIME_TYPES.has(req.file.mimetype)) {
        const fs = await import('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (_unlinkError) {
          // Ignore cleanup errors
        }

        return res.status(400).json({
          success: false,
          message: 'Nur JPEG, PNG oder WEBP sind erlaubt'
        });
      }

      if (req.file.size > MAX_LOGO_SIZE_BYTES) {
        const fs = await import('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (_unlinkError) {
          // Ignore cleanup errors
        }

        return res.status(400).json({
          success: false,
          message: 'Datei zu groß. Maximal 5MB erlaubt'
        });
      }

      const baseFilename = path.basename(req.file.filename);
      if (baseFilename !== req.file.filename || req.file.filename.includes('..')) {
        const fs = await import('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (_unlinkError) {
          // Ignore cleanup errors
        }

        return res.status(400).json({
          success: false,
          message: 'Ungültiger Dateiname'
        });
      }
    }

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
