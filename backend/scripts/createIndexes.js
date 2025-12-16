import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Import all models
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import Payment from '../models/Payment.js';

dotenv.config();

/**
 * Database Indexes Creation Script
 * Run this after model changes or before production deployment
 * Command: npm run create:indexes
 */

const createIndexes = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Creating indexes...\n');

    // ==================== USER INDEXES ====================
    console.log('📝 User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ salon: 1, role: 1 });
    await User.collection.createIndex({ salon: 1, isActive: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ lastLogin: -1 });
    console.log('   ✅ User indexes created');

    // ==================== BOOKING INDEXES ====================
    console.log('📝 Booking indexes...');
    await Booking.collection.createIndex({ salon: 1, date: 1 });
    await Booking.collection.createIndex({ customer: 1, status: 1 });
    await Booking.collection.createIndex({ employee: 1, date: 1 });
    await Booking.collection.createIndex({ status: 1, date: 1 });
    await Booking.collection.createIndex({ salon: 1, status: 1, date: -1 });
    await Booking.collection.createIndex({ salon: 1, customer: 1, date: -1 });

    // NO-SHOW-KILLER specific
    await Booking.collection.createIndex({
      salon: 1,
      status: 1,
      date: 1,
      noShowKillerEnabled: 1
    });
    await Booking.collection.createIndex({
      date: 1,
      status: 1
    }, {
      partialFilterExpression: { status: 'pending' }
    });
    console.log('   ✅ Booking indexes created');

    // ==================== SALON INDEXES ====================
    console.log('📝 Salon indexes...');
    await Salon.collection.createIndex({ slug: 1 }, { unique: true });
    await Salon.collection.createIndex({ industry: 1 });
    await Salon.collection.createIndex({ 'address.city': 1 });
    await Salon.collection.createIndex({ isActive: 1, createdAt: -1 });
    await Salon.collection.createIndex({
      name: 'text',
      description: 'text'
    });
    console.log('   ✅ Salon indexes created');

    // ==================== SERVICE INDEXES ====================
    console.log('📝 Service indexes...');
    await Service.collection.createIndex({ salon: 1, isActive: 1 });
    await Service.collection.createIndex({ salon: 1, category: 1 });
    await Service.collection.createIndex({ salon: 1, price: 1 });
    console.log('   ✅ Service indexes created');

    // ==================== CUSTOMER INDEXES ====================
    console.log('📝 Customer indexes...');
    await Customer.collection.createIndex({ email: 1 });
    await Customer.collection.createIndex({ phone: 1 });
    await Customer.collection.createIndex({ salon: 1, email: 1 });
    await Customer.collection.createIndex({ salon: 1, createdAt: -1 });
    console.log('   ✅ Customer indexes created');

    // ==================== PAYMENT INDEXES ====================
    console.log('📝 Payment indexes...');
    await Payment.collection.createIndex({ salon: 1, createdAt: -1 });
    await Payment.collection.createIndex({ customer: 1, status: 1 });
    await Payment.collection.createIndex({ booking: 1 });
    // stripePaymentIntentId (skip if exists - may have sparse: true from previous version)
    try {
      await Payment.collection.createIndex({ stripePaymentIntentId: 1 });
    } catch (err) {
      if (err.code === 86) {
        console.log('   ⚠️  stripePaymentIntentId index already exists (skipped)');
      } else {
        throw err;
      }
    }
    await Payment.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('   ✅ Payment indexes created');

    // ==================== AUDIT LOG INDEXES ====================
    console.log('📝 AuditLog indexes...');
    await AuditLog.collection.createIndex({ createdAt: -1 });
    await AuditLog.collection.createIndex({ userId: 1, createdAt: -1 });
    await AuditLog.collection.createIndex({ action: 1, createdAt: -1 });
    await AuditLog.collection.createIndex({ category: 1, createdAt: -1 });
    await AuditLog.collection.createIndex({ resourceType: 1, resourceId: 1 });

    // TTL Index: Auto-delete audit logs after 90 days
    await AuditLog.collection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 7776000 } // 90 days
    );
    console.log('   ✅ AuditLog indexes created (with TTL: 90 days)');

    // ==================== COMPOUND INDEXES FOR ANALYTICS ====================
    console.log('📝 Analytics compound indexes...');
    await Booking.collection.createIndex({
      salon: 1,
      status: 1,
      date: -1,
      totalPrice: -1
    });
    await Booking.collection.createIndex({
      employee: 1,
      date: 1,
      status: 1
    });
    console.log('   ✅ Analytics indexes created');

    console.log('\n✅ All indexes created successfully!');
    console.log('📊 Index summary:');

    const collections = [
      'users',
      'bookings',
      'salons',
      'services',
      'customers',
      'payments',
      'auditlogs'
    ];

    for (const collectionName of collections) {
      const indexes = await mongoose.connection.db
        .collection(collectionName)
        .indexes();
      console.log(`   ${collectionName}: ${indexes.length} indexes`);
    }

    console.log('\n🎉 Database optimization complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    logger.error('Index creation failed:', error);
    process.exit(1);
  }
};

createIndexes();
