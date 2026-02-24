import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

dotenv.config();

// Import all models
import Booking from '../models/Booking.js';
import TattooProject from '../models/TattooProject.js';
import WorkflowProject from '../models/WorkflowProject.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import MarketingCampaign from '../models/MarketingCampaign.js';
import Package from '../models/Package.js';
import Service from '../models/Service.js';
import Employee from '../models/Employee.js';
import Resource from '../models/Resource.js';
import Waitlist from '../models/Waitlist.js';
import ConsentForm from '../models/ConsentForm.js';
import ClinicalNote from '../models/ClinicalNote.js';
import Payment from '../models/Payment.js';
import RefreshToken from '../models/RefreshToken.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  logger.log('\n🔧 Creating database indexes...\n');

  try {
    // Booking Indexes
    await Booking.collection.createIndex({ salonId: 1, deletedAt: 1 });
    await Booking.collection.createIndex({ customerId: 1, deletedAt: 1 });
    await Booking.collection.createIndex({ startTime: 1, deletedAt: 1 });
    logger.log('✅ Booking indexes created');

    // User/Employee Indexes
    await User.collection.createIndex({ email: 1, deletedAt: 1 }, { sparse: true });
    await Employee.collection.createIndex({ salonId: 1, deletedAt: 1 });
    logger.log('✅ User/Employee indexes created');

    // Soft-delete compound indexes
    await Customer.collection.createIndex({ salonId: 1, deletedAt: 1 });
    await Service.collection.createIndex({ salonId: 1, deletedAt: 1 });
    await Package.collection.createIndex({ salonId: 1, deletedAt: 1 });
    logger.log('✅ Soft-delete indexes created');

    // Payment Indexes
    await Payment.collection.createIndex({ salonId: 1, createdAt: -1 });
    await Payment.collection.createIndex({ customerId: 1, createdAt: -1 });
    logger.log('✅ Payment indexes created');

    // RefreshToken Indexes with TTL
    await RefreshToken.collection.createIndex(
      { userId: 1 },
      { background: true }
    );
    await RefreshToken.collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, background: true }
    );
    logger.log('✅ RefreshToken indexes created');

    // Marketing Indexes
    await MarketingCampaign.collection.createIndex({ salonId: 1, deletedAt: 1 });
    await MarketingCampaign.collection.createIndex({ status: 1, deletedAt: 1 });
    logger.log('✅ Marketing indexes created');

    // Soft-delete queries optimization
    await Salon.collection.createIndex({ deletedAt: 1 });
    await TattooProject.collection.createIndex({ deletedAt: 1 });
    await WorkflowProject.collection.createIndex({ deletedAt: 1 });
    logger.log('✅ Soft-delete optimization indexes created');

    logger.log('\n✅ All indexes created successfully!\n');
  } catch (error) {
    logger.error('❌ Index creation error:', error.message);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await createIndexes();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  logger.error('❌ Fatal error:', error.message);
  process.exit(1);
});
