/**
 * CSRF Protection Middleware
 * ? SECURITY FIX: Prevents Cross-Site Request Forgery attacks
 *
 * Features:
 * - Token generation on login/registration
 * - Token validation for all state-changing operations
 * - Token expiry (1 hour)
 * - One-time use for sensitive operations
 */

import crypto from 'crypto';
import logger from '../utils/logger.js';

// CSRF Token storage (in production, use Redis or database)
const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, expiry] of csrfTokens.entries()) {
    if (now > expiry) {
      csrfTokens.delete(token);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.log(`🧹 Cleaned up ${cleaned} expired CSRF tokens`);
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

/**
 * Generate CSRF token and set as cookie
 * ? SECURITY FIX: Called after successful authentication
 */
export const generateCSRFToken = (req, res, next) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + CSRF_TOKEN_EXPIRY;
    csrfTokens.set(token, expiry);

    // Set cookie (not HTTP-only, must be readable by JavaScript)
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by JavaScript for header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY,
      path: '/'
    });

    logger.log(`🔐 CSRF token generated for ${req.ip || 'unknown'}`);

    if (next) {
      next();
    }
  } catch (error) {
    logger.error('❌ Failed to generate CSRF token:', error);
    if (next) {
      next(error);
    }
  }
};

/**
 * Validate CSRF token for state-changing operations
 * ? SECURITY FIX: Validates token on POST/PUT/DELETE/PATCH requests
 */
export const validateCSRFToken = (req, res, next) => {
  try {
    // Skip CSRF validation for safe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip for webhook endpoints (they use signature validation)
    if (req.path.includes('/webhooks/') || req.path.includes('/webhook/')) {
      return next();
    }

    // Get token from header (preferred) or body
    const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
    const bodyToken = req.body?._csrf;
    const token = headerToken || bodyToken;

    // Get token from cookie
    const cookieToken = req.cookies?.['XSRF-TOKEN'];

    // Validate token exists
    if (!token || !cookieToken) {
      logger.warn(`⚠️ CSRF token missing for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing'
      });
    }

    // Validate tokens match
    if (token !== cookieToken) {
      logger.warn(`⚠️ CSRF token mismatch for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token'
      });
    }

    // Check if token exists and is not expired
    if (!csrfTokens.has(token)) {
      logger.warn(`⚠️ CSRF token not found in storage for ${req.method} ${req.path} from ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'CSRF token not found'
      });
    }

    const expiry = csrfTokens.get(token);
    if (expiry < Date.now()) {
      logger.warn(`⚠️ CSRF token expired for ${req.method} ${req.path} from ${req.ip}`);
      csrfTokens.delete(token);
      return res.status(403).json({
        success: false,
        message: 'CSRF token expired'
      });
    }

    // Remove token after use for sensitive operations (one-time use)
    const sensitivePaths = ['/auth/', '/payment/', '/subscription/', '/gdpr/'];
    if (sensitivePaths.some(path => req.path.includes(path))) {
      csrfTokens.delete(token);
      logger.log(`🔐 CSRF token consumed (one-time use) for ${req.method} ${req.path}`);
    }

    next();
  } catch (error) {
    logger.error('❌ CSRF validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'CSRF validation failed'
    });
  }
};

/**
 * Get CSRF token status (for debugging)
 */
export const getCSRFStatus = () => {
  return {
    activeTokens: csrfTokens.size,
    expiry: CSRF_TOKEN_EXPIRY
  };
};

export default {
  generateCSRFToken,
  validateCSRFToken,
  getCSRFStatus
};

