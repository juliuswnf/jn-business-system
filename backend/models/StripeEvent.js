import mongoose from 'mongoose';

/**
 * StripeEvent Schema
 *
 * Purpose: Idempotency tracking for Stripe webhook events
 * Prevents duplicate processing of webhook events (e.g., payment_intent.succeeded fired twice)
 *
 * Critical for: Financial accuracy, preventing duplicate charges/credits
 */
const stripeEventSchema = new mongoose.Schema(
  {
    // Stripe's unique event ID (e.g., "evt_1MqLX...")
    stripeEventId: {
      type: String,
      required: true,
      unique: true, // ? PREVENTS DUPLICATE PROCESSING
      index: true
    },

    // Event type (e.g., "payment_intent.succeeded", "invoice.paid")
    eventType: {
      type: String,
      required: true,
      index: true
    },

    // Processing status
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
      index: true
    },

    // Full event data from Stripe (for debugging)
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    // Processing metadata
    processedAt: {
      type: Date
    },

    errorMessage: {
      type: String
    },

    retryCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

// ==================== INDEXES ====================

// Compound index for queries by type and status
stripeEventSchema.index({ eventType: 1, status: 1 });

// TTL index - auto-delete processed events after 90 days (audit retention)
stripeEventSchema.index(
  { processedAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    partialFilterExpression: { status: 'processed' }
  }
);

// ==================== METHODS ====================

/**
 * Mark event as processed
 */
stripeEventSchema.methods.markProcessed = function () {
  this.status = 'processed';
  this.processedAt = new Date();
  return this.save();
};

/**
 * Mark event as failed
 */
stripeEventSchema.methods.markFailed = function (errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

// ==================== STATICS ====================

/**
 * Check if event has already been processed (idempotency check)
 */
stripeEventSchema.statics.hasBeenProcessed = async function (stripeEventId) {
  const existingEvent = await this.findOne({ stripeEventId });
  return existingEvent?.status === 'processed';
};

/**
 * Record new event (idempotent)
 */
stripeEventSchema.statics.recordEvent = async function (stripeEventId, eventType, eventData) {
  try {
    const event = new this({
      stripeEventId,
      eventType,
      eventData,
      status: 'pending'
    });
    await event.save();
    return event;
  } catch (error) {
    // Duplicate key error = event already exists
    if (error.code === 11000) {
      return await this.findOne({ stripeEventId });
    }
    throw error;
  }
};

const StripeEvent = mongoose.model('StripeEvent', stripeEventSchema);

export default StripeEvent;
