import express from 'express';
import mongoose from 'mongoose';
import os from 'os';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Health Check Endpoints
 * For monitoring and uptime checks
 * Mounted at /health in server.js
 */

// Basic health check - GET /health
router.get('/', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    service: 'JN Business System API',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'CHECKING',
      memory: 'OK',
      cpu: 'OK'
    }
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.database = 'OK';
    } else {
      health.checks.database = 'ERROR';
      health.status = 'DEGRADED';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryUsagePercent = memUsage.heapUsed / memUsage.heapTotal;

    if (memoryUsagePercent > 0.9) {
      health.checks.memory = 'CRITICAL';
      health.status = 'DEGRADED';
    } else if (memoryUsagePercent > 0.7) {
      health.checks.memory = 'WARNING';
    }

    // Check CPU load
    const loadAvg = os.loadavg()[0]; // 1-minute average
    const cpuCount = os.cpus().length;
    const cpuLoadPercent = loadAvg / cpuCount;

    if (cpuLoadPercent > 0.9) {
      health.checks.cpu = 'CRITICAL';
      health.status = 'DEGRADED';
    } else if (cpuLoadPercent > 0.7) {
      health.checks.cpu = 'WARNING';
    }

    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      ...health,
      status: 'ERROR',
      error: error.message
    });
  }
});

// Detailed health check (for internal monitoring) - GET /health/detailed
router.get('/detailed', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const loadAvg = os.loadavg();

    const detailed = {
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) + '%'
      },
      cpu: {
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2)
        },
        cores: os.cpus().length
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name,
        host: mongoose.connection.host
      },
      environment: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch()
      }
    };

    res.json(detailed);

  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Readiness check (is service ready to accept traffic?)
router.get('/ready', async (req, res) => {
  try {
    // Check if MongoDB is ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        ready: false,
        reason: 'Database not connected'
      });
    }

    // Check if we can perform a simple query
    await mongoose.connection.db.admin().ping();

    res.json({
      ready: true,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      reason: error.message
    });
  }
});

// Liveness check (is service alive?)
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: Date.now()
  });
});

export default router;
