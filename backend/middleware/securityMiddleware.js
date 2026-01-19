/**
 * Security Middleware Suite
 * Version: 1.0.0
 * Provides: Rate limiting, input validation, XSS/CSRF protection
 */

// ==================== CUSTOM RATE LIMITERS ====================

const requestCounts = new Map();
const failedLoginAttempts = new Map();

export const generalLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `general:${ip}`;
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000; // 15 min
  const maxRequests = 100;

  if (!requestCounts.has(key)) {requestCounts.set(key, []);}

  let requests = requestCounts.get(key);
  requests = requests.filter(time => now - time < timeWindow);
  requestCounts.set(key, requests);

  if (requests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen - bitte später versuchen'
    });
  }

  requests.push(now);
  next();
};

export const authLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `auth:${ip}`;
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000;
  const maxRequests = 5;

  if (!requestCounts.has(key)) {requestCounts.set(key, []);}

  let requests = requestCounts.get(key);
  requests = requests.filter(time => now - time < timeWindow);
  requestCounts.set(key, requests);

  if (requests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele Anmeldeversuche - Konto gesperrt'
    });
  }

  requests.push(now);
  next();
};

export const passwordResetLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `password:${ip}`;
  const now = Date.now();
  const timeWindow = 60 * 60 * 1000;
  const maxRequests = 5;

  if (!requestCounts.has(key)) {requestCounts.set(key, []);}

  let requests = requestCounts.get(key);
  requests = requests.filter(time => now - time < timeWindow);
  requestCounts.set(key, requests);

  if (requests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele Password Reset Anfragen'
    });
  }

  requests.push(now);
  next();
};

export const apiLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `api:${ip}`;
  const now = Date.now();
  const timeWindow = 15 * 60 * 1000;
  const maxRequests = 1000;

  if (!requestCounts.has(key)) {requestCounts.set(key, []);}

  let requests = requestCounts.get(key);
  requests = requests.filter(time => now - time < timeWindow);
  requestCounts.set(key, requests);

  if (requests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'API Limit überschritten'
    });
  }

  requests.push(now);
  next();
};

// ==================== INPUT/OUTPUT SECURITY ====================

export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type muss application/json sein'
      });
    }
  }
  next();
};

export const bruteForcePrevention = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const maxAttempts = 5;
  const lockoutTime = 15 * 60 * 1000; // 15 min

  if (!failedLoginAttempts.has(ip)) {
    failedLoginAttempts.set(ip, { attempts: 0, lockedUntil: 0 });
  }

  const attempt = failedLoginAttempts.get(ip);

  // Check if IP is locked
  if (attempt.lockedUntil > Date.now()) {
    return res.status(429).json({
      success: false,
      message: 'Zu viele fehlgeschlagene Versuche - Konto vorübergehend gesperrt'
    });
  }

  // Reset if lock time expired
  if (attempt.lockedUntil <= Date.now() && attempt.attempts > 0) {
    attempt.attempts = 0;
  }

  // Check if max attempts reached
  if (attempt.attempts >= maxAttempts) {
    attempt.lockedUntil = Date.now() + lockoutTime;
    return res.status(429).json({
      success: false,
      message: 'Konto gesperrt - zu viele Versuche'
    });
  }

  next();
};

export const recordFailedLogin = (ip) => {
  if (failedLoginAttempts.has(ip)) {
    const attempt = failedLoginAttempts.get(ip);
    attempt.attempts++;
  }
};

export const xssProtection = (req, res, next) => {
  res.set('X-XSS-Protection', '1; mode=block');
  next();
};

import crypto from 'crypto';

// CSRF Token storage (in production, use Redis or database)
const csrfTokens = new Map();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Cleanup expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of csrfTokens.entries()) {
    if (now > expiry) {
      csrfTokens.delete(token);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export const generateCSRFToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + CSRF_TOKEN_EXPIRY;
  csrfTokens.set(token, expiry);
  res.locals.csrfToken = token;
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY
  });
  next();
};

export const validateCSRFToken = (req, res, next) => {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for webhook endpoints (they use signature validation)
  if (req.path.includes('/webhooks/')) {
    return next();
  }

  // Get token from header or cookie
  const token = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.body._csrf;
  const cookieToken = req.cookies?.['XSRF-TOKEN'];

  if (!token || !cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing'
    });
  }

  // Validate tokens match
  if (token !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  // Check if token exists and is not expired
  if (!csrfTokens.has(token) || csrfTokens.get(token) < Date.now()) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token expired'
    });
  }

  // Remove token after use (one-time use for sensitive operations)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) && 
      (req.path.includes('/auth/') || req.path.includes('/payment/'))) {
    csrfTokens.delete(token);
  }

  next();
};

// Legacy export for backwards compatibility
export const csrfProtection = generateCSRFToken;

export const sqlInjectionPrevention = (req, res, next) => {
  // Wird durch MongoDB handled (nicht SQL)
  next();
};

export const securityHeaders = (req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

export const validateInput = (req, res, next) => {
  const inputs = { ...req.body, ...req.query };
  for (const value of Object.values(inputs)) {
    if (typeof value === 'string' && /<script|javascript:|onerror=/i.test(value)) {
      return res.status(400).json({
        success: false,
        message: 'Ungültige Eingabe - verdächtige Zeichen erkannt'
      });
    }
  }
  next();
};

export const sanitizeOutput = (data) => {
  if (typeof data === 'string') {
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  return data;
};

export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || 0);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Anfragegröße zu groß (max 10MB)'
    });
  }
  next();
};

export const timeoutProtection = (timeout = 30000) => (req, res, next) => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request abgelaufen'
      });
    }
  }, timeout);

  res.on('finish', () => clearTimeout(timeoutId));
  next();
};

// ==================== EXPORT ====================

export default {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  apiLimiter,
  validateContentType,
  bruteForcePrevention,
  recordFailedLogin,
  xssProtection,
  csrfProtection,
  generateCSRFToken, // ? SECURITY FIX: Export CSRF token generation
  validateCSRFToken, // ? SECURITY FIX: Export CSRF token validation
  sqlInjectionPrevention,
  securityHeaders,
  validateInput,
  sanitizeOutput,
  requestSizeLimit,
  timeoutProtection
};
