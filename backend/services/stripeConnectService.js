/**
 * Stripe Connect Service
 * Handles Stripe Connect accounts for salons
 * Each salon has their own Stripe account for direct payouts
 */

import Stripe from 'stripe';
import logger from '../utils/logger.js';
import Salon from '../models/Salon.js';

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

/**
 * Create Stripe Connect Account for Salon
 * @param {Object} salon - Salon document
 * @param {Object} salonOwner - User document
 * @returns {String} accountId
 */
export const createConnectedAccount = async (salon, salonOwner) => {
  try {
    const stripe = getStripe();
    
    const account = await stripe.accounts.create({
      type: 'express', // Express Account (simpler onboarding)
      country: 'DE',
      email: salonOwner.email,
      business_type: 'company', // or 'individual'
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_profile: {
        name: salon.name,
        support_email: salon.email,
        support_phone: salon.phone,
        url: salon.website || `https://jn-business.app/s/${salon.slug}`
      },
      metadata: {
        salonId: salon._id.toString(),
        salonName: salon.name
      }
    });

    // Update salon
    salon.stripe.connectedAccountId = account.id;
    salon.stripe.accountType = 'express';
    salon.stripe.accountStatus = 'pending';
    salon.stripe.chargesEnabled = account.charges_enabled;
    salon.stripe.payoutsEnabled = account.payouts_enabled;
    await salon.save();

    logger.info(`✅ Stripe Connect Account created: ${account.id} for salon ${salon._id}`);

    return account.id;
  } catch (error) {
    logger.error('❌ Failed to create Stripe Connect Account:', error);
    throw error;
  }
};

/**
 * Create Account Link for Onboarding
 * @param {String} accountId - Stripe Account ID
 * @returns {String} onboarding URL
 */
export const createAccountLink = async (accountId) => {
  try {
    const stripe = getStripe();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/dashboard/settings/stripe/refresh`,
      return_url: `${frontendUrl}/dashboard/settings/stripe/complete`,
      type: 'account_onboarding'
    });

    return accountLink.url;
  } catch (error) {
    logger.error('❌ Failed to create Account Link:', error);
    throw error;
  }
};

/**
 * Check and update account status
 * @param {String} accountId
 * @returns {Object} account status
 */
export const checkAccountStatus = async (accountId) => {
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements
    };
  } catch (error) {
    logger.error('❌ Failed to check account status:', error);
    throw error;
  }
};

/**
 * Charge No-Show-Fee with Stripe Connect
 * @param {Object} booking - Booking document
 * @param {Object} salon - Salon document
 * @returns {Object} charge result
 */
export const chargeNoShowFeeConnect = async (booking, salon) => {
  try {
    const stripe = getStripe();
    
    if (!salon.stripe?.connectedAccountId) {
      throw new Error('Salon has no connected Stripe account');
    }

    if (!salon.stripe?.chargesEnabled) {
      throw new Error('Salon Stripe account cannot accept charges yet');
    }

    const feeAmount = salon.noShowKiller?.feeAmount || 1500; // €15.00 = 1500 cents

    // Create PaymentIntent on behalf of connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: feeAmount,
      currency: 'eur',
      customer: booking.stripeCustomerId,
      payment_method: booking.paymentMethodId,
      off_session: true,
      confirm: true,
      description: `No-Show-Gebühr - ${salon.name}`,
      // ✅ CRITICAL: Application fee = 0 (salon keeps all, pays Stripe fees)
      application_fee_amount: 0,
      // ✅ Transfer to connected account
      transfer_data: {
        destination: salon.stripe.connectedAccountId
      },
      metadata: {
        bookingId: booking._id.toString(),
        salonId: salon._id.toString(),
        type: 'no_show_fee',
        salonName: salon.name
      }
    });

    // Calculate breakdown (Stripe takes ~€0.46 from salon)
    // Stripe fee: €0.25 + 1.4% of amount
    const stripeFee = Math.round(25 + (feeAmount * 0.014)); // €0.25 + 1.4%
    const salonReceives = feeAmount - stripeFee;

    // Get transfer ID from payment intent charges
    let transferId = null;
    if (paymentIntent.charges?.data?.[0]) {
      const charge = await stripe.charges.retrieve(paymentIntent.charges.data[0].id);
      transferId = charge.transfer || null;
    }

    logger.info(`✅ Charged No-Show-Fee via Connect: €${feeAmount / 100} - Payment Intent: ${paymentIntent.id}`);

    return {
      success: true,
      chargeId: paymentIntent.id,
      transferId: transferId,
      amount: feeAmount,
      breakdown: {
        totalCharged: feeAmount,
        stripeFee: stripeFee,
        salonReceives: salonReceives,
        platformCommission: 0
      }
    };
  } catch (error) {
    logger.error('❌ Failed to charge No-Show-Fee via Connect:', error);
    throw error;
  }
};

/**
 * Refund No-Show-Fee
 * @param {String} chargeId - PaymentIntent ID
 * @param {Number} amount - Amount in cents
 * @returns {Object} refund result
 */
export const refundNoShowFee = async (chargeId, amount) => {
  try {
    const stripe = getStripe();
    
    const refund = await stripe.refunds.create({
      payment_intent: chargeId,
      amount: amount,
      reason: 'requested_by_customer',
      // Refund reverses application fee and transfer automatically
      reverse_transfer: true
    });

    logger.info(`✅ Refunded No-Show-Fee: Refund ID ${refund.id}`);

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    };
  } catch (error) {
    logger.error('❌ Failed to refund No-Show-Fee:', error);
    throw error;
  }
};

export default {
  createConnectedAccount,
  createAccountLink,
  checkAccountStatus,
  chargeNoShowFeeConnect,
  refundNoShowFee
};

