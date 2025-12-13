import User from '../models/User.js';
import logger from '../utils/logger.js';

// ==================== CHECK CEO ROLE ====================

const checkCEO = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Nur CEO hat Zugriff auf diese Ressource'
    });
  }
  next();
};

// ==================== CEO DASHBOARD ACCESS ====================

const ceoAccessOnly = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'CEO Dashboard nur für CEO verfügbar'
    });
  }
  next();
};

// ==================== VERIFY CEO AUTHORIZATION ====================

const verifyCEOAuth = async (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Diese Aktion erfordert CEO-Berechtigung'
    });
  }

  // Log CEO actions for audit trail
  logger.log(`[CEO ACTION] User: ${req.user.id}, Action: ${req.method} ${req.path}, Timestamp: ${new Date().toISOString()}`);

  next();
};

// ==================== MULTI-TENANT DATA ISOLATION ====================

const multiTenantIsolation = (req, res, next) => {
  // CEO can access all companies
  if (req.user.role === 'ceo') {
    req.companyFilter = {}; // No filter - see all
  }
  // Admin can only access their company
  else if (req.user.role === 'admin') {
    req.companyFilter = { companyId: req.user.companyId };
  }
  // Employee can only access their company
  else if (req.user.role === 'employee') {
    req.companyFilter = { companyId: req.user.companyId };
  }

  next();
};

// ==================== CEO BUSINESS VALIDATION ====================

const validateCEOBusinessAccess = async (req, res, next) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'Nur CEO kann auf Geschäftsdaten zugreifen'
      });
    }

    const { businessId } = req.params || req.query;

    // If businessId is specified, verify it's valid
    if (businessId) {
      const business = await User.findById(businessId);

      if (!business || business.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'Geschäft nicht gefunden'
        });
      }

      req.business = business;
    }

    next();
  } catch (error) {
    logger.error('ValidateCEOBusinessAccess Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== CEO AUDIT LOG ====================

const auditLog = [];

const auditLogMiddleware = (action) => {
  return (req, res, next) => {
    const logEntry = {
      timestamp: new Date(),
      userId: req.user?.id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action,
      method: req.method,
      path: req.path,
      ip: req.ip,
      statusCode: res.statusCode
    };

    auditLog.push(logEntry);

    // Keep only last 1000 entries
    if (auditLog.length > 1000) {
      auditLog.shift();
    }

    next();
  };
};

// ==================== GET AUDIT LOG ====================

const getAuditLog = (req, res) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Nur CEO kann Audit Logs sehen'
    });
  }

  res.status(200).json({
    success: true,
    logs: auditLog
  });
};

// ==================== CEO RATE LIMIT ====================

const ceoRequestCounts = new Map();

const ceoRateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    if (req.user.role !== 'ceo') {
      return next();
    }

    const now = Date.now();
    const requests = ceoRequestCounts.get(req.user.id) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'CEO Rate limit exceeded'
      });
    }

    recentRequests.push(now);
    ceoRequestCounts.set(req.user.id, recentRequests);

    next();
  };
};

// ==================== VERIFY CEO EMAIL ====================

const verifyCEOEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'ceo') {
      return res.status(403).json({
        success: false,
        message: 'CEO Email Verification erforderlich'
      });
    }

    if (!user.email || !user.email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Gültige CEO Email erforderlich'
      });
    }

    next();
  } catch (error) {
    logger.error('VerifyCEOEmail Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== CEO SYSTEM STATUS ====================

const checkSystemStatus = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return next();
  }

  const systemStatus = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date()
  };

  req.systemStatus = systemStatus;
  next();
};

// ==================== CEO PERMISSION ESCALATION PREVENTION ====================

const preventPermissionEscalation = (req, res, next) => {
  // Only allow non-CEO users to update their own profile
  if (req.user.role !== 'ceo' && req.params.id && req.params.id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Sie können nur Ihr eigenes Profil aktualisieren'
    });
  }

  // Prevent role change to CEO
  if (req.body.role && req.body.role === 'ceo' && req.user.role !== 'ceo') {
    delete req.body.role;
  }

  next();
};

// ==================== CEO DATA BACKUP ====================

const triggerDataBackup = async (req, res, next) => {
  try {
    if (req.user.role !== 'ceo') {
      return next();
    }

    // Log backup request
    logger.log(`[BACKUP] Triggered by CEO: ${req.user.email} at ${new Date().toISOString()}`);

    // Backup logic would go here
    req.backupTriggered = true;

    next();
  } catch (error) {
    logger.error('TriggerDataBackup Error:', error);
    next();
  }
};

// ==================== CEO ANALYTICS PERMISSION ====================

const ceoAnalyticsAccess = (req, res, next) => {
  if (req.user.role === 'ceo') {
    req.analyticsAccess = 'full'; // Full system analytics
  } else if (req.user.role === 'admin') {
    req.analyticsAccess = 'company'; // Only own company analytics
  } else {
    req.analyticsAccess = 'limited'; // Limited analytics
  }

  next();
};

// ==================== CEO SESSION PROTECTION ====================

const ceoSessions = new Map();

const protectCEOSession = (req, res, next) => {
  if (req.user.role !== 'ceo') {
    return next();
  }

  const sessionId = req.headers['x-session-id'] || `session-${Date.now()}`;

  if (!ceoSessions.has(req.user.id)) {
    ceoSessions.set(req.user.id, []);
  }

  const sessions = ceoSessions.get(req.user.id);

  // Limit concurrent sessions (max 3)
  if (sessions.length >= 3 && !sessions.includes(sessionId)) {
    return res.status(403).json({
      success: false,
      message: 'Maximale Anzahl von gleichzeitigen Sessions erreicht'
    });
  }

  if (!sessions.includes(sessionId)) {
    sessions.push(sessionId);
  }

  req.sessionId = sessionId;
  next();
};

// ==================== CEO SENSITIVE ACTION VERIFICATION ====================

const verifySensitiveAction = async (req, res, next) => {
  try {
    if (req.user.role !== 'ceo') {
      return next();
    }

    const sensitiveActions = ['DELETE', 'PUT', 'PATCH'];

    if (sensitiveActions.includes(req.method)) {
      const { confirmPassword } = req.body;

      if (!confirmPassword) {
        return res.status(403).json({
          success: false,
          message: 'Passwortbestätigung erforderlich für sensible Aktion'
        });
      }

      const user = await User.findById(req.user.id).select('+password');

      const isPasswordCorrect = await user.comparePassword(confirmPassword);

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: 'Passwort ist falsch'
        });
      }

      delete req.body.confirmPassword;
    }

    next();
  } catch (error) {
    logger.error('VerifySensitiveAction Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== CEO STATS ====================

const getCEOStats = (req, res) => {
  if (req.user.role !== 'ceo') {
    return res.status(403).json({
      success: false,
      message: 'Nur CEO kann diese Statistiken sehen'
    });
  }

  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    auditLogsCount: auditLog.length,
    timestamp: new Date()
  };

  res.status(200).json({
    success: true,
    stats
  });
};

// ==================== EXPORT ====================

export default {
  checkCEO,
  ceoAccessOnly,
  verifyCEOAuth,
  multiTenantIsolation,
  validateCEOBusinessAccess,
  auditLogMiddleware,
  getAuditLog,
  ceoRateLimit,
  verifyCEOEmail,
  checkSystemStatus,
  preventPermissionEscalation,
  triggerDataBackup,
  ceoAnalyticsAccess,
  protectCEOSession,
  verifySensitiveAction,
  getCEOStats
};
