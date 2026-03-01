import express from 'express';
import BookingConfirmation from '../models/BookingConfirmation.js';
import Booking from '../models/Booking.js';
import { sendBookingConfirmation } from '../services/smsService.js';
import authMiddleware from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/confirmations/:bookingId
 * @desc    Create a booking confirmation (48h requirement)
 * @access  Private (called by confirmationSenderWorker)
 */
router.post('/:bookingId', authMiddleware.protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('customer', 'firstName lastName phone')
      .populate('salon', 'businessName phone email')
      .populate('service', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if confirmation already exists
    const existing = await BookingConfirmation.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation already exists for this booking',
        confirmation: existing
      });
    }

    // Calculate deadline (48h from now)
    const confirmationDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Create confirmation
    const confirmation = await BookingConfirmation.create({
      bookingId,
      customerId: booking.customer._id,
      salonId: booking.salon._id,
      confirmationDeadline,
      status: 'pending'
    });

    // Send SMS
    try {
      await sendBookingConfirmation(booking, confirmation.confirmationToken);
      confirmation.remindersSent += 1;
      confirmation.lastReminderSent = new Date();
      await confirmation.save();
    } catch (smsError) {
      logger.error('Failed to send confirmation SMS:', smsError);
      // Continue even if SMS fails (can retry later)
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmation created and SMS sent',
      confirmation: {
        id: confirmation._id,
        bookingId: confirmation.bookingId,
        status: confirmation.status,
        confirmationDeadline: confirmation.confirmationDeadline,
        confirmationToken: confirmation.confirmationToken
      }
    });

  } catch (error) {
    logger.error('Error creating booking confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking confirmation',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/confirmations/confirm/:token
 * @desc    Confirm a booking via public link (no auth required)
 * @access  Public
 */
router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find confirmation
    const confirmation = await BookingConfirmation.findOne({
      confirmationToken: token
    }).populate({
      path: 'bookingId',
      populate: [
        { path: 'customer', select: 'firstName lastName' },
        { path: 'salon', select: 'businessName' },
        { path: 'service', select: 'name' }
      ]
    });

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message: 'Confirmation not found or invalid token'
      });
    }

    // Check if already confirmed
    if (confirmation.status === 'confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Booking already confirmed',
        confirmation: {
          status: confirmation.status,
          confirmedAt: confirmation.confirmedAt,
          booking: confirmation.bookingId
        }
      });
    }

    // Check if expired
    if (confirmation.status === 'expired') {
      return res.status(410).json({
        success: false,
        message: 'Confirmation deadline has passed. Booking has been auto-cancelled.',
        confirmation: {
          status: confirmation.status,
          confirmationDeadline: confirmation.confirmationDeadline
        }
      });
    }

    // Check if auto-cancelled
    if (confirmation.status === 'auto_cancelled') {
      return res.status(410).json({
        success: false,
        message: 'Booking was automatically cancelled due to no confirmation',
        confirmation: {
          status: confirmation.status,
          autoCancelledAt: confirmation.autoCancelledAt
        }
      });
    }

    // Confirm booking
    await confirmation.markConfirmed();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully! ✅',
      confirmation: {
        status: confirmation.status,
        confirmedAt: confirmation.confirmedAt,
        booking: {
          id: confirmation.bookingId._id,
          customer: confirmation.bookingId.customer,
          salon: confirmation.bookingId.salon,
          service: confirmation.bookingId.service,
          startTime: confirmation.bookingId.startTime
        }
      }
    });

  } catch (error) {
    logger.error('Error confirming booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/confirmations/:bookingId
 * @desc    Get confirmation status for a booking
 * @access  Private (authenticated)
 */
router.get('/:bookingId', authMiddleware.protect, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find confirmation
    const confirmation = await BookingConfirmation.findOne({ bookingId });

    if (!confirmation) {
      return res.status(404).json({
        success: false,
        message: 'No confirmation found for this booking'
      });
    }

    res.status(200).json({
      success: true,
      confirmation: {
        id: confirmation._id,
        bookingId: confirmation.bookingId,
        status: confirmation.status,
        confirmationDeadline: confirmation.confirmationDeadline,
        confirmedAt: confirmation.confirmedAt,
        remindersSent: confirmation.remindersSent,
        lastReminderSent: confirmation.lastReminderSent,
        autoCancelledAt: confirmation.autoCancelledAt
      }
    });

  } catch (error) {
    logger.error('Error fetching confirmation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch confirmation status',
      error: error.message
    });
  }
});

export default router;
