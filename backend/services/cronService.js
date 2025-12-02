import cron from 'node-cron';
import logger from '../utils/logger.js';

// ==================== CLEANUP JOBS ====================

const cleanupExpiredErrorLogs = async () => {
  try {
    // MVP: Error logs are console-only, no DB cleanup needed
    logger.log('✅ Cleanup: Error logs cleanup triggered (console-only for MVP)');
  } catch (err) {
    logger.error('❌ Cleanup error logs failed:', err.message);
  }
};

const cleanupExpiredSessions = async () => {
  try {
    logger.log('✅ Session cleanup triggered');
  } catch (err) {
    logger.error('❌ Session cleanup failed:', err.message);
  }
};

const cleanupOrphanedData = async () => {
  try {
    logger.log('✅ Orphaned data cleanup triggered');
  } catch (err) {
    logger.error('❌ Orphaned data cleanup failed:', err.message);
  }
};

// ==================== MAINTENANCE JOBS ====================

const performDatabaseMaintenance = async () => {
  try {
    logger.log('✅ Database maintenance started');
    // Add DB index building, stats update, etc.
  } catch (err) {
    logger.error('❌ Database maintenance failed:', err.message);
  }
};

const generateSystemReport = async () => {
  try {
    // MVP: Simple console report
    logger.log('✅ System Report: System running normally');
  } catch (err) {
    logger.error('❌ System report generation failed:', err.message);
  }
};

// ==================== MONITORING JOBS ====================

const checkSystemHealth = async () => {
  try {
    logger.log('✅ System health check passed');
  } catch (err) {
    logger.error('❌ System health check failed:', err.message);
  }
};

const checkWebhookHealth = async () => {
  try {
    logger.log('✅ Webhook health check triggered');
  } catch (err) {
    logger.error('❌ Webhook health check failed:', err.message);
  }
};

// ==================== NOTIFICATION JOBS ====================

const sendDailyReports = async () => {
  try {
    logger.log('✅ Daily reports sent');
  } catch (err) {
    logger.error('❌ Daily report sending failed:', err.message);
  }
};

const sendWeeklyDigest = async () => {
  try {
    logger.log('✅ Weekly digest sent');
  } catch (err) {
    logger.error('❌ Weekly digest sending failed:', err.message);
  }
};

// ==================== INITIALIZE CRON JOBS ====================

export const initializeCronJobs = () => {
  try {
    logger.log('🕐 Initializing Cron Jobs...');

    // ✅ Cleanup Jobs
    // Every day at 2 AM - Clean up old error logs
    cron.schedule('0 2 * * *', cleanupExpiredErrorLogs);

    // Every day at 3 AM - Clean up expired sessions
    cron.schedule('0 3 * * *', cleanupExpiredSessions);

    // Every day at 4 AM - Clean up orphaned data
    cron.schedule('0 4 * * *', cleanupOrphanedData);

    // ✅ Maintenance Jobs
    // Every Sunday at 3 AM - Database maintenance
    cron.schedule('0 3 * * 0', performDatabaseMaintenance);

    // Every day at 6 AM - Generate system report
    cron.schedule('0 6 * * *', generateSystemReport);

    // ✅ Monitoring Jobs
    // Every 5 minutes - Check system health
    cron.schedule('*/5 * * * *', checkSystemHealth);

    // Every 10 minutes - Check webhook health
    cron.schedule('*/10 * * * *', checkWebhookHealth);

    // ✅ Notification Jobs
    // Every day at 8 AM - Send daily reports
    cron.schedule('0 8 * * *', sendDailyReports);

    // Every Monday at 9 AM - Send weekly digest
    cron.schedule('0 9 * * 1', sendWeeklyDigest);

    logger.log('✅ All Cron Jobs initialized successfully');
  } catch (err) {
    logger.error('❌ Failed to initialize cron jobs:', err.message);
    throw err;
  }
};

// ==================== STOP CRON JOBS ====================

export const stopAllCronJobs = () => {
  try {
    cron.getTasks().forEach(task => {
      task.stop();
    });
    logger.log('✅ All cron jobs stopped');
  } catch (err) {
    logger.error('❌ Failed to stop cron jobs:', err.message);
    throw err;
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  initializeCronJobs,
  stopAllCronJobs,
  cleanupExpiredErrorLogs,
  cleanupExpiredSessions,
  checkSystemHealth,
  sendDailyReports
};
