import ProgressEntry from '../models/ProgressEntry.js';
import Salon from '../models/Salon.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';
import fs from 'fs';

/**
 * Progress Entry Controller
 * For Personal Trainers - Track client progress
 */

// ==================== CREATE PROGRESS ENTRY ====================
export const createProgressEntry = async (req, res) => {
  try {
    const {
      salonId,
      customerId,
      bookingId,
      weight,
      bodyFatPercentage,
      muscleMass,
      measurements,
      performance,
      cardio,
      notes,
      clientFeedback,
      currentGoals,
      goalsAchieved,
      customMetrics,
      isPrivate
    } = req.body;

    const userId = req.user.id;

    // Verify salon authorization
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    const isOwner = salon.owner.toString() === userId;
    // Trainer authorization check
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const progressEntry = await ProgressEntry.create({
      salonId,
      customerId,
      trainerId: userId,
      bookingId,
      recordedAt: new Date(),
      weight: weight ? JSON.parse(weight) : undefined,
      bodyFatPercentage,
      muscleMass: muscleMass ? JSON.parse(muscleMass) : undefined,
      measurements: measurements ? JSON.parse(measurements) : undefined,
      performance: performance ? JSON.parse(performance) : undefined,
      cardio: cardio ? JSON.parse(cardio) : undefined,
      notes,
      clientFeedback,
      currentGoals: currentGoals ? JSON.parse(currentGoals) : [],
      goalsAchieved: goalsAchieved ? JSON.parse(goalsAchieved) : [],
      customMetrics: customMetrics ? JSON.parse(customMetrics) : {},
      isPrivate: isPrivate === 'true',
      photos: []
    });

    return res.status(201).json({
      success: true,
      message: 'Progress entry created',
      progressEntry
    });
  } catch (error) {
    console.error('Error creating progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPLOAD PROGRESS PHOTOS ====================
export const uploadProgressPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // front, back, side, other
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id);
    if (!progressEntry) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Verify authorization
    if (progressEntry.trainerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded' });
    }

    // Upload to Cloudinary
    let photoUrl, thumbnailUrl;
    if (process.env.CLOUDINARY_ENABLED === 'true') {
      const uploadResult = await uploadToCloudinary(req.file.path, {
        folder: `progress/${progressEntry.salonId}/${progressEntry.customerId}`,
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
      });
      photoUrl = uploadResult.secure_url;

      const thumbResult = await uploadToCloudinary(req.file.path, {
        folder: `progress/${progressEntry.salonId}/${progressEntry.customerId}/thumbs`,
        transformation: [{ width: 200, height: 200, crop: 'fill' }]
      });
      thumbnailUrl = thumbResult.secure_url;

      fs.unlinkSync(req.file.path);
    } else {
      photoUrl = `/uploads/progress/${req.file.filename}`;
      thumbnailUrl = photoUrl;
    }

    progressEntry.photos.push({
      type: type || 'other',
      url: photoUrl,
      thumbnailUrl,
      capturedAt: new Date()
    });

    await progressEntry.save();

    return res.json({
      success: true,
      message: 'Progress photo uploaded',
      photos: progressEntry.photos
    });
  } catch (error) {
    console.error('Error uploading progress photo:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CLIENT PROGRESS HISTORY ====================
export const getClientProgressHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { salonId, startDate, endDate, limit = 50 } = req.query;

    const query = {
      customerId,
      deletedAt: null
    };

    if (salonId) query.salonId = salonId;
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const progressEntries = await ProgressEntry.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .populate('trainerId', 'name email')
      .populate('bookingId', 'bookingDate')
      .lean();

    return res.json({
      success: true,
      progressEntries,
      count: progressEntries.length
    });
  } catch (error) {
    console.error('Error getting progress history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PROGRESS SUMMARY ====================
export const getProgressSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const summary = await ProgressEntry.getProgressSummary(
      customerId,
      new Date(startDate),
      new Date(endDate)
    );

    if (!summary) {
      return res.json({
        success: true,
        message: 'No progress entries found',
        summary: null
      });
    }

    return res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting progress summary:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE PROGRESS ENTRY ====================
export const updateProgressEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id);
    if (!progressEntry) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Verify authorization
    if (progressEntry.trainerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'salonId' && key !== 'customerId') {
        if (typeof updateData[key] === 'string' && (key === 'weight' || key === 'measurements' || key === 'performance' || key === 'cardio' || key === 'currentGoals' || key === 'goalsAchieved' || key === 'customMetrics')) {
          progressEntry[key] = JSON.parse(updateData[key]);
        } else {
          progressEntry[key] = updateData[key];
        }
      }
    });

    await progressEntry.save();

    return res.json({
      success: true,
      message: 'Progress entry updated',
      progressEntry
    });
  } catch (error) {
    console.error('Error updating progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE PROGRESS ENTRY ====================
export const deleteProgressEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id);
    if (!progressEntry) {
      return res.status(404).json({ success: false, message: 'Progress entry not found' });
    }

    // Verify authorization
    if (progressEntry.trainerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    progressEntry.deletedAt = new Date();
    progressEntry.deletedBy = userId;
    await progressEntry.save();

    return res.json({
      success: true,
      message: 'Progress entry deleted'
    });
  } catch (error) {
    console.error('Error deleting progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET WEIGHT TREND ====================
export const getWeightTrend = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { salonId, months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const query = {
      customerId,
      recordedAt: { $gte: startDate },
      'weight.value': { $exists: true },
      deletedAt: null
    };

    if (salonId) query.salonId = salonId;

    const weightEntries = await ProgressEntry.find(query)
      .sort({ recordedAt: 1 })
      .select('recordedAt weight')
      .lean();

    return res.json({
      success: true,
      weightTrend: weightEntries
    });
  } catch (error) {
    console.error('Error getting weight trend:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PERFORMANCE TREND ====================
export const getPerformanceTrend = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { salonId, exercise, months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const query = {
      customerId,
      recordedAt: { $gte: startDate },
      deletedAt: null
    };

    if (salonId) query.salonId = salonId;
    if (exercise) query[`performance.${exercise}`] = { $exists: true };

    const performanceEntries = await ProgressEntry.find(query)
      .sort({ recordedAt: 1 })
      .select('recordedAt performance')
      .lean();

    return res.json({
      success: true,
      performanceTrend: performanceEntries
    });
  } catch (error) {
    console.error('Error getting performance trend:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET TRAINER STATISTICS ====================
export const getTrainerStatistics = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const userId = req.user.id;

    if (trainerId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const stats = await ProgressEntry.aggregate([
      { $match: { trainerId: userId, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalClients: { $addToSet: '$customerId' }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: {
        totalEntries: stats[0]?.totalEntries || 0,
        totalClients: stats[0]?.totalClients?.length || 0
      }
    });
  } catch (error) {
    console.error('Error getting trainer statistics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
