/**
 * Lifecycle Email Worker
 * Cron job that processes and sends lifecycle emails
 *
 * Runs every hour to check for pending lifecycle emails
 * and sends them to nurture trial users toward conversion
 */

import LifecycleEmail from '../models/LifecycleEmail.js';
import { sendEmail } from '../services/emailService.js';
import { getLifecycleEmailTemplate } from '../services/lifecycleEmailTemplates.js';
import logger from '../utils/logger.js';

// Track if worker is running
let isRunning = false;
let intervalId = null;

/**
 * Process all pending lifecycle emails
 */
export const processLifecycleEmails = async () => {
  if (isRunning) {
    logger.log('? Lifecycle email worker already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    const pendingEmails = await LifecycleEmail.getPendingEmails(50);

    if (pendingEmails.length === 0) {
      return;
    }

    logger.log(`?? Processing ${pendingEmails.length} lifecycle emails...`);

    for (const emailDoc of pendingEmails) {
      await processLifecycleEmail(emailDoc);
    }

    logger.log('? Finished processing lifecycle emails');
  } catch (error) {
    logger.error('? Error in lifecycle email worker:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Process a single lifecycle email
 */
const processLifecycleEmail = async (emailDoc) => {
  try {
    const { salonId, userId, emailType } = emailDoc;

    // Validate salon and user exist
    if (!salonId || !userId) {
      emailDoc.status = 'failed';
      emailDoc.error = 'Salon or User not found';
      await emailDoc.save();
      return;
    }

    // Check if salon has already converted (has active subscription)
    if (salonId.subscription?.status === 'active') {
      emailDoc.status = 'skipped';
      emailDoc.error = 'Salon already converted';
      await emailDoc.save();
      logger.log(`??  Skipping ${emailType} for ${salonId.name} (already converted)`);
      return;
    }

    // Check if salon has cancelled subscription
    if (salonId.subscription?.status === 'cancelled') {
      emailDoc.status = 'skipped';
      emailDoc.error = 'Subscription cancelled';
      await emailDoc.save();
      return;
    }

    // Get email template
    const template = getLifecycleEmailTemplate(emailType, {
      userName: userId.name || userId.email?.split('@')[0] || 'Geschätzter Kunde',
      salonName: salonId.name || 'Ihr Studio',
      salonSlug: salonId.slug || 'demo',
      trialDaysLeft: calculateTrialDaysLeft(salonId.subscription?.trialEndsAt)
    });

    if (!template) {
      emailDoc.status = 'failed';
      emailDoc.error = `Template not found: ${emailType}`;
      await emailDoc.save();
      return;
    }

    // Send email
    await sendEmail({
      to: userId.email,
      subject: template.subject,
      body: template.body,
      html: template.html,
      type: `lifecycle_${emailType}`
    });

    // Mark as sent
    emailDoc.status = 'sent';
    emailDoc.sentAt = new Date();
    emailDoc.subject = template.subject;
    await emailDoc.save();

    logger.log(`? Sent lifecycle email: ${emailType} to ${userId.email}`);
  } catch (error) {
    logger.error(`? Failed to send lifecycle email ${emailDoc.emailType}:`, error);

    // Increment retry count
    emailDoc.retries = (emailDoc.retries || 0) + 1;
    emailDoc.error = error.message;

    if (emailDoc.retries >= 3) {
      emailDoc.status = 'failed';
    }

    await emailDoc.save();
  }
};

/**
 * Calculate days left in trial
 */
const calculateTrialDaysLeft = (trialEndsAt) => {
  if (!trialEndsAt) {
    return 30;
  }

  const now = new Date();
  const endDate = new Date(trialEndsAt);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

/**
 * Start the lifecycle email worker
 * Runs every hour
 */
export const startLifecycleEmailWorker = () => {
  // Run immediately on startup (wrapped in safe handler)
  logger.log('?? Starting lifecycle email worker...');
  
  // Safe wrapper to prevent crashes
  const processLifecycleEmailsSafe = async () => {
    try {
      await processLifecycleEmails();
    } catch (error) {
      logger.error('? Lifecycle email worker error (continuing):', error);
    }
  };

  // Run immediately
  processLifecycleEmailsSafe();

  // Then run every hour
  intervalId = setInterval(processLifecycleEmailsSafe, 60 * 60 * 1000); // 1 hour

  logger.log('? Lifecycle email worker started (runs every hour)');

  return intervalId;
};

/**
 * Stop the lifecycle email worker
 */
export const stopLifecycleEmailWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.log('?? Lifecycle email worker stopped');
  }
};

/**
 * Get worker status
 */
export const getWorkerStatus = () => ({
  running: !!intervalId,
  processing: isRunning
});

export default {
  processLifecycleEmails,
  startLifecycleEmailWorker,
  stopLifecycleEmailWorker,
  getWorkerStatus
};
