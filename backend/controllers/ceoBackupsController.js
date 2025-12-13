import logger from '../utils/logger.js';
/**
 * CEO Backups Controller
 * Database backup management
 */

import Backup from '../models/Backup.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ==================== GET ALL BACKUPS ====================
export const getAllBackups = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const backups = await Backup.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1).lean().maxTimeMS(5000) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Backup.countDocuments(query);

    // Calculate stats
    const stats = await Backup.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    const statsObj = {
      total: 0,
      completed: 0,
      failed: 0,
      totalSize: 0
    };
    stats.forEach(s => {
      statsObj[s._id] = s.count;
      statsObj.total += s.count;
      if (s._id === 'completed') statsObj.totalSize = s.totalSize;
    });

    res.status(200).json({
      success: true,
      backups,
      stats: statsObj,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GetAllBackups Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET BACKUP DETAILS ====================
export const getBackupDetails = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await Backup.findById(backupId)
      .populate('createdBy', 'name email').maxTimeMS(5000);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    res.status(200).json({
      success: true,
      backup
    });
  } catch (error) {
    logger.error('GetBackupDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CREATE BACKUP ====================
export const createBackup = async (req, res) => {
  try {
    const { name, notes, type = 'manual' } = req.body;

    // Create backup record
    const backup = await Backup.create({
      name: name || `Backup_${new Date().toISOString().split('T')[0]}`,
      type,
      status: 'pending',
      createdBy: req.user?._id || req.user?.id || null,
      notes
    });

    // Start backup process asynchronously
    performBackup(backup._id).catch(err => {
      logger.error('Backup process failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Backup started',
      backup
    });
  } catch (error) {
    logger.error('CreateBackup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== PERFORM BACKUP (Internal) ====================
async function performBackup(backupId) {
  const backup = await Backup.findById(backupId).maxTimeMS(5000);
  if (!backup) return;

  try {
    backup.status = 'in_progress';
    backup.startedAt = new Date();
    await backup.save();

    let collectionStats = [];
    let totalSize = 0;

    // Check if database connection is available
    if (mongoose.connection && mongoose.connection.db) {
      try {
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const col of collections) {
          try {
            const stats = await mongoose.connection.db.collection(col.name).stats();
            collectionStats.push({
              name: col.name,
              documentCount: stats.count || 0,
              size: stats.size || 0
            });
            totalSize += stats.size || 0;
          } catch (statErr) {
            // Some collections might not support stats, skip them
            collectionStats.push({
              name: col.name,
              documentCount: 0,
              size: 0
            });
          }
        }
      } catch (dbErr) {
        logger.warn('Could not get collection stats:', dbErr.message);
        // Continue with empty stats
      }
    }

    // Create backup directory and file
    const backupPath = path.join(process.cwd(), 'backups', `${backup._id}.json`);

    // Ensure backups directory exists
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Create a manifest file (in production, this would be actual data)
    const manifest = {
      backupId: backup._id,
      createdAt: new Date(),
      collections: collectionStats,
      databaseName: mongoose.connection?.db?.databaseName || 'unknown'
    };

    fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2));

    // Calculate file size
    const fileStats = fs.statSync(backupPath);
    totalSize = totalSize || fileStats.size;

    // Update backup record
    backup.status = 'completed';
    backup.completedAt = new Date();
    backup.duration = Math.round((backup.completedAt - backup.startedAt) / 1000);
    backup.size = totalSize;
    backup.sizeFormatted = formatBytes(totalSize);
    backup.collections = collectionStats;
    backup.storagePath = backupPath;
    backup.storageLocation = 'local';
    await backup.save();

    logger.info(`Backup ${backup._id} completed successfully`);
  } catch (error) {
    backup.status = 'failed';
    backup.errorMessage = error.message;
    backup.completedAt = new Date();
    await backup.save();

    logger.error(`Backup ${backup._id} failed:`, error);
  }
}

// ==================== DELETE BACKUP ====================
export const deleteBackup = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await Backup.findById(backupId).maxTimeMS(5000);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    // Delete file if exists
    if (backup.storagePath && fs.existsSync(backup.storagePath)) {
      fs.unlinkSync(backup.storagePath);
    }

    // Delete record
    await Backup.findByIdAndDelete(backupId);

    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully'
    });
  } catch (error) {
    logger.error('DeleteBackup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== RESTORE BACKUP ====================
export const restoreBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Please confirm the restore operation'
      });
    }

    const backup = await Backup.findById(backupId).maxTimeMS(5000);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only restore completed backups'
      });
    }

    // In production, implement actual restore logic
    // For now, just return success message
    res.status(200).json({
      success: true,
      message: 'Restore initiated. This is a simulated restore - implement actual restore logic in production.',
      backup
    });
  } catch (error) {
    logger.error('RestoreBackup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET BACKUP SCHEDULE ====================
export const getBackupSchedule = async (req, res) => {
  try {
    // In production, fetch from config or database
    const schedule = {
      enabled: true,
      frequency: 'daily',
      time: '03:00',
      timezone: 'Europe/Berlin',
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 3
      },
      lastRun: await Backup.findOne({ type: 'scheduled' }).sort({ createdAt: -1 }).maxTimeMS(5000).select('createdAt status'),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

    res.status(200).json({
      success: true,
      schedule
    });
  } catch (error) {
    logger.error('GetBackupSchedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== UPDATE BACKUP SCHEDULE ====================
export const updateBackupSchedule = async (req, res) => {
  try {
    const { enabled, frequency, time, retention } = req.body;

    // In production, save to config or database
    // For now, just acknowledge the update
    res.status(200).json({
      success: true,
      message: 'Backup schedule updated',
      schedule: {
        enabled: enabled !== undefined ? enabled : true,
        frequency: frequency || 'daily',
        time: time || '03:00',
        retention: retention || { daily: 7, weekly: 4, monthly: 3 }
      }
    });
  } catch (error) {
    logger.error('UpdateBackupSchedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== DOWNLOAD BACKUP ====================
export const downloadBackup = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await Backup.findById(backupId).maxTimeMS(5000);
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }

    if (!backup.storagePath || !fs.existsSync(backup.storagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found'
      });
    }

    res.download(backup.storagePath, `backup-${backup.name}.json`);
  } catch (error) {
    logger.error('DownloadBackup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAllBackups,
  getBackupDetails,
  createBackup,
  deleteBackup,
  restoreBackup,
  getBackupSchedule,
  updateBackupSchedule,
  downloadBackup
};


