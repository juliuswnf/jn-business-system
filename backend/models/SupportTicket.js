import mongoose from 'mongoose';

/**
 * Support Ticket Model
 * For CEO support ticket management
 */

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true
    },

    // Customer info
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    customerName: {
      type: String,
      required: true
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true
    },

    // Ticket details
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['billing', 'technical', 'feature', 'bug', 'other'],
      default: 'other'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'],
      default: 'open',
      index: true
    },

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Messages/Replies
    messages: [{
      sender: {
        type: String,
        enum: ['customer', 'support'],
        required: true
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        required: true
      },
      attachments: [{
        name: String,
        url: String,
        type: String
      }],
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Metadata
    tags: [String],
    internalNotes: String,

    // Timestamps
    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date
  },
  {
    timestamps: true
  }
);

// Generate ticket number before save
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model('SupportTicket').countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ customerEmail: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
