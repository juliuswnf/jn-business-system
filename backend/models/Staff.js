import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      alias: 'salonId',
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          required: true
        },
        start: {
          type: String,
          required: true,
          match: /^\d{2}:\d{2}$/
        },
        end: {
          type: String,
          required: true,
          match: /^\d{2}:\d{2}$/
        }
      }
    ]
  },
  { timestamps: true }
);

staffSchema.index({ studioId: 1, status: 1 });
staffSchema.index({ studioId: 1, email: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);