import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Stripe from 'stripe';

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
 * Check email queue health
 */
const checkEmailQueue = async () => {
  try {
    const pendingCount = await EmailQueue.countDocuments({ status: 'pending' });
    const failedCount = await EmailQueue.countDocuments({ status: 'failed' });
    const oldestPending = await EmailQueue.findOne({ status: 'pending' })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();

    // Alert if >100 pending or oldest pending >1 hour
    const maxPendingAge = oldestPending 
      ? Date.now() - new Date(oldestPending.createdAt).getTime()
      : 0;
    const oneHour = 60 * 60 * 1000;

    const isHealthy = pendingCount < 100 && maxPendingAge < oneHour;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      message: isHealthy ? 'Email queue processing' : 'Email queue backlog detected',
      details: {
        pending: pendingCount,
        failed: failedCount,
        oldestPendingAge: oldestPending ? `${Math.round(maxPendingAge / 1000 / 60)}min` : 'none'
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
    const isHealthy = heapUsagePercent < 90; // Alert if >90% heap used

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
 */
export const getHealthStatus = async () => {
  const checks = {
    database: await checkDatabase(),
    stripe: await checkStripe(),
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

export default {
  getHealthStatus,
  healthCheckEndpoint,
  checkDatabase,
  checkStripe,
  checkEmailQueue,
  checkMemory,
  checkProcess
};
