import logger from '../utils/logger.js';
/**
 * Payment Controller - MVP Simplified
 * Essential payment operations only
 */

import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

// Lazy initialization of Stripe (after dotenv is loaded)
let stripe = null;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

const validateAmount = (amount) => {
  return !isNaN(amount) && amount > 0 && amount <= 999999.99;
};

// ==================== CREATE PAYMENT INTENT ====================

export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide booking ID and amount'
      });
    }

    if (!validateAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount (must be between 0.01 and 999999.99 EUR)'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      metadata: {
        bookingId: bookingId.toString()
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('CreatePaymentIntent Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== PROCESS PAYMENT ====================

export const processPayment = async (req, res) => {
  try {
    const { bookingId, paymentIntentId, amount, paymentMethod } = req.body;

    if (!bookingId || !paymentIntentId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: paymentIntentId
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const payment = await Payment.create({
      bookingId,
      amount,
      currency: 'EUR',
      paymentMethod,
      stripePaymentIntentId: paymentIntentId,
      status: 'completed',
      transactionId: paymentIntent.id
    });

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      payment,
      booking
    });
  } catch (error) {
    logger.error('ProcessPayment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET PAYMENT HISTORY ====================

export const getPaymentHistory = async (req, res) => {
  try {
    const { bookingId, salonId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    let filter = {};

    if (req.user && req.user.role !== 'ceo') {
      filter.salonId = req.user.salonId || salonId;
    } else if (salonId) {
      filter.salonId = salonId;
    }

    if (bookingId) {
      filter.bookingId = bookingId;
    }

    const total = await Payment.countDocuments(filter);
    const skip = (page - 1) * limit;
    const payments = await Payment.find(filter)
      .populate('bookingId', 'customerName customerEmail bookingDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      limit,
      totalPages,
      payments
    });
  } catch (error) {
    logger.error('GetPaymentHistory Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== REFUND PAYMENT (Full or Partial) ====================

export const refundPayment = async (req, res) => {
  try {
    const { paymentId, reason, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide payment ID'
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been fully refunded'
      });
    }

    // Calculate refundable amount
    const alreadyRefunded = payment.refundedAmount || 0;
    const maxRefundable = payment.amount - alreadyRefunded;

    // Determine refund amount (partial or full)
    let refundAmount;
    const isPartialRefund = amount && amount < maxRefundable;

    if (amount) {
      // Partial refund requested
      if (!validateAmount(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid refund amount'
        });
      }
      if (amount > maxRefundable) {
        return res.status(400).json({
          success: false,
          message: `Maximum refundable amount is ${maxRefundable.toFixed(2)} EUR`
        });
      }
      refundAmount = amount;
    } else {
      // Full refund of remaining amount
      refundAmount = maxRefundable;
    }

    // Create refund with Stripe
    const refund = await getStripe().refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason || 'requested_by_customer'
    });

    // Calculate new totals
    const newRefundedAmount = alreadyRefunded + refundAmount;
    const isFullyRefunded = newRefundedAmount >= payment.amount;

    // Update payment record
    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: isFullyRefunded ? 'refunded' : 'partially_refunded',
        refundId: refund.id,
        refundedAmount: newRefundedAmount,
        refundedAt: Date.now(),
        $push: {
          refundHistory: {
            refundId: refund.id,
            amount: refundAmount,
            reason: reason || 'requested_by_customer',
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Update booking status based on refund type
    if (isFullyRefunded) {
      await Booking.findByIdAndUpdate(
        payment.bookingId,
        {
          status: 'cancelled',
          paymentStatus: 'refunded'
        }
      );
    } else {
      await Booking.findByIdAndUpdate(
        payment.bookingId,
        {
          paymentStatus: 'partially_refunded'
        }
      );
    }

    res.status(200).json({
      success: true,
      message: isPartialRefund
        ? `Partial refund of ${refundAmount.toFixed(2)} EUR processed successfully`
        : 'Full refund processed successfully',
      payment: updatedPayment,
      refund: {
        id: refund.id,
        amount: refundAmount,
        isPartial: isPartialRefund,
        remainingRefundable: payment.amount - newRefundedAmount
      }
    });
  } catch (error) {
    logger.error('RefundPayment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== GET REVENUE ANALYTICS ====================

export const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, salonId } = req.query;
    let filter = { status: 'completed' };

    if (req.user && req.user.role !== 'ceo') {
      filter.salonId = req.user.salonId || salonId;
    } else if (salonId) {
      filter.salonId = salonId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const revenueData = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    const revenueByMethod = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailyRevenue = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        overall: revenueData[0] || { totalRevenue: 0, totalPayments: 0 },
        byPaymentMethod: revenueByMethod,
        dailyBreakdown: dailyRevenue
      }
    });
  } catch (error) {
    logger.error('GetRevenueAnalytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== HANDLE STRIPE WEBHOOK ====================

export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      logger.error('❌ Missing Stripe signature header');
      return res.status(401).json({
        success: false,
        message: 'Missing signature'
      });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logger.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error('❌ Stripe signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }

    logger.log(`✅ Stripe webhook received: ${event.type}`);

    switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntentSucceeded = event.data.object;
      logger.log('✅ Payment succeeded:', paymentIntentSucceeded.id);

      if (paymentIntentSucceeded.metadata?.bookingId) {
        await Booking.findOneAndUpdate(
          { _id: paymentIntentSucceeded.metadata.bookingId },
          {
            status: 'confirmed',
            paymentStatus: 'paid'
          }
        );
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntentFailed = event.data.object;
      logger.log('❌ Payment failed:', paymentIntentFailed.id);

      if (paymentIntentFailed.metadata?.bookingId) {
        await Booking.findOneAndUpdate(
          { _id: paymentIntentFailed.metadata.bookingId },
          { paymentStatus: 'failed' }
        );
      }
      break;
    }

    case 'charge.refunded': {
      const chargeRefunded = event.data.object;
      logger.log('💰 Charge refunded:', chargeRefunded.id);

      if (chargeRefunded.payment_intent) {
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: chargeRefunded.payment_intent },
          { status: 'refunded' }
        );
      }
      break;
    }

    default:
      logger.log(`⚠️ Unhandled webhook event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('❌ Stripe Webhook Error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook processing error'
    });
  }
};

// ==================== GET PAYMENT DETAILS ====================

export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('bookingId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error('GetPaymentDetails Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// ==================== DEFAULT EXPORT ====================

export default {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  refundPayment,
  getRevenueAnalytics,
  handleStripeWebhook,
  getPaymentDetails
};
