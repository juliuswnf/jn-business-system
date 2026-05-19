import logger from '../utils/logger.js';
/**
 * CEO Analytics Controller
 * Deep-dive analytics for revenue, growth, cohorts, and churn
 */

import Salon from '../models/Salon.js';
import LifecycleEmail from '../models/LifecycleEmail.js';
import mongoose from 'mongoose';

// ==================== PRICING CONSTANTS ====================
const PRICING = {
  starter: 129,
  pro: 249,
  enterprise: 599
};

const parsePagination = (req, defaultLimit = 20, maxLimit = 100) => {
  const parsedPage = Number.parseInt(String(req.query.page || '1'), 10);
  const parsedLimit = Number.parseInt(String(req.query.limit || String(defaultLimit)), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), maxLimit)
    : defaultLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const parseOptionalSalonFilter = (req, res) => {
  const rawSalonId = req.query?.salonId;
  if (!rawSalonId) {
    return null;
  }

  if (!mongoose.isValidObjectId(rawSalonId)) {
    res.status(400).json({ success: false, message: 'Invalid salonId format' });
    return 'INVALID';
  }

  return new mongoose.Types.ObjectId(rawSalonId);
};

// ==================== GET ANALYTICS OVERVIEW ====================
export const getAnalyticsOverview = async (req, res) => {
  try {
    const rawPeriod = typeof req.query.period === 'string' ? req.query.period : '30d';
    const period = ['7d', '30d', '90d', '1y'].includes(rawPeriod) ? rawPeriod : '30d';

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
    const [
      totalCustomers,
      paidCustomers,
      starterCount,
      proCount,
      prevCustomers,
      newCustomers,
      churnedCustomers,
      trialCount,
      cancelledCount
    ] = await Promise.all([
      Salon.countDocuments().maxTimeMS(10000),
      Salon.countDocuments({
        'subscription.status': 'active',
        'subscription.plan': { $in: ['starter', 'pro'] }
      }).maxTimeMS(10000),
      Salon.countDocuments({ 'subscription.plan': 'starter', 'subscription.status': 'active' }).maxTimeMS(10000),
      Salon.countDocuments({ 'subscription.plan': 'pro', 'subscription.status': 'active' }).maxTimeMS(10000),
      Salon.countDocuments({ createdAt: { $lt: startDate } }).maxTimeMS(10000),
      Salon.countDocuments({ createdAt: { $gte: startDate } }).maxTimeMS(10000),
      Salon.countDocuments({
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': { $gte: startDate }
      }).maxTimeMS(10000),
      Salon.countDocuments({ 'subscription.status': 'trial' }).maxTimeMS(10000),
      Salon.countDocuments({ 'subscription.status': 'cancelled' }).maxTimeMS(10000)
    ]);

    // Calculate MRR
    const mrr = (starterCount * PRICING.starter) + (proCount * PRICING.pro);
    const arr = mrr * 12;

    const customerGrowth = prevCustomers > 0
      ? Math.round(((totalCustomers - prevCustomers) / prevCustomers) * 100)
      : 100;

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
          trial: trialCount,
          cancelled: cancelledCount
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
    const rawPeriod = typeof req.query.period === 'string' ? req.query.period : '12m';
    const period = ['6m', '12m'].includes(rawPeriod) ? rawPeriod : '12m';

    // Generate monthly revenue data
    const months = period === '6m' ? 6 : 12;
    const chartData = [];

    // Fetch all active salons once — avoids N×2 sequential queries in the loop
    const [allStarters, allPros] = await Promise.all([
      Salon.find({ 'subscription.plan': 'starter', 'subscription.status': 'active' }, { createdAt: 1 }).lean().maxTimeMS(10000),
      Salon.find({ 'subscription.plan': 'pro', 'subscription.status': 'active' }, { createdAt: 1 }).lean().maxTimeMS(10000)
    ]);

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const starterCount = allStarters.filter(s => new Date(s.createdAt) <= monthEnd).length;
      const proCount = allPros.filter(s => new Date(s.createdAt) <= monthEnd).length;
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
    const rawPeriod = typeof req.query.period === 'string' ? req.query.period : '12m';
    const period = ['6m', '12m'].includes(rawPeriod) ? rawPeriod : '12m';
    const months = period === '6m' ? 6 : 12;
    const chartData = [];

    // Fetch all salons once — avoids N×2 sequential queries in the loop
    const [allSalons, allPaidSalons] = await Promise.all([
      Salon.find({}, { createdAt: 1 }).lean().maxTimeMS(10000),
      Salon.find({ 'subscription.status': 'active', 'subscription.plan': { $in: ['starter', 'pro'] } }, { createdAt: 1 }).lean().maxTimeMS(10000)
    ]);

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const totalCustomers = allSalons.filter(s => new Date(s.createdAt) <= monthEnd).length;
      const paidCustomers = allPaidSalons.filter(s => new Date(s.createdAt) <= monthEnd).length;

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
      }).lean().maxTimeMS(10000);

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
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const salonFilter = parseOptionalSalonFilter(req, res);
    if (salonFilter === 'INVALID') {
      return;
    }

    const churnFilter = {
      'subscription.status': 'cancelled',
      ...(salonFilter ? { _id: salonFilter } : {})
    };

    const totalChurned = await Salon.countDocuments(churnFilter).maxTimeMS(10000);

    const reasonBreakdown = await Salon.aggregate([
      { $match: { ...churnFilter } },
      {
        $group: {
          _id: {
            $ifNull: ['$subscription.cancelReason', 'Unbekannt']
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).maxTimeMS(10000);

    // Monthly churn trend
    const churnTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const churnedInMonth = await Salon.countDocuments({
        ...churnFilter,
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': { $gte: monthStart, $lte: monthEnd }
      }).maxTimeMS(10000);

      const totalAtStart = await Salon.countDocuments({
        ...(salonFilter ? { _id: salonFilter } : {}),
        'subscription.status': { $in: ['active', 'cancelled'] },
        createdAt: { $lt: monthStart }
      }).maxTimeMS(10000);

      const churnRate = totalAtStart > 0 ? ((churnedInMonth / totalAtStart) * 100).toFixed(1) : 0;

      churnTrend.push({
        month: date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        churned: churnedInMonth,
        rate: parseFloat(churnRate)
      });
    }

    const recentChurns = await Salon.find(churnFilter)
      .select('name subscription.cancelledAt subscription.cancelReason createdAt')
      .sort({ 'subscription.cancelledAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(10000);

    res.status(200).json({
      success: true,
      analysis: {
        total: totalChurned,
        reasons: reasonBreakdown.map(({ _id, count }) => ({
          reason: _id,
          count,
          percentage: totalChurned > 0 ? Math.round((count / totalChurned) * 100) : 0
        })),
        trend: churnTrend,
        recentChurns: recentChurns.map(c => ({
          name: c.name,
          cancelledAt: c.subscription?.cancelledAt,
          reason: c.subscription?.cancelReason || 'Unbekannt',
          customerSince: c.createdAt
        })),
        pagination: {
          page,
          limit,
          total: totalChurned,
          totalPages: Math.ceil(totalChurned / limit)
        }
      }
    });
  } catch (error) {
    logger.error('GetChurnAnalysis Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET AT-RISK STUDIOS ====================

function calculateStudioRisk(studio, recentCountMap, totalCountMap, now) {
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const riskFactors = [];
  let riskScore = 0;

  const lastLogin = studio.owner?.lastLogin;
  if (!lastLogin) {
    riskFactors.push('Noch nie eingeloggt');
    riskScore += 30;
  } else if (lastLogin < fourteenDaysAgo) {
    riskFactors.push(`Letzter Login: ${Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24))} Tage`);
    riskScore += lastLogin < thirtyDaysAgo ? 25 : 15;
  }

  const recentBookings = recentCountMap.get(studio._id.toString()) ?? 0;
  const totalBookings = totalCountMap.get(studio._id.toString()) ?? 0;

  if (totalBookings === 0) {
    riskFactors.push('Keine Buchungen');
    riskScore += 30;
  } else if (recentBookings === 0) {
    riskFactors.push('Keine Buchungen letzte 7 Tage');
    riskScore += 20;
  }

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

  return { riskScore, riskFactors, recentBookings, totalBookings, lastLogin };
}

function buildAtRiskEntry(studio, recentCountMap, totalCountMap, now) {
  const { riskScore, riskFactors, recentBookings, totalBookings, lastLogin } =
    calculateStudioRisk(studio, recentCountMap, totalCountMap, now);
  if (riskScore < 20) return null;
  return {
    id: studio._id,
    name: studio.name,
    slug: studio.slug,
    owner: {
      name: studio.owner?.name || 'Unbekannt',
      email: studio.owner?.email || 'N/A',
      lastLogin
    },
    subscription: {
      status: studio.subscription?.status,
      plan: studio.subscription?.plan,
      trialEndsAt: studio.subscription?.trialEndsAt
    },
    stats: { totalBookings, recentBookings },
    riskScore,
    riskLevel: riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    riskFactors,
    createdAt: studio.createdAt
  };
}

export const getAtRiskStudios = async (req, res) => {
  try {
    const Booking = (await import('../models/Booking.js')).default;
    const { page, limit, skip } = parsePagination(req, 25, 100);
    const salonFilter = parseOptionalSalonFilter(req, res);
    if (salonFilter === 'INVALID') {
      return;
    }

    const studioFilter = {
      'subscription.status': { $in: ['active', 'trial'] },
      ...(salonFilter ? { _id: salonFilter } : {})
    };

    // Get all active/trial studios
    const studios = await Salon.find(studioFilter)
      .populate('owner', 'name email lastLogin')
      .lean()
      .maxTimeMS(10000);

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Pre-fetch booking counts for all studios in 2 aggregations instead of 2×N queries
    const studioIds = studios.map(s => s._id);
    const [recentCountDocs, totalCountDocs] = await Promise.all([
      Booking.aggregate([
        { $match: { salonId: { $in: studioIds }, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]).maxTimeMS(10000),
      Booking.aggregate([
        { $match: { salonId: { $in: studioIds } } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]).maxTimeMS(10000)
    ]);
    const recentCountMap = new Map(recentCountDocs.map(r => [r._id.toString(), r.count]));
    const totalCountMap = new Map(totalCountDocs.map(r => [r._id.toString(), r.count]));

    const atRiskStudios = studios
      .map(studio => buildAtRiskEntry(studio, recentCountMap, totalCountMap, now))
      .filter(Boolean);

    // Sort by risk score descending
    atRiskStudios.sort((a, b) => b.riskScore - a.riskScore);
    const pagedStudios = atRiskStudios.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      studios: pagedStudios,
      summary: {
        total: atRiskStudios.length,
        highRisk: atRiskStudios.filter(s => s.riskLevel === 'high').length,
        mediumRisk: atRiskStudios.filter(s => s.riskLevel === 'medium').length,
        lowRisk: atRiskStudios.filter(s => s.riskLevel === 'low').length
      },
      pagination: {
        page,
        limit,
        total: atRiskStudios.length,
        totalPages: Math.ceil(atRiskStudios.length / limit)
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
    const { page, limit, skip } = parsePagination(req, 20, 100);
    const salonFilter = parseOptionalSalonFilter(req, res);
    if (salonFilter === 'INVALID') {
      return;
    }

    const baseFilter = salonFilter ? { salonId: salonFilter } : {};

    // Get overall stats
    const totalScheduled = await LifecycleEmail.countDocuments(baseFilter).maxTimeMS(10000);
    const sent = await LifecycleEmail.countDocuments({ ...baseFilter, status: 'sent' }).maxTimeMS(10000);
    const pending = await LifecycleEmail.countDocuments({ ...baseFilter, status: 'pending' }).maxTimeMS(10000);
    const failed = await LifecycleEmail.countDocuments({ ...baseFilter, status: 'failed' }).maxTimeMS(10000);
    const skipped = await LifecycleEmail.countDocuments({ ...baseFilter, status: 'skipped' }).maxTimeMS(10000);

    // Get stats by email type
    const emailTypes = [
      'welcome_day1', 'engagement_day3', 'midtrial_day7',
      'urgency_day23', 'expiry_day30', 'expired_day31', 'winback_day45'
    ];

    const byType = await Promise.all(emailTypes.map(async (type) => {
      const typeSent = await LifecycleEmail.countDocuments({ ...baseFilter, emailType: type, status: 'sent' }).maxTimeMS(10000);
      const typeTotal = await LifecycleEmail.countDocuments({ ...baseFilter, emailType: type }).maxTimeMS(10000);
      const conversions = await LifecycleEmail.countDocuments({
        ...baseFilter,
        emailType: type,
        status: 'sent',
        convertedAfter: true
      }).maxTimeMS(10000);

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
    const recentlySentFilter = { ...baseFilter, status: 'sent' };
    const recentlySentTotal = await LifecycleEmail.countDocuments(recentlySentFilter).maxTimeMS(10000);
    const recentlySent = await LifecycleEmail.find(recentlySentFilter)
      .populate('salonId', 'name')
      .populate('userId', 'name email')
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(10000);

    // Get upcoming emails
    const upcomingFilter = {
      ...baseFilter,
      status: 'pending',
      scheduledFor: { $gte: new Date() }
    };
    const upcomingTotal = await LifecycleEmail.countDocuments(upcomingFilter).maxTimeMS(10000);
    const upcoming = await LifecycleEmail.find(upcomingFilter)
      .populate('salonId', 'name')
      .populate('userId', 'name email')
      .sort({ scheduledFor: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(10000);

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
      })),
      pagination: {
        page,
        limit,
        recentlySentTotal,
        recentlySentPages: Math.ceil(recentlySentTotal / limit),
        upcomingTotal,
        upcomingPages: Math.ceil(upcomingTotal / limit)
      }
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


