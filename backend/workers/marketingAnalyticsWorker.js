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
    }).populate('smsLogId');

    let updated = 0;

    for (const recipient of recipients) {
      if (!recipient.smsLogId) continue;

      const smsLog = recipient.smsLogId;

      // Update based on SMS log status
      if (smsLog.status === 'delivered' && recipient.status !== 'delivered') {
        await recipient.markAsDelivered();
        updated++;

        // Update campaign stats
        await MarketingCampaign.findByIdAndUpdate(
          recipient.campaignId,
          { $inc: { 'stats.totalDelivered': 1 } }
        );
      } else if (smsLog.status === 'failed' && recipient.status !== 'failed') {
        await recipient.markAsFailed(smsLog.errorMessage || 'SMS delivery failed');
        updated++;
      }
    }

    if (updated > 0) {
      logger.log(`[INFO] Updated delivery status for ${updated} recipients`);
    }
  } catch (error) {
    logger.error('[ERROR] Update delivery statuses error:', error);
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
    });

    let conversions = 0;

    for (const recipient of recipients) {
      // Check if booking exists with this discount code
      const booking = await Booking.findOne({
        customerId: recipient.customerId,
        discountCode: recipient.discountCode,
        status: { $ne: 'cancelled' }
      });

      if (booking) {
        // Mark recipient as booked
        await recipient.markAsBooked(booking._id, booking.totalPrice || 0);
        conversions++;

        logger.log(`[SUCCESS] Conversion tracked: ${recipient.discountCode} -> ${booking.totalPrice}â‚¬`);
      }
    }

    if (conversions > 0) {
      logger.log(`[INFO] Tracked ${conversions} new conversions`);
    }
  } catch (error) {
    logger.error('[ERROR] Track booking conversions error:', error);
  }
};

/**
 * Update campaign ROI and statistics
 */
const updateCampaignROI = async () => {
  try {
    const campaigns = await MarketingCampaign.find({ status: 'active' });

    for (const campaign of campaigns) {
      // Get recipient stats
      const recipients = await MarketingRecipient.find({ campaignId: campaign._id });

      const stats = {
        totalSent: 0,
        totalDelivered: 0,
        totalClicked: 0,
        totalBooked: 0,
        totalRevenue: 0
      };

      recipients.forEach(r => {
        if (r.status === 'sent' || r.status === 'delivered' || r.status === 'clicked' || r.status === 'booked') {
          stats.totalSent++;
        }
        if (r.status === 'delivered' || r.status === 'clicked' || r.status === 'booked') {
          stats.totalDelivered++;
        }
        if (r.clickedAt) {
          stats.totalClicked++;
        }
        if (r.status === 'booked') {
          stats.totalBooked++;
          stats.totalRevenue += r.revenue || 0;
        }
      });

      // Update campaign stats if changed
      const hasChanges =
        campaign.stats.totalSent !== stats.totalSent ||
        campaign.stats.totalDelivered !== stats.totalDelivered ||
        campaign.stats.totalClicked !== stats.totalClicked ||
        campaign.stats.totalBooked !== stats.totalBooked ||
        campaign.stats.totalRevenue !== stats.totalRevenue;

      if (hasChanges) {
        campaign.stats.totalSent = stats.totalSent;
        campaign.stats.totalDelivered = stats.totalDelivered;
        campaign.stats.totalClicked = stats.totalClicked;
        campaign.stats.totalBooked = stats.totalBooked;
        campaign.stats.totalRevenue = stats.totalRevenue;
        
        await campaign.save();

        logger.log(`[INFO] Updated stats for campaign ${campaign.name}: ${stats.totalBooked} conversions, ${stats.totalRevenue}â‚¬ revenue`);
      }
    }
  } catch (error) {
    logger.error('[ERROR] Update campaign ROI error:', error);
  }
};

/**
 * Get analytics summary for reporting
 */
export const getAnalyticsSummary = async () => {
  try {
    const campaigns = await MarketingCampaign.find({});
    
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
