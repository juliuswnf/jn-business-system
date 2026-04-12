/**
 * Marketing Analytics Worker
 * Runs hourly to update marketing campaign analytics
 *
 * - Updates SMS delivery status from provider
 * - Tracks bookings made with discount codes
 * - Calculates ROI for campaigns
 * - Updates recipient and campaign statistics
 */

import MarketingCampaign from '../models/MarketingCampaign.js';
import MarketingRecipient from '../models/MarketingRecipient.js';
import Booking from '../models/Booking.js';
import ErrorLog from '../models/ErrorLog.js';
import logger from '../utils/logger.js';

// Track if worker is running
let isRunning = false;
let intervalId = null;

/**
 * Main analytics worker function
 */
export const updateMarketingAnalytics = async () => {
  if (isRunning) {
    logger.log('[INFO] Marketing analytics worker already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    logger.log('[INFO] Starting marketing analytics update...');

    // Update delivery statuses
    await updateDeliveryStatuses();

    // Track booking conversions
    await trackBookingConversions();

    // Update campaign ROI
    await updateCampaignROI();

    logger.log('[SUCCESS] Marketing analytics update complete');
  } catch (error) {
    logger.error('[ERROR] Marketing analytics worker error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `MarketingAnalytics worker error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingAnalytics] ErrorLog write failed:', e.message));
  } finally {
    isRunning = false;
  }
};

/**
 * Update SMS delivery statuses from SMS logs
 */
const updateDeliveryStatuses = async () => {
  try {
    // Find recipients with SMS logs that need status update
    const recipients = await MarketingRecipient.find({
      status: { $in: ['sent', 'pending'] },
      smsLogId: { $exists: true, $ne: null }
    }).populate('smsLogId').limit(500).maxTimeMS(5000);

    // Separate into delivered / failed buckets — avoid N+1 saves in the loop
    const deliveredIds = [];
    const failedUpdates = []; // { id, errorMessage }
    const campaignDeliveredCounts = new Map(); // campaignId -> increment count

    for (const recipient of recipients) {
      if (!recipient.smsLogId) continue;
      const smsLog = recipient.smsLogId;

      if (smsLog.status === 'delivered' && recipient.status !== 'delivered') {
        deliveredIds.push(recipient._id);
        const key = recipient.campaignId.toString();
        campaignDeliveredCounts.set(key, (campaignDeliveredCounts.get(key) || 0) + 1);
      } else if (smsLog.status === 'failed' && recipient.status !== 'failed') {
        failedUpdates.push({ id: recipient._id, errorMessage: smsLog.errorMessage || 'SMS delivery failed' });
      }
    }

    // Bulk-update delivered status
    if (deliveredIds.length > 0) {
      await MarketingRecipient.updateMany(
        { _id: { $in: deliveredIds } },
        { $set: { status: 'delivered', deliveredAt: new Date() } }
      );
      // Bulk-update campaign delivered counts
      const campaignBulk = Array.from(campaignDeliveredCounts.entries()).map(
        ([campaignId, count]) => ({
          updateOne: {
            filter: { _id: campaignId },
            update: { $inc: { 'stats.totalDelivered': count } }
          }
        })
      );
      if (campaignBulk.length > 0) {
        await MarketingCampaign.bulkWrite(campaignBulk);
      }
    }

    // Bulk-update failed status
    if (failedUpdates.length > 0) {
      const failedBulk = failedUpdates.map(({ id, errorMessage }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { status: 'failed', failedAt: new Date(), errorMessage } }
        }
      }));
      await MarketingRecipient.bulkWrite(failedBulk);
    }

    const updated = deliveredIds.length + failedUpdates.length;
    if (updated > 0) {
      logger.log(`[INFO] Updated delivery status for ${updated} recipients`);
    }
  } catch (error) {
    logger.error('[ERROR] Update delivery statuses error:', error);
    ErrorLog.logError({
      type: 'error',
      message: `MarketingAnalytics: updateDeliveryStatuses failed: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingAnalytics] ErrorLog write failed:', e.message));
  }
};

/**
 * Track bookings made with marketing discount codes
 */
const trackBookingConversions = async () => {
  try {
    // Find recipients with discount codes that haven't been marked as booked
    const recipients = await MarketingRecipient.find({
      status: { $ne: 'booked' },
      discountCode: { $exists: true, $ne: null }
    }).limit(500).maxTimeMS(5000);

    if (recipients.length === 0) return;

    // Batch: fetch all relevant bookings in one query instead of N individual findOne calls
    const allCodes = recipients.map(r => r.discountCode);
    const bookings = await Booking.find({
      discountCode: { $in: allCodes },
      status: { $ne: 'cancelled' }
    }).lean().maxTimeMS(5000);

    // Build lookup map keyed by "customerId:discountCode"
    const bookingMap = new Map();
    for (const booking of bookings) {
      const key = `${booking.customerId}:${booking.discountCode}`;
      bookingMap.set(key, booking);
    }

    const conversionTasks = [];
    for (const recipient of recipients) {
      const key = `${recipient.customerId}:${recipient.discountCode}`;
      const booking = bookingMap.get(key);

      if (booking) {
        conversionTasks.push(
          recipient.markAsBooked(booking._id, booking.totalPrice || 0)
            .then(() => {
              logger.log(`[SUCCESS] Conversion tracked: ${recipient.discountCode} -> ${booking.totalPrice}€`);
            })
        );
      }
    }

    await Promise.allSettled(conversionTasks);
    const conversions = conversionTasks.length;

    if (conversions > 0) {
      logger.log(`[INFO] Tracked ${conversions} new conversions`);
    }
  } catch (error) {
    logger.error('[ERROR] Track booking conversions error:', error);
    ErrorLog.logError({
      type: 'error',
      message: `MarketingAnalytics: trackBookingConversions failed: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingAnalytics] ErrorLog write failed:', e.message));
  }
};

/**
 * Update campaign ROI and statistics
 */
const updateCampaignROI = async () => {
  try {
    const campaigns = await MarketingCampaign.find({ status: 'active' }).limit(500).maxTimeMS(5000);
    if (campaigns.length === 0) return;

    const campaignIds = campaigns.map(c => c._id);

    // Aggregate all recipient stats in one query instead of N individual finds
    const recipientStats = await MarketingRecipient.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: '$campaignId',
          totalSent: {
            $sum: {
              $cond: [{ $in: ['$status', ['sent', 'delivered', 'clicked', 'booked']] }, 1, 0]
            }
          },
          totalDelivered: {
            $sum: {
              $cond: [{ $in: ['$status', ['delivered', 'clicked', 'booked']] }, 1, 0]
            }
          },
          totalClicked: { $sum: { $cond: [{ $ifNull: ['$clickedAt', false] }, 1, 0] } },
          totalBooked: { $sum: { $cond: [{ $eq: ['$status', 'booked'] }, 1, 0] } },
          totalRevenue: { $sum: { $ifNull: ['$revenue', 0] } }
        }
      }
    ]).option({ maxTimeMS: 5000 });

    const statsMap = new Map(recipientStats.map(s => [s._id.toString(), s]));

    const bulkOps = [];
    for (const campaign of campaigns) {
      const stats = statsMap.get(campaign._id.toString()) || {
        totalSent: 0, totalDelivered: 0, totalClicked: 0, totalBooked: 0, totalRevenue: 0
      };

      const hasChanges =
        campaign.stats.totalSent !== stats.totalSent ||
        campaign.stats.totalDelivered !== stats.totalDelivered ||
        campaign.stats.totalClicked !== stats.totalClicked ||
        campaign.stats.totalBooked !== stats.totalBooked ||
        campaign.stats.totalRevenue !== stats.totalRevenue;

      if (hasChanges) {
        bulkOps.push({
          updateOne: {
            filter: { _id: campaign._id },
            update: {
              $set: {
                'stats.totalSent': stats.totalSent,
                'stats.totalDelivered': stats.totalDelivered,
                'stats.totalClicked': stats.totalClicked,
                'stats.totalBooked': stats.totalBooked,
                'stats.totalRevenue': stats.totalRevenue
              }
            }
          }
        });
        logger.log(`[INFO] Queued stats update for campaign ${campaign.name}: ${stats.totalBooked} conversions, ${stats.totalRevenue}€ revenue`);
      }
    }

    if (bulkOps.length > 0) {
      await MarketingCampaign.bulkWrite(bulkOps);
      logger.log(`[INFO] Updated stats for ${bulkOps.length} campaigns`);
    }
  } catch (error) {
    logger.error('[ERROR] Update campaign ROI error:', error);
    ErrorLog.logError({
      type: 'error',
      message: `MarketingAnalytics: updateCampaignROI failed: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingAnalytics] ErrorLog write failed:', e.message));
  }
};

/**
 * Get analytics summary for reporting
 */
export const getAnalyticsSummary = async () => {
  try {
    const campaigns = await MarketingCampaign.find({}).maxTimeMS(5000);

    const summary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalBooked: 0,
      totalRevenue: 0,
      totalCost: 0,
      avgROI: 0,
      avgConversionRate: 0,
      topCampaigns: []
    };

    campaigns.forEach(c => {
      summary.totalSent += c.stats.totalSent || 0;
      summary.totalDelivered += c.stats.totalDelivered || 0;
      summary.totalClicked += c.stats.totalClicked || 0;
      summary.totalBooked += c.stats.totalBooked || 0;
      summary.totalRevenue += c.stats.totalRevenue || 0;
    });

    // Calculate costs and ROI
    summary.totalCost = (summary.totalSent * 0.077).toFixed(2);
    if (parseFloat(summary.totalCost) > 0) {
      summary.avgROI = (((summary.totalRevenue - summary.totalCost) / summary.totalCost) * 100).toFixed(2);
    }
    if (summary.totalSent > 0) {
      summary.avgConversionRate = ((summary.totalBooked / summary.totalSent) * 100).toFixed(2);
    }

    // Top 5 campaigns by revenue
    summary.topCampaigns = campaigns
      .sort((a, b) => (b.stats.totalRevenue || 0) - (a.stats.totalRevenue || 0))
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        type: c.type,
        revenue: c.stats.totalRevenue,
        roi: c.roi,
        conversionRate: c.conversionRate
      }));

    return summary;
  } catch (error) {
    logger.error('[ERROR] Get analytics summary error:', error);
    ErrorLog.logError({
      type: 'error',
      message: `MarketingAnalytics: getAnalyticsSummary failed: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingAnalytics] ErrorLog write failed:', e.message));
    throw error;
  }
};

/**
 * Start the marketing analytics worker
 * Runs every hour
 */
export const startMarketingAnalyticsWorker = () => {
  logger.log('[WORKER] Starting marketing analytics worker...');

  // Safe wrapper to prevent crashes
  const updateMarketingAnalyticsSafe = async () => {
    try {
      await updateMarketingAnalytics();
    } catch (error) {
      logger.error('[ERROR] Marketing analytics worker error (continuing):', error);
    }
  };

  // Run immediately on startup
  updateMarketingAnalyticsSafe();

  // Then run every hour
  intervalId = setInterval(updateMarketingAnalyticsSafe, 60 * 60 * 1000);

  logger.log('[WORKER] Marketing analytics worker started (runs every hour)');

  return intervalId;
};

/**
 * Stop the marketing analytics worker
 */
export const stopMarketingAnalyticsWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.log('[WORKER] Marketing analytics worker stopped');
  }
};

/**
 * Get worker status
 */
export const getAnalyticsWorkerStatus = () => ({
  running: !!intervalId,
  processing: isRunning
});

export default {
  updateMarketingAnalytics,
  getAnalyticsSummary,
  startMarketingAnalyticsWorker,
  stopMarketingAnalyticsWorker,
  getAnalyticsWorkerStatus
};
