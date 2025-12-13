import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * ? SRE FIX #33: File Upload Validation
 * Prevents file upload bombs, validates type and size
 */

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Max image dimensions
const MAX_IMAGE_WIDTH = 4000;
const MAX_IMAGE_HEIGHT = 4000;

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
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter: Validate MIME type and extension
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  if (!allowedExts.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: ${allowedExts.join(', ')}`), false);
  }
  
  cb(null, true);
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
 * Validate image dimensions after upload
 * Use with sharp: npm install sharp
 */
export const validateImageDimensions = async (filePath) => {
  try {
    // Lazy load sharp (only if needed)
    const sharp = (await import('sharp')).default;
    
    const metadata = await sharp(filePath).metadata();
    
    if (metadata.width > MAX_IMAGE_WIDTH || metadata.height > MAX_IMAGE_HEIGHT) {
      // Delete invalid file
      fs.unlinkSync(filePath);
      
      throw new Error(
        `Image dimensions too large. Max: ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px, ` +
        `got: ${metadata.width}x${metadata.height}px`
      );
    }
    
    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  } catch (error) {
    // If sharp not installed, skip dimension check (backwards compatible)
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.warn('?? sharp not installed - skipping image dimension validation');
      return { valid: true, skipped: true };
    }
    
    throw error;
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
  sanitizeFilename,
  handleUploadError
};
