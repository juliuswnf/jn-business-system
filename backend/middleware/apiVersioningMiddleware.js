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
  const versionedPath = req.path.replace('/api/', '/api/v1/');
  req.url = versionedPath + (req.url.includes('?') ? req.url.substring(req.path.length) : '');
  req.path = versionedPath;

  logger.log(`🔄 API versioning: ${req.method} ${req.originalUrl} → ${req.path}`);

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

