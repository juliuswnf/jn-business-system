/**
 * Security Monitoring Middleware
 * Tracks security events for monitoring and alerting
 *
 * Features:
 * - Failed login attempts
 * - Suspicious activity detection
 * - Rate limit violations
 * - Authorization failures
 * - Unusual access patterns
 */

import logger from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';

// In-memory tracking for real-time detection (in production, use Redis)
const securityEvents = new Map();
const suspiciousIPs = new Map();

// Configuration
const CONFIG = {
  FAILED_LOGIN_THRESHOLD: 5, // Alert after 5 failed logins
  SUSPICIOUS_ACTIVITY_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_VIOLATION_THRESHOLD: 10, // Alert after 10 violations
  UNUSUAL_ACCESS_THRESHOLD: 20 // Alert after 20 unusual access attempts
};

/**
 * Track security event
 */
export const trackSecurityEvent = async (event) => {
  try {
    const {
      type, // 'failed_login', 'rate_limit', 'unauthorized', 'suspicious'
      userId,
      email,
      ipAddress,
      userAgent,
      details = {},
      severity = 'medium' // 'low', 'medium', 'high', 'critical'
    } = event;

    // Log to structured logger
    logger.warn(`[SECURITY] ${type}`, {
      userId,
      email,
      ipAddress,
      userAgent,
      details,
      severity,
      timestamp: new Date().toISOString()
    });

    // Store in AuditLog for compliance
    try {
      await AuditLog.create({
        userId: userId || null,
        action: `SECURITY_${type.toUpperCase()}`,
        category: 'security',
        description: `Security event: ${type}`,
        details: {
          email,
          ipAddress,
          userAgent,
          ...details
        },
        status: severity === 'critical' || severity === 'high' ? 'alert' : 'info',
        ipAddress,
        userAgent
      });
    } catch (auditError) {
      // Non-blocking - log error but don't fail request
      logger.error('Failed to create audit log:', auditError);
    }

    // Real-time tracking for alerting
    const key = `${type}:${ipAddress}`;
    const now = Date.now();

    if (!securityEvents.has(key)) {
      securityEvents.set(key, []);
    }

    const events = securityEvents.get(key);
    events.push(now);

    // Keep only events from last window
    const recentEvents = events.filter(time => now - time < CONFIG.SUSPICIOUS_ACTIVITY_WINDOW);
    securityEvents.set(key, recentEvents);

    // Check thresholds and alert
    if (type === 'failed_login' && recentEvents.length >= CONFIG.FAILED_LOGIN_THRESHOLD) {
      await triggerSecurityAlert({
        type: 'multiple_failed_logins',
        ipAddress,
        count: recentEvents.length,
        severity: 'high'
      });
    }

    if (type === 'rate_limit' && recentEvents.length >= CONFIG.RATE_LIMIT_VIOLATION_THRESHOLD) {
      await triggerSecurityAlert({
        type: 'rate_limit_abuse',
        ipAddress,
        count: recentEvents.length,
        severity: 'high'
      });
    }

    if (type === 'unauthorized' && recentEvents.length >= CONFIG.UNUSUAL_ACCESS_THRESHOLD) {
      await triggerSecurityAlert({
        type: 'unauthorized_access_attempts',
        ipAddress,
        count: recentEvents.length,
        severity: 'critical'
      });
    }

  } catch (error) {
    // Non-blocking - never fail request due to monitoring
    logger.error('Security monitoring error:', error);
  }
};

/**
 * Trigger security alert
 */
const triggerSecurityAlert = async (alert) => {
  try {
    const { type, ipAddress, count, severity } = alert;

    // Mark IP as suspicious
    suspiciousIPs.set(ipAddress, {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      severity,
      count
    });

    // Log critical alerts
    if (severity === 'critical' || severity === 'high') {
      logger.error(`[SECURITY ALERT] ${type}`, {
        ipAddress,
        count,
        severity,
        timestamp: new Date().toISOString(),
        action: 'IP_MARKED_SUSPICIOUS'
      });

      // TODO: Send alert to monitoring service (Datadog, Sentry, etc.)
      // TODO: Send email/Slack notification for critical alerts
      // Example:
      // await sendSecurityAlert({
      //   channel: 'security-alerts',
      //   message: `🚨 Security Alert: ${type} from ${ipAddress} (${count} attempts)`
      // });
    }

  } catch (error) {
    logger.error('Failed to trigger security alert:', error);
  }
};

/**
 * Check if IP is suspicious
 */
export const isSuspiciousIP = (ipAddress) => {
  const suspicious = suspiciousIPs.get(ipAddress);
  if (!suspicious) return false;

  // Check if still within window
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  if (now - suspicious.lastSeen > window) {
    suspiciousIPs.delete(ipAddress);
    return false;
  }

  return true;
};

/**
 * Get security metrics
 */
export const getSecurityMetrics = () => {
  const now = Date.now();
  const window = 60 * 60 * 1000; // Last hour

  const metrics = {
    totalEvents: 0,
    failedLogins: 0,
    rateLimitViolations: 0,
    unauthorizedAttempts: 0,
    suspiciousIPs: suspiciousIPs.size,
    recentAlerts: []
  };

  for (const [key, events] of securityEvents.entries()) {
    const recentEvents = events.filter(time => now - time < window);
    metrics.totalEvents += recentEvents.length;

    if (key.startsWith('failed_login:')) {
      metrics.failedLogins += recentEvents.length;
    } else if (key.startsWith('rate_limit:')) {
      metrics.rateLimitViolations += recentEvents.length;
    } else if (key.startsWith('unauthorized:')) {
      metrics.unauthorizedAttempts += recentEvents.length;
    }
  }

  return metrics;
};

/**
 * Middleware to track failed login attempts
 */
export const trackFailedLogin = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    // Check if this was a failed login
    if (req.path.includes('/login') && data.success === false && data.message?.includes('Invalid')) {
      trackSecurityEvent({
        type: 'failed_login',
        email: req.body?.email,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        severity: 'medium'
      });
    }

    return originalJson(data);
  };

  next();
};

/**
 * Middleware to track unauthorized access
 */
export const trackUnauthorizedAccess = (req, res, next) => {
  const originalStatus = res.status.bind(res);

  res.status = function(code) {
    if (code === 403 || code === 401) {
      trackSecurityEvent({
        type: 'unauthorized',
        userId: req.user?.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: {
          path: req.path,
          method: req.method,
          statusCode: code
        },
        severity: 'high'
      });
    }

    return originalStatus(code);
  };

  next();
};

/**
 * Cleanup old events (run periodically)
 */
export const cleanupOldEvents = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, events] of securityEvents.entries()) {
    const recentEvents = events.filter(time => now - time < maxAge);
    if (recentEvents.length === 0) {
      securityEvents.delete(key);
    } else {
      securityEvents.set(key, recentEvents);
    }
  }

  // Cleanup suspicious IPs
  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.lastSeen > maxAge) {
      suspiciousIPs.delete(ip);
    }
  }
};

// Cleanup every hour
setInterval(cleanupOldEvents, 60 * 60 * 1000);

export default {
  trackSecurityEvent,
  isSuspiciousIP,
  getSecurityMetrics,
  trackFailedLogin,
  trackUnauthorizedAccess
};

