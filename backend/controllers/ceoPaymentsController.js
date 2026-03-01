import logger from '../utils/logger.js';
/**
 * CEO Payments Controller
 * Stripe transactions, refunds, and payout management
 */

import Salon from '../models/Salon.js';
import Payment from '../models/Payment.js';
import { escapeRegExp } from '../utils/securityHelpers.js';

// ==================== PRICING CONSTANTS ====================
const PRICING = {
  starter: 29,
  pro: 69
};

// ==================== GET ALL TRANSACTIONS ====================
export const getAllTransactions = async (req, res) => {
  try {
    const {
      status,
      type,
      startDate,
      endDate,
      page: pageQuery = 1,
      limit = 50,
      search
    } = req.query;

    const validatedPage = Math.max(1, parseInt(pageQuery, 10) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (validatedPage - 1) * validatedLimit;

    const query = {};

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (search && typeof search === 'string' && search.length > 0 && search.length <= 100) {
      const escapedSearch = escapeRegExp(search);
      query.$or = [
        { customerEmail: { $regex: escapedSearch, $options: 'i' } },
        { customerName: { $regex: escapedSearch, $options: 'i' } },
        { stripePaymentId: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (validatedPage - 1) * validatedLimit;

    const transactions = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean()
      .maxTimeMS(5000)
      .populate('companyId', 'name email');

    const total = await Payment.countDocuments(query);

    // Calculate totals
    const totals = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalRefunded: {
            $sum: {
              $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      transactions,
      totals: totals[0] || { totalAmount: 0, totalRefunded: 0, count: 0 },
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    });
  } catch (error) {
    logger.error('GetAllTransactions Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET PAYMENT OVERVIEW ====================
export const getPaymentOverview = async (req, res) => {
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

    // MRR calculation
    const starterCount = await Salon.countDocuments({
      'subscription.plan': 'starter',
      'subscription.status': 'active'
    });
    const proCount = await Salon.countDocuments({
      'subscription.plan': 'pro',
      'subscription.status': 'active'
    });
    const mrr = (starterCount * PRICING.starter) + (proCount * PRICING.pro);

    // Payments in period
    const periodPayments = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'succeeded' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Refunds in period
    const periodRefunds = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'refunded' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Pending payments
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    // Failed payments in period
    const failedPayments = await Payment.countDocuments({
      createdAt: { $gte: startDate },
      status: 'failed'
    });

    res.status(200).json({
      success: true,
      overview: {
        mrr,
        arr: mrr * 12,
        periodRevenue: periodPayments[0]?.total || 0,
        periodTransactions: periodPayments[0]?.count || 0,
        refunds: {
          total: periodRefunds[0]?.total || 0,
          count: periodRefunds[0]?.count || 0
        },
        pendingPayments,
        failedPayments,
        subscriptions: {
          starter: starterCount,
          pro: proCount,
          total: starterCount + proCount
        }
      },
      period
    });
  } catch (error) {
    logger.error('GetPaymentOverview Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET TRANSACTION DETAILS ====================
export const getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Payment.findById(transactionId)
      .populate('companyId', 'name email phone').maxTimeMS(5000)
      .populate('bookingId');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('GetTransactionDetails Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== PROCESS REFUND ====================
export const processRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason, amount } = req.body;

    const transaction = await Payment.findById(transactionId).maxTimeMS(5000);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Transaction already refunded'
      });
    }

    // Update transaction
    transaction.status = 'refunded';
    transaction.refundReason = reason;
    transaction.refundedAt = new Date();
    transaction.refundedBy = req.user._id;
    transaction.refundAmount = amount || transaction.amount;
    await transaction.save();

    // TODO: Call Stripe refund API
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // await stripe.refunds.create({ payment_intent: transaction.stripePaymentId });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      transaction
    });
  } catch (error) {
    logger.error('ProcessRefund Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET PAYOUT SCHEDULE ====================
export const getPayoutSchedule = async (req, res) => {
  try {
    // Simulated payout data - in production, fetch from Stripe
    const payouts = [
      {
        id: 'po_1',
        amount: 2450,
        status: 'paid',
        arrivalDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        transactions: 89
      },
      {
        id: 'po_2',
        amount: 2680,
        status: 'pending',
        arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        transactions: 95
      },
      {
        id: 'po_3',
        amount: 2100,
        status: 'in_transit',
        arrivalDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        transactions: 76
      }
    ];

    // Calculate totals
    const pendingAmount = payouts
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      payouts,
      summary: {
        pendingAmount,
        nextPayout: payouts.find(p => p.status === 'pending')
      }
    });
  } catch (error) {
    logger.error('GetPayoutSchedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET REVENUE BY PLAN ====================
export const getRevenueByPlan = async (req, res) => {
  try {
    const starterCount = await Salon.countDocuments({
      'subscription.plan': 'starter',
      'subscription.status': 'active'
    });
    const proCount = await Salon.countDocuments({
      'subscription.plan': 'pro',
      'subscription.status': 'active'
    });

    const starterRevenue = starterCount * PRICING.starter;
    const proRevenue = proCount * PRICING.pro;
    const totalRevenue = starterRevenue + proRevenue;

    res.status(200).json({
      success: true,
      breakdown: {
        starter: {
          count: starterCount,
          price: PRICING.starter,
          revenue: starterRevenue,
          percentage: totalRevenue > 0 ? Math.round((starterRevenue / totalRevenue) * 100) : 0
        },
        pro: {
          count: proCount,
          price: PRICING.pro,
          revenue: proRevenue,
          percentage: totalRevenue > 0 ? Math.round((proRevenue / totalRevenue) * 100) : 0
        },
        total: {
          count: starterCount + proCount,
          revenue: totalRevenue
        }
      }
    });
  } catch (error) {
    logger.error('GetRevenueByPlan Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getAllTransactions,
  getPaymentOverview,
  getTransactionDetails,
  processRefund,
  getPayoutSchedule,
  getRevenueByPlan
};


