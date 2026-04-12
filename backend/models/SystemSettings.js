import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    trialPeriodDays: { type: Number, default: 30 },
    emailNotificationsEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('SystemSettings', systemSettingsSchema);
