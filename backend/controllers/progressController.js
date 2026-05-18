import ProgressEntry from '../models/ProgressEntry.js';
import Salon from '../models/Salon.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import mongoose from 'mongoose';

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
    const salon = await Salon.findById(salonId).maxTimeMS(5000);
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
    logger.error('Error creating progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPLOAD PROGRESS PHOTOS ====================
export const uploadProgressPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // front, back, side, other
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id).maxTimeMS(5000);
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
    logger.error('Error uploading progress photo:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CLIENT PROGRESS HISTORY ====================
export const getClientProgressHistory = async (req, res) => {
  try {
    const { customerId: rawCustomerId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    if (!rawCustomerId || !mongoose.isValidObjectId(rawCustomerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const customerId = new mongoose.Types.ObjectId(rawCustomerId);

    const rawSalonId = req.query.salonId;
    if (rawSalonId && !mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }
    let salonId = null;
    if (req.user?.role !== 'ceo') {
      if (!req.user?.salonId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (rawSalonId && rawSalonId !== req.user.salonId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
      }
      salonId = new mongoose.Types.ObjectId(req.user.salonId);
    } else if (rawSalonId) {
      salonId = new mongoose.Types.ObjectId(rawSalonId);
    }

    const query = {
      customerId,
      deletedAt: null
    };

    if (salonId) query.salonId = salonId;
    if (startDate || endDate) {
      // typeof guards prevent object-operator injection via nested query strings
      if (startDate && typeof startDate !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid startDate' });
      }
      if (endDate && typeof endDate !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid endDate' });
      }
      const dateRange = {};
      if (startDate) {
        const d = new Date(startDate);
        if (isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'Invalid startDate' });
        dateRange.$gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) return res.status(400).json({ success: false, message: 'Invalid endDate' });
        dateRange.$lte = d;
      }
      query.recordedAt = dateRange;
    }

    const progressEntries = await ProgressEntry.find(query)
      .sort({ recordedAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 200))
      .populate('trainerId', 'name email')
      .populate('bookingId', 'bookingDate')
      .lean()
      .maxTimeMS(5000);

    return res.json({
      success: true,
      progressEntries,
      count: progressEntries.length
    });
  } catch (error) {
    logger.error('Error getting progress history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PROGRESS SUMMARY ====================
export const getProgressSummary = async (req, res) => {
  try {
    const { customerId: rawCustomerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!rawCustomerId || !mongoose.isValidObjectId(rawCustomerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    const customerId = new mongoose.Types.ObjectId(rawCustomerId);

    const rawSalonId = req.query.salonId;
    if (rawSalonId && !mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    let salonId = null;
    if (req.user?.role !== 'ceo') {
      if (!req.user?.salonId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (rawSalonId && rawSalonId !== req.user.salonId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
      }
      salonId = new mongoose.Types.ObjectId(req.user.salonId);
    } else if (rawSalonId) {
      salonId = new mongoose.Types.ObjectId(rawSalonId);
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const safeStartDate = new Date(startDate);
    const safeEndDate = new Date(endDate);
    if (isNaN(safeStartDate.getTime()) || isNaN(safeEndDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    const summary = await ProgressEntry.getProgressSummary(
      customerId,
      safeStartDate,
      safeEndDate,
      salonId
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
    logger.error('Error getting progress summary:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE PROGRESS ENTRY ====================
export const updateProgressEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id).maxTimeMS(5000);
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
    logger.error('Error updating progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE PROGRESS ENTRY ====================
export const deleteProgressEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const progressEntry = await ProgressEntry.findById(id).maxTimeMS(5000);
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
    logger.error('Error deleting progress entry:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET WEIGHT TREND ====================
export const getWeightTrend = async (req, res) => {
  try {
    const { customerId: rawCustomerIdWeight } = req.params;
    const { months = 6 } = req.query;

    if (!rawCustomerIdWeight || !mongoose.isValidObjectId(rawCustomerIdWeight)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const customerId = new mongoose.Types.ObjectId(rawCustomerIdWeight);

    const rawSalonId = req.query.salonId;
    if (rawSalonId && !mongoose.isValidObjectId(rawSalonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }
    let salonId = null;
    if (req.user?.role !== 'ceo') {
      if (!req.user?.salonId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (rawSalonId && rawSalonId !== req.user.salonId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
      }
      salonId = new mongoose.Types.ObjectId(req.user.salonId);
    } else if (rawSalonId) {
      salonId = new mongoose.Types.ObjectId(rawSalonId);
    }
    // Clamp months to a safe integer (prevents date manipulation via user input)
    const safeMonths = Math.min(60, Math.max(1, Math.floor(Number(months) || 6)));

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - safeMonths);

    const weightQuery = {
      customerId,
      recordedAt: { $gte: startDate },
      'weight.value': { $exists: true },
      deletedAt: null
    };

    if (salonId) weightQuery.salonId = salonId;

    const weightEntries = await ProgressEntry.find(weightQuery)
      .sort({ recordedAt: 1 }).lean().maxTimeMS(5000)
      .select('recordedAt weight')
      .lean();

    return res.json({
      success: true,
      weightTrend: weightEntries
    });
  } catch (error) {
    logger.error('Error getting weight trend:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PERFORMANCE TREND ====================
export const getPerformanceTrend = async (req, res) => {
  try {
    const { customerId: rawCustomerIdPerf } = req.params;
    const { exercise, months = 6 } = req.query;

    if (!rawCustomerIdPerf || !mongoose.isValidObjectId(rawCustomerIdPerf)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId' });
    }
    // Cast to ObjectId — breaks taint chain from req.params into query
    const customerId = new mongoose.Types.ObjectId(rawCustomerIdPerf);

    const rawSalonId2 = req.query.salonId;
    if (rawSalonId2 && !mongoose.isValidObjectId(rawSalonId2)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }
    let salonId = null;
    if (req.user?.role !== 'ceo') {
      if (!req.user?.salonId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (rawSalonId2 && rawSalonId2 !== req.user.salonId?.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied - Resource belongs to another salon' });
      }
      salonId = new mongoose.Types.ObjectId(req.user.salonId);
    } else if (rawSalonId2) {
      salonId = new mongoose.Types.ObjectId(rawSalonId2);
    }
    // Sanitize exercise key: only allow alphanumeric and underscores to prevent object key injection
    const safeExercise = exercise && /^[a-zA-Z0-9_]{1,50}$/.test(exercise) ? exercise : null;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const query = {
      customerId,
      recordedAt: { $gte: startDate },
      deletedAt: null
    };

    if (salonId) query.salonId = salonId;
    // Avoid dynamic query key from user input — filter exercise in app code instead

    const allPerformanceEntries = await ProgressEntry.find(query)
      .sort({ recordedAt: 1 }).lean().maxTimeMS(5000)
      .select('recordedAt performance')
      .lean();

    const performanceEntries = safeExercise
      ? allPerformanceEntries.filter(
          e => Object.prototype.hasOwnProperty.call(e.performance ?? {}, safeExercise)
        )
      : allPerformanceEntries;

    return res.json({
      success: true,
      performanceTrend: performanceEntries
    });
  } catch (error) {
    logger.error('Error getting performance trend:', error);
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
    logger.error('Error getting trainer statistics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


