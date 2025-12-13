import logger from '../utils/logger.js';
import emailService from './emailService.js';

/**
 * Alerting Service
 * Sends notifications for critical system events
 * Supports: Email, Slack, Discord webhooks
 */

// Alert thresholds
const THRESHOLDS = {
  errorRate: 0.05,           // 5% error rate triggers alert
  responseTime: 2000,        // 2 seconds average triggers alert
  memoryUsage: 0.85,         // 85% memory usage triggers alert
  diskUsage: 0.90,           // 90% disk usage triggers alert
  consecutiveErrors: 10,     // 10 consecutive errors triggers alert
  error5xxCount: 5           // 5 5xx errors in 5 minutes triggers alert
};

// Alert cooldowns (prevent spam)
const alertCooldowns = new Map();
const COOLDOWN_MINUTES = 15;

// Track consecutive errors
let consecutiveErrors = 0;
let recent5xxErrors = [];

/**
 * Check if alert is on cooldown
 */
const isOnCooldown = (alertType) => {
  const lastAlert = alertCooldowns.get(alertType);
  if (!lastAlert) {
    return false;
  }

  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  return (Date.now() - lastAlert) < cooldownMs;
};

/**
 * Set cooldown for alert type
 */
const setCooldown = (alertType) => {
  alertCooldowns.set(alertType, Date.now());
};

/**
 * Send alert via configured channels
 */
const sendAlert = async (alert) => {
  const { type, severity, title, message, details } = alert;

  // Check cooldown
  if (isOnCooldown(type)) {
    logger.info(`Alert "${type}" on cooldown, skipping`);
    return;
  }

  setCooldown(type);

  // Log the alert
  logger.error(`🚨 ALERT [${severity.toUpperCase()}]: ${title}`, { type, message, details });

  // Send email if configured
  if (process.env.ALERT_EMAIL) {
    try {
      await sendEmailAlert(alert);
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }

  // Send to Slack if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await sendSlackAlert(alert);
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
    }
  }

  // Send to Discord if configured
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await sendDiscordAlert(alert);
    } catch (error) {
      logger.error('Failed to send Discord alert:', error);
    }
  }
};

/**
 * Send email alert
 */
const sendEmailAlert = async (alert) => {
  const { severity, title, message, details, type } = alert;

  const severityColor = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#16a34a'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${severityColor[severity] || '#6b7280'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🚨 ${title}</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Severity: ${severity.toUpperCase()} | Type: ${type}</p>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">${message}</p>
        ${details ? `<pre style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>` : ''}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">
          Environment: ${process.env.NODE_ENV || 'development'}<br>
          Timestamp: ${new Date().toISOString()}<br>
          Server: ${process.env.SERVER_NAME || 'jn-automation'}
        </p>
      </div>
    </div>
  `;

  await emailService.sendRawEmail({
    to: process.env.ALERT_EMAIL,
    subject: `[${severity.toUpperCase()}] ${title} - JN Automation`,
    html
  });
};

/**
 * Send Slack alert
 */
const sendSlackAlert = async (alert) => {
  const { severity, title, message, details, type } = alert;

  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji[severity] || '⚪'} ${title}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Severity:*\n${severity.toUpperCase()}` },
          { type: 'mrkdwn', text: `*Type:*\n${type}` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ]
  };

  if (details) {
    payload.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`${JSON.stringify(details, null, 2)}\`\`\``
      }
    });
  }

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

/**
 * Send Discord alert
 */
const sendDiscordAlert = async (alert) => {
  const { severity, title, message, details, type } = alert;

  const severityColor = {
    critical: 0xdc2626,
    high: 0xea580c,
    medium: 0xca8a04,
    low: 0x16a34a
  };

  const payload = {
    embeds: [{
      title: `🚨 ${title}`,
      description: message,
      color: severityColor[severity] || 0x6b7280,
      fields: [
        { name: 'Severity', value: severity.toUpperCase(), inline: true },
        { name: 'Type', value: type, inline: true },
        { name: 'Environment', value: process.env.NODE_ENV || 'development', inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  if (details) {
    payload.embeds[0].fields.push({
      name: 'Details',
      value: `\`\`\`json\n${JSON.stringify(details, null, 2).substring(0, 1000)}\n\`\`\``
    });
  }

  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

// ==================== ALERT TRIGGERS ====================

/**
 * Alert on high error rate
 */
export const checkErrorRate = (metrics) => {
  if (metrics.requests.total < 100) {
    return; // Need enough data
  }

  const errorRate = metrics.requests.errors / metrics.requests.total;

  if (errorRate > THRESHOLDS.errorRate) {
    sendAlert({
      type: 'error_rate',
      severity: errorRate > 0.1 ? 'critical' : 'high',
      title: 'High Error Rate Detected',
      message: `Error rate is ${(errorRate * 100).toFixed(2)}% (threshold: ${THRESHOLDS.errorRate * 100}%)`,
      details: {
        totalRequests: metrics.requests.total,
        errors: metrics.requests.errors,
        errorRate: `${(errorRate * 100).toFixed(2)}%`
      }
    });
  }
};

/**
 * Alert on slow response times
 */
export const checkResponseTime = (metrics) => {
  if (metrics.responseTime.count < 50) {
    return;
  }

  const avgTime = metrics.responseTime.total / metrics.responseTime.count;

  if (avgTime > THRESHOLDS.responseTime) {
    sendAlert({
      type: 'slow_response',
      severity: avgTime > 5000 ? 'critical' : 'high',
      title: 'Slow Response Times',
      message: `Average response time is ${avgTime.toFixed(0)}ms (threshold: ${THRESHOLDS.responseTime}ms)`,
      details: {
        averageMs: avgTime.toFixed(0),
        maxMs: metrics.responseTime.max,
        requestCount: metrics.responseTime.count
      }
    });
  }
};

/**
 * Alert on high memory usage
 * Uses RSS (Resident Set Size) against a reasonable absolute threshold
 * Node's heap ratio is misleading since heap expands dynamically
 */
export const checkMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const rssMB = memUsage.rss / 1024 / 1024;

  // Alert if RSS exceeds 512MB (reasonable for Node.js API)
  const RSS_THRESHOLD_MB = 512;

  if (rssMB > RSS_THRESHOLD_MB) {
    const severity = rssMB > 768 ? 'critical' : 'high';
    sendAlert({
      type: 'memory_usage',
      severity,
      title: 'High Memory Usage',
      message: `Memory usage is ${rssMB.toFixed(0)}MB (threshold: ${RSS_THRESHOLD_MB}MB)`,
      details: {
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
        rss: `${rssMB.toFixed(1)}MB`
      }
    });
  }
};

/**
 * Alert on 5xx errors
 */
export const record5xxError = (error, req) => {
  const now = Date.now();

  // Add to recent errors
  recent5xxErrors.push({ timestamp: now, error: error.message, path: req?.path });

  // Clean old errors (older than 5 minutes)
  const fiveMinutesAgo = now - (5 * 60 * 1000);
  recent5xxErrors = recent5xxErrors.filter(e => e.timestamp > fiveMinutesAgo);

  // Check threshold
  if (recent5xxErrors.length >= THRESHOLDS.error5xxCount) {
    sendAlert({
      type: '5xx_errors',
      severity: 'critical',
      title: 'Multiple 5xx Errors',
      message: `${recent5xxErrors.length} server errors in the last 5 minutes`,
      details: {
        errors: recent5xxErrors.slice(-5).map(e => ({
          path: e.path,
          error: e.error,
          time: new Date(e.timestamp).toISOString()
        }))
      }
    });

    // Reset after alerting
    recent5xxErrors = [];
  }
};

/**
 * Alert on consecutive errors
 */
export const recordConsecutiveError = (error) => {
  consecutiveErrors++;

  if (consecutiveErrors >= THRESHOLDS.consecutiveErrors) {
    sendAlert({
      type: 'consecutive_errors',
      severity: 'critical',
      title: 'Consecutive Errors Detected',
      message: `${consecutiveErrors} consecutive errors - possible system issue`,
      details: {
        lastError: error.message,
        count: consecutiveErrors
      }
    });
  }
};

/**
 * Reset consecutive error count (on successful request)
 */
export const resetConsecutiveErrors = () => {
  consecutiveErrors = 0;
};

/**
 * Alert on database connection issues
 */
export const alertDatabaseIssue = (error) => {
  sendAlert({
    type: 'database',
    severity: 'critical',
    title: 'Database Connection Issue',
    message: 'MongoDB connection lost or errored',
    details: {
      error: error.message
    }
  });
};

/**
 * Alert on payment failures
 */
export const alertPaymentFailure = (bookingId, error, amount) => {
  sendAlert({
    type: 'payment_failure',
    severity: 'high',
    title: 'Payment Processing Failed',
    message: `Payment failed for booking ${bookingId}`,
    details: {
      bookingId,
      amount,
      error: error.message
    }
  });
};

/**
 * Alert on security events
 */
export const alertSecurityEvent = (event, details) => {
  sendAlert({
    type: 'security',
    severity: event.includes('breach') ? 'critical' : 'high',
    title: `Security Event: ${event}`,
    message: `Security event detected: ${event}`,
    details
  });
};

/**
 * Custom alert
 */
export const customAlert = (type, severity, title, message, details = null) => {
  sendAlert({ type, severity, title, message, details });
};

/**
 * Run periodic health checks
 */
export const startHealthChecks = (getMetricsFn, intervalMs = 60000) => {
  setInterval(() => {
    try {
      const metrics = getMetricsFn();
      checkErrorRate(metrics);
      checkResponseTime(metrics);
      checkMemoryUsage();
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }, intervalMs);

  logger.info(`🔔 Alerting service started (interval: ${intervalMs / 1000}s)`);
};

export default {
  sendAlert,
  checkErrorRate,
  checkResponseTime,
  checkMemoryUsage,
  record5xxError,
  recordConsecutiveError,
  resetConsecutiveErrors,
  alertDatabaseIssue,
  alertPaymentFailure,
  alertSecurityEvent,
  customAlert,
  startHealthChecks,
  THRESHOLDS
};
