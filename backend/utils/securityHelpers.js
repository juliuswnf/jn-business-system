/**
 * SECURITY HELPERS - Centralized Security Functions
 * Fixes Codacy Critical Issues
 */

import crypto from 'crypto';
import path from 'path';

// ==================== CRYPTO FIXES ====================

/**
 * Generate cryptographically secure random ID
 * FIXES: Math.random() → crypto.randomBytes()
 */
export const generateSecureId = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure unique suffix for file uploads
 * FIXES: Date.now() + Math.random() → crypto-based
 */
export const generateSecureFileSuffix = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
};

/**
 * Generate secure session ID
 * FIXES: Math.random().toString(36) → crypto-based
 */
export const generateSecureSessionId = (prefix = 'session') => {
  const random = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${Date.now()}_${random}`;
};

/**
 * Generate secure random number in range
 * FIXES: Math.random() for security contexts
 */
export const generateSecureRandomInt = (min, max) => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const randomBytes = crypto.randomBytes(bytesNeeded);
  const randomNumber = randomBytes.readUIntBE(0, bytesNeeded);
  return min + (randomNumber % range);
};

// ==================== INPUT SANITIZATION ====================

/**
 * Sanitize MongoDB query parameters
 * FIXES: NoSQL Injection via findOne/find
 */
export const sanitizeMongoQuery = (input) => {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(input)) {
    // Block $operators and prototype pollution
    if (key.startsWith('$') || key.startsWith('_') || key === '__proto__' || key === 'constructor') {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Escape RegExp special characters
 * FIXES: DoS via RegExp with user input
 */
export const escapeRegExp = (string) => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Safe RegExp constructor with user input
 * FIXES: new RegExp(userInput) vulnerability
 */
export const createSafeRegExp = (pattern, flags = 'i') => {
  const escaped = escapeRegExp(pattern);
  return new RegExp(escaped, flags);
};

// ==================== HTML/XSS PROTECTION ====================

/**
 * Escape HTML entities to prevent XSS
 * FIXES: User data in HTML templates
 */
export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') {
    return String(unsafe);
  }

  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Safe HTML template interpolation
 * FIXES: XSS in email templates
 */
export const safeHtmlTemplate = (template, data) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const escaped = escapeHtml(value);
    const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
    result = result.replace(regex, escaped);
  }
  return result;
};

// ==================== FILE PATH PROTECTION ====================

/**
 * Validate and sanitize file path
 * FIXES: Path traversal attacks
 */
export const sanitizeFilePath = (userPath, baseDir) => {
  // Normalize to prevent ../../../etc/passwd
  const normalized = path.normalize(userPath);

  // Resolve to absolute path
  const resolved = path.resolve(baseDir, normalized);

  // Ensure it's within baseDir
  const relative = path.relative(baseDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file path: Path traversal detected');
  }

  return resolved;
};

/**
 * Safe file path join
 * FIXES: User input in path.join()
 */
export const safePathJoin = (baseDir, ...parts) => {
  const joined = path.join(baseDir, ...parts);
  const normalized = path.normalize(joined);

  // Ensure result is within baseDir
  if (!normalized.startsWith(baseDir)) {
    throw new Error('Invalid file path: Attempted directory traversal');
  }

  return normalized;
};

// ==================== URL VALIDATION ====================

/**
 * Validate URL to prevent SSRF/Open Redirect
 * FIXES: User-controlled URLs in fetch/redirect
 */
export const validateUrl = (url, allowedDomains = []) => {
  try {
    const parsed = new URL(url);

    // Block dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Check allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        throw new Error('Domain not allowed');
      }
    }

    return parsed.href;
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
};

/**
 * Safe redirect with whitelist
 * FIXES: Open redirect vulnerability
 */
export const safeRedirect = (res, url, allowedDomains = []) => {
  try {
    const validatedUrl = validateUrl(url, allowedDomains);
    return res.redirect(validatedUrl);
  } catch (error) {
    // Fallback to safe default
    return res.redirect('/');
  }
};

// ==================== TIMING-SAFE COMPARISONS ====================

/**
 * Timing-safe string comparison
 * FIXES: Timing attack vulnerabilities in password/token comparison
 */
export const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return crypto.timingSafeEqual(bufA, bufB);
};

// ==================== PROTOTYPE POLLUTION PROTECTION ====================

/**
 * Safe object property access
 * FIXES: Prototype pollution via object[key]
 */
export const safeObjectGet = (obj, path) => {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of keys) {
    // Block dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }

    if (current === null || current === undefined) {
      return undefined;
    }

    current = current[key];
  }

  return current;
};

/**
 * Safe object merge (prevent prototype pollution)
 */
export const safeMerge = (target, source) => {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    result[key] = value;
  }

  return result;
};

// ==================== EXPORT ALL ====================

export default {
  generateSecureId,
  generateSecureFileSuffix,
  generateSecureSessionId,
  generateSecureRandomInt,
  sanitizeMongoQuery,
  escapeRegExp,
  createSafeRegExp,
  escapeHtml,
  safeHtmlTemplate,
  sanitizeFilePath,
  safePathJoin,
  validateUrl,
  safeRedirect,
  timingSafeEqual,
  safeObjectGet,
  safeMerge
};
