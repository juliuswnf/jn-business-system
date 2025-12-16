import logger from '../utils/logger.js';

/**
 * Input Sanitization Middleware
 * Protects against XSS attacks by sanitizing all string inputs
 * Uses regex-based sanitization (lightweight, no jsdom dependency)
 * Works with express-mongo-sanitize and xss-clean for defense-in-depth
 */

// Simple HTML tag stripper (removes all HTML tags)
const stripHTML = (str) => {
  if (typeof str !== 'string') return str;

  // Remove all HTML tags
  let cleaned = str.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Remove script event handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return cleaned.trim();
};

// Sanitize single value
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return stripHTML(value);
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
          // Allow only safe HTML tags for rich content
          let cleaned = value;

          // Remove dangerous tags (script, iframe, object, embed, etc.)
          const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'meta', 'base'];
          dangerousTags.forEach(tag => {
            const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
            cleaned = cleaned.replace(regex, '');
            cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
          });

          // Remove event handlers from all tags
          cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
          cleaned = cleaned.replace(/javascript:/gi, '');

          req.body[key] = cleaned;
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
