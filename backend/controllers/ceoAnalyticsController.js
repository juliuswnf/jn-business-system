import logger from '../utils/logger.js';
/**
 * CEO Analytics Controller
 * Deep-dive analytics for revenue, growth, cohorts, and churn
 */

import Salon from '../models/Salon.js';
import LifecycleEmail from '../models/LifecycleEmail.js';

// ==================== PRICING CONSTANTS ====================
const PRICING = {
  starter: 29,
  pro: 69
};

// ==================== GET ANALYTICS OVERVIEW ====================
export const getAnalyticsOverview = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
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
    case '1y':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }

    // Current metrics
    const totalCustomers = await Salon.countDocuments();
    const paidCustomers = await Salon.countDocuments({
      'subscription.status': 'active',
      'subscription.plan': { $in: ['starter', 'pro'] }
    });
    const starterCount = await Salon.countDocuments({ 'subscription.plan': 'starter', 'subscription.status': 'active' });
    const proCount = await Salon.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' });

    // Calculate MRR
    const mrr = (starterCount * PRICING.starter) + (proCount * PRICING.pro);
    const arr = mrr * 12;

    // Previous period for comparison
    const prevCustomers = await Salon.countDocuments({ createdAt: { $lt: startDate } });
    const customerGrowth = prevCustomers > 0
      ? Math.round(((totalCustomers - prevCustomers) / prevCustomers) * 100)
      : 100;

    // New customers in period
    const newCustomers = await Salon.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Churned customers (cancelled in period)
    const churnedCustomers = await Salon.countDocuments({
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': { $gte: startDate }
    });

    // Churn rate
    const churnRate = paidCustomers > 0
      ? ((churnedCustomers / paidCustomers) * 100).toFixed(1)
      : 0;

    // Average Revenue Per User
    const arpu = paidCustomers > 0 ? Math.round(mrr / paidCustomers) : 0;

    // Customer Lifetime Value (simplified: ARPU / Churn Rate)
    const ltv = churnRate > 0 ? Math.round((arpu / (parseFloat(churnRate) / 100)) * 12) : arpu * 24;

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalCustomers,
          paidCustomers,
          newCustomers,
          churnedCustomers,
          customerGrowth
        },
        revenue: {
          mrr,
          arr,
          arpu,
          ltv
        },
        subscriptions: {
          starter: starterCount,
          pro: proCount,
          trial: await Salon.countDocuments({ 'subscription.status': 'trial' }),
          cancelled: await Salon.countDocuments({ 'subscription.status': 'cancelled' })
        },
        churn: {
          rate: parseFloat(churnRate),
          count: churnedCustomers
        },
        period
      }
    });
  } catch (error) {
    logger.error('GetAnalyticsOverview Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET REVENUE CHART DATA ====================
export const getRevenueChart = async (req, res) => {
  try {
    const { period = '12m' } = req.query;

    // Generate monthly revenue data
    const months = period === '6m' ? 6 : 12;
    const chartData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Count active subscriptions at end of month
      const starterCount = await Salon.countDocuments({
        'subscription.plan': 'starter',
        'subscription.status': 'active',
        createdAt: { $lte: monthEnd }
      });

      const proCount = await Salon.countDocuments({
        'subscription.plan': 'pro',
        'subscription.status': 'active',
        createdAt: { $lte: monthEnd }
      });

      const revenue = (starterCount * PRICING.starter) + (proCount * PRICING.pro);

      chartData.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        revenue,
        customers: starterCount + proCount
      });
    }

    res.status(200).json({
      success: true,
      chartData
    });
  } catch (error) {
    logger.error('GetRevenueChart Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET CUSTOMER GROWTH CHART ====================
export const getCustomerGrowthChart = async (req, res) => {
  try {
    const { period = '12m' } = req.query;
    const months = period === '6m' ? 6 : 12;
    const chartData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const totalCustomers = await Salon.countDocuments({
        createdAt: { $lte: monthEnd }
      });

      const paidCustomers = await Salon.countDocuments({
        'subscription.status': 'active',
        'subscription.plan': { $in: ['starter', 'pro'] },
        createdAt: { $lte: monthEnd }
      });

      chartData.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        total: totalCustomers,
        paid: paidCustomers
      });
    }

    res.status(200).json({
      success: true,
      chartData
    });
  } catch (error) {
    logger.error('GetCustomerGrowthChart Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET COHORT ANALYSIS ====================
export const getCohortAnalysis = async (req, res) => {
  try {
    // Get cohorts by signup month
    const cohorts = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Customers who signed up in this month
      const cohortCustomers = await Salon.find({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      }).lean().maxTimeMS(5000);

      const cohortSize = cohortCustomers.length;

      // Calculate retention for each subsequent month
      const retention = [];
      for (let j = 0; j <= 5 - i; j++) {
        const checkDate = new Date(monthStart);
        checkDate.setMonth(checkDate.getMonth() + j + 1);

        const stillActive = cohortCustomers.filter(c =>
          c.subscription?.status === 'active' ||
          (c.subscription?.status === 'cancelled' && new Date(c.subscription?.cancelledAt) > checkDate)
        ).length;

        retention.push(cohortSize > 0 ? Math.round((stillActive / cohortSize) * 100) : 0);
      }

      cohorts.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        size: cohortSize,
        retention
      });
    }

    res.status(200).json({
      success: true,
      cohorts
    });
  } catch (error) {
    logger.error('GetCohortAnalysis Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET CHURN ANALYSIS ====================
export const getChurnAnalysis = async (req, res) => {
  try {
    // Churned customers with reasons
    const churned = await Salon.find({
      'subscription.status': 'cancelled'
    }).lean().maxTimeMS(5000).select('name subscription.cancelledAt subscription.cancelReason createdAt');

    // Group by reason
    const reasonCounts = {};
    churned.forEach(c => {
      const reason = c.subscription?.cancelReason || 'Unbekannt';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    // Monthly churn trend
    const churnTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const churnedInMonth = await Salon.countDocuments({
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': { $gte: monthStart, $lte: monthEnd }
      });

      const totalAtStart = await Salon.countDocuments({
        'subscription.status': { $in: ['active', 'cancelled'] },
        createdAt: { $lt: monthStart }
      });

      const churnRate = totalAtStart > 0 ? ((churnedInMonth / totalAtStart) * 100).toFixed(1) : 0;

      churnTrend.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        churned: churnedInMonth,
        rate: parseFloat(churnRate)
      });
    }

    res.status(200).json({
      success: true,
      analysis: {
        total: churned.length,
        reasons: Object.entries(reasonCounts).map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / churned.length) * 100)
        })),
        trend: churnTrend,
        recentChurns: churned.slice(-10).map(c => ({
          name: c.name,
          cancelledAt: c.subscription?.cancelledAt,
          reason: c.subscription?.cancelReason || 'Unbekannt',
          customerSince: c.createdAt
        }))
      }
    });
  } catch (error) {
    logger.error('GetChurnAnalysis Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET AT-RISK STUDIOS ====================
export const getAtRiskStudios = async (req, res) => {
  try {
    const Booking = (await import('../models/Booking.js')).default;

    // Get all active/trial studios
    const studios = await Salon.find({
      'subscription.status': { $in: ['active', 'trial'] }
    }).populate('owner', 'name email lastLogin').lean().maxTimeMS(5000);

    const atRiskStudios = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const studio of studios) {
      const riskFactors = [];
      let riskScore = 0;

      // Check last login
      const lastLogin = studio.owner?.lastLogin;
      if (!lastLogin) {
        riskFactors.push('Noch nie eingeloggt');
        riskScore += 30;
      } else if (lastLogin < fourteenDaysAgo) {
        riskFactors.push(`Letzter Login: ${Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24))} Tage`);
        riskScore += lastLogin < thirtyDaysAgo ? 25 : 15;
      }

      // Check booking activity
      const recentBookings = await Booking.countDocuments({
        salonId: studio._id,
        createdAt: { $gte: sevenDaysAgo }
      });

      const totalBookings = await Booking.countDocuments({
        salonId: studio._id
      });

      if (totalBookings === 0) {
        riskFactors.push('Keine Buchungen');
        riskScore += 30;
      } else if (recentBookings === 0) {
        riskFactors.push('Keine Buchungen letzte 7 Tage');
        riskScore += 20;
      }

      // Check trial ending soon
      if (studio.subscription?.status === 'trial') {
        const trialEnds = new Date(studio.subscription.trialEndsAt);
        const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 7 && daysLeft > 0) {
          riskFactors.push(`Trial endet in ${daysLeft} Tagen`);
          riskScore += 20;
        } else if (daysLeft <= 0) {
          riskFactors.push('Trial abgelaufen');
          riskScore += 35;
        }
      }

      // Only include if there are risk factors
      if (riskScore >= 20) {
        atRiskStudios.push({
          id: studio._id,
          name: studio.name,
          slug: studio.slug,
          owner: {
            name: studio.owner?.name || 'Unbekannt',
            email: studio.owner?.email || 'N/A',
            lastLogin: lastLogin
          },
          subscription: {
            status: studio.subscription?.status,
            plan: studio.subscription?.plan,
            trialEndsAt: studio.subscription?.trialEndsAt
          },
          stats: {
            totalBookings,
            recentBookings
          },
          riskScore,
          riskLevel: riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
          riskFactors,
          createdAt: studio.createdAt
        });
      }
    }

    // Sort by risk score descending
    atRiskStudios.sort((a, b) => b.riskScore - a.riskScore);

    res.status(200).json({
      success: true,
      studios: atRiskStudios,
      summary: {
        total: atRiskStudios.length,
        highRisk: atRiskStudios.filter(s => s.riskLevel === 'high').length,
        mediumRisk: atRiskStudios.filter(s => s.riskLevel === 'medium').length,
        lowRisk: atRiskStudios.filter(s => s.riskLevel === 'low').length
      }
    });
  } catch (error) {
    logger.error('GetAtRiskStudios Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET LIFECYCLE EMAIL STATS ====================
export const getLifecycleEmailStats = async (req, res) => {
  try {
    // Get overall stats
    const totalScheduled = await LifecycleEmail.countDocuments();
    const sent = await LifecycleEmail.countDocuments({ status: 'sent' });
    const pending = await LifecycleEmail.countDocuments({ status: 'pending' });
    const failed = await LifecycleEmail.countDocuments({ status: 'failed' });
    const skipped = await LifecycleEmail.countDocuments({ status: 'skipped' });

    // Get stats by email type
    const emailTypes = [
      'welcome_day1', 'engagement_day3', 'midtrial_day7',
      'urgency_day23', 'expiry_day30', 'expired_day31', 'winback_day45'
    ];

    const byType = await Promise.all(emailTypes.map(async (type) => {
      const typeSent = await LifecycleEmail.countDocuments({ emailType: type, status: 'sent' });
      const typeTotal = await LifecycleEmail.countDocuments({ emailType: type });
      const conversions = await LifecycleEmail.countDocuments({
        emailType: type,
        status: 'sent',
        convertedAfter: true
      });

      return {
        type,
        sent: typeSent,
        total: typeTotal,
        sendRate: typeTotal > 0 ? Math.round((typeSent / typeTotal) * 100) : 0,
        conversions,
        conversionRate: typeSent > 0 ? Math.round((conversions / typeSent) * 100) : 0
      };
    }));

    // Get recently sent emails
    const recentlySent = await LifecycleEmail.find({ status: 'sent' })
      .populate('salonId', 'name').lean().maxTimeMS(5000)
      .populate('userId', 'name email')
      .sort({ sentAt: -1 })
      .limit(20);

    // Get upcoming emails
    const upcoming = await LifecycleEmail.find({
      status: 'pending',
      scheduledFor: { $gte: new Date().lean().maxTimeMS(5000) }
    })
      .populate('salonId', 'name')
      .populate('userId', 'name email')
      .sort({ scheduledFor: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      stats: {
        total: totalScheduled,
        sent,
        pending,
        failed,
        skipped,
        sendRate: totalScheduled > 0 ? Math.round((sent / totalScheduled) * 100) : 0
      },
      byType,
      recentlySent: recentlySent.map(e => ({
        id: e._id,
        type: e.emailType,
        salon: e.salonId?.name || 'Unknown',
        user: e.userId?.email || 'Unknown',
        subject: e.subject,
        sentAt: e.sentAt
      })),
      upcoming: upcoming.map(e => ({
        id: e._id,
        type: e.emailType,
        salon: e.salonId?.name || 'Unknown',
        user: e.userId?.email || 'Unknown',
        scheduledFor: e.scheduledFor
      }))
    });
  } catch (error) {
    logger.error('GetLifecycleEmailStats Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAnalyticsOverview,
  getRevenueChart,
  getCustomerGrowthChart,
  getCohortAnalysis,
  getChurnAnalysis,
  getAtRiskStudios,
  getLifecycleEmailStats
};


