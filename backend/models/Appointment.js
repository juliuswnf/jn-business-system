/**
 * Appointment — Legacy/Internal model used by walk-in appointment routes (/api/v1/appointments)
 * and database utility scripts (seed, backup, clear).
 *
 * NOTE: The primary booking model for customer-facing flows is Booking.js.
 * Appointment.js covers internal studio operations that require a confirmed
 * customerId and staffId. Do NOT merge these two models without auditing
 * all routes and utilities that reference each one.
 */
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      alias: 'salonId',
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      alias: 'employeeId',
      index: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      required: true,
      index: true
    },
    endTime: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['booked', 'completed', 'cancelled'],
      default: 'booked',
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

appointmentSchema.index({ studioId: 1, startTime: 1 });
appointmentSchema.index({ studioId: 1, status: 1, startTime: 1 });
appointmentSchema.index({ studioId: 1, customerId: 1, startTime: -1 });
appointmentSchema.index({ studioId: 1, staffId: 1, startTime: 1 });

appointmentSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime && this.endTime <= this.startTime) {
    return next(new Error('endTime must be after startTime'));
  }
  return next();
});

export default mongoose.model('Appointment', appointmentSchema);