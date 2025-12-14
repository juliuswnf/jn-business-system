import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

// Configure Cloudinary
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  logger.info('? Cloudinary configured successfully');
} else {
  // Cloudinary is optional - local storage is used as fallback
  // Only log in production environment
  if (process.env.NODE_ENV === 'production') {
    logger.warn('?? Cloudinary not configured in production - using local storage');
  }
}

/**
 * Upload an image to Cloudinary
 * @param {string} filePath - Local file path to upload
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g., 'portfolios', 'progress')
 * @param {string} options.publicId - Optional custom public ID
 * @param {object} options.transformation - Optional transformations
 * @returns {Promise<object>} - Upload result with URL and public_id
 */
export async function uploadToCloudinary(filePath, options = {}) {
  if (!isCloudinaryConfigured()) {
    logger.warn('?? Cloudinary not configured - skipping upload');
    return {
      url: `/uploads/${path.basename(filePath)}`,
      public_id: null,
      isLocal: true
    };
  }

  try {
    const uploadOptions = {
      folder: options.folder || 'jn-business',
      resource_type: 'auto',
      ...options
    };

    // Add transformations for images
    if (!options.transformation && filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
        { fetch_format: 'auto' }
      ];
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    logger.info(`? Uploaded to Cloudinary: ${result.public_id}`);

    // Delete local file after successful upload
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`??? Deleted local file: ${filePath}`);
      }
    } catch (deleteError) {
      logger.warn(`?? Failed to delete local file: ${deleteError.message}`);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      isLocal: false
    };
  } catch (error) {
    logger.error(`? Cloudinary upload failed: ${error.message}`);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public_id to delete
 * @returns {Promise<object>} - Deletion result
 */
export async function deleteFromCloudinary(publicId) {
  if (!isCloudinaryConfigured()) {
    logger.warn('?? Cloudinary not configured - skipping delete');
    return { result: 'not_found', isLocal: true };
  }

  if (!publicId) {
    logger.warn('?? No public_id provided for deletion');
    return { result: 'not_found' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      logger.info(`? Deleted from Cloudinary: ${publicId}`);
    } else {
      logger.warn(`?? Cloudinary delete result: ${result.result} for ${publicId}`);
    }

    return result;
  } catch (error) {
    logger.error(`? Cloudinary delete failed: ${error.message}`);
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
}

/**
 * Generate a signed URL for private Cloudinary resources
 * @param {string} publicId - Cloudinary public_id
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {string} - Signed URL
 */
export function generateSignedUrl(publicId, expiresIn = 3600) {
  if (!isCloudinaryConfigured()) {
    return `/uploads/${publicId}`;
  }

  try {
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;

    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      secure: true,
      expiration: timestamp
    });

    return signedUrl;
  } catch (error) {
    logger.error(`? Failed to generate signed URL: ${error.message}`);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Generate a thumbnail URL for an image
 * @param {string} publicId - Cloudinary public_id
 * @param {object} options - Thumbnail options
 * @param {number} options.width - Thumbnail width (default: 400)
 * @param {number} options.height - Thumbnail height (default: 400)
 * @returns {string} - Thumbnail URL
 */
export function generateThumbnailUrl(publicId, options = {}) {
  if (!isCloudinaryConfigured()) {
    return `/uploads/${publicId}`;
  }

  const { width = 400, height = 400 } = options;

  try {
    const thumbnailUrl = cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      secure: true
    });

    return thumbnailUrl;
  } catch (error) {
    logger.error(`? Failed to generate thumbnail URL: ${error.message}`);
    throw new Error(`Failed to generate thumbnail URL: ${error.message}`);
  }
}

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  generateSignedUrl,
  generateThumbnailUrl,
  isCloudinaryConfigured
};
