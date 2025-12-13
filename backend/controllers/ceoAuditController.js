import logger from '../utils/logger.js';
/**
 * CEO Audit Log Controller
 * Security audit trail management
 */

import AuditLog from '../models/AuditLog.js';

// ==================== GET AUDIT LOGS ====================
export const getAuditLogs = async (req, res) => {
  try {
    const {
      category,
      action,
      userId,
      resourceType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (userId) query.userId = userId;
    if (resourceType) query.resourceType = resourceType;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1).lean().maxTimeMS(5000) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GetAuditLogs Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET LOG DETAILS ====================
export const getLogDetails = async (req, res) => {
  try {
    const { logId } = req.params;

    const log = await AuditLog.findById(logId)
      .populate('userId', 'name email role').maxTimeMS(5000);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.status(200).json({
      success: true,
      log
    });
  } catch (error) {
    logger.error('GetLogDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET AUDIT STATS ====================
export const getAuditStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
      case '24h': startDate = new Date(now - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now - 30 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // Total events in period
    const totalEvents = await AuditLog.countDocuments({
      createdAt: { $gte: startDate }
    });

    // By category
    const byCategory = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // By status
    const byStatus = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Failed actions
    const failedActions = await AuditLog.countDocuments({
      createdAt: { $gte: startDate },
      status: 'failed'
    });

    // Security events (auth category)
    const securityEvents = await AuditLog.countDocuments({
      createdAt: { $gte: startDate },
      category: { $in: ['auth', 'security'] }
    });

    // Top actions
    const topActions = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Active users
    const activeUsers = await AuditLog.distinct('userId', {
      createdAt: { $gte: startDate }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        failedActions,
        securityEvents,
        activeUsers: activeUsers.length,
        byCategory: byCategory.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {}),
        byStatus: byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
        topActions
      },
      period
    });
  } catch (error) {
    logger.error('GetAuditStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET SECURITY ALERTS ====================
export const getSecurityAlerts = async (req, res) => {
  try {
    // Get recent failed login attempts
    const failedLogins = await AuditLog.find({
      action: { $regex: /login.*failed/i },
      createdAt: { $gte: new Date(Date.now().lean().maxTimeMS(5000) - 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Get suspicious activities
    const suspiciousActivities = await AuditLog.find({
      $or: [
        { status: 'failed' },
        { action: { $regex: /suspicious|blocked|banned/i } }
      ],
      createdAt: { $gte: new Date(Date.now().lean().maxTimeMS(5000) - 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // IP addresses with multiple failed attempts
    const suspiciousIPs = await AuditLog.aggregate([
      {
        $match: {
          status: 'failed',
          ipAddress: { $exists: true, $ne: null },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
          lastSeen: { $max: '$createdAt' }
        }
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      alerts: {
        failedLogins,
        suspiciousActivities,
        suspiciousIPs
      }
    });
  } catch (error) {
    logger.error('GetSecurityAlerts Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== EXPORT AUDIT LOGS ====================
export const exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(10000).lean().maxTimeMS(5000) // Max 10k records
      .lean();

    if (format === 'csv') {
      // Convert to CSV
      const fields = ['createdAt', 'userEmail', 'action', 'category', 'status', 'ipAddress', 'description'];
      const csv = [
        fields.join(','),
        ...logs.map(log =>
          fields.map(f => `"${(log[f] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('ExportAuditLogs Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAuditLogs,
  getLogDetails,
  getAuditStats,
  getSecurityAlerts,
  exportAuditLogs
};


