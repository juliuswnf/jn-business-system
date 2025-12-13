import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';

/**
 * Breach Notification Service
 * HIPAA Breach Notification Rule (45 CFR §§ 164.400-414)
 */

/**
 * Detect potential data breaches
 */
export async function detectBreaches() {
  try {
    logger.info('Running breach detection scan...');

    const now = Date.now();
    const timeWindows = {
      oneMinute: 60 * 1000,
      fiveMinutes: 5 * 60 * 1000,
      oneHour: 60 * 60 * 1000
    };

    // Pattern 1: Excessive PHI access in short time
    const excessiveAccess = await detectExcessiveAccess(now, timeWindows);

    // Pattern 2: Failed login attempts
    const bruteForce = await detectBruteForce(now, timeWindows);

    // Pattern 3: Unusual access patterns
    const unusualAccess = await detectUnusualAccess(now, timeWindows);

    // Pattern 4: Unauthorized access attempts
    const unauthorizedAccess = await detectUnauthorizedAccess(now, timeWindows);

    const breaches = [
      ...excessiveAccess,
      ...bruteForce,
      ...unusualAccess,
      ...unauthorizedAccess
    ];

    if (breaches.length > 0) {
      logger.warn('Potential breaches detected', {
        count: breaches.length,
        types: breaches.map(b => b.type)
      });

      // Process each breach
      for (const breach of breaches) {
        await handleBreach(breach);
      }
    }

    return breaches;

  } catch (error) {
    logger.error('Breach detection failed:', error);
    throw error;
  }
}

/**
 * Detect excessive PHI access
 */
async function detectExcessiveAccess(now, timeWindows) {
  const breaches = [];

  // Find users with excessive access in last 5 minutes
  const recentAccess = await AuditLog.aggregate([
    {
      $match: {
        isPHIAccess: true,
        timestamp: { $gte: new Date(now - timeWindows.fiveMinutes) }
      }
    },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 },
        patients: { $addToSet: '$phiAccessDetails.patientId' },
        ips: { $addToSet: '$ipAddress' }
      }
    },
    {
      $match: {
        count: { $gt: 50 } // More than 50 accesses in 5 minutes
      }
    }
  ]);

  for (const access of recentAccess) {
    breaches.push({
      type: 'excessive_phi_access',
      severity: 'HIGH',
      userId: access._id,
      details: {
        accessCount: access.count,
        timeWindow: '5 minutes',
        affectedPatients: access.patients.length,
        ipAddresses: access.ips
      },
      detectedAt: new Date()
    });
  }

  return breaches;
}

/**
 * Detect brute force login attempts
 */
async function detectBruteForce(now, timeWindows) {
  const breaches = [];

  // Find IPs with multiple failed login attempts
  const failedLogins = await AuditLog.aggregate([
    {
      $match: {
        action: 'login_failed',
        timestamp: { $gte: new Date(now - timeWindows.fiveMinutes) }
      }
    },
    {
      $group: {
        _id: '$ipAddress',
        count: { $sum: 1 },
        userEmails: { $addToSet: '$userEmail' }
      }
    },
    {
      $match: {
        count: { $gt: 10 } // More than 10 failed attempts in 5 minutes
      }
    }
  ]);

  for (const attempt of failedLogins) {
    breaches.push({
      type: 'brute_force_attack',
      severity: 'CRITICAL',
      ipAddress: attempt._id,
      details: {
        failedAttempts: attempt.count,
        timeWindow: '5 minutes',
        targetedUsers: attempt.userEmails
      },
      detectedAt: new Date()
    });
  }

  return breaches;
}

/**
 * Detect unusual access patterns
 */
async function detectUnusualAccess(now, timeWindows) {
  const breaches = [];

  // Find access from unusual locations/times
  const users = await AuditLog.distinct('userId', {
    isPHIAccess: true,
    timestamp: { $gte: new Date(now - timeWindows.oneHour) }
  });

  for (const userId of users) {
    // Get user's historical IP addresses
    const historicalIPs = await AuditLog.distinct('ipAddress', {
      userId,
      timestamp: { $lt: new Date(now - 24 * 60 * 60 * 1000) } // Before last 24 hours
    });

    // Get recent IP addresses
    const recentIPs = await AuditLog.distinct('ipAddress', {
      userId,
      timestamp: { $gte: new Date(now - timeWindows.oneHour) }
    });

    // Check for new IPs
    const newIPs = recentIPs.filter(ip => !historicalIPs.includes(ip));

    if (newIPs.length > 0) {
      const accessCount = await AuditLog.countDocuments({
        userId,
        isPHIAccess: true,
        ipAddress: { $in: newIPs },
        timestamp: { $gte: new Date(now - timeWindows.oneHour) }
      });

      if (accessCount > 5) {
        breaches.push({
          type: 'unusual_access_location',
          severity: 'MEDIUM',
          userId,
          details: {
            newIPs,
            accessCount,
            historicalIPs: historicalIPs.length
          },
          detectedAt: new Date()
        });
      }
    }
  }

  return breaches;
}

/**
 * Detect unauthorized access attempts
 */
async function detectUnauthorizedAccess(now, timeWindows) {
  const breaches = [];

  // Find access denied events
  const deniedAccess = await AuditLog.find({
    action: 'access_denied',
    timestamp: { $gte: new Date(now - timeWindows.fiveMinutes) }
  })
    .limit(100)
    .lean();

  // Group by user
  const deniedByUser = {};
  for (const access of deniedAccess) {
    const key = access.userId || access.ipAddress;
    if (!deniedByUser[key]) {
      deniedByUser[key] = [];
    }
    deniedByUser[key].push(access);
  }

  // Check for repeated unauthorized attempts
  for (const [key, attempts] of Object.entries(deniedByUser)) {
    if (attempts.length > 5) {
      breaches.push({
        type: 'unauthorized_access_attempt',
        severity: 'HIGH',
        userId: attempts[0].userId,
        ipAddress: attempts[0].ipAddress,
        details: {
          attemptCount: attempts.length,
          timeWindow: '5 minutes',
          resources: [...new Set(attempts.map(a => a.resource))]
        },
        detectedAt: new Date()
      });
    }
  }

  return breaches;
}

/**
 * Handle detected breach
 */
async function handleBreach(breach) {
  try {
    logger.error('SECURITY BREACH DETECTED', breach);

    // Create breach record
    const BreachIncident = (await import('../models/BreachIncident.js')).default;
    
    const incident = await BreachIncident.create({
      type: breach.type,
      severity: breach.severity,
      userId: breach.userId,
      ipAddress: breach.ipAddress,
      details: breach.details,
      status: 'detected',
      detectedAt: breach.detectedAt,
      affectedRecords: breach.details.affectedPatients || 0,
      notificationRequired: breach.severity === 'CRITICAL' || breach.severity === 'HIGH',
      investigationStarted: false
    });

    // Alert administrators immediately
    await alertAdministrators(breach, incident);

    // If critical, take immediate action
    if (breach.severity === 'CRITICAL') {
      await takeImmediateAction(breach);
    }

    // If affects patients, prepare notifications
    if (breach.details.affectedPatients > 0) {
      await preparePatientNotifications(incident);
    }

    return incident;

  } catch (error) {
    logger.error('Failed to handle breach:', error);
    throw error;
  }
}

/**
 * Alert administrators
 */
async function alertAdministrators(breach, incident) {
  try {
    // Email alert
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const emailContent = `
      SECURITY BREACH DETECTED
      
      Type: ${breach.type}
      Severity: ${breach.severity}
      Detected: ${breach.detectedAt.toISOString()}
      Incident ID: ${incident._id}
      
      Details:
      ${JSON.stringify(breach.details, null, 2)}
      
      Immediate Actions Required:
      1. Review incident details in admin dashboard
      2. Investigate access logs
      3. Determine scope of breach
      4. Take corrective actions
      5. Notify affected patients if required
      
      HIPAA Breach Notification Rule:
      - If 500+ patients affected: Notify HHS and media within 60 days
      - If <500 patients affected: Notify HHS annually
      - Notify affected individuals without unreasonable delay
      
      Dashboard: ${process.env.FRONTEND_URL}/admin/breaches/${incident._id}
    `;

    await transporter.sendMail({
      from: process.env.ALERT_EMAIL || 'security@jnbusiness.com',
      to: process.env.ADMIN_EMAILS || 'admin@jnbusiness.com',
      subject: `[SECURITY ALERT] ${breach.severity} - ${breach.type}`,
      text: emailContent
    });

    logger.info('Administrator alert sent', { incidentId: incident._id });

  } catch (error) {
    logger.error('Failed to send administrator alert:', error);
  }
}

/**
 * Take immediate action for critical breaches
 */
async function takeImmediateAction(breach) {
  try {
    logger.warn('Taking immediate action for critical breach', { type: breach.type });

    // Action 1: Block suspicious IP
    if (breach.ipAddress && breach.type === 'brute_force_attack') {
      // In production, add to IP blocklist/firewall
      logger.warn('IP should be blocked', { ip: breach.ipAddress });
    }

    // Action 2: Suspend user account
    if (breach.userId && breach.type === 'excessive_phi_access') {
      const User = (await import('../models/User.js')).default;
      await User.findByIdAndUpdate(breach.userId, {
        accountStatus: 'suspended',
        suspensionReason: 'Suspicious activity detected',
        suspendedAt: new Date()
      });
      logger.warn('User account suspended', { userId: breach.userId });
    }

    // Action 3: Enable additional audit logging
    logger.info('Enhanced audit logging enabled');

  } catch (error) {
    logger.error('Failed to take immediate action:', error);
  }
}

/**
 * Prepare patient notifications
 */
async function preparePatientNotifications(incident) {
  try {
    // Get affected patients
    const affectedPatients = await getAffectedPatients(incident);

    logger.info('Preparing patient notifications', {
      incidentId: incident._id,
      patientCount: affectedPatients.length
    });

    // Create notification records
    const BreachNotification = (await import('../models/BreachNotification.js')).default;

    for (const patient of affectedPatients) {
      await BreachNotification.create({
        incidentId: incident._id,
        patientId: patient.id,
        notificationType: affectedPatients.length >= 500 ? 'expedited' : 'standard',
        status: 'pending_approval',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        channels: ['email', 'sms']
      });
    }

    logger.info('Patient notifications prepared', {
      incidentId: incident._id,
      count: affectedPatients.length
    });

  } catch (error) {
    logger.error('Failed to prepare patient notifications:', error);
  }
}

/**
 * Get affected patients
 */
async function getAffectedPatients(incident) {
  try {
    const patientIds = incident.details.patients || [];
    
    const User = (await import('../models/User.js')).default;
    
    const patients = await User.find({
      _id: { $in: patientIds },
      role: 'customer'
    })
      .select('firstName lastName email phone')
      .lean();

    return patients.map(p => ({
      id: p._id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone
    }));

  } catch (error) {
    logger.error('Failed to get affected patients:', error);
    return [];
  }
}

/**
 * Send breach notification to patient
 */
export async function sendBreachNotification(notificationId) {
  try {
    const BreachNotification = (await import('../models/BreachNotification.js')).default;
    const notification = await BreachNotification.findById(notificationId)
      .populate('incidentId')
      .populate('patientId')
      .lean();

    if (!notification) {
      throw new Error('Notification not found');
    }

    const patient = notification.patientId;
    const incident = notification.incidentId;

    // Email notification
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const emailContent = `
      Dear ${patient.firstName} ${patient.lastName},

      We are writing to inform you of a data security incident that may have affected your protected health information (PHI).

      Incident Details:
      - Date Detected: ${new Date(incident.detectedAt).toLocaleDateString()}
      - Type: ${incident.type}
      - Affected Information: ${incident.affectedDataTypes?.join(', ') || 'Medical records'}

      What Happened:
      ${incident.description || 'Unauthorized access to protected health information was detected by our security systems.'}

      What We Are Doing:
      - Immediate investigation launched
      - Enhanced security measures implemented
      - Cooperation with law enforcement (if applicable)
      - Additional staff training

      What You Can Do:
      - Monitor your accounts for suspicious activity
      - Consider placing a fraud alert on your credit reports
      - Review the attached information on identity theft protection

      We take the privacy and security of your information very seriously. For more information or questions, please contact:
      
      Privacy Officer: ${process.env.PRIVACY_OFFICER_NAME || 'Privacy Office'}
      Phone: ${process.env.PRIVACY_OFFICER_PHONE || '1-800-XXX-XXXX'}
      Email: ${process.env.PRIVACY_OFFICER_EMAIL || 'privacy@jnbusiness.com'}

      Sincerely,
      JN Business System
    `;

    await transporter.sendMail({
      from: process.env.NOTIFICATION_EMAIL || 'notifications@jnbusiness.com',
      to: patient.email,
      subject: 'Important Notice: Data Security Incident',
      text: emailContent
    });

    // Update notification status
    await BreachNotification.findByIdAndUpdate(notificationId, {
      status: 'sent',
      sentAt: new Date()
    });

    logger.info('Breach notification sent', {
      notificationId,
      patientId: patient._id
    });

  } catch (error) {
    logger.error('Failed to send breach notification:', error);
    throw error;
  }
}

/**
 * Get breach incidents (admin endpoint)
 */
export async function getBreachIncidents(req, res) {
  try {
    const { status, severity, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (startDate || endDate) {
      query.detectedAt = {};
      if (startDate) query.detectedAt.$gte = new Date(startDate);
      if (endDate) query.detectedAt.$lte = new Date(endDate);
    }

    const BreachIncident = (await import('../models/BreachIncident.js')).default;

    const incidents = await BreachIncident.find(query)
      .sort({ detectedAt: -1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      incidents,
      count: incidents.length
    });

  } catch (error) {
    logger.error('Failed to get breach incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get breach incidents'
    });
  }
}

export default {
  detectBreaches,
  sendBreachNotification,
  getBreachIncidents
};
