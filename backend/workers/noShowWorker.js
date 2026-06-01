import cron from 'node-cron';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import ErrorLog from '../models/ErrorLog.js';
import { sendReminder } from '../services/reminderService.js';
import logger from '../utils/logger.js';

const REMINDER_WINDOWS = [
  { type: '72h', hoursBefore: 72, settingKey: 'enabled72h' },
  { type: '24h', hoursBefore: 24, settingKey: 'enabled24h' },
  { type: '2h', hoursBefore: 2, settingKey: 'enabled2h' }
];

const QUERY_WINDOW_MINUTES = 15;
const MAX_BATCH_SIZE = 300;

let isRunning = false;
let cronTask = null;

const getNoShowSettings = (salon) => {
  const settings = salon?.noShowSettings || {};
  const reminders = settings.reminders || {};
  const remindersEnabled = settings.remindersEnabled !== false;

  const enabled72h = remindersEnabled
    ? (reminders.enabled72h !== undefined ? reminders.enabled72h !== false : settings.reminder72h !== false)
    : false;
  const enabled24h = remindersEnabled
    ? (reminders.enabled24h !== undefined ? reminders.enabled24h !== false : settings.reminder24h !== false)
    : false;
  const enabled2h = remindersEnabled
    ? (reminders.enabled2h !== undefined ? reminders.enabled2h !== false : settings.reminder2h !== false)
    : false;

  const parsedAutoMarkMinutes = Number(settings.autoMarkNoShowAfterMinutes);
  const riskThresholdValue = settings.highRiskThreshold ?? settings.autoDepositThreshold;
  const parsedRiskThreshold = Number(riskThresholdValue);
  const parsedBlockBookingThreshold = Number(settings.blockBookingThreshold);
  const parsedDepositPercentage = Number(settings.depositPercentage);

  return {
    remindersEnabled,
    reminders: {
      enabled72h,
      enabled24h,
      enabled2h
    },
    autoMarkNoShowAfterMinutes: Number.isFinite(parsedAutoMarkMinutes) ? parsedAutoMarkMinutes : 30,
    autoDepositThreshold: Number.isFinite(parsedRiskThreshold) ? parsedRiskThreshold : 3,
    highRiskThreshold: Number.isFinite(parsedRiskThreshold) ? parsedRiskThreshold : 3,
    blockBookingThreshold: Number.isFinite(parsedBlockBookingThreshold) ? parsedBlockBookingThreshold : 5,
    depositPercentage: Number.isFinite(parsedDepositPercentage) ? parsedDepositPercentage : 30
  };
};

async function processReminderWindow(reminderWindow) {
  const now = new Date();
  const targetTime = new Date(now.getTime() + reminderWindow.hoursBefore * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - QUERY_WINDOW_MINUTES * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + QUERY_WINDOW_MINUTES * 60 * 1000);

  const bookings = await Booking.find({
    status: 'confirmed',
    confirmationStatus: { $in: ['pending', null] },
    bookingDate: { $gte: windowStart, $lte: windowEnd },
    remindersSent: {
      $not: {
        $elemMatch: { type: reminderWindow.type }
      }
    }
  })
    .select('_id salonId bookingDate status confirmationStatus remindersSent')
    .populate('salonId', 'noShowSettings')
    .limit(MAX_BATCH_SIZE)
    .maxTimeMS(5000);

  if (bookings.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const booking of bookings) {
    try {
      const noShowSettings = getNoShowSettings(booking.salonId);
      const settingEnabled = noShowSettings.reminders[reminderWindow.settingKey] !== false;

      if (!settingEnabled) {
        skipped += 1;
        continue;
      }

      const result = await sendReminder(booking._id, reminderWindow.type);
      if (!result.sent) {
        skipped += 1;
        continue;
      }

      await Booking.updateOne(
        {
          _id: booking._id,
          remindersSent: {
            $not: {
              $elemMatch: { type: reminderWindow.type }
            }
          }
        },
        {
          $push: {
            remindersSent: {
              type: reminderWindow.type,
              sentAt: new Date(),
              channel: result.channel || 'email'
            }
          }
        }
      ).maxTimeMS(5000);

      sent += 1;
    } catch (error) {
      failed += 1;
      logger.error(`[NoShowWorker] Reminder job failed for booking ${booking._id}:`, error.message);
      ErrorLog.logError({
        type: 'error',
        message: `NoShowWorker reminder failed for booking ${booking._id}: ${error.message}`,
        source: 'worker',
        salonId: booking.salonId?._id || booking.salonId,
        stackTrace: error.stack
      }).catch((logError) => logger.error('[NoShowWorker] Failed to write ErrorLog:', logError.message));
    }
  }

  return { sent, skipped, failed };
}

async function processNoShowDetection() {
  const now = new Date();

  const bookings = await Booking.find({
    status: 'confirmed',
    noShowMarkedAt: null,
    bookingDate: { $lte: now }
  })
    .select('_id salonId customerId bookingDate status noShowMarkedAt confirmationStatus')
    .populate('salonId', 'noShowSettings')
    .limit(MAX_BATCH_SIZE)
    .maxTimeMS(5000);

  if (bookings.length === 0) {
    return { marked: 0 };
  }

  let marked = 0;

  for (const booking of bookings) {
    try {
      const settings = getNoShowSettings(booking.salonId);
      const graceMinutes = Math.max(5, settings.autoMarkNoShowAfterMinutes);
      const noShowCutoff = new Date(now.getTime() - graceMinutes * 60 * 1000);

      if (new Date(booking.bookingDate).getTime() > noShowCutoff.getTime()) {
        continue;
      }

      const bookingUpdate = await Booking.updateOne(
        {
          _id: booking._id,
          status: 'confirmed',
          noShowMarkedAt: null
        },
        {
          $set: {
            status: 'no_show',
            noShowMarkedAt: now,
            confirmationStatus: 'no_response'
          }
        }
      ).maxTimeMS(5000);

      if (!bookingUpdate.modifiedCount) {
        continue;
      }

      if (booking.customerId) {
        await Customer.updateOne(
          { _id: booking.customerId },
          {
            $inc: {
              noShowScore: 1,
              noShowCount: 1,
              totalNoShows: 1
            },
            $push: {
              noShowHistory: {
                bookingId: booking._id,
                date: now
              }
            }
          }
        ).maxTimeMS(5000);
      }

      marked += 1;
    } catch (error) {
      logger.error(`[NoShowWorker] No-show detection failed for booking ${booking._id}:`, error.message);
      ErrorLog.logError({
        type: 'error',
        message: `NoShowWorker no-show detection failed for booking ${booking._id}: ${error.message}`,
        source: 'worker',
        salonId: booking.salonId?._id || booking.salonId,
        stackTrace: error.stack
      }).catch((logError) => logger.error('[NoShowWorker] Failed to write ErrorLog:', logError.message));
    }
  }

  return { marked };
}

async function processDepositRiskChecks() {
  const now = new Date();

  const bookings = await Booking.find({
    status: { $in: ['pending', 'booked', 'confirmed'] },
    bookingDate: { $gte: now },
    depositRequired: { $ne: true },
    customerId: { $exists: true, $ne: null }
  })
    .select('_id salonId customerId serviceId depositRequired depositAmount bookingDate status')
    .populate('customerId', 'noShowScore')
    .populate('salonId', 'noShowSettings')
    .populate('serviceId', 'price')
    .limit(MAX_BATCH_SIZE)
    .maxTimeMS(5000);

  if (bookings.length === 0) {
    return { updated: 0 };
  }

  let updated = 0;

  for (const booking of bookings) {
    try {
      const customer = booking.customerId;
      const salon = booking.salonId;
      const service = booking.serviceId;

      if (!customer || !salon || !service) {
        continue;
      }

      const settings = getNoShowSettings(salon);
      const threshold = Math.max(1, settings.highRiskThreshold);
      const score = Number(customer.noShowScore) || 0;

      if (score < threshold) {
        continue;
      }

      const servicePriceEur = Number(service.price) || 0;
      const depositPercentage = Math.min(100, Math.max(0, settings.depositPercentage));
      const calculatedDepositAmount = Math.round(servicePriceEur * 100 * (depositPercentage / 100));

      if (calculatedDepositAmount <= 0) {
        continue;
      }

      const updateResult = await Booking.updateOne(
        {
          _id: booking._id,
          depositRequired: { $ne: true }
        },
        {
          $set: {
            depositRequired: true,
            depositAmount: calculatedDepositAmount
          }
        }
      ).maxTimeMS(5000);

      if (updateResult.modifiedCount) {
        updated += 1;
      }
    } catch (error) {
      logger.error(`[NoShowWorker] Deposit risk job failed for booking ${booking._id}:`, error.message);
      ErrorLog.logError({
        type: 'error',
        message: `NoShowWorker deposit risk check failed for booking ${booking._id}: ${error.message}`,
        source: 'worker',
        salonId: booking.salonId?._id || booking.salonId,
        stackTrace: error.stack
      }).catch((logError) => logger.error('[NoShowWorker] Failed to write ErrorLog:', logError.message));
    }
  }

  return { updated };
}

async function processNoShowCycle() {
  if (isRunning) {
    logger.info('[NoShowWorker] Previous cycle still running, skipping this tick');
    return;
  }

  isRunning = true;
  logger.info('[NoShowWorker] Starting no-show cycle...');

  try {
    const reminderResults = [];

    for (const reminderWindow of REMINDER_WINDOWS) {
      const result = await processReminderWindow(reminderWindow);
      reminderResults.push({ type: reminderWindow.type, ...result });
    }

    const noShowResult = await processNoShowDetection();
    const depositResult = await processDepositRiskChecks();

    const reminderSummary = reminderResults
      .map((result) => `${result.type}: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`)
      .join(' | ');

    logger.info(
      `[NoShowWorker] Cycle complete -> ${reminderSummary}; no-shows marked: ${noShowResult.marked}; deposits required: ${depositResult.updated}`
    );
  } catch (error) {
    logger.error('[NoShowWorker] Fatal cycle error:', error.message);
    ErrorLog.logError({
      type: 'critical',
      message: `NoShowWorker fatal error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch((logError) => logger.error('[NoShowWorker] Failed to write ErrorLog:', logError.message));
  } finally {
    isRunning = false;
  }
}

export function startNoShowWorker() {
  logger.info('[NoShowWorker] Initializing no-show worker (runs every 15 minutes)...');

  processNoShowCycle();

  cronTask = cron.schedule('*/15 * * * *', () => {
    processNoShowCycle();
  });

  logger.info('[NoShowWorker] Worker scheduled');
}

export function stopNoShowWorker() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[NoShowWorker] Worker stopped');
  }
}

export default startNoShowWorker;
