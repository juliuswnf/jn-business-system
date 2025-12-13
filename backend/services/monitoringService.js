import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import cacheService from './cacheService.js';

/**
 * Monitoring Service
 * Provides health checks, metrics collection, and system status
 */

// Store metrics in memory (use Redis in production for distributed systems)
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: {}
  },
  responseTime: {
    total: 0,
    count: 0,
    max: 0,
    min: Infinity
  },
  errors: {
    byType: {},
    recent: []
  },
  uptime: Date.now()
};

/**
 * Record a request metric
 */
export const recordRequest = (req, res, duration) => {
  metrics.requests.total++;

  if (res.statusCode >= 400) {
    metrics.requests.errors++;
  } else {
    metrics.requests.success++;
  }

  // Track by endpoint
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  if (!metrics.requests.byEndpoint[endpoint]) {
    metrics.requests.byEndpoint[endpoint] = { count: 0, totalTime: 0 };
  }
  metrics.requests.byEndpoint[endpoint].count++;
  metrics.requests.byEndpoint[endpoint].totalTime += duration;

  // Track response time
  metrics.responseTime.total += duration;
  metrics.responseTime.count++;
  metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
  metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);

  // Log slow requests
  if (duration > 1000) {
    logger.performance(endpoint, duration, {
      statusCode: res.statusCode,
      userId: req.user?._id?.toString()
    });
  }
};

/**
 * Record an error metric
 */
export const recordError = (error, req) => {
  const errorType = error.name || 'UnknownError';

  if (!metrics.errors.byType[errorType]) {
    metrics.errors.byType[errorType] = 0;
  }
  metrics.errors.byType[errorType]++;

  // Keep last 100 errors
  metrics.errors.recent.unshift({
    type: errorType,
    message: error.message,
    path: req?.path,
    timestamp: new Date().toISOString()
  });
  if (metrics.errors.recent.length > 100) {
    metrics.errors.recent.pop();
  }
};

/**
 * Get health check status
 */
export const getHealthStatus = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - metrics.uptime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    services: {}
  };

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState;
    health.services.mongodb = {
      status: mongoState === 1 ? 'connected' : 'disconnected',
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoState]
    };
    if (mongoState !== 1) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services.mongodb = { status: 'error', error: error.message };
    health.status = 'unhealthy';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  health.services.memory = {
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
  };

  // Warn if memory usage is high
  const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
  if (heapUsedPercent > 0.9) {
    health.status = 'degraded';
    health.services.memory.warning = 'High memory usage';
  }

  return health;
};

/**
 * Get metrics summary
 */
export const getMetrics = () => {
  const avgResponseTime = metrics.responseTime.count > 0
    ? Math.round(metrics.responseTime.total / metrics.responseTime.count)
    : 0;

  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - metrics.uptime) / 1000),
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      successRate: metrics.requests.total > 0
        ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    responseTime: {
      average: avgResponseTime + 'ms',
      max: metrics.responseTime.max + 'ms',
      min: metrics.responseTime.min === Infinity ? '0ms' : metrics.responseTime.min + 'ms'
    },
    cache: cacheService.getStats(),
    errors: {
      byType: metrics.errors.byType,
      recentCount: metrics.errors.recent.length
    },
    topEndpoints: Object.entries(metrics.requests.byEndpoint)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([endpoint, data]) => ({
        endpoint,
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count) + 'ms'
      }))
  };
};

/**
 * Request timing middleware
 */
export const requestTimingMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    recordRequest(req, res, duration);
  });

  next();
};

/**
 * Reset metrics (for testing)
 */
export const resetMetrics = () => {
  metrics.requests = { total: 0, success: 0, errors: 0, byEndpoint: {} };
  metrics.responseTime = { total: 0, count: 0, max: 0, min: Infinity };
  metrics.errors = { byType: {}, recent: [] };
  metrics.uptime = Date.now();
};

export default {
  recordRequest,
  recordError,
  getHealthStatus,
  getMetrics,
  requestTimingMiddleware,
  resetMetrics
};
