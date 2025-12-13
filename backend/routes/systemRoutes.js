import express from 'express';
import healthCheckService from '../services/healthCheckService.js';
import backupService from '../services/backupService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * ? MEDIUM FIX #14: Comprehensive Health Check Routes
 * ? MEDIUM FIX #13: Backup Management Routes
 */

// ==================== PUBLIC HEALTH CHECK ====================

// Simple health check (no auth required - for load balancers)
router.get('/ping', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Comprehensive health check (no auth required)
router.get('/health', healthCheckService.healthCheckEndpoint);

// ==================== ADMIN ROUTES (AUTH REQUIRED) ====================

// Protect admin routes
router.use(authMiddleware.protect);
router.use((req, res, next) => {
  if (req.user.role !== 'ceo' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
});

// Get detailed health status
router.get('/health/detailed', async (req, res) => {
  try {
    const health = await healthCheckService.getHealthStatus();
    return res.status(200).json({
      success: true,
      ...health
    });
  } catch (error) {
    logger.error('? Detailed health check failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ==================== BACKUP ROUTES ====================

// Create manual backup
router.post('/backups/create', async (req, res) => {
  try {
    const result = await backupService.createMongoBackup();
    return res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backup: result
    });
  } catch (error) {
    logger.error('? Backup creation failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup creation failed',
      error: error.message
    });
  }
});

// List all backups
router.get('/backups', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    return res.status(200).json({
      success: true,
      count: backups.length,
      backups
    });
  } catch (error) {
    logger.error('? Failed to list backups:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

// Clean up old backups
router.post('/backups/cleanup', async (req, res) => {
  try {
    const result = await backupService.cleanupOldBackups();
    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old backups`,
      ...result
    });
  } catch (error) {
    logger.error('? Backup cleanup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Backup cleanup failed',
      error: error.message
    });
  }
});

// Restore from backup (DANGEROUS - requires confirmation)
router.post('/backups/restore', async (req, res) => {
  try {
    const { backupPath, confirm } = req.body;

    if (confirm !== 'YES_I_UNDERSTAND_THIS_WILL_OVERWRITE_DATA') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Set confirm: "YES_I_UNDERSTAND_THIS_WILL_OVERWRITE_DATA"'
      });
    }

    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: 'backupPath required'
      });
    }

    const result = await backupService.restoreFromBackup(backupPath);
    return res.status(200).json({
      success: true,
      message: 'Restore completed',
      ...result
    });
  } catch (error) {
    logger.error('? Restore failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error.message
    });
  }
});

export default router;
