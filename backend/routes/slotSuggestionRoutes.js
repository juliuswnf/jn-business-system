import express from 'express';
import SlotSuggestion from '../models/SlotSuggestion.js';
import Booking from '../models/Booking.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/slot-suggestions/accept/:id
 * @desc    Customer accepts a slot suggestion and creates booking
 * @access  Public (token embedded in SMS link)
 */
router.post('/accept/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find slot suggestion
    const suggestion = await SlotSuggestion.findById(id)
      .populate('waitlistId')
      .populate('salonId', 'businessName phone email')
      .populate('serviceId', 'name duration price');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Slot suggestion not found'
      });
    }

    // Check if still available
    if (suggestion.status !== 'pending') {
      return res.status(410).json({
        success: false,
        message: `Slot suggestion is no longer available (status: ${suggestion.status})`,
        suggestion: {
          status: suggestion.status,
          suggestedSlot: suggestion.suggestedSlot
        }
      });
    }

    // Check if offer has expired (2 hours)
    const now = new Date();
    const offerExpiry = new Date(suggestion.createdAt.getTime() + 2 * 60 * 60 * 1000);
    if (now > offerExpiry) {
      suggestion.status = 'expired';
      await suggestion.save();

      return res.status(410).json({
        success: false,
        message: 'Slot offer has expired (valid for 2 hours only)',
        suggestion: {
          status: 'expired',
          createdAt: suggestion.createdAt,
          expiryTime: offerExpiry
        }
      });
    }

    // Check if slot is still free (no booking exists)
    const existingBooking = await Booking.findOne({
      salonId: suggestion.salonId,
      startTime: suggestion.suggestedSlot,
      status: { $in: ['confirmed', 'pending'] }
    });

    if (existingBooking) {
      suggestion.status = 'expired';
      await suggestion.save();

      return res.status(409).json({
        success: false,
        message: 'Slot was just booked by someone else',
        suggestion: {
          status: 'expired',
          suggestedSlot: suggestion.suggestedSlot
        }
      });
    }

    // Create booking
    const booking = await Booking.create({
      customer: suggestion.customerId,
      salon: suggestion.salonId,
      service: suggestion.serviceId,
      startTime: suggestion.suggestedSlot,
      endTime: new Date(suggestion.suggestedSlot.getTime() + suggestion.serviceId.duration * 60000),
      status: 'confirmed',
      source: 'waitlist',
      totalPrice: suggestion.serviceId.price
    });

    // Mark suggestion as filled
    await suggestion.markFilled(booking._id);

    // Mark waitlist as fulfilled
    const waitlist = suggestion.waitlistId;
    waitlist.status = 'fulfilled';
    waitlist.fulfilledAt = new Date();
    await waitlist.save();

    res.status(201).json({
      success: true,
      message: '🎉 Booking confirmed! Slot successfully reserved from waitlist.',
      booking: {
        id: booking._id,
        customer: booking.customer,
        salon: suggestion.salonId,
        service: suggestion.serviceId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error accepting slot suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept slot suggestion',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/slot-suggestions/reject/:id
 * @desc    Customer rejects a slot suggestion (offer to next in line)
 * @access  Public (token embedded in SMS link)
 */
router.post('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find slot suggestion
    const suggestion = await SlotSuggestion.findById(id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Slot suggestion not found'
      });
    }

    // Check if already processed
    if (suggestion.status !== 'pending') {
      return res.status(410).json({
        success: false,
        message: `Slot suggestion already processed (status: ${suggestion.status})`
      });
    }

    // Mark as rejected
    suggestion.status = 'rejected';
    suggestion.respondedAt = new Date();
    await suggestion.save();

    // Notify next customer in waitlist
    try {
      await suggestion.notifyNextCustomer();
    } catch (notifyError) {
      console.error('Failed to notify next customer:', notifyError);
      // Continue even if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Slot suggestion rejected. Offering to next customer in waitlist.',
      suggestion: {
        id: suggestion._id,
        status: suggestion.status,
        respondedAt: suggestion.respondedAt
      }
    });

  } catch (error) {
    console.error('Error rejecting slot suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject slot suggestion',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/slot-suggestions/:salonId
 * @desc    Get all slot suggestions for a salon (admin dashboard)
 * @access  Private (salon owner only)
 */
router.get('/:salonId', authenticateToken, async (req, res) => {
  try {
    const { salonId } = req.params;
    const { status, days = 7 } = req.query;

    // TODO: Add authorization check (user must own salon)

    // Build query
    const query = { salonId };
    if (status) {
      query.status = status;
    }

    // Filter by date range
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: since };

    const suggestions = await SlotSuggestion.find(query)
      .populate('customerId', 'firstName lastName phone')
      .populate('serviceId', 'name duration price')
      .populate('waitlistId')
      .sort({ createdAt: -1 });

    // Get fill rate stats
    const stats = await SlotSuggestion.getFillRateStats(salonId, days);

    res.status(200).json({
      success: true,
      stats,
      suggestions
    });

  } catch (error) {
    console.error('Error fetching slot suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slot suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/slot-suggestions/urgent/:salonId
 * @desc    Get urgent slot suggestions that need attention (expiring soon)
 * @access  Private (salon owner only)
 */
router.get('/urgent/:salonId', authenticateToken, async (req, res) => {
  try {
    const { salonId } = req.params;

    // TODO: Add authorization check (user must own salon)

    // Find urgent suggestions (expiring within 1 hour)
    const urgentSuggestions = await SlotSuggestion.findUrgent(salonId, 60);

    res.status(200).json({
      success: true,
      count: urgentSuggestions.length,
      suggestions: urgentSuggestions
    });

  } catch (error) {
    console.error('Error fetching urgent slot suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch urgent slot suggestions',
      error: error.message
    });
  }
});

export default router;
