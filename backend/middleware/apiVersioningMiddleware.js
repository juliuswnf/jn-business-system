/**
 * API Versioning Middleware
 * ? SECURITY FIX: Implements API versioning with backward compatibility
 *
 * Routes are now versioned as /api/v1/*
 * Old routes /api/* are automatically forwarded to /api/v1/* for backward compatibility
 */

import logger from '../utils/logger.js';

/**
 * Middleware to handle API versioning
 * Forwards /api/* requests to /api/v1/* for backward compatibility
 */
export const apiVersioningMiddleware = (req, res, next) => {
  // Skip if already versioned
  if (req.path.startsWith('/api/v1/') || req.path.startsWith('/api/v2/')) {
    return next();
  }

  // Skip non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Skip webhooks (they have their own versioning)
  if (req.path.startsWith('/api/webhooks/')) {
    return next();
  }

  // Skip health check and metrics
  if (req.path === '/health' || req.path === '/api/metrics') {
    return next();
  }

  // Forward /api/* to /api/v1/* for backward compatibility
  // Note: req.path is read-only, so we manipulate req.url instead
  const originalPath = req.path;
  const versionedPath = originalPath.replace('/api/', '/api/v1/');
  
  // Preserve query string if present
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  
  // Update req.url - Express will recalculate req.path from this
  req.url = versionedPath + queryString;
  
  // Also update req.baseUrl if needed (for sub-routers)
  if (req.baseUrl && req.baseUrl.startsWith('/api/') && !req.baseUrl.startsWith('/api/v')) {
    req.baseUrl = req.baseUrl.replace('/api/', '/api/v1/');
  }

  // Only log in development to reduce noise
  if (process.env.NODE_ENV === 'development') {
    logger.log(`🔄 API versioning: ${req.method} ${req.originalUrl} → ${versionedPath}`);
  }

  next();
};

/**
 * Get API version from request
 */
export const getApiVersion = (req) => {
  if (req.path.startsWith('/api/v2/')) {
    return 'v2';
  }
  if (req.path.startsWith('/api/v1/')) {
    return 'v1';
  }
  return 'v1'; // Default to v1 for backward compatibility
};

export default {
  apiVersioningMiddleware,
  getApiVersion
};

