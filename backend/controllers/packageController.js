import Package from '../models/Package.js';
import CustomerPackage from '../models/CustomerPackage.js';
import Salon from '../models/Salon.js';
import Booking from '../models/Booking.js';

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

    // Verify salon ownership
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }

    if (salon.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const pkg = await Package.create({
      salonId,
      createdBy: userId,
      name,
      description,
      price,
      currency: currency || 'EUR',
      totalSessions,
      sessionDuration,
      validityPeriod,
      serviceIds: serviceIds ? JSON.parse(serviceIds) : [],
      trainerSpecific: trainerSpecific === 'true',
      trainerId: trainerSpecific === 'true' ? trainerId : null,
      isActive: true
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      package: pkg
    });
  } catch (error) {
    console.error('Error creating package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET AVAILABLE PACKAGES ====================
export const getAvailablePackages = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { trainerId } = req.query;

    const query = {
      salonId,
      isActive: true,
      deletedAt: null
    };

    if (trainerId) {
      query.$or = [
        { trainerSpecific: false },
        { trainerId }
      ];
    } else {
      query.trainerSpecific = false;
    }

    const packages = await Package.find(query)
      .populate('serviceIds', 'name price duration')
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
    console.error('Error getting packages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== PURCHASE PACKAGE ====================
export const purchasePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, paymentId } = req.body;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    if (!pkg.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Package is not available'
      });
    }

    // Calculate validity dates
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + pkg.validityPeriod);

    // Create customer package
    const customerPackage = await CustomerPackage.create({
      salonId: pkg.salonId,
      customerId,
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
    console.error('Error purchasing package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET CUSTOMER PACKAGES ====================
export const getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    const query = {
      customerId,
      deletedAt: null
    };

    if (status) query.status = status;

    const customerPackages = await CustomerPackage.find(query)
      .populate('packageId', 'name description sessionDuration')
      .populate('salonId', 'name')
      .sort({ purchasedAt: -1 })
      .lean();

    return res.json({
      success: true,
      customerPackages
    });
  } catch (error) {
    console.error('Error getting customer packages:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== USE PACKAGE SESSION ====================
export const usePackageSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingId } = req.body;

    const customerPackage = await CustomerPackage.findById(id);
    if (!customerPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Use session
    await customerPackage.useSession(bookingId);

    // Update booking with package info
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        'packageUsage.packageId': id,
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
    console.error('Error using package session:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to use package session'
    });
  }
};

// ==================== CANCEL PACKAGE ====================
export const cancelPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const customerPackage = await CustomerPackage.findById(id);
    if (!customerPackage) {
      return res.status(404).json({ success: false, message: 'Package not found' });
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
    console.error('Error cancelling package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== UPDATE PACKAGE ====================
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;
    const userId = req.user.id;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(pkg.salonId);
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
    console.error('Error updating package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== DELETE PACKAGE ====================
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    // Verify authorization
    const salon = await Salon.findById(pkg.salonId);
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
    console.error('Error deleting package:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== GET PACKAGE STATISTICS ====================
export const getPackageStatistics = async (req, res) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    // Verify authorization
    const salon = await Salon.findById(salonId);
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
    console.error('Error getting package statistics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
