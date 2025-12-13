import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * HIPAA Audit Log Middleware
 * Automatically logs all PHI access for compliance
 */

/**
 * Middleware to log PHI access
 * Usage: router.get('/clinical-notes/:id', auditPHIAccess('clinical_note', 'read'), getClinicalNote)
 */
export const auditPHIAccess = (dataType, action, options = {}) => {
  return async (req, res, next) => {
    // Skip audit logging for non-PHI requests
    if (!isPHIRequest(req, dataType)) {
      return next();
    }

    const startTime = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override res.end to log after response
    res.end = function(chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Log asynchronously after response is sent
      logPHIAccess(req, res, dataType, action, startTime, options).catch(error => {
        logger.error('Failed to log PHI access:', error);
      });
    };

    next();
  };
};

/**
 * Determine if request involves PHI
 */
function isPHIRequest(req, dataType) {
  const phiTypes = [
    'clinical_note',
    'medical_history',
    'consent_form',
    'progress_entry',
    'booking' // Medical bookings contain PHI
  ];

  return phiTypes.includes(dataType);
}

/**
 * Log PHI access to audit trail
 */
async function logPHIAccess(req, res, dataType, action, startTime, options) {
  try {
    const duration = Date.now() - startTime;

    // Extract PHI details from request
    const phiDetails = extractPHIDetails(req, dataType, options);

    // Create audit log entry
    await AuditLog.create({
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      action: `phi_${action}`,
      resource: dataType,
      resourceId: req.params.id || phiDetails.resourceId,
      salonId: req.user?.salonId || phiDetails.salonId,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        duration: `${duration}ms`
      },
      ipAddress: getClientIp(req),
      timestamp: new Date(),

      // HIPAA-specific fields
      isPHIAccess: true,
      phiAccessDetails: {
        patientId: phiDetails.patientId || phiDetails.customerId,
        dataType: dataType,
        accessReason: req.body.accessReason || req.query.reason || 'routine_access',
        justification: req.body.justification || options.justification || 'Clinical care',
        dataFields: phiDetails.dataFields || []
      }
    });

    // Log to structured logger for monitoring
    logger.info('PHI Access Logged', {
      userId: req.user?.id,
      action: `phi_${action}`,
      dataType,
      patientId: phiDetails.patientId || phiDetails.customerId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: getClientIp(req)
    });

    // Check for suspicious access patterns
    await detectAnomalousAccess(req.user?.id, dataType, getClientIp(req));

  } catch (error) {
    logger.error('Error logging PHI access:', error);
    // Don't throw - audit logging failure shouldn't break the request
  }
}

/**
 * Extract PHI-specific details from request
 */
function extractPHIDetails(req, dataType, _options) {
  const details = {
    dataFields: []
  };

  // Extract based on data type
  switch (dataType) {
    case 'clinical_note':
      details.patientId = req.params.customerId || req.body.customerId;
      details.dataFields = ['diagnosis', 'treatment_plan', 'medications', 'notes'];
      break;

    case 'medical_history':
      details.patientId = req.params.customerId || req.body.customerId;
      details.dataFields = ['allergies', 'conditions', 'medications', 'family_history'];
      break;

    case 'consent_form':
      details.customerId = req.params.customerId || req.body.customerId;
      details.dataFields = ['signature', 'consent_type', 'ip_address'];
      break;

    case 'progress_entry':
      details.customerId = req.params.customerId || req.body.customerId;
      details.dataFields = ['weight', 'body_fat', 'photos', 'notes'];
      break;

    case 'booking':
      details.customerId = req.body.customerId;
      details.dataFields = ['customer_name', 'email', 'phone', 'notes'];
      break;
  }

  // Extract salon ID
  details.salonId = req.user?.salonId || req.params.salonId || req.body.salonId;
  details.resourceId = req.params.id;

  return details;
}

/**
 * Get client IP address (handles proxies)
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         req.connection?.remoteAddress ||
         'unknown';
}

/**
 * Detect anomalous access patterns
 */
async function detectAnomalousAccess(userId, dataType, ipAddress) {
  try {
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentAccessThreshold = 50; // Max accesses in time window

    // Count recent accesses by this user
    const recentCount = await AuditLog.countDocuments({
      userId,
      isPHIAccess: true,
      timestamp: { $gte: new Date(Date.now() - timeWindow) }
    });

    if (recentCount > recentAccessThreshold) {
      logger.warn('Anomalous PHI Access Detected', {
        userId,
        dataType,
        ipAddress,
        accessCount: recentCount,
        timeWindow: '5 minutes',
        severity: 'HIGH'
      });

      // Create breach alert
      await AuditLog.create({
        userId,
        action: 'breach_alert',
        resource: 'phi_access',
        details: {
          alertType: 'excessive_access',
          accessCount: recentCount,
          timeWindow: '5 minutes',
          dataType,
          ipAddress
        },
        ipAddress,
        timestamp: new Date(),
        isPHIAccess: true,
        phiAccessDetails: {
          dataType: 'multiple',
          accessReason: 'anomaly_detection',
          justification: 'Automatic breach detection'
        }
      });
    }

    // Check for access from unusual IP
    const userIPs = await AuditLog.distinct('ipAddress', {
      userId,
      isPHIAccess: true,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    if (!userIPs.includes(ipAddress)) {
      logger.warn('PHI Access from New IP', {
        userId,
        newIp: ipAddress,
        knownIPs: userIPs,
        severity: 'MEDIUM'
      });
    }

  } catch (error) {
    logger.error('Error detecting anomalous access:', error);
  }
}

/**
 * Middleware to require access justification for sensitive operations
 */
export const requireJustification = (req, res, next) => {
  const justification = req.body.justification || req.query.justification;

  if (!justification || justification.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Access justification required for HIPAA compliance',
      hipaaCompliance: true,
      requiredField: 'justification',
      minLength: 10
    });
  }

  next();
};

/**
 * Get audit trail for a specific patient
 */
export const getPatientAuditTrail = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    const query = {
      isPHIAccess: true,
      'phiAccessDetails.patientId': customerId
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const auditTrail = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('-__v')
      .lean();

    res.json({
      success: true,
      auditTrail,
      count: auditTrail.length,
      hipaaCompliance: true
    });

  } catch (error) {
    logger.error('Error fetching patient audit trail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail'
    });
  }
};

/**
 * Generate HIPAA compliance report
 */
export const generateComplianceReport = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate } = req.query;

    const query = {
      salonId,
      isPHIAccess: true
    };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const [totalAccesses, uniqueUsers, uniquePatients, breachAlerts, accessByType] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.distinct('userId', query).then(arr => arr.length),
      AuditLog.distinct('phiAccessDetails.patientId', query).then(arr => arr.length),
      AuditLog.countDocuments({ ...query, action: 'breach_alert' }),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$phiAccessDetails.dataType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const report = {
      period: {
        start: startDate || 'All time',
        end: endDate || 'Now'
      },
      summary: {
        totalPHIAccesses: totalAccesses,
        uniqueUsers,
        uniquePatients,
        breachAlerts
      },
      accessByType: accessByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      complianceStatus: breachAlerts === 0 ? 'COMPLIANT' : 'REVIEW_REQUIRED',
      generatedAt: new Date(),
      generatedBy: req.user.email
    };

    res.json({
      success: true,
      report,
      hipaaCompliance: true
    });

  } catch (error) {
    logger.error('Error generating compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate compliance report'
    });
  }
};

export default {
  auditPHIAccess,
  requireJustification,
  getPatientAuditTrail,
  generateComplianceReport
};
