import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * ? SECURITY FIX: File Upload Validation
 * Prevents malicious file uploads, validates type, size, and dimensions
 *
 * Features:
 * - MIME type validation
 * - File extension whitelist
 * - File size limits
 * - Image dimension validation (via Sharp)
 * - Filename sanitization
 * - Path traversal prevention
 */

// Allowed MIME types (strict whitelist)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml' // For logos
];

// Allowed file extensions (must match MIME types)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];

// Max file size: 5MB (configurable)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

// Max image dimensions (prevent image bombs)
const MAX_IMAGE_WIDTH = parseInt(process.env.MAX_IMAGE_WIDTH || '4000');
const MAX_IMAGE_HEIGHT = parseInt(process.env.MAX_IMAGE_HEIGHT || '4000');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');

    // Create directory if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename (prevent path traversal)
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// ? SECURITY FIX: File filter with comprehensive validation
const fileFilter = (req, file, cb) => {
  try {
    // 1. Validate MIME type (primary check)
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      logger.warn(`⚠️ Rejected file upload: Invalid MIME type "${file.mimetype}" from ${req.ip}`);
      return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
    }

    // 2. Validate file extension (secondary check - defense in depth)
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      logger.warn(`⚠️ Rejected file upload: Invalid extension "${ext}" from ${req.ip}`);
      return cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
    }

    // 3. Validate filename (prevent path traversal)
    const filename = path.basename(file.originalname);
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
      logger.warn(`⚠️ Rejected file upload: Dangerous filename "${filename}" from ${req.ip}`);
      return cb(new Error('Invalid filename - path traversal detected'), false);
    }

    // 4. Validate filename length
    if (filename.length > 255) {
      logger.warn(`⚠️ Rejected file upload: Filename too long from ${req.ip}`);
      return cb(new Error('Filename too long (max 255 characters)'), false);
    }

    // All checks passed
    cb(null, true);
  } catch (error) {
    logger.error('❌ File filter error:', error);
    cb(error, false);
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Max 1 file per request
  }
});

/**
 * ? SECURITY FIX: Validate image dimensions and format using Sharp
 * Prevents image bombs (extremely large images that consume memory)
 *
 * @param {string} filePath - Path to uploaded file
 * @returns {Promise<Object>} Validation result with dimensions
 */
export const validateImageDimensions = async (filePath) => {
  try {
    // Lazy load sharp (only if needed)
    const sharp = (await import('sharp')).default;

    // Get image metadata
    const metadata = await sharp(filePath).metadata();

    // Validate dimensions (prevent image bombs)
    if (metadata.width > MAX_IMAGE_WIDTH || metadata.height > MAX_IMAGE_HEIGHT) {
      // Delete invalid file immediately
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        logger.error('Failed to delete invalid image:', unlinkError);
      }

      throw new Error(
        `Image dimensions too large. Max: ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px, ` +
        `got: ${metadata.width}x${metadata.height}px`
      );
    }

    // Validate format (ensure it's actually an image)
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'];
    if (!validFormats.includes(metadata.format)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        logger.error('Failed to delete invalid image:', unlinkError);
      }

      throw new Error(`Invalid image format: ${metadata.format}`);
    }

    logger.log(`✅ Image validated: ${metadata.width}x${metadata.height}px, format: ${metadata.format}`);

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size || null
    };
  } catch (error) {
    // If sharp not installed, log warning but don't fail (backwards compatible)
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.warn('⚠️ sharp not installed - skipping image dimension validation');
      logger.warn('⚠️ Install sharp for full image validation: npm install sharp');
      return { valid: true, skipped: true, reason: 'sharp_not_installed' };
    }

    // Re-throw validation errors
    throw error;
  }
};

/**
 * ? SECURITY FIX: Validate file using Sharp (MIME type verification)
 * Ensures file is actually what it claims to be (not just renamed)
 */
export const validateFileWithSharp = async (filePath) => {
  try {
    const sharp = (await import('sharp')).default;

    // Try to read metadata - if it fails, file is not a valid image
    await sharp(filePath).metadata();

    return { valid: true };
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return { valid: true, skipped: true };
    }

    // File is not a valid image - delete it
    try {
      fs.unlinkSync(filePath);
    } catch (unlinkError) {
      logger.error('Failed to delete invalid file:', unlinkError);
    }

    throw new Error('File is not a valid image');
  }
};

/**
 * Sanitize filename (remove dangerous characters)
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .substring(0, 255); // Limit length
};

/**
 * Middleware: Handle file upload errors
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Max 1 file per request'
      });
    }

    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed'
    });
  }

  next();
};

/**
 * Example usage in route:
 *
 * import { upload, validateImageDimensions, handleUploadError } from './middleware/fileUploadMiddleware.js';
 *
 * router.post('/upload/logo',
 *   upload.single('logo'),
 *   handleUploadError,
 *   async (req, res) => {
 *     try {
 *       // Validate dimensions
 *       await validateImageDimensions(req.file.path);
 *
 *       // Process file...
 *       res.json({ success: true, file: req.file });
 *     } catch (error) {
 *       // Clean up on error
 *       if (req.file) fs.unlinkSync(req.file.path);
 *       res.status(400).json({ success: false, message: error.message });
 *     }
 *   }
 * );
 */

export default {
  upload,
  validateImageDimensions,
  validateFileWithSharp,
  sanitizeFilename,
  handleUploadError
};
