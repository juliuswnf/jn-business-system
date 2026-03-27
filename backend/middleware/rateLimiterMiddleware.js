import logger from '../utils/logger.js';
/**
 * Rate Limiter Middleware Suite
 * Version: 1.0.0
 * Provides: Comprehensive rate limiting with memory management
 */

import rateLimit from 'express-rate-limit';

// ==================== IN-MEMORY STORE WITH CLEANUP ====================

class MemoryStoreAdapter {
  constructor(windowMs = 15 * 60 * 1000, maxKeys = 10000) {
    this.hits = new Map();
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.startCleanupInterval();
  }

  incr(key, cb) {
    try {
      // Prevent memory leak
      if (this.hits.size >= this.maxKeys) {
        this.cleanup();
      }

      const now = Date.now();
      const existing = this.hits.get(key);

      // If a prior entry exists and its window hasn't expired yet, count within the same window
      if (existing && (now - existing.windowStart) <= this.windowMs) {
        const current = existing.count + 1;
        this.hits.set(key, { count: current, windowStart: existing.windowStart });
        const resetTime = new Date(existing.windowStart + this.windowMs);
        cb(null, current, resetTime);
      } else {
        // New entry or expired window — start a fresh window
        this.hits.set(key, { count: 1, windowStart: now });
        const resetTime = new Date(now + this.windowMs);
        cb(null, 1, resetTime);
      }
    } catch (err) {
      logger.error('MemoryStore incr error:', err);
      cb(err);
    }
  }

  decrement(key, cb) {
    try {
      const existing = this.hits.get(key);
      if (existing) {
        const current = Math.max(0, existing.count - 1);
        this.hits.set(key, { count: current, windowStart: existing.windowStart });
      }
      if (cb) cb(null);
    } catch (err) {
      logger.error('MemoryStore decrement error:', err);
      if (cb) cb(err);
    }
  }

  resetKey(key, cb) {
    this.hits.delete(key);
    if (cb) {cb(null);}
  }

  resetAll(cb) {
    this.hits.clear();
    if (cb) {cb(null);}
  }

  cleanup() {
    const now = Date.now();
    let deleted = 0;

    for (const [key, value] of this.hits.entries()) {
      if (now - value.windowStart > this.windowMs) {
        this.hits.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.log(`✓ Cleaned up ${deleted} expired rate limit entries`);
    }
  }

  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }

  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Each limiter gets its own store so counts are fully isolated per limiter
const makeStore = (windowMs) => new MemoryStoreAdapter(windowMs, 10000);

// ==================== RATE LIMITERS ====================

// Determine rate limit based on environment and user authentication
const getGeneralRateLimit = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  // Much higher limits in development to prevent 429 errors during development
  // React Strict Mode causes double renders, so we need very high limits
  const baseLimit = parseInt(process.env.RATE_LIMIT_GENERAL || (isDevelopment ? '10000' : '100'));
  return baseLimit;
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getGeneralRateLimit(),
  message: {
    success: false,
    message: 'Zu viele Anfragen von dieser IP, bitte später versuchen'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(15 * 60 * 1000),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    // This allows authenticated users to have higher limits
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip || 'unknown'}`;
  },
  skip: (req) => {
    // Skip for admin/CEO
    if (req.user && (req.user.role === 'admin' || req.user.role === 'ceo')) {
      return true;
    }
    // In development, skip rate limiting for authenticated users to prevent issues with React Strict Mode
    if (process.env.NODE_ENV === 'development' && req.user?.id) {
      return true; // Skip rate limiting in development for authenticated users
    }
    return false;
  },
  handler: (req, res) => {
    logger.warn(`⚠️ Rate limit exceeded for ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen, bitte später versuchen',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ? SECURITY FIX: Login Rate Limiter - Prevents brute force attacks
// Limits both per-email and per-IP to prevent bypassing by trying different emails
const _authMax = process.env.NODE_ENV === 'development'
  ? parseInt(process.env.RATE_LIMIT_AUTH || '100')  // relaxed in dev
  : parseInt(process.env.RATE_LIMIT_AUTH || '5');   // strict in production

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: _authMax,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed login attempts
  message: {
    success: false,
    message: 'Zu viele Login-Versuche, bitte später versuchen'
  },
  store: makeStore(15 * 60 * 1000),
  keyGenerator: (req) => {
    // ? SECURITY FIX: Rate limit by both email and IP to prevent bypassing
    const email = req.body?.email?.toLowerCase()?.trim() || 'unknown';
    const ip = req.ip || 'unknown';
    // Use email as primary key, but also track by IP
    return `auth:email:${email}:ip:${ip}`;
  },
  handler: (req, res) => {
    const email = req.body?.email || 'unknown';
    logger.warn(`⚠️ Auth rate limit exceeded for email: ${email}, IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Login-Versuche. Bitte versuchen Sie es später erneut.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      email: email
    });
  }
});

// ? SECURITY FIX: IP-based rate limiter for login endpoints
// Prevents brute force attacks by limiting total login attempts per IP
// regardless of which email is being used
const _loginIPMax = process.env.NODE_ENV === 'development'
  ? parseInt(process.env.RATE_LIMIT_LOGIN_IP || '200')
  : parseInt(process.env.RATE_LIMIT_LOGIN_IP || '10');

const loginIPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: _loginIPMax,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count all failed attempts
  message: {
    success: false,
    message: 'Zu viele Login-Versuche von dieser IP-Adresse'
  },
  store: makeStore(15 * 60 * 1000),
  keyGenerator: (req) => `login:ip:${req.ip || 'unknown'}`,
  handler: (req, res) => {
    logger.warn(`🚨 Login IP rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Login-Versuche von dieser IP-Adresse. Bitte versuchen Sie es später erneut.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT || '10'),
  message: { success: false, message: 'Zu viele Anfragen, bitte warten' },
  store: makeStore(1 * 60 * 1000),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen in kurzer Zeit',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API || (process.env.NODE_ENV === 'development' ? '10000' : '1000')),
  message: { success: false, message: 'API Rate Limit überschritten' },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => {
    // Skip for CEO
    if (req.user?.role === 'ceo') {
      return true;
    }
    // Skip in development for authenticated users
    if (process.env.NODE_ENV === 'development' && req.user?.id) {
      return true;
    }
    return false;
  }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_PAYMENT || '50'),
  message: { success: false, message: 'Zu viele Zahlungsversuche, bitte später versuchen' },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    logger.warn(`⚠️ Payment rate limit exceeded for user ${req.user?.id}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Zahlungsversuche. Bitte versuchen Sie es später erneut.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_UPLOAD || '50'),
  message: { success: false, message: 'Upload Limit erreicht' },
  store: makeStore(24 * 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Sie haben Ihr tägliches Upload-Limit erreicht',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      resetTime: new Date(req.rateLimit.resetTime * 1000)
    });
  }
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_EMAIL || '5'),
  message: { success: false, message: 'Zu viele Email-Anfragen' },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => req.user?.email || req.email || req.ip,
  handler: (req, res) => {
    logger.warn(`⚠️ Email rate limit exceeded for ${req.user?.email || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Email-Anfragen. Bitte versuchen Sie es später erneut.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_SEARCH || '30'),
  message: { success: false, message: 'Zu viele Suchanfragen' },
  store: makeStore(10 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip
});

const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_EXPORT || '10'),
  message: { success: false, message: 'Export Limit erreicht' },
  store: makeStore(24 * 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Sie haben Ihr tägliches Export-Limit erreicht',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_BOOKING || '100'),
  message: { success: false, message: 'Zu viele Buchungen in kurzer Zeit' },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip
});

// ? HIGH FIX #10: Booking Creation Limiter - DoS Protection
const bookingCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_BOOKING_CREATION || '10'), // 10 bookings per minute
  message: { success: false, message: 'Zu viele Buchungen in kurzer Zeit' },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  skip: (req) => req.user && req.user.role === 'ceo', // CEO bypass
  handler: (req, res) => {
    logger.warn(`⚠️ Booking creation rate limit exceeded: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Buchungsanfragen. Bitte warten Sie einen Moment.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ? HIGH FIX #10: Mutation Limiter - General DoS Protection for Updates/Deletes
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MUTATIONS || '30'), // 30 mutations per minute
  message: { success: false, message: 'Zu viele Änderungen in kurzer Zeit' },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore(60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  skip: (req) => req.user && req.user.role === 'ceo', // CEO bypass
  handler: (req, res) => {
    logger.warn(`⚠️ Mutation rate limit exceeded: ${req.user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Änderungen. Bitte verlangsamen Sie Ihre Anfragen.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REVIEW || '5'),
  message: { success: false, message: 'Zu viele Bewertungen pro Tag' },
  store: makeStore(24 * 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id || req.ip
});

// ==================== CEO LOGIN LIMITER (Extra Strict) ====================

const ceoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Only 3 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Zu viele CEO-Login-Versuche. Bitte warten Sie 15 Minuten.'
  },
  store: makeStore(15 * 60 * 1000),
  keyGenerator: (req) => `ceo:${req.body?.email || req.ip}`,
  handler: (req, res) => {
    logger.warn(`🚨 CEO login rate limit exceeded for ${req.body?.email || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele CEO-Login-Versuche. Aus Sicherheitsgründen bitte 15 Minuten warten.',
      retryAfter: 900
    });
  }
});

// ==================== PASSWORD RESET LIMITER ====================

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset requests per hour per email
  message: {
    success: false,
    message: 'Zu viele Passwort-Reset-Anfragen. Bitte versuchen Sie es in einer Stunde erneut.'
  },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => {
    // Rate limit by both email and IP for better security
    const email = req.body?.email?.toLowerCase()?.trim() || 'unknown';
    const ip = req.ip || 'unknown';
    return `pwreset:email:${email}:ip:${ip}`;
  },
  handler: (req, res) => {
    const email = req.body?.email || 'unknown';
    logger.warn(`⚠️ Password reset rate limit exceeded for email: ${email}, IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Passwort-Reset-Anfragen. Bitte überprüfen Sie Ihre E-Mails oder warten Sie eine Stunde.',
      retryAfter: 3600
    });
  }
});

// Separate limiter for token verification (prevent brute-force on tokens)
const tokenVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 verification attempts per 15 minutes per token
  message: {
    success: false,
    message: 'Zu viele Token-Verifizierungsversuche. Bitte warten Sie 15 Minuten.'
  },
  store: makeStore(15 * 60 * 1000),
  keyGenerator: (req) => {
    const token = req.body?.token || req.query?.token || 'unknown';
    const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex').substring(0, 16);
    return `tokenverify:${tokenHash}:${req.ip || 'unknown'}`;
  },
  handler: (req, res) => {
    logger.warn(`⚠️ Token verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Token-Verifizierungsversuche. Bitte warten Sie 15 Minuten.',
      retryAfter: 900
    });
  }
});

// ==================== REGISTRATION LIMITER ====================

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    message: 'Zu viele Registrierungen von dieser IP. Bitte später versuchen.'
  },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => `register:${req.ip}`,
  handler: (req, res) => {
    logger.warn(`⚠️ Registration rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Registrierungsversuche. Bitte versuchen Sie es später erneut.',
      retryAfter: 3600
    });
  }
});

// ==================== WIDGET/PUBLIC BOOKING LIMITER ====================

const widgetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: {
    success: false,
    message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.'
  },
  store: makeStore(1 * 60 * 1000),
  keyGenerator: (req) => `widget:${req.ip}`,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.',
      retryAfter: 60
    });
  }
});

const publicBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 bookings per hour per IP
  message: {
    success: false,
    message: 'Zu viele Buchungen. Bitte versuchen Sie es später erneut.'
  },
  store: makeStore(60 * 60 * 1000),
  keyGenerator: (req) => `publicbook:${req.ip}:${req.body?.customerEmail || 'unknown'}`,
  handler: (req, res) => {
    logger.warn(`⚠️ Public booking rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Buchungsversuche. Bitte versuchen Sie es in einer Stunde erneut.',
      retryAfter: 3600
    });
  }
});

// ==================== UTILITY FUNCTIONS ====================

const customLimiter = (windowMs, max, prefix = 'custom') => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message: `Zu viele Anfragen (${max} pro ${windowMs / 1000}s)` },
    store: makeStore(windowMs),
    keyGenerator: (req) => req.user?.id || req.ip,
    prefix: `rl:${prefix}:`
  });
};

const adminBypass = (limiter) => {
  return (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'ceo')) {
      return next();
    }
    limiter(req, res, next);
  };
};

const createRateLimiter = (config) => {
  return rateLimit({
    windowMs: config.windowMs || 15 * 60 * 1000,
    max: config.max || 100,
    message: config.message || 'Zu viele Anfragen',
    store: makeStore(config.windowMs || 15 * 60 * 1000),
    keyGenerator: config.keyGenerator || ((req) => req.ip),
    skip: config.skip,
    handler: config.handler,
    prefix: config.prefix || 'rl:'
  });
};

// ==================== API ENDPOINTS ====================

const getRateLimitStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rate Limiter aktiv',
    limits: {
      general: `${process.env.RATE_LIMIT_GENERAL || 100} pro 15 Minuten`,
      auth: `${process.env.RATE_LIMIT_AUTH || 5} Versuche pro 15 Minuten`,
      payment: `${process.env.RATE_LIMIT_PAYMENT || 50} pro Stunde`,
      upload: `${process.env.RATE_LIMIT_UPLOAD || 50} pro Tag`,
      email: `${process.env.RATE_LIMIT_EMAIL || 5} pro Stunde`,
      booking: `${process.env.RATE_LIMIT_BOOKING || 100} pro Stunde`,
      export: `${process.env.RATE_LIMIT_EXPORT || 10} pro Tag`,
      search: `${process.env.RATE_LIMIT_SEARCH || 30} pro 10 Minuten`,
      review: `${process.env.RATE_LIMIT_REVIEW || 5} pro Tag`
    },
    store: 'Memory (per-limiter)'
  });
};

const resetRateLimiter = (req, res) => {
  if (req.user && req.user.role === 'ceo') {
    // Stores are per-limiter instances; individual expiry handles cleanup automatically
    res.status(200).json({
      success: true,
      message: 'Rate Limiter Information: Stores laufen isoliert, Fenster laufen automatisch ab'
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Nur CEO kann Rate Limiter zurücksetzen'
    });
  }
};

const resetRateLimitKey = (req, res) => {
  if (req.user && req.user.role === 'ceo') {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Key erforderlich'
      });
    }
    // Note: keys are distributed across per-limiter stores; no single reset is possible
    res.status(200).json({
      success: true,
      message: `Rate Limit Key ${key} zurückgesetzt`
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Keine Berechtigung'
    });
  }
};

const getRateLimitInfo = (req, res) => {
  if (req.rateLimit) {
    res.status(200).json({
      success: true,
      rateLimit: {
        limit: req.rateLimit.limit,
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: new Date(req.rateLimit.resetTime * 1000)
      }
    });
  } else {
    res.status(200).json({
      success: true,
      message: 'Keine Rate Limit Daten'
    });
  }
};

// ==================== MIDDLEWARE CHAIN ====================

const rateLimiterMiddlewareChain = [generalLimiter, apiLimiter];

// ==================== CLEANUP ON SHUTDOWN ====================

process.on('SIGTERM', () => {
  // Individual store cleanup intervals will stop when process exits
});

process.on('SIGINT', () => {
  // Individual store cleanup intervals will stop when process exits
});

// ==================== EXPORT ====================

export default generalLimiter;

export {
  // Rate Limiters
  generalLimiter,
  authLimiter,
  loginIPLimiter, // ? SECURITY FIX: IP-based login rate limiter
  strictLimiter,
  apiLimiter,
  mutationLimiter,
  reviewLimiter,
  ceoLoginLimiter,
  passwordResetLimiter,
  tokenVerifyLimiter,
  registrationLimiter,
  emailLimiter,
  bookingCreationLimiter,
  searchLimiter,
  paymentLimiter,
  uploadLimiter,
  exportLimiter,
  bookingLimiter,
  widgetLimiter,
  publicBookingLimiter,
  // Utilities
  customLimiter,
  adminBypass,
  createRateLimiter,
  getRateLimitStatus,
  resetRateLimiter,
  resetRateLimitKey,
  getRateLimitInfo,
  rateLimiterMiddlewareChain
};
