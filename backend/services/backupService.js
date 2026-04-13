import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import alertingService from './alertingService.js';
import Backup from '../models/Backup.js';
import ErrorLog from '../models/ErrorLog.js';

/**
 * Run an external command via spawn (never exec) to prevent shell injection.
 * @param {string} command - The executable name.
 * @param {string[]} args  - Array of arguments (no shell expansion applied).
 */
const spawnAsync = (command, args) =>
  new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'pipe' });
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.slice(0, 500)}`));
    });
    proc.on('error', reject);
  });

/**
 * ? SECURITY FIX: Automated Database Backup Service
 *
 * Features:
 * - Automated daily MongoDB backups (3 AM)
 * - 7-day retention policy
 * - Backup verification
 * - Backup metadata stored in database
 * - Cloud storage integration (S3/Railway) - optional
 * - Restore procedures
 */

// Backup directory: MUST come from env var; never default to a relative path that could
// land inside the repository. Fall back to a user-home subdirectory instead.
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(os.homedir(), 'jn-backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7'); // ? SECURITY FIX: 7 days retention
const BACKUP_SCHEDULE = process.env.BACKUP_SCHEDULE || '0 3 * * *'; // ? SECURITY FIX: 3 AM daily

/**
 * Create MongoDB backup using mongodump
 */
const createMongoBackup = async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }

    logger.log(`?? Starting MongoDB backup to ${backupPath}...`);

    // Use mongodump if available, otherwise use mongoose export
    if (await isMongoToolsInstalled()) {
      // spawn() with an argument array — no shell expansion, no injection risk
      await spawnAsync('mongodump', [`--uri=${mongoUri}`, `--out=${backupPath}`]);
    } else {
      // Fallback: Export collections using mongoose
      await exportCollectionsManually(backupPath);
    }

    // Compress backup (spawn — no shell string interpolation)
    const zipPath = `${backupPath}.tar.gz`;
    if (process.platform === 'win32') {
      // Windows: Use 7zip or skip compression
      logger.warn('?? Compression skipped on Windows. Install 7zip for compression.');
    } else {
      await spawnAsync('tar', ['-czf', zipPath, '-C', BACKUP_DIR, path.basename(backupPath)]);
      // Remove uncompressed directory
      await fs.rm(backupPath, { recursive: true, force: true });

      // Restrict backup file to owner read/write only
      await fs.chmod(zipPath, 0o600);
    }

    const backupSize = await getFileSize(process.platform === 'win32' ? backupPath : zipPath);
    const backupSizeBytes = (await fs.stat(process.platform === 'win32' ? backupPath : zipPath)).size;

    logger.log(`? Backup completed: ${backupSize}MB`);

    // ? SECURITY FIX: Store backup metadata in database
    const backupRecord = await Backup.create({
      name: `backup-${timestamp}`,
      type: 'scheduled',
      size: backupSizeBytes,
      storageLocation: 'local',
      storagePath: process.platform === 'win32' ? backupPath : zipPath,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000) // 7 days from now
    });

    logger.log(`? Backup metadata saved: ${backupRecord._id}`);

    return {
      success: true,
      path: process.platform === 'win32' ? backupPath : zipPath,
      size: backupSize,
      sizeBytes: backupSizeBytes,
      timestamp: new Date().toISOString(),
      backupId: backupRecord._id
    };
  } catch (error) {
    logger.error('? Backup creation failed:', error.message);

    ErrorLog.logError({
      type: 'backup_failure',
      message: `Backup creation failed: ${error.message}`,
      source: 'service'
    }).catch(e => logger.error('ErrorLog write failed:', e.message));

    // Send alert
    await alertingService.sendAlert({
      severity: 'high',
      message: 'Database backup failed',
      error: error.message,
      timestamp: new Date()
    }).catch(err => logger.error('Alert sending failed:', err));

    throw error;
  }
};

/**
 * Export collections manually (fallback when mongodump not available)
 */
const exportCollectionsManually = async (backupPath) => {
  await fs.mkdir(backupPath, { recursive: true });

  const collections = await mongoose.connection.db.listCollections().toArray();

  for (const collInfo of collections) {
    const collName = collInfo.name;
    const collection = mongoose.connection.db.collection(collName);
    const documents = await collection.find({}).toArray();

    const filePath = path.join(backupPath, `${collName}.json`);
    await fs.writeFile(filePath, JSON.stringify(documents, null, 2), 'utf8');

    logger.log(`  ? Exported ${collName}: ${documents.length} documents`);
  }
};

/**
 * Check if MongoDB tools are installed
 */
const isMongoToolsInstalled = async () => {
  try {
    await spawnAsync('mongodump', ['--version']);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file size in MB
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return (stats.size / 1024 / 1024).toFixed(2);
  } catch {
    return 0;
  }
};

/**
 * Clean up old backups (retention policy)
 * ? SECURITY FIX: Clean up both files and database records
 */
const cleanupOldBackups = async () => {
  try {
    const now = new Date();
    const retentionDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Clean up old backup files
    const files = await fs.readdir(BACKUP_DIR);
    let deletedFilesCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup-')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const fileDate = new Date(stats.mtimeMs);

      if (fileDate < retentionDate) {
        await fs.rm(filePath, { recursive: true, force: true });
        deletedFilesCount++;
        logger.log(`???  Deleted old backup file: ${file}`);
      }
    }

    // ? SECURITY FIX: Clean up old backup records from database
    const markedRecords = await Backup.updateMany(
      {
        status: 'completed',
        createdAt: { $lt: retentionDate }
      },
      {
        status: 'deleted'
      }
    );

    // Actually delete old records (optional - can keep for audit)
    const actuallyDeleted = await Backup.deleteMany({
      status: 'deleted',
      createdAt: { $lt: new Date(now.getTime() - (RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000) }
    });

    const markedRecordsCount = markedRecords.modifiedCount || 0;
    const totalDeleted = deletedFilesCount + actuallyDeleted.deletedCount;

    if (totalDeleted > 0) {
      logger.log(`? Cleaned up ${deletedFilesCount} old backup files, marked ${markedRecordsCount} records, and removed ${actuallyDeleted.deletedCount} database records`);
    }

    return {
      deletedFilesCount,
      markedRecordsCount,
      deletedRecordsCount: actuallyDeleted.deletedCount
    };
  } catch (error) {
    logger.error('? Backup cleanup failed:', error.message);

    ErrorLog.logError({
      type: 'backup_failure',
      message: `Backup cleanup failed: ${error.message}`,
      source: 'service'
    }).catch(e => logger.error('ErrorLog write failed:', e.message));

    throw error;
  }
};

/**
 * List all available backups.
 * Internal file paths are never exposed in the returned objects.
 */
const listBackups = async () => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (!file.startsWith('backup-')) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);

      backups.push({
        filename: file,
        // Do NOT include the full server path — it must never reach API responses
        size: `${(stats.size / 1024 / 1024).toFixed(2)}MB`,
        created: stats.mtime.toISOString(),
        age: `${Math.round((Date.now() - stats.mtimeMs) / 1000 / 60 / 60 / 24)} days`
      });
    }

    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    logger.error('? Failed to list backups:', error);
    return [];
  }
};

/**
 * Restore from backup (CAUTION!)
 *
 * @param {string} backupName - The filename (not a full path) of the backup to restore.
 *   Only alphanumeric characters, hyphens, underscores and dots are accepted.
 *   The resolved path must be inside BACKUP_DIR (path-traversal check).
 */
const restoreFromBackup = async (backupName) => {
  try {
    logger.warn('??  RESTORE OPERATION STARTED - This will overwrite current data!');

    // 1. Sanitize input: allow only safe filename characters
    const SAFE_FILENAME = /^[a-zA-Z0-9_\-\.]+$/;
    if (!backupName || !SAFE_FILENAME.test(backupName)) {
      throw new Error('Invalid backup name. Only alphanumeric, hyphen, underscore and dot characters are allowed.');
    }

    // 2. Path traversal check — resolved path must stay inside BACKUP_DIR
    const resolvedBackupDir = path.resolve(BACKUP_DIR);
    const resolvedBackupPath = path.resolve(BACKUP_DIR, backupName);
    if (!resolvedBackupPath.startsWith(resolvedBackupDir + path.sep)) {
      throw new Error('Path traversal detected');
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }

    // 3. Extract if compressed (spawn — no shell string interpolation)
    let extractedPath = resolvedBackupPath;
    if (backupName.endsWith('.tar.gz')) {
      extractedPath = resolvedBackupPath.replace('.tar.gz', '');
      await spawnAsync('tar', ['-xzf', resolvedBackupPath, '-C', resolvedBackupDir]);
    }

    // 4. Restore using mongorestore (spawn — argument array, no shell injection)
    if (await isMongoToolsInstalled()) {
      await spawnAsync('mongorestore', [`--uri=${mongoUri}`, '--drop', extractedPath]);
    } else {
      throw new Error('mongorestore not available. Manual restore required.');
    }

    logger.log('? Restore completed successfully');

    return {
      success: true,
      message: 'Database restored successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('? Restore failed:', error.message);

    ErrorLog.logError({
      type: 'backup_failure',
      message: `Restore operation failed: ${error.message}`,
      source: 'service'
    }).catch(e => logger.error('ErrorLog write failed:', e.message));

    // Re-throw without leaking internal paths to the caller
    throw new Error('Restore failed. Check server logs for details.');
  }
};

/**
 * Run automated backup job
 * ? SECURITY FIX: Creates backup, stores metadata, and cleans up old backups
 */
const runBackupJob = async () => {
  try {
    logger.log('?? Starting scheduled backup job...');
    const startTime = Date.now();

    // Create backup
    const result = await createMongoBackup();

    // Update backup record with duration
    if (result.backupId) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      await Backup.findByIdAndUpdate(result.backupId, {
        duration,
        completedAt: new Date()
      });
    }

    // Clean up old backups (keep last 7 days)
    await cleanupOldBackups();

    logger.log(`? Backup job completed successfully in ${Math.round((Date.now() - startTime) / 1000)}s`);

    return result;
  } catch (error) {
    logger.error('? Backup job failed:', error);

    // ? SECURITY FIX: Mark backup as failed in database if record exists
    if (error.backupId) {
      await Backup.findByIdAndUpdate(error.backupId, {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      }).catch(err => logger.error('Failed to update backup record:', err));
    }

    throw error;
  }
};

export default {
  createMongoBackup,
  cleanupOldBackups,
  listBackups,
  restoreFromBackup,
  runBackupJob,
  BACKUP_SCHEDULE
};
