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
import ErrorLog from '../models/ErrorLog.js';
import crypto from 'crypto';
import { sendSMS } from '../services/smsService.js';
import logger from '../utils/logger.js';
import { escapeRegExp } from '../utils/securityHelpers.js';

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
    const campaigns = (await MarketingCampaign.getReadyToRun()).slice(0, 500);

    if (campaigns.length === 0) {
      return;
    }

    logger.log(`[INFO] Processing ${campaigns.length} marketing campaigns...`);

    await Promise.allSettled(campaigns.map(campaign => processCampaign(campaign)));

    logger.log('[SUCCESS] Finished processing marketing campaigns');
  } catch (error) {
    logger.error('[ERROR] Marketing campaign worker error:', error);
    ErrorLog.logError({
      type: 'critical',
      message: `MarketingCampaign worker error: ${error.message}`,
      source: 'worker',
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingCampaign] ErrorLog write failed:', e.message));
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
    ErrorLog.logError({
      type: 'error',
      message: `MarketingCampaign: process campaign failed (${campaign._id}): ${error.message}`,
      source: 'worker',
      salonId: campaign?.salonId?._id || campaign?.salonId,
      stackTrace: error.stack
    }).catch(e => logger.error('[MarketingCampaign] ErrorLog write failed:', e.message));
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
      ]).option({ maxTimeMS: 5000 });

      const inactiveCustomerIds = lastBookings.map(b => b._id);

      query = {
        _id: { $in: inactiveCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    case 'birthday': {
      // Find customers with birthday in next N days — scoped to this salon only
      const today = new Date();
      const daysAhead = campaign.rules.birthdayDaysBefore || 7;

      // First: get customer IDs who have booked at this salon
      const salonBookings = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId' } }
      ]).option({ maxTimeMS: 5000 });
      const salonCustomerIds = salonBookings.map(b => b._id);

      // Fetch only those customers who have a birthdate and phone
      const salonCustomers = await User.find({
        _id: { $in: salonCustomerIds },
        phoneNumber: { $exists: true, $ne: null },
        birthdate: { $exists: true, $ne: null }
      }).lean().maxTimeMS(5000);

      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysAhead);

      const birthdayCustomers = salonCustomers.filter(customer => {
        const birthday = new Date(customer.birthdate);
        return birthday.getMonth() === targetDate.getMonth() &&
               birthday.getDate() === targetDate.getDate();
      });

      return birthdayCustomers;
    }

    case 'last_minute': {
      // Find customers based on segment — always scoped to this salon via booking history
      const segment = campaign.rules.targetSegment || 'all';
      const minCount = segment === 'vip' ? 10 : segment === 'regular' ? 3 : 1;

      const bookingCounts = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $match: { count: { $gte: minCount } } }
      ]).option({ maxTimeMS: 5000 });

      const customerIds = bookingCounts.map(b => b._id);
      query = {
        _id: { $in: customerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    case 'upsell': {
      // Find customers with minimum bookings
      const minBookings = campaign.rules.minBookings || 3;

      const upsellCustomers = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $match: { count: { $gte: minBookings } } }
      ]).option({ maxTimeMS: 5000 });

      const upsellCustomerIds = upsellCustomers.map(b => b._id);
      query = {
        _id: { $in: upsellCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    case 'referral': {
      // Find active customers who can refer friends
      // Target: Customers with 3+ bookings (loyal customers who are likely to refer)
      const minBookings = campaign.rules.minBookings || 3;

      const referralCustomers = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId', count: { $sum: 1 } } },
        { $match: { count: { $gte: minBookings } } }
      ]).option({ maxTimeMS: 5000 });

      const referralCustomerIds = referralCustomers.map(b => b._id);
      query = {
        _id: { $in: referralCustomerIds },
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
      ]).option({ maxTimeMS: 5000 });

      const loyalCustomerIds = loyalCustomers.map(b => b._id);
      query = {
        _id: { $in: loyalCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;
    }

    default: {
      // Scope to customers who have at least one booking at this salon
      const defaultBookings = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId' } }
      ]).option({ maxTimeMS: 5000 });
      const defaultCustomerIds = defaultBookings.map(b => b._id);
      query = {
        _id: { $in: defaultCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
    }
  }

  // Filter out customers who already received this campaign
  const alreadySent = await MarketingRecipient.distinct('customerId', {
    campaignId: campaign._id
  }).maxTimeMS(5000);

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
  const maxRecipients = Math.min(campaign.rules.maxRecipients || 100, 500);

  const customers = await User.find(query)
    .limit(maxRecipients)
    .select('name email phoneNumber')
    .maxTimeMS(5000);

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

  const codePrefix = campaign.type.toUpperCase().substring(0, 3);
  const initialRecipients = customers.map(customer => {
    const discountCode = `${codePrefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const trackingLink = crypto.randomBytes(6).toString('hex');
    return {
      campaignId: campaign._id,
      customerId: customer._id,
      customerName: customer.name,
      phoneNumber: customer.phoneNumber,
      discountCode,
      trackingLink,
      status: 'pending'
    };
  });

  let createdRecipients = [];
  try {
    createdRecipients = await MarketingRecipient.insertMany(
      initialRecipients.map(({ customerName, ...recipient }) => recipient),
      { ordered: false }
    );
  } catch (insertError) {
    logger.warn('[WARN] MarketingCampaign recipient insert had partial failures:', insertError.message);
    ErrorLog.logError({
      type: 'warning',
      message: `MarketingCampaign: recipient insert partial failure for campaign ${campaign._id}: ${insertError.message}`,
      source: 'worker',
      salonId: salon?._id,
      stackTrace: insertError.stack
    }).catch(e => logger.error('[MarketingCampaign] ErrorLog write failed:', e.message));

    createdRecipients = await MarketingRecipient.find({
      campaignId: campaign._id,
      customerId: { $in: customers.map(customer => customer._id) }
    }).maxTimeMS(5000);
  }

  const createdMap = new Map(createdRecipients.map(r => [r.customerId.toString(), r]));

  const sendTasks = customers.map(async customer => {
    const recipient = createdMap.get(customer._id.toString());
    if (!recipient) {
      results.failed++;
      results.errors.push({
        customer: customer.name,
        error: 'Recipient creation failed'
      });
      return { recipientId: null, success: false, error: 'Recipient creation failed', customerName: customer.name };
    }

    const message = renderMessage(campaign.message.template, {
      customerName: customer.name || 'Kunde',
      salonName: salon.name,
      discount: formatDiscount(campaign.message),
      discountCode: recipient.discountCode,
      bookingLink: `${process.env.FRONTEND_URL}/track/${recipient.trackingLink}`,
      validDays: campaign.message.validDays
    });

    try {
      const smsResult = await sendSMS({
        phoneNumber: customer.phoneNumber,
        message,
        salonId: salon._id,
        customerId: customer._id
      });

      if (smsResult.success) {
        results.sent++;
        return {
          recipientId: recipient._id,
          success: true,
          smsLogId: smsResult.smsLogId,
          customerName: customer.name
        };
      }

      results.failed++;
      results.errors.push({
        customer: customer.name,
        error: smsResult.error
      });
      return {
        recipientId: recipient._id,
        success: false,
        error: smsResult.error || 'SMS send failed',
        customerName: customer.name
      };
    } catch (error) {
      logger.error('[ERROR] Send campaign SMS error:', error);
      results.failed++;
      results.errors.push({
        customer: customer.name,
        error: error.message
      });
      ErrorLog.logError({
        type: 'error',
        message: `MarketingCampaign: send message failed for customer ${customer._id}: ${error.message}`,
        source: 'worker',
        salonId: salon?._id,
        stackTrace: error.stack
      }).catch(e => logger.error('[MarketingCampaign] ErrorLog write failed:', e.message));

      return {
        recipientId: recipient._id,
        success: false,
        error: error.message,
        customerName: customer.name
      };
    }
  });

  const sendResults = await Promise.all(sendTasks);

  const statusUpdates = sendResults
    .filter(result => result.recipientId)
    .map(result => ({
      updateOne: {
        filter: { _id: result.recipientId },
        update: result.success
          ? { $set: { status: 'sent', sentAt: new Date(), smsLogId: result.smsLogId || null } }
          : { $set: { status: 'failed', errorMessage: result.error || 'SMS send failed' } }
      }
    }));

  if (statusUpdates.length > 0) {
    await MarketingRecipient.bulkWrite(statusUpdates);
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

  const campaignIds = await MarketingCampaign.find({ salonId }).distinct('_id').maxTimeMS(5000);
  const smsUsed = await MarketingRecipient.countDocuments({
    campaignId: { $in: campaignIds },
    sentAt: { $gte: startOfMonth }
  }).maxTimeMS(5000);

  

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
    const regex = new RegExp(`{{${escapeRegExp(key)}}}`, 'g');
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
    return `${messageConfig.discountValue}€`;
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
