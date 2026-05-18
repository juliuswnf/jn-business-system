import Package from '../models/Package.js';
import CustomerPackage from '../models/CustomerPackage.js';
import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

const ALLOWED_PACKAGE_STATUSES = ['active', 'expired', 'completed', 'cancelled', 'suspended'];

/**
 * Package Controller
 * For Personal Training / Fitness - Package deals management
 */

// ==================== CREATE PACKAGE ====================
export const createPackage = async (req, res) => {
  try {
    const {
      salonId,
      name,
      description,
      price,
      currency,
      totalSessions,
      sessionDuration,
      validityPeriod,
      serviceIds,
      trainerSpecific,
      trainerId
    } = req.body;

    const userId = req.user.id;

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    const safeSalonId = new mongoose.Types.ObjectId(salonId);

    if (trainerSpecific === 'true' && trainerId && !mongoose.isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainerId format' });
    }

    let parsedServiceIds = [];
    if (Array.isArray(serviceIds)) {
      parsedServiceIds = serviceIds;
    } else if (typeof serviceIds === 'string' && serviceIds.trim()) {
      try {
        const decodedServiceIds = JSON.parse(serviceIds);
        if (!Array.isArray(decodedServiceIds)) {
          return res.status(400).json({ success: false, message: 'Invalid serviceIds format' });
        }
        parsedServiceIds = decodedServiceIds;
      } catch (_parseError) {
        return res.status(400).json({ success: false, message: 'Invalid serviceIds JSON' });
      }
    }

    for (const serviceId of parsedServiceIds) {
      if (!mongoose.isValidObjectId(serviceId)) {
        return res.status(400).json({ success: false, message: 'Invalid serviceIds entry' });
      }
    }

    const safeServiceIds = parsedServiceIds.map(serviceId => new mongoose.Types.ObjectId(serviceId));
    const safeTrainerId = trainerSpecific === 'true' && trainerId ? new mongoose.Types.ObjectId(trainerId) : null;

    // Verify salon ownership
    const salon = await Salon.findById(safeSalonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const pkg = await Package.create({
      salonId: safeSalonId,
      createdBy: userId,
      name,
      description,
      price,
      currency: currency || 'EUR',
      totalSessions,
      sessionDuration,
      validityPeriod,
      serviceIds: safeServiceIds,
      trainerSpecific: trainerSpecific === 'true',
      trainerId: safeTrainerId,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      package: pkg
    });
  } catch (error) {
    logger.error('Error creating package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET AVAILABLE PACKAGES ====================
export const getAvailablePackages = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { trainerId } = req.query;

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    const safeSalonId = new mongoose.Types.ObjectId(salonId);
    let safeTrainerId = null;
    if (trainerId) {
      if (!mongoose.isValidObjectId(trainerId)) {
        return res.status(400).json({ success: false, message: 'Invalid trainerId format' });
      }
      safeTrainerId = new mongoose.Types.ObjectId(trainerId);
    }

    const query = {
      salonId: safeSalonId,
      isActive: true,
      deletedAt: null
    };

    if (safeTrainerId) {
      query.$or = [
        { trainerSpecific: false },
        { trainerId: safeTrainerId }
      ];
    } else {
      query.trainerSpecific = false;
    }

    const packages = await Package.find(query)
      .populate('serviceIds', 'name price duration').lean().maxTimeMS(5000)
      .populate('trainerId', 'name email')
      .sort({ soldCount: -1, createdAt: -1 })
      .lean();

    // Add calculated price per session
    const packagesWithCalculations = packages.map(pkg => ({
      ...pkg,
      pricePerSession: (pkg.price / pkg.totalSessions).toFixed(2)
    }));

    return res.json({
      success: true,
      packages: packagesWithCalculations
    });
  } catch (error) {
    logger.error('Error getting packages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PURCHASE PACKAGE ====================
export const purchasePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, paymentId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format' });
    }
    if (!paymentId || typeof paymentId !== 'string') {
      return res.status(400).json({ success: false, message: 'Payment ID is required' });
    }

    const safePackageId = new mongoose.Types.ObjectId(id);
    const safeCustomerId = new mongoose.Types.ObjectId(customerId);

    const pkg = await Package.findById(safePackageId).maxTimeMS(5000);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    if (req.user?.role !== 'ceo' && pkg.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    if (!pkg.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Package is not available'
      });
    }

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentId,
      status: 'completed'
    }).maxTimeMS(5000);

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: 'Payment not found or not completed'
      });
    }

    if (req.user?.role !== 'ceo' && payment.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Payment belongs to another salon'
      });
    }

    const expectedAmount = Number(pkg.price);
    const paidAmount = Number(payment.amount);
    if (!Number.isFinite(expectedAmount) || !Number.isFinite(paidAmount) || paidAmount < expectedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match package price'
      });
    }

    const alreadyUsedPayment = await CustomerPackage.findOne({ paymentId }).lean().maxTimeMS(5000);
    if (alreadyUsedPayment) {
      return res.status(409).json({
        success: false,
        message: 'Payment has already been used for a package purchase'
      });
    }

    // Calculate validity dates
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + pkg.validityPeriod);

    // Create customer package
    const customerPackage = await CustomerPackage.create({
      salonId: pkg.salonId,
      customerId: safeCustomerId,
      packageId: pkg._id,
      purchasedAt: new Date(),
      purchasePrice: pkg.price,
      paymentId,
      totalSessions: pkg.totalSessions,
      usedSessions: 0,
      remainingSessions: pkg.totalSessions,
      validFrom,
      validUntil,
      isActive: true,
      status: 'active'
    });

    // Increment sold count
    pkg.soldCount += 1;
    await pkg.save();

    return res.status(201).json({
      success: true,
      message: 'Package purchased successfully',
      customerPackage
    });
  } catch (error) {
    logger.error('Error purchasing package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CUSTOMER PACKAGES ====================
export const getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customerId format' });
    }
    const status = ALLOWED_PACKAGE_STATUSES.includes(String(req.query.status)) ? String(req.query.status) : undefined;

    const safeCustomerId = new mongoose.Types.ObjectId(customerId);

    const query = {
      customerId: safeCustomerId,
      deletedAt: null
    };

    if (req.user?.role !== 'ceo') {
      query.salonId = req.user.salonId;
    }

    if (status) query.status = status;

    const customerPackages = await CustomerPackage.find(query)
      .populate('packageId', 'name description sessionDuration').lean().maxTimeMS(5000)
      .populate('salonId', 'name')
      .sort({ purchasedAt: -1 })
      .lean();

    return res.json({
      success: true,
      customerPackages
    });
  } catch (error) {
    logger.error('Error getting customer packages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== USE PACKAGE SESSION ====================
export const usePackageSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    const safeCustomerPackageId = new mongoose.Types.ObjectId(id);

    if (bookingId && !mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Invalid booking ID format' });
    }
    const safeBookingId = bookingId ? new mongoose.Types.ObjectId(bookingId) : null;

    const customerPackage = await CustomerPackage.findById(safeCustomerPackageId).maxTimeMS(5000);
    if (!customerPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    if (req.user?.role !== 'ceo' && customerPackage.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    if (safeBookingId) {
      const booking = await Booking.findById(safeBookingId).maxTimeMS(5000);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      if (booking.salonId?.toString() !== customerPackage.salonId?.toString()) {
        return res.status(403).json({ success: false, message: 'Booking belongs to another salon' });
      }
    }

    // Use session
    await customerPackage.useSession(safeBookingId);

    // Update booking with package info
    if (safeBookingId) {
      await Booking.findByIdAndUpdate(safeBookingId, {
        'packageUsage.packageId': safeCustomerPackageId,
        'packageUsage.sessionsUsed': 1
      });
    }

    return res.json({
      success: true,
      message: 'Session used from package',
      remainingSessions: customerPackage.remainingSessions,
      status: customerPackage.status
    });
  } catch (error) {
    logger.error('Error using package session:', error);
    return res.status(400).json({
      success: false,
      message: 'Failed to use package session'
    });
  }
};

// ==================== CANCEL PACKAGE ====================
export const cancelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }
    const safeCustomerPackageId = new mongoose.Types.ObjectId(id);

    const customerPackage = await CustomerPackage.findById(safeCustomerPackageId).maxTimeMS(5000);
    if (!customerPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    if (req.user?.role !== 'ceo' && customerPackage.salonId?.toString() !== req.user.salonId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Resource belongs to another salon'
      });
    }

    if (customerPackage.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Package cannot be cancelled'
      });
    }

    // Cancel and calculate refund
    await customerPackage.cancelPackage(userId, reason);

    return res.json({
      success: true,
      message: 'Package cancelled',
      refundAmount: customerPackage.refundAmount,
      status: customerPackage.status
    });
  } catch (error) {
    logger.error('Error cancelling package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE PACKAGE ====================
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }

    const safePackageId = new mongoose.Types.ObjectId(id);

    const pkg = await Package.findById(safePackageId).maxTimeMS(5000);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(pkg.salonId).maxTimeMS(5000);
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (name) pkg.name = name;
    if (description) pkg.description = description;
    if (price) pkg.price = price;
    if (typeof isActive !== 'undefined') pkg.isActive = isActive;

    await pkg.save();

    return res.json({
      success: true,
      message: 'Package updated',
      package: pkg
    });
  } catch (error) {
    logger.error('Error updating package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE PACKAGE ====================
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid package ID format' });
    }

    const safePackageId = new mongoose.Types.ObjectId(id);

    const pkg = await Package.findById(safePackageId).maxTimeMS(5000);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(pkg.salonId).maxTimeMS(5000);
    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    pkg.deletedAt = new Date();
    pkg.deletedBy = userId;
    await pkg.save();

    return res.json({
      success: true,
      message: 'Package deleted'
    });
  } catch (error) {
    logger.error('Error deleting package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PACKAGE STATISTICS ====================
export const getPackageStatistics = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(salonId)) {
      return res.status(400).json({ success: false, message: 'Invalid salonId format' });
    }

    const safeSalonId = new mongoose.Types.ObjectId(salonId);

    // Verify authorization
    const salon = await Salon.findById(safeSalonId).maxTimeMS(5000);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const stats = await Package.aggregate([
      { $match: { salonId: salon._id, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalPackages: { $sum: 1 },
          activePackages: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalSold: { $sum: '$soldCount' },
          totalRevenue: {
            $sum: { $multiply: ['$price', '$soldCount'] }
          }
        }
      }
    ]);

    const customerPackageStats = await CustomerPackage.aggregate([
      { $match: { salonId: salon._id, deletedAt: null } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: {
        packages: stats[0] || {},
        customerPackages: customerPackageStats
      }
    });
  } catch (error) {
    logger.error('Error getting package statistics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


