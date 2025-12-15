import express from 'express';
import Waitlist from '../models/Waitlist.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/waitlist
 * @desc    Join waitlist for a preferred time slot
 * @access  Public (can be called during booking flow)
 */
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      salonId,
      preferredService,
      preferredDate,
      preferredTime,
      flexibleTimes,
      notes
    } = req.body;

    // Validation
    if (!customerId || !salonId || !preferredService) {
      return res.status(400).json({
        success: false,
        message: 'customerId, salonId, and preferredService are required'
      });
    }

    // Check if already on waitlist
    const existing = await Waitlist.findOne({
      customerId,
      salonId,
      status: 'active'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Customer is already on the waitlist for this salon',
        waitlistEntry: existing
      });
    }

    // Create waitlist entry
    const waitlistEntry = await Waitlist.create({
      customerId,
      salonId,
      preferredService,
      preferredDate,
      preferredTime,
      flexibleTimes: flexibleTimes || [],
      notes,
      status: 'active'
    });

    // Calculate initial priority score
    await waitlistEntry.calculatePriorityScore();

    res.status(201).json({
      success: true,
      message: 'Successfully joined waitlist',
      waitlistEntry: {
        id: waitlistEntry._id,
        customerId: waitlistEntry.customerId,
        salonId: waitlistEntry.salonId,
        preferredService: waitlistEntry.preferredService,
        preferredDate: waitlistEntry.preferredDate,
        preferredTime: waitlistEntry.preferredTime,
        priorityScore: waitlistEntry.priorityScore,
        status: waitlistEntry.status
      }
    });

  } catch (error) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/waitlist/:salonId
 * @desc    Get all active waitlist entries for a salon (sorted by priority)
 * @access  Private (salon owner only)
 */
router.get('/:salonId', authenticateToken, async (req, res) => {
  try {
    const { salonId } = req.params;

    // TODO: Add authorization check (user must own salon)

    const waitlist = await Waitlist.find({ salonId, status: 'active' })
      .populate('customerId', 'firstName lastName phone email')
      .populate('preferredService', 'name duration price')
      .sort({ priorityScore: -1 }); // Highest priority first

    const stats = {
      total: waitlist.length,
      highPriority: waitlist.filter(w => w.priorityScore > 80).length,
      mediumPriority: waitlist.filter(w => w.priorityScore >= 50 && w.priorityScore <= 80).length,
      lowPriority: waitlist.filter(w => w.priorityScore < 50).length
    };

    res.status(200).json({
      success: true,
      stats,
      waitlist
    });

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/waitlist/customer/:customerId/:salonId
 * @desc    Get waitlist entry for a specific customer
 * @access  Public (customer can check their own status)
 */
router.get('/customer/:customerId/:salonId', async (req, res) => {
  try {
    const { customerId, salonId } = req.params;

    const waitlistEntry = await Waitlist.findOne({
      customerId,
      salonId,
      status: 'active'
    })
      .populate('preferredService', 'name duration price');

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'No active waitlist entry found'
      });
    }

    res.status(200).json({
      success: true,
      waitlistEntry: {
        id: waitlistEntry._id,
        preferredService: waitlistEntry.preferredService,
        preferredDate: waitlistEntry.preferredDate,
        preferredTime: waitlistEntry.preferredTime,
        priorityScore: waitlistEntry.priorityScore,
        notificationsSent: waitlistEntry.notificationsSent,
        lastNotificationSent: waitlistEntry.lastNotificationSent,
        createdAt: waitlistEntry.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching customer waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waitlist entry',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/waitlist/:id
 * @desc    Update waitlist entry (e.g., change preferred time)
 * @access  Private (customer or salon owner)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      preferredDate,
      preferredTime,
      flexibleTimes,
      notes
    } = req.body;

    // Find waitlist entry
    const waitlistEntry = await Waitlist.findById(id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    // TODO: Add authorization check (user must be customer or salon owner)

    // Update fields
    if (preferredDate) waitlistEntry.preferredDate = preferredDate;
    if (preferredTime) waitlistEntry.preferredTime = preferredTime;
    if (flexibleTimes) waitlistEntry.flexibleTimes = flexibleTimes;
    if (notes) waitlistEntry.notes = notes;

    await waitlistEntry.save();

    // Recalculate priority score
    await waitlistEntry.calculatePriorityScore();

    res.status(200).json({
      success: true,
      message: 'Waitlist entry updated successfully',
      waitlistEntry
    });

  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update waitlist entry',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/waitlist/:id
 * @desc    Remove customer from waitlist
 * @access  Private (customer or salon owner)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find waitlist entry
    const waitlistEntry = await Waitlist.findById(id);

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    // TODO: Add authorization check (user must be customer or salon owner)

    // Mark as removed
    waitlistEntry.status = 'removed';
    await waitlistEntry.save();

    res.status(200).json({
      success: true,
      message: 'Successfully removed from waitlist',
      waitlistEntry: {
        id: waitlistEntry._id,
        status: waitlistEntry.status
      }
    });

  } catch (error) {
    console.error('Error removing from waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from waitlist',
      error: error.message
    });
  }
});

export default router;
