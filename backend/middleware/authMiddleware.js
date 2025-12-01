import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Auth Middleware Suite
 * Version: 1.0.0
 * Provides: JWT verification, role-based authorization, and utility middleware
 */

// ==================== PROTECT ROUTE ====================

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Nicht authentifiziert - Token erforderlich'
      });
    }

    // Verify token with proper error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('❌ JWT Verification Error:', error.name);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token abgelaufen'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token ungültig'
        });
      }
      
      throw error;
    }

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User nicht gefunden'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User ist deaktiviert'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Protect Middleware Error:', error.message);
    next(error);
  }
};

// ==================== AUTHORIZE ROLES ====================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Nicht authentifiziert'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Sie haben keine Berechtigung für diese Aktion'
      });
    }
    next();
  };
};

// ==================== CHECK ADMIN ====================

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Nicht authentifiziert'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Nur Admins können diese Aktion ausführen'
    });
  }
  next();
};

// ==================== CHECK CEO ====================

const isCEO = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Nicht authentifiziert'
    });
  }

  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Nur CEO kann diese Aktion ausführen'
    });
  }
  next();
};

// ==================== CHECK COMPANY ACCESS ====================

const checkCompanyAccess = (req, res, next) => {
  const { companyId } = req.query || req.body || req.params;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Nicht authentifiziert'
    });
  }

  if (req.user.role === 'ceo') {
    // CEO can access all companies
    next();
  } else if (req.user.role === 'admin' || req.user.role === 'employee') {
    // Check if user belongs to company
    if (req.user.companyId && req.user.companyId.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Sie haben keinen Zugriff auf dieses Unternehmen'
      });
    }
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Keine Berechtigung'
    });
  }
};

// ==================== OPTIONAL AUTH ====================

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
      } catch (error) {
        console.log('⚠️ Optional auth token invalid, continuing without user');
      }
    }

    next();
  } catch (error) {
    console.error('❌ Optional Auth Middleware Error:', error.message);
    next();
  }
};

// ==================== VALIDATE REQUEST ====================

const validateRequest = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      console.error('❌ Validation schema is undefined');
      return next();
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validierungsfehler',
        details: error.details.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    req.validatedData = value;
    next();
  };
};

// ==================== LOG REQUESTS ====================

const logRequests = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${req.user?.id || 'anonymous'}`
    );
  });

  next();
};

// ==================== SANITIZE DATA ====================

const sanitizeData = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = { ...req.body };
    delete sanitized.password;
    delete sanitized._id;
    delete sanitized.__v;
    delete sanitized.createdAt;
    delete sanitized.updatedAt;
    req.body = sanitized;
  }

  next();
};

// ==================== REQUEST TIMEOUT ====================

const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    let timeoutHandle;

    timeoutHandle = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request Timeout'
        });
      }
    }, timeout);

    res.on('finish', () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    });

    res.on('close', () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    });

    next();
  };
};

// ==================== HANDLE ASYNC ERRORS ====================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('❌ Async Handler Error:', err.message);
    next(err);
  });
};

// ==================== RATE LIMITING ====================

const requestCounts = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, []);
    }

    const requests = requestCounts.get(key);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Zu viele Anfragen, bitte später versuchen'
      });
    }

    recentRequests.push(now);
    requestCounts.set(key, recentRequests);
    next();
  };
};

// ==================== EXPORT ====================

export default {
  protect,
  authorize,
  isAdmin,
  isCEO,
  checkCompanyAccess,
  optionalAuth,
  validateRequest,
  logRequests,
  sanitizeData,
  requestTimeout,
  asyncHandler,
  rateLimit
};