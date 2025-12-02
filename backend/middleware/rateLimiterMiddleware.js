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

      const current = (this.hits.get(key) || 0) + 1;
      this.hits.set(key, { count: current, timestamp: Date.now() });

      cb(null, current);
    } catch (err) {
      logger.error('❌ MemoryStore incr error:', err);
      cb(err);
    }
  }

  decrement(key, cb) {
    try {
      const current = Math.max(0, (this.hits.get(key)?.count || 1) - 1);
      this.hits.set(key, { count: current, timestamp: Date.now() });
      cb(null, current);
    } catch (err) {
      logger.error('❌ MemoryStore decrement error:', err);
      cb(err);
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
      if (now - value.timestamp > this.windowMs) {
        this.hits.delete(key);
        deleted++;
      }
    }

    logger.log(`✅ Cleaned up ${deleted} expired rate limit entries`);
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

const memoryStoreAdapter = new MemoryStoreAdapter(15 * 60 * 1000, 10000);

// ==================== RATE LIMITERS ====================

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL || '100'),
  message: {
    success: false,
    message: 'Zu viele Anfragen von dieser IP, bitte später versuchen'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  skip: (req) => req.user && (req.user.role === 'admin' || req.user.role === 'ceo'),
  handler: (req, res) => {
    logger.warn(`⚠️ Rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Anfragen, bitte später versuchen',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH || '5'),
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  message: {
    success: false,
    message: 'Zu viele Login-Versuche, bitte später versuchen'
  },
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.body?.email || req.ip || 'unknown',
  handler: (req, res) => {
    logger.warn(`⚠️ Auth rate limit exceeded for ${req.body?.email || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Zu viele Login-Versuche. Bitte versuchen Sie es später erneut.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      email: req.body?.email
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT || '10'),
  message: { success: false, message: 'Zu viele Anfragen, bitte warten' },
  store: memoryStoreAdapter,
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
  max: parseInt(process.env.RATE_LIMIT_API || '1000'),
  message: { success: false, message: 'API Rate Limit überschritten' },
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.user?.role === 'ceo'
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_PAYMENT || '50'),
  message: { success: false, message: 'Zu viele Zahlungsversuche, bitte später versuchen' },
  store: memoryStoreAdapter,
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
  store: memoryStoreAdapter,
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
  store: memoryStoreAdapter,
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
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.user?.id || req.ip
});

const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_EXPORT || '10'),
  message: { success: false, message: 'Export Limit erreicht' },
  store: memoryStoreAdapter,
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
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.user?.id || req.ip
});

const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REVIEW || '5'),
  message: { success: false, message: 'Zu viele Bewertungen pro Tag' },
  store: memoryStoreAdapter,
  keyGenerator: (req) => req.user?.id || req.ip
});

// ==================== UTILITY FUNCTIONS ====================

const customLimiter = (windowMs, max, prefix = 'custom') => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message: `Zu viele Anfragen (${max} pro ${windowMs / 1000}s)` },
    store: memoryStoreAdapter,
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
    store: memoryStoreAdapter,
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
    store: 'Memory',
    activeKeys: memoryStoreAdapter.hits.size
  });
};

const resetRateLimiter = (req, res) => {
  if (req.user && req.user.role === 'ceo') {
    memoryStoreAdapter.resetAll();
    res.status(200).json({
      success: true,
      message: 'Rate Limiter zurückgesetzt'
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
    memoryStoreAdapter.resetKey(key);
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
  memoryStoreAdapter.stopCleanupInterval();
});

process.on('SIGINT', () => {
  memoryStoreAdapter.stopCleanupInterval();
});

// ==================== EXPORT ====================

export default generalLimiter;

export {
  memoryStoreAdapter,
  generalLimiter,
  authLimiter,
  strictLimiter,
  apiLimiter,
  paymentLimiter,
  uploadLimiter,
  emailLimiter,
  searchLimiter,
  exportLimiter,
  bookingLimiter,
  reviewLimiter,
  customLimiter,
  adminBypass,
  createRateLimiter,
  getRateLimitStatus,
  resetRateLimiter,
  resetRateLimitKey,
  getRateLimitInfo,
  rateLimiterMiddlewareChain
};