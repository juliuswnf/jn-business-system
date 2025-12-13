import logger from '../utils/logger.js';
/**
 * CEO Email Campaigns Controller
 * Broadcast emails, templates, and campaign management
 */

import Salon from '../models/Salon.js';
import EmailLog from '../models/EmailLog.js';
import EmailQueue from '../models/EmailQueue.js';

// ==================== GET ALL CAMPAIGNS ====================
export const getAllCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { type: 'campaign' };
    if (status) {
      query.status = status;
    }

    // Get campaigns from email logs
    const campaigns = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await EmailLog.countDocuments(query);

    // Calculate stats
    const stats = await EmailLog.aggregate([
      { $match: { type: 'campaign' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      total: 0,
      sent: 0,
      pending: 0,
      failed: 0
    };
    stats.forEach(s => {
      statsObj[s._id] = s.count;
      statsObj.total += s.count;
    });

    res.status(200).json({
      success: true,
      campaigns,
      stats: statsObj,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('GetAllCampaigns Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CREATE CAMPAIGN ====================
export const createCampaign = async (req, res) => {
  try {
    const { subject, content, recipients, template, scheduledAt } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Determine recipients
    let targetEmails = [];

    if (recipients === 'all') {
      const salons = await Salon.find({ isActive: true }).select('ownerEmail');
      targetEmails = salons.map(s => s.ownerEmail).filter(Boolean);
    } else if (recipients === 'trial') {
      const salons = await Salon.find({
        isActive: true,
        'subscription.status': 'trial'
      }).select('ownerEmail');
      targetEmails = salons.map(s => s.ownerEmail).filter(Boolean);
    } else if (recipients === 'paid') {
      const salons = await Salon.find({
        isActive: true,
        'subscription.status': 'active'
      }).select('ownerEmail');
      targetEmails = salons.map(s => s.ownerEmail).filter(Boolean);
    } else if (recipients === 'starter') {
      const salons = await Salon.find({
        isActive: true,
        'subscription.plan': 'starter'
      }).select('ownerEmail');
      targetEmails = salons.map(s => s.ownerEmail).filter(Boolean);
    } else if (recipients === 'pro') {
      const salons = await Salon.find({
        isActive: true,
        'subscription.plan': 'pro'
      }).select('ownerEmail');
      targetEmails = salons.map(s => s.ownerEmail).filter(Boolean);
    } else if (Array.isArray(recipients)) {
      targetEmails = recipients;
    }

    // Create campaign record
    const campaign = await EmailLog.create({
      type: 'campaign',
      subject,
      content,
      template: template || 'default',
      recipients: targetEmails,
      recipientCount: targetEmails.length,
      status: scheduledAt ? 'scheduled' : 'pending',
      scheduledAt: scheduledAt || null,
      createdBy: req.user._id
    });

    // Add to email queue
    for (const email of targetEmails) {
      await EmailQueue.create({
        to: email,
        subject,
        content,
        template: template || 'default',
        campaignId: campaign._id,
        scheduledAt: scheduledAt || new Date(),
        status: 'pending'
      });
    }

    res.status(201).json({
      success: true,
      message: `Campaign created for ${targetEmails.length} recipients`,
      campaign
    });
  } catch (error) {
    logger.error('CreateCampaign Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET CAMPAIGN DETAILS ====================
export const getCampaignDetails = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await EmailLog.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get delivery stats
    const queueStats = await EmailQueue.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const deliveryStats = {
      total: campaign.recipientCount || 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0
    };
    queueStats.forEach(s => {
      deliveryStats[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      campaign,
      deliveryStats
    });
  } catch (error) {
    logger.error('GetCampaignDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== CANCEL CAMPAIGN ====================
export const cancelCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await EmailLog.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel already sent campaign'
      });
    }

    // Update campaign status
    campaign.status = 'cancelled';
    await campaign.save();

    // Cancel pending queue items
    await EmailQueue.updateMany(
      { campaignId: campaign._id, status: 'pending' },
      { status: 'cancelled' }
    );

    res.status(200).json({
      success: true,
      message: 'Campaign cancelled successfully'
    });
  } catch (error) {
    logger.error('CancelCampaign Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== SEND CAMPAIGN ====================
export const sendCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await EmailLog.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Campaign already sent'
      });
    }

    if (campaign.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send cancelled campaign'
      });
    }

    // Update campaign status to sending
    campaign.status = 'sending';
    campaign.sentAt = new Date();
    await campaign.save();

    // Update queue items to be processed
    await EmailQueue.updateMany(
      { campaignId: campaign._id, status: 'pending' },
      { status: 'queued', scheduledAt: new Date() }
    );

    // In production, this would trigger the email worker
    // For now, simulate sending
    setTimeout(async () => {
      campaign.status = 'sent';
      campaign.sent = campaign.recipientCount;
      await campaign.save();
    }, 2000);

    res.status(200).json({
      success: true,
      message: 'Campaign sending started',
      campaign
    });
  } catch (error) {
    logger.error('SendCampaign Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== DELETE CAMPAIGN ====================
export const deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await EmailLog.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Delete related queue items
    await EmailQueue.deleteMany({ campaignId: campaign._id });

    // Delete the campaign
    await EmailLog.findByIdAndDelete(campaignId);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error('DeleteCampaign Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET EMAIL TEMPLATES ====================
export const getEmailTemplates = async (req, res) => {
  try {
    // Predefined templates
    const templates = [
      {
        id: 'welcome',
        name: 'Willkommen',
        description: 'Willkommens-E-Mail für neue Kunden',
        subject: 'Willkommen bei JN Automation!',
        content: 'Hallo {name},\n\nwillkommen bei JN Automation...'
      },
      {
        id: 'trial_reminder',
        name: 'Trial Erinnerung',
        description: 'Erinnerung vor Trial-Ablauf',
        subject: 'Ihr Trial endet bald',
        content: 'Hallo {name},\n\nIhr Trial endet in {days} Tagen...'
      },
      {
        id: 'feature_announcement',
        name: 'Feature Ankündigung',
        description: 'Neue Features vorstellen',
        subject: 'Neu: {feature_name}',
        content: 'Hallo {name},\n\nwir haben ein neues Feature...'
      },
      {
        id: 'promotion',
        name: 'Promotion',
        description: 'Rabattaktionen und Angebote',
        subject: 'Exklusives Angebot für Sie!',
        content: 'Hallo {name},\n\nnur für kurze Zeit...'
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        description: 'Monatlicher Newsletter',
        subject: 'JN Automation Newsletter - {month}',
        content: 'Hallo {name},\n\nhier sind die Neuigkeiten...'
      },
      {
        id: 'custom',
        name: 'Benutzerdefiniert',
        description: 'Eigene E-Mail erstellen',
        subject: '',
        content: ''
      }
    ];

    res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    logger.error('GetEmailTemplates Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET EMAIL STATS ====================
export const getEmailStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const now = new Date();
    let startDate;
    switch (period) {
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await EmailLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          totalDelivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          totalOpened: { $sum: { $cond: [{ $eq: ['$opened', true] }, 1, 0] } },
          totalClicked: { $sum: { $cond: [{ $eq: ['$clicked', true] }, 1, 0] } },
          totalBounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
          totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalFailed: 0
    };

    // Calculate rates
    result.deliveryRate = result.totalSent > 0
      ? ((result.totalDelivered / result.totalSent) * 100).toFixed(1)
      : 0;
    result.openRate = result.totalDelivered > 0
      ? ((result.totalOpened / result.totalDelivered) * 100).toFixed(1)
      : 0;
    result.clickRate = result.totalOpened > 0
      ? ((result.totalClicked / result.totalOpened) * 100).toFixed(1)
      : 0;
    result.bounceRate = result.totalSent > 0
      ? ((result.totalBounced / result.totalSent) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      stats: result,
      period
    });
  } catch (error) {
    logger.error('GetEmailStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAllCampaigns,
  createCampaign,
  getCampaignDetails,
  cancelCampaign,
  sendCampaign,
  deleteCampaign,
  getEmailTemplates,
  getEmailStats
};
