import MarketingCampaign from '../models/MarketingCampaign.js';
import MarketingRecipient from '../models/MarketingRecipient.js';
import MarketingTemplate from '../models/MarketingTemplate.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Salon from '../models/Salon.js';
import { sendSMS } from '../services/smsService.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get all marketing templates
 * @route   GET /api/marketing/templates
 * @access  Private (salon_owner)
 */
export const getTemplates = async (req, res) => {
  try {
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const tier = salon.subscription?.tier || 'starter';
    const templates = await MarketingTemplate.getForTier(tier);

    res.json({
      success: true,
      data: templates,
      tier
    });
  } catch (error) {
    logger.error('[ERROR] Get templates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create campaign from template
 * @route   POST /api/marketing/campaigns
 * @access  Private (salon_owner)
 */
export const createCampaign = async (req, res) => {
  try {
    const { templateId, name, customRules, customMessage, customSchedule } = req.body;

    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    // Check tier limits
    const tierLimits = await checkTierLimits(salon._id, salon.subscription?.tier);
    if (!tierLimits.canCreate) {
      return res.status(403).json({
        success: false,
        message: tierLimits.message
      });
    }

    // Get template
    const template = await MarketingTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template nicht gefunden' });
    }

    // Create campaign from template
    const campaignData = template.createCampaign(salon._id, name);

    // Override with custom data
    if (customRules) campaignData.rules = { ...campaignData.rules, ...customRules };
    if (customMessage) campaignData.message = { ...campaignData.message, ...customMessage };
    if (customSchedule) campaignData.schedule = { ...campaignData.schedule, ...customSchedule };

    const campaign = await MarketingCampaign.create(campaignData);

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error('[ERROR] Create campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all campaigns for salon
 * @route   GET /api/marketing/campaigns
 * @access  Private (salon_owner)
 */
export const getCampaigns = async (req, res) => {
  try {
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const { status } = req.query;
    const query = { salonId: salon._id };
    if (status) query.status = status;

    const campaigns = await MarketingCampaign.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    logger.error('[ERROR] Get campaigns error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single campaign with stats
 * @route   GET /api/marketing/campaigns/:id
 * @access  Private (salon_owner)
 */
export const getCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    // Get recipient stats
    const recipientStats = await MarketingRecipient.getCampaignStats(campaign._id);

    res.json({
      success: true,
      data: {
        ...campaign.toJSON(),
        recipientStats
      }
    });
  } catch (error) {
    logger.error('[ERROR] Get campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/marketing/campaigns/:id
 * @access  Private (salon_owner)
 */
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    const { name, status, rules, message, schedule } = req.body;

    if (name) campaign.name = name;
    if (status) campaign.status = status;
    if (rules) campaign.rules = { ...campaign.rules, ...rules };
    if (message) campaign.message = { ...campaign.message, ...message };
    if (schedule) campaign.schedule = { ...campaign.schedule, ...schedule };

    // Recalculate nextRunAt if schedule changed
    if (schedule && status === 'active') {
      campaign.stats.nextRunAt = campaign.calculateNextRun();
    }

    await campaign.save();

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error('[ERROR] Update campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/marketing/campaigns/:id
 * @access  Private (salon_owner)
 */
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign gelÃ¶scht'
    });
  } catch (error) {
    logger.error('[ERROR] Delete campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Manually run campaign
 * @route   POST /api/marketing/campaigns/:id/run
 * @access  Private (salon_owner)
 */
export const runCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id }).populate('userId');
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Campaign muss aktiv sein' });
    }

    // Check SMS limits
    const tierLimits = await checkTierLimits(salon._id, salon.subscription?.tier);
    if (tierLimits.smsUsed >= tierLimits.smsLimit) {
      return res.status(403).json({
        success: false,
        message: `SMS-Limit erreicht (${tierLimits.smsLimit}/Monat)`
      });
    }

    // Find target customers
    const targetCustomers = await findTargetCustomers(campaign, salon._id);
    
    if (targetCustomers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keine passenden Kunden gefunden'
      });
    }

    // Execute campaign
    const result = await executeCampaign(campaign, targetCustomers, salon);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ERROR] Run campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Preview campaign recipients
 * @route   GET /api/marketing/campaigns/:id/preview
 * @access  Private (salon_owner)
 */
export const previewCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    // Find target customers
    const targetCustomers = await findTargetCustomers(campaign, salon._id);

    // Render sample message for first customer
    let sampleMessage = null;
    if (targetCustomers.length > 0) {
      sampleMessage = renderMessage(campaign.message.template, {
        customerName: targetCustomers[0].name || 'Max Mustermann',
        salonName: salon.name,
        discount: formatDiscount(campaign.message),
        discountCode: 'MKT-PREVIEW',
        bookingLink: `${process.env.FRONTEND_URL}/booking/${salon.slug}`,
        validDays: campaign.message.validDays
      });
    }

    res.json({
      success: true,
      data: {
        totalRecipients: targetCustomers.length,
        estimatedCost: (targetCustomers.length * 0.077).toFixed(2),
        sampleMessage,
        recipients: targetCustomers.slice(0, 10).map(c => ({
          name: c.name,
          email: c.email,
          phoneNumber: c.phoneNumber
        }))
      }
    });
  } catch (error) {
    logger.error('[ERROR] Preview campaign error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get campaign recipients
 * @route   GET /api/marketing/campaigns/:id/recipients
 * @access  Private (salon_owner)
 */
export const getRecipients = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign nicht gefunden' });
    }

    // Verify ownership
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon || campaign.salonId.toString() !== salon._id.toString()) {
      return res.status(403).json({ success: false, message: 'Keine Berechtigung' });
    }

    const { status } = req.query;
    const query = { campaignId: campaign._id };
    if (status) query.status = status;

    const recipients = await MarketingRecipient.find(query)
      .populate('customerId', 'name email phoneNumber')
      .populate('bookingId', 'date totalPrice')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recipients
    });
  } catch (error) {
    logger.error('[ERROR] Get recipients error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Track click (public endpoint)
 * @route   GET /api/marketing/track/:trackingId
 * @access  Public
 */
export const trackClick = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const recipient = await MarketingRecipient.findByTrackingLink(trackingId);
    if (!recipient) {
      return res.redirect(`${process.env.FRONTEND_URL}/404`);
    }

    // Mark as clicked
    await recipient.markAsClicked();

    // Redirect to booking page
    const salon = await Salon.findById(recipient.campaignId.salonId);
    const redirectUrl = `${process.env.FRONTEND_URL}/booking/${salon.slug}?code=${recipient.discountCode}`;

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('[ERROR] Track click error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/404`);
  }
};

/**
 * @desc    Get salon-wide marketing stats
 * @route   GET /api/marketing/stats
 * @access  Private (salon_owner)
 */
export const getStats = async (req, res) => {
  try {
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const campaigns = await MarketingCampaign.find({ salonId: salon._id });
    
    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalSent: 0,
      totalDelivered: 0,
      totalClicked: 0,
      totalBooked: 0,
      totalRevenue: 0,
      totalCost: 0,
      roi: 0,
      avgConversionRate: 0
    };

    campaigns.forEach(c => {
      stats.totalSent += c.stats.totalSent;
      stats.totalDelivered += c.stats.totalDelivered || 0;
      stats.totalClicked += c.stats.totalClicked || 0;
      stats.totalBooked += c.stats.totalBooked;
      stats.totalRevenue += c.stats.totalRevenue;
    });

    stats.totalCost = (stats.totalSent * 0.077).toFixed(2);
    stats.roi = stats.totalCost > 0 
      ? (((stats.totalRevenue - stats.totalCost) / stats.totalCost) * 100).toFixed(2)
      : 0;
    stats.avgConversionRate = stats.totalSent > 0
      ? ((stats.totalBooked / stats.totalSent) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('[ERROR] Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get tier limits
 * @route   GET /api/marketing/limits
 * @access  Private (salon_owner)
 */
export const getLimits = async (req, res) => {
  try {
    const salon = await Salon.findOne({ userId: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon nicht gefunden' });
    }

    const limits = await checkTierLimits(salon._id, salon.subscription?.tier);

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    logger.error('[ERROR] Get limits error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check tier limits for marketing campaigns
 */
async function checkTierLimits(salonId, tier = 'starter') {
  const tierConfig = {
    starter: {
      maxActiveCampaigns: 1,
      campaignTypes: ['inactive_customers'],
      smsPerMonth: 100,
      autoScheduling: false,
      abTesting: false
    },
    professional: {
      maxActiveCampaigns: 3,
      campaignTypes: ['inactive_customers', 'birthday', 'last_minute', 'upsell', 'loyalty'],
      smsPerMonth: 500,
      autoScheduling: true,
      abTesting: true
    },
    enterprise: {
      maxActiveCampaigns: 999,
      campaignTypes: 'all',
      smsPerMonth: 2000,
      autoScheduling: true,
      abTesting: true,
      customCampaigns: true
    }
  };

  const config = tierConfig[tier] || tierConfig.starter;
  const activeCampaigns = await MarketingCampaign.countDocuments({
    salonId,
    status: 'active'
  });

  // Get SMS usage this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const smsUsed = await MarketingRecipient.countDocuments({
    campaignId: { $in: await MarketingCampaign.find({ salonId }).distinct('_id') },
    sentAt: { $gte: startOfMonth }
  });

  return {
    tier,
    maxActiveCampaigns: config.maxActiveCampaigns,
    activeCampaigns,
    canCreate: activeCampaigns < config.maxActiveCampaigns,
    campaignTypes: config.campaignTypes,
    smsLimit: config.smsPerMonth,
    smsUsed,
    smsRemaining: Math.max(0, config.smsPerMonth - smsUsed),
    autoScheduling: config.autoScheduling,
    abTesting: config.abTesting,
    customCampaigns: config.customCampaigns || false,
    message: activeCampaigns >= config.maxActiveCampaigns
      ? `${tier}-Tier Limit erreicht: ${config.maxActiveCampaigns} aktive Kampagnen`
      : null
  };
}

/**
 * Find target customers for campaign
 */
async function findTargetCustomers(campaign, salonId) {
  let query = {};

  switch (campaign.type) {
    case 'inactive_customers':
      const inactiveSince = new Date();
      inactiveSince.setDate(inactiveSince.getDate() - campaign.rules.inactiveDays);
      
      const inactiveCustomerIds = await Booking.distinct('customerId', {
        salonId,
        date: { $lt: inactiveSince }
      });

      query = {
        _id: { $in: inactiveCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;

    case 'birthday':
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + campaign.rules.birthdayDaysBefore);
      
      query = {
        birthdate: {
          $exists: true,
          $ne: null
        },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;

    case 'loyalty':
      const loyalCustomerIds = await Booking.aggregate([
        { $match: { salonId } },
        { $group: { _id: '$customerId', count: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
        { $match: { count: { $gte: campaign.rules.minBookings || 10 } } }
      ]).then(results => results.map(r => r._id));

      query = {
        _id: { $in: loyalCustomerIds },
        phoneNumber: { $exists: true, $ne: null }
      };
      break;

    default:
      query = {
        phoneNumber: { $exists: true, $ne: null }
      };
  }

  // Filter already sent
  const alreadySent = await MarketingRecipient.distinct('customerId', {
    campaignId: campaign._id
  });

  query._id = query._id || {};
  query._id.$nin = alreadySent;

  const customers = await User.find(query)
    .limit(campaign.rules.maxRecipients || 100)
    .select('name email phoneNumber');

  return customers;
}

/**
 * Execute campaign - send SMS to all targets
 */
async function executeCampaign(campaign, targetCustomers, salon) {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const customer of targetCustomers) {
    try {
      // Generate discount code
      const discountCode = await MarketingRecipient.generateDiscountCode(campaign.type.toUpperCase().substring(0, 3));
      
      // Generate tracking link
      const trackingLink = await MarketingRecipient.generateTrackingLink();

      // Create recipient entry
      const recipient = await MarketingRecipient.create({
        campaignId: campaign._id,
        customerId: customer._id,
        phoneNumber: customer.phoneNumber,
        discountCode,
        trackingLink,
        status: 'pending'
      });

      // Render message
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
        await recipient.markAsFailed(smsResult.error);
        results.failed++;
        results.errors.push({ customer: customer.name, error: smsResult.error });
      }
    } catch (error) {
      logger.error('[ERROR] Send campaign SMS error:', error);
      results.failed++;
      results.errors.push({ customer: customer.name, error: error.message });
    }
  }

  // Update campaign stats
  campaign.stats.totalSent += results.sent;
  campaign.stats.lastRunAt = new Date();
  campaign.stats.nextRunAt = campaign.calculateNextRun();
  await campaign.save();

  return results;
}

/**
 * Render message template with variables
 */
function renderMessage(template, vars) {
  let message = template;
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, vars[key]);
  });
  return message;
}

/**
 * Format discount for display
 */
function formatDiscount(messageConfig) {
  if (messageConfig.discountType === 'percentage') {
    return `${messageConfig.discountValue}%`;
  } else if (messageConfig.discountType === 'fixed_amount') {
    return `${messageConfig.discountValue}â‚¬`;
  }
  return '';
}
