/**
 * Marketing Campaign Worker
 * Runs every 15 minutes to process scheduled marketing campaigns
 *
 * Finds active campaigns, targets customers, generates discount codes,
 * sends SMS messages, and updates campaign statistics
 */

import MarketingCampaign from '../models/MarketingCampaign.js';
import MarketingRecipient from '../models/MarketingRecipient.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import { sendSMS } from '../services/smsService.js';
import logger from '../utils/logger.js';

// Track if worker is running
let isRunning = false;
let intervalId = null;

/**
 * Main worker function - process all ready campaigns
 */
export const processMarketingCampaigns = async () => {
  if (isRunning) {
    logger.log('[INFO] Marketing campaign worker already running, skipping...');
    return;
  }

  isRunning = true;

  try {
    // Find campaigns ready to run
    const campaigns = await MarketingCampaign.getReadyToRun();

    if (campaigns.length === 0) {
      return;
    }

    logger.log(`[INFO] Processing ${campaigns.length} marketing campaigns...`);

    for (const campaign of campaigns) {
      await processCampaign(campaign);
    }

    logger.log('[SUCCESS] Finished processing marketing campaigns');
  } catch (error) {
    logger.error('[ERROR] Marketing campaign worker error:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Process a single campaign
 */
const processCampaign = async (campaign) => {
  try {
    const salon = campaign.salonId;

    // Validate salon and subscription
    if (!salon || !salon.subscription) {
      logger.log(`[INFO] Skipping campaign ${campaign.name} (no valid subscription)`);
      return;
    }

    // Check tier limits
    const tierLimits = await checkTierLimits(salon._id, salon.subscription.tier);
    if (tierLimits.smsUsed >= tierLimits.smsLimit) {
      logger.log(`[INFO] Skipping campaign ${campaign.name} (SMS limit reached: ${tierLimits.smsLimit})`);
      campaign.status = 'paused';
      await campaign.save();
      return;
    }

    // Find target customers
    const targetCustomers = await findTargetCustomers(campaign, salon._id);

    if (targetCustomers.length === 0) {
      logger.log(`[INFO] No target customers for campaign ${campaign.name}`);
      
      // Update next run time
      campaign.stats.lastRunAt = new Date();
      campaign.stats.nextRunAt = campaign.calculateNextRun();
      await campaign.save();
      return;
    }

    // Limit recipients to remaining SMS quota
    const remainingQuota = tierLimits.smsRemaining;
    const recipients = targetCustomers.slice(0, Math.min(targetCustomers.length, remainingQuota));

    logger.log(`[INFO] Sending to ${recipients.length} recipients for campaign ${campaign.name}`);

    // Send messages
    const results = await sendCampaignMessages(campaign, recipients, salon);

    // Update campaign stats
    campaign.stats.totalSent += results.sent;
    campaign.stats.lastRunAt = new Date();
    campaign.stats.nextRunAt = campaign.calculateNextRun();
    await campaign.save();

    logger.log(`[SUCCESS] Campaign ${campaign.name}: ${results.sent} sent, ${results.failed} failed`);
  } catch (error) {
    logger.error(`[ERROR] Process campaign ${campaign.name} error:`, error);
  }
};

/**
 * Find target customers based on campaign rules
 */
const findTargetCustomers = async (campaign, salonId) => {
  let query = {};

  switch (campaign.type) {
    case 'inactive_customers': {
      const inactiveSince = new Date();
      inactiveSince.setDate(inactiveSince.getDate() - (campaign.rules.inactiveDays || 180));
      
      // Find customers with last booking before inactive date
      const lastBookings = await Booking.aggregate([
        { $match: { salonId } },
        { $sort: { date: -1 } },
        { $group: {
          _id: '$customerId',
          lastBooking: { $first: '$date' }
        }},
        { $match: { lastBooking: { $lt: inactiveSince } } }
      ]);

      const inactiveCustomerIds = lastBookings.map(b => b._id);

      query = {
        _id: { $in: inactiveCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    case 'birthday': {
      // Find customers with birthday in next N days
      const today = new Date();
      const daysAhead = campaign.rules.birthdayDaysBefore || 7;
      
      // Get customers and filter by birthday month/day
      const allCustomers = await User.find({
        phoneNumber: { $exists: true, $ne: null },
        birthdate: { $exists: true, $ne: null }
      });

      const birthdayCustomers = allCustomers.filter(customer => {
        if (!customer.birthdate) return false;
        
        const birthday = new Date(customer.birthdate);
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysAhead);
        
        // Check if birthday (month/day) matches target date
        return birthday.getMonth() === targetDate.getMonth() &&
               birthday.getDate() === targetDate.getDate();
      });

      return birthdayCustomers;
    }

    case 'last_minute': {
      // Find customers based on segment
      const segment = campaign.rules.targetSegment || 'all';
      
      if (segment === 'vip' || segment === 'regular') {
        const bookingCounts = await Booking.aggregate([
          { $match: { salonId } },
          { $group: { _id: '$customerId', count: { $sum: 1 } } },
          { $match: { count: { $gte: segment === 'vip' ? 10 : 3 } } }
        ]);

        const customerIds = bookingCounts.map(b => b._id);
        query = {
          _id: { $in: customerIds },
          phoneNumber: { $exists: true, $ne: null }
        };
      } else {
        query = {
          phoneNumber: { $exists: true, $ne: null }
        };
      }
      break;
    }

    case 'upsell': {
      // Find customers with minimum bookings
      const minBookings = campaign.rules.minBookings || 3;
      
      const upsellCustomers = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $match: { count: { $gte: minBookings } } }
      ]);

      const upsellCustomerIds = upsellCustomers.map(b => b._id);
      query = {
        _id: { $in: upsellCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    case 'loyalty': {
      // Find VIP customers
      const loyaltyBookings = campaign.rules.minBookings || 10;
      const minSpent = campaign.rules.minSpent || 0;
      
      const loyalCustomers = await Booking.aggregate([
        { $match: { salonId } },
        { $group: {
          _id: '$customerId',
          count: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }},
        { $match: {
          count: { $gte: loyaltyBookings },
          totalSpent: { $gte: minSpent }
        }}
      ]);

      const loyalCustomerIds = loyalCustomers.map(b => b._id);
      query = {
        _id: { $in: loyalCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    default:
      query = {
        phoneNumber: { $exists: true, $ne: null }
      };
  }

  // Filter out customers who already received this campaign
  const alreadySent = await MarketingRecipient.distinct('customerId', {
    campaignId: campaign._id
  });

  if (query._id) {
    if (query._id.$in) {
      query._id.$in = query._id.$in.filter(id =>
        !alreadySent.some(sentId => sentId.toString() === id.toString())
      );
    }
  } else {
    query._id = { $nin: alreadySent };
  }

  // Apply max recipients limit
  const maxRecipients = campaign.rules.maxRecipients || 100;
  
  const customers = await User.find(query)
    .limit(maxRecipients)
    .select('name email phoneNumber');

  return customers;
};

/**
 * Send campaign messages to recipients
 */
const sendCampaignMessages = async (campaign, customers, salon) => {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const customer of customers) {
    try {
      // Generate discount code
      const codePrefix = campaign.type.toUpperCase().substring(0, 3);
      const discountCode = await MarketingRecipient.generateDiscountCode(codePrefix);
      
      // Generate tracking link
      const trackingLink = await MarketingRecipient.generateTrackingLink();

      // Create recipient record
      const recipient = await MarketingRecipient.create({
        campaignId: campaign._id,
        customerId: customer._id,
        phoneNumber: customer.phoneNumber,
        discountCode,
        trackingLink,
        status: 'pending'
      });

      // Render message with variables
      const message = renderMessage(campaign.message.template, {
        customerName: customer.name || 'Kunde',
        salonName: salon.name,
        discount: formatDiscount(campaign.message),
        discountCode,
        bookingLink: `${process.env.FRONTEND_URL}/track/${trackingLink}`,
        validDays: campaign.message.validDays
      });

      // Send SMS
      const smsResult = await sendSMS({
        phoneNumber: customer.phoneNumber,
        message,
        salonId: salon._id,
        customerId: customer._id
      });

      if (smsResult.success) {
        await recipient.markAsSent(smsResult.smsLogId);
        results.sent++;
      } else {
        await recipient.markAsFailed(smsResult.error || 'SMS send failed');
        results.failed++;
        results.errors.push({
          customer: customer.name,
          error: smsResult.error
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      logger.error('[ERROR] Send campaign SMS error:', error);
      results.failed++;
      results.errors.push({
        customer: customer.name,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Check tier limits
 */
const checkTierLimits = async (salonId, tier = 'starter') => {
  const tierConfig = {
    starter: { maxActiveCampaigns: 1, smsPerMonth: 100 },
    professional: { maxActiveCampaigns: 3, smsPerMonth: 500 },
    enterprise: { maxActiveCampaigns: 999, smsPerMonth: 2000 }
  };

  const config = tierConfig[tier] || tierConfig.starter;

  // Count SMS sent this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const campaignIds = await MarketingCampaign.find({ salonId }).distinct('_id');
  const smsUsed = await MarketingRecipient.countDocuments({
    campaignId: { $in: campaignIds },
    sentAt: { $gte: startOfMonth }
  });

  return {
    smsLimit: config.smsPerMonth,
    smsUsed,
    smsRemaining: Math.max(0, config.smsPerMonth - smsUsed)
  };
};

/**
 * Render message template with variables
 */
const renderMessage = (template, vars) => {
  let message = template;
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, vars[key]);
  });
  return message;
};

/**
 * Format discount for display
 */
const formatDiscount = (messageConfig) => {
  if (messageConfig.discountType === 'percentage') {
    return `${messageConfig.discountValue}%`;
  } else if (messageConfig.discountType === 'fixed_amount') {
    return `${messageConfig.discountValue}â‚¬`;
  }
  return '';
};

/**
 * Start the marketing campaign worker
 * Runs every 15 minutes
 */
export const startMarketingCampaignWorker = () => {
  logger.log('[WORKER] Starting marketing campaign worker...');
  
  // Safe wrapper to prevent crashes
  const processMarketingCampaignsSafe = async () => {
    try {
      await processMarketingCampaigns();
    } catch (error) {
      logger.error('[ERROR] Marketing campaign worker error (continuing):', error);
    }
  };

  // Run immediately on startup
  processMarketingCampaignsSafe();

  // Then run every 15 minutes
  intervalId = setInterval(processMarketingCampaignsSafe, 15 * 60 * 1000);

  logger.log('[WORKER] Marketing campaign worker started (runs every 15 minutes)');

  return intervalId;
};

/**
 * Stop the marketing campaign worker
 */
export const stopMarketingCampaignWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.log('[WORKER] Marketing campaign worker stopped');
  }
};

/**
 * Get worker status
 */
export const getMarketingWorkerStatus = () => ({
  running: !!intervalId,
  processing: isRunning
});

export default {
  processMarketingCampaigns,
  startMarketingCampaignWorker,
  stopMarketingCampaignWorker,
  getMarketingWorkerStatus
};
