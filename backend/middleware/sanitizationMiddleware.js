import createDOMPurify from 'isomorphic-dompurify';
import logger from '../utils/logger.js';

/**
 * Input Sanitization Middleware
 * Protects against XSS attacks by sanitizing all string inputs
 */

const DOMPurify = createDOMPurify();

// Sanitize single value
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value);
  }

  return value;
};

// Recursively sanitize object
const sanitizeObject = (obj) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
};

// Middleware to sanitize request body, query, and params
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query params
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    next(error);
  }
};

// Strict sanitization for HTML content (allow some safe tags)
export const sanitizeHTML = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string' && value.includes('<')) {
          req.body[key] = DOMPurify.sanitize(value, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'target']
          });
        }
      }
    }
    next();
  } catch (error) {
    logger.error('HTML sanitization error:', error);
    next(error);
  }
};

export default { sanitizeInput, sanitizeHTML };
