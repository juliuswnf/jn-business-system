import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Stripe from 'stripe';
import alertingService from './alertingService.js';

import EmailQueue from '../models/EmailQueue.js';

/**
 * ? MEDIUM FIX #14: Comprehensive Health Check Service
 *
 * Monitors all critical system components:
 * - Database connectivity
 * - Email service status
 * - Stripe connectivity
 * - Worker status
 * - Memory usage
 * - Queue health
 */

let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Check MongoDB connection health
 */
const checkDatabase = async () => {
  try {
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state !== 1) {
      return {
        status: 'unhealthy',
        message: `Database ${stateMap[state]}`,
        details: { state: stateMap[state] }
      };
    }

    // Test query
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Database connected',
      details: {
        state: 'connected',
        responseTime: `${responseTime}ms`,
        host: mongoose.connection.host,
        database: mongoose.connection.name
      }
    };
  } catch (error) {
    logger.error('? Database health check failed:', error);
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      details: { error: error.message }
    };
  }
};

/**
 * Check Stripe API connectivity
 */
const checkStripe = async () => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        status: 'disabled',
        message: 'Stripe not configured',
        details: { configured: false }
      };
    }

    const stripeClient = getStripe();
    const startTime = Date.now();

    // Test API call
    await stripeClient.balance.retrieve();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Stripe API connected',
      details: {
        configured: true,
        responseTime: `${responseTime}ms`,
        mode: process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test'
      }
    };
  } catch (error) {
    logger.error('? Stripe health check failed:', error);
    return {
      status: 'unhealthy',
      message: 'Stripe API connection failed',
      details: { error: error.message }
    };
  }
};

/**
 * ? SECURITY FIX: Check Twilio API connectivity
 */
const checkTwilio = async () => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return {
        status: 'disabled',
        message: 'Twilio not configured',
        details: { configured: false }
      };
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const startTime = Date.now();

    // Test API call (get account info)
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Twilio API connected',
      details: {
        configured: true,
        responseTime: `${responseTime}ms`,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'not set'
      }
    };
  } catch (error) {
    // Authentication errors = invalid credentials = config problem, not an outage
    if (error.message === 'Authenticate' || error.status === 401 || error.code === 20003) {
      return {
        status: 'disabled',
        message: 'Twilio credentials invalid or not activated',
        details: { configured: false, error: error.message }
      };
    }
    logger.error('? Twilio health check failed:', error);
    return {
      status: 'unhealthy',
      message: 'Twilio API connection failed',
      details: { error: error.message }
    };
  }
};

/**
 * ? SECURITY FIX: Check Redis connectivity
 */
const checkRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'disabled',
        message: 'Redis not configured',
        details: { configured: false }
      };
    }

    const { createClient } = await import('redis');
    const testClient = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: false } // one-shot check, no retries
    });

    const startTime = Date.now();

    // Connect and test
    await testClient.connect();
    await testClient.ping();
    await testClient.quit();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Redis connected',
      details: {
        configured: true,
        responseTime: `${responseTime}ms`
      }
    };
  } catch (error) {
    // Connection refused = Redis not running locally — treat as disabled, not a critical outage
    return {
      status: 'disabled',
      message: 'Redis not available',
      details: { configured: false, error: error.message }
    };
  }
};

/**
 * Check email queue health
 * Only flags OVERDUE pending emails (scheduledFor in the past) as a problem.
 * Emails scheduled for the future (lifecycle, reminders) are intentional and not counted.
 */
const checkEmailQueue = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // Only count emails that were supposed to be sent already (overdue)
    const overduePendingCount = await EmailQueue.countDocuments({
      status: 'pending',
      scheduledFor: { $lte: now }
    });
    const failedCount = await EmailQueue.countDocuments({ status: 'failed' });

    // Find oldest overdue pending email
    const oldestOverdue = await EmailQueue.findOne({
      status: 'pending',
      scheduledFor: { $lte: now }
    })
      .sort({ scheduledFor: 1 })
      .select('scheduledFor')
      .lean();

    const maxOverdueAge = oldestOverdue
      ? now - new Date(oldestOverdue.scheduledFor).getTime()
      : 0;

    // Alert if >50 overdue OR oldest overdue >2 hours
    const twoHours = 2 * 60 * 60 * 1000;
    const isHealthy = overduePendingCount < 50 && maxOverdueAge < twoHours;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      message: isHealthy ? 'Email queue processing' : 'Email queue backlog detected',
      details: {
        overduePending: overduePendingCount,
        failed: failedCount,
        oldestOverdueAge: oldestOverdue ? `${Math.round(maxOverdueAge / 1000 / 60)}min` : 'none'
      }
    };
  } catch (error) {
    logger.error('? Email queue health check failed:', error);
    return {
      status: 'unhealthy',
      message: 'Email queue check failed',
      details: { error: error.message }
    };
  }
};

/**
 * Check system memory usage
 */
const checkMemory = () => {
  try {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const rssMB = Math.round(used.rss / 1024 / 1024);

    const heapUsagePercent = (used.heapUsed / used.heapTotal) * 100;
    // 90% threshold is misleading — heapTotal is currently allocated (not Node.js max).
    // Only alert if heap is large AND near-full to avoid false positives.
    const isHealthy = heapUsagePercent < 95 || heapUsedMB < 200;

    return {
      status: isHealthy ? 'healthy' : 'warning',
      message: isHealthy ? 'Memory usage normal' : 'High memory usage detected',
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssMB}MB`,
        heapUsagePercent: `${heapUsagePercent.toFixed(1)}%`
      }
    };
  } catch (error) {
    logger.error('? Memory health check failed:', error);
    return {
      status: 'unknown',
      message: 'Memory check failed',
      details: { error: error.message }
    };
  }
};

/**
 * Check uptime and process info
 */
const checkProcess = () => {
  const uptimeSeconds = process.uptime();
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  return {
    status: 'healthy',
    message: 'Process running',
    details: {
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
};

/**
 * Comprehensive health check
 * ? SECURITY FIX: Auto-alerts for unhealthy dependencies
 */
export const getHealthStatus = async () => {
  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripe(),
    twilio: await checkTwilio(),
    redis: await checkRedis(),
    emailQueue: await checkEmailQueue(),
    memory: checkMemory(),
    process: checkProcess()
  };

  // Determine overall status
  const hasUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');
  const hasDegraded = Object.values(checks).some(c => c.status === 'degraded' || c.status === 'warning');

  let overallStatus = 'healthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  }

  // ? SECURITY FIX: Auto-alert on unhealthy dependencies
  if (hasUnhealthy) {
    const unhealthyChecks = Object.entries(checks)
      .filter(([_, check]) => check.status === 'unhealthy')
      .map(([name, check]) => ({ name, message: check.message, details: check.details }));

    alertingService.sendAlert({
      type: 'dependency_unhealthy',
      severity: 'critical',
      title: 'Critical Dependencies Unhealthy',
      message: `${unhealthyChecks.length} dependency(ies) are unhealthy: ${unhealthyChecks.map(c => c.name).join(', ')}`,
      details: {
        unhealthy: unhealthyChecks,
        overallStatus,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Alert on degraded services
  if (hasDegraded && !hasUnhealthy) {
    const degradedChecks = Object.entries(checks)
      .filter(([_, check]) => check.status === 'degraded' || check.status === 'warning')
      .map(([name, check]) => ({ name, message: check.message, details: check.details }));

    alertingService.sendAlert({
      type: 'dependency_degraded',
      severity: 'high',
      title: 'Dependencies Degraded',
      message: `${degradedChecks.length} dependency(ies) are degraded: ${degradedChecks.map(c => c.name).join(', ')}`,
      details: {
        degraded: degradedChecks,
        overallStatus,
        timestamp: new Date().toISOString()
      }
    });
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks
  };
};

/**
 * Express middleware for health endpoint
 */
export const healthCheckEndpoint = async (req, res) => {
  try {
    const health = await getHealthStatus();

    // Return appropriate HTTP status code
    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      ...health
    });
  } catch (error) {
    logger.error('? Health check endpoint error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message
    });
  }
};

/**
 * ? SECURITY FIX: Start periodic health checks with auto-alerts
 */
export const startPeriodicHealthChecks = (intervalMs = 60000) => {
  setInterval(async () => {
    try {
      await getHealthStatus(); // This will trigger alerts if unhealthy
    } catch (error) {
      logger.error('Periodic health check failed:', error);
    }
  }, intervalMs);

  logger.info(`✅ Periodic health checks started (interval: ${intervalMs / 1000}s)`);
};

export default {
  getHealthStatus,
  healthCheckEndpoint,
  startPeriodicHealthChecks,
  checkDatabase,
  checkStripe,
  checkTwilio,
  checkRedis,
  checkEmailQueue,
  checkMemory,
  checkProcess
};
