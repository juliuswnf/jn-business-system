/**
 * Security Monitoring Routes
 * Provides endpoints for security metrics and monitoring
 *
 * Access: CEO/Admin only
 */

import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import { checkFeatureAccess } from '../middleware/checkFeatureAccess.js';
import { getSecurityMetrics, isSuspiciousIP } from '../middleware/securityMonitoringMiddleware.js';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require CEO/Admin access
router.use(authMiddleware.protect);
router.use(ceoMiddleware.checkCEO);
router.use(checkFeatureAccess('auditLogs'));

/**
 * GET /api/security/metrics
 * Get security metrics for monitoring dashboard
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = getSecurityMetrics();

    // Get recent critical security events from AuditLog
    const recentAlerts = await AuditLog.find({
      category: 'security',
      status: { $in: ['alert', 'critical'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('action description details ipAddress createdAt')
      .lean();

    res.status(200).json({
      success: true,
      metrics: {
        ...metrics,
        recentAlerts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Security metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security metrics'
    });
  }
});

/**
 * GET /api/security/suspicious-ips
 * Get list of suspicious IPs
 */
router.get('/suspicious-ips', async (req, res) => {
  try {
    // Get suspicious IPs from AuditLog
    const suspiciousIPs = await AuditLog.aggregate([
      {
        $match: {
          category: 'security',
          status: { $in: ['alert', 'critical'] },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastSeen: { $max: '$createdAt' },
          actions: { $push: '$action' },
          severity: { $max: '$status' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 100
      }
    ]);

    res.status(200).json({
      success: true,
      suspiciousIPs: suspiciousIPs.map(ip => ({
        ipAddress: ip._id,
        count: ip.count,
        lastSeen: ip.lastSeen,
        actions: [...new Set(ip.actions)],
        severity: ip.severity
      }))
    });
  } catch (error) {
    logger.error('Suspicious IPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suspicious IPs'
    });
  }
});

/**
 * GET /api/security/audit-logs
 * Get security audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, startDate, endDate } = req.query;

    const query = {
      category: 'security'
    };

    if (severity) {
      query.status = severity;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      const parsedStart = startDate ? new Date(String(startDate)) : null;
      const parsedEnd = endDate ? new Date(String(endDate)) : null;
      if (parsedStart && !isNaN(parsedStart.getTime())) query.createdAt.$gte = parsedStart;
      if (parsedEnd && !isNaN(parsedEnd.getTime())) query.createdAt.$lte = parsedEnd;
      if (!Object.keys(query.createdAt).length) delete query.createdAt;
    }

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (validatedPage - 1) * validatedLimit;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean()
      .maxTimeMS(5000);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    });
  } catch (error) {
    logger.error('Audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
});

/**
 * POST /api/security/check-ip
 * Check if an IP is suspicious
 */
router.post('/check-ip', async (req, res) => {
  try {
    const { ipAddress } = req.body;

    if (!ipAddress || !/^[\d.:a-fA-F]+$/.test(String(ipAddress)) || String(ipAddress).length > 45) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format'
      });
    }
    const safeIp = String(ipAddress);

    const isSuspicious = isSuspiciousIP(safeIp);

    // Get IP history from AuditLog
    const ipHistory = await AuditLog.find({
      ipAddress: safeIp,
      category: 'security',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('action description status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      ipAddress,
      isSuspicious,
      history: {
        totalEvents: ipHistory.length,
        criticalEvents: ipHistory.filter(e => e.status === 'critical').length,
        recentEvents: ipHistory.slice(0, 10)
      }
    });
  } catch (error) {
    logger.error('Check IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check IP'
    });
  }
});

export default router;

