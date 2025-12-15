import dotenv from 'dotenv';
import mongoose from 'mongoose';
import readline from 'readline';

import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import logger from './logger.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.log('\n✅ Database connected\n');
  } catch (error) {
    logger.error('\n❌ Database connection error:', error.message, '\n');
    process.exit(1);
  }
};

export const addMissingFields = async () => {
  try {
    logger.log('🔧 Adding missing fields to users...\n');

    const result = await User.updateMany(
      { phoneVerified: { $exists: false } },
      {
        $set: {
          phoneVerified: false,
          twoFactorEnabled: false,
          lastLogin: null,
          loginAttempts: 0
        }
      }
    );

    logger.log(`✅ Updated ${result.modifiedCount} users\n`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('❌ Error adding missing fields:', error.message, '\n');
    throw error;
  }
};

export const updateBookingStatus = async () => {
  try {
    logger.log('📅 Updating booking statuses...\n');

    const cancelResult = await Booking.updateMany(
      {
        appointmentDate: { $lt: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      },
      { $set: { status: 'completed' } }
    );

    logger.log(`✅ Updated ${cancelResult.modifiedCount} bookings to completed\n`);
    return cancelResult.modifiedCount;
  } catch (error) {
    logger.error('❌ Error updating booking status:', error.message, '\n');
    throw error;
  }
};

export const consolidateCustomerData = async () => {
  try {
    logger.log('👥 Consolidating customer data...\n');

    const customers = await Customer.find({});
    let mergedCount = 0;

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];

      const duplicates = await Customer.find({
        email: customer.email,
        _id: { $ne: customer._id }
      });

      if (duplicates.length > 0) {
        for (const duplicate of duplicates) {
          await Booking.updateMany(
            { customerId: duplicate._id },
            { $set: { customerId: customer._id } }
          );

          await Customer.deleteOne({ _id: duplicate._id });
          mergedCount++;
        }
      }
    }

    logger.log(`✅ Merged ${mergedCount} duplicate customers\n`);
    return mergedCount;
  } catch (error) {
    logger.error('❌ Error consolidating customer data:', error.message, '\n');
    throw error;
  }
};

export const fixPaymentData = async () => {
  try {
    logger.log('💳 Fixing payment data...\n');

    const currencyResult = await Payment.updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'EUR' } }
    );

    logger.log(`✅ Added currency to ${currencyResult.modifiedCount} payments`);

    const txnResult = await Payment.updateMany(
      { transactionId: { $exists: false } },
      [
        {
          $set: {
            transactionId: {
              $concat: ['TXN-', { $toString: '$_id' }]
            }
          }
        }
      ]
    );

    logger.log(`✅ Added transaction IDs to ${txnResult.modifiedCount} payments\n`);
    return currencyResult.modifiedCount + txnResult.modifiedCount;
  } catch (error) {
    logger.error('❌ Error fixing payment data:', error.message, '\n');
    throw error;
  }
};

export const updateReviewRatings = async () => {
  try {
    logger.log('⭐ Updating review ratings...\n');

    const result = await Review.updateMany(
      { $or: [{ rating: { $lt: 1 } }, { rating: { $gt: 5 } }] },
      [
        {
          $set: {
            rating: {
              $cond: [{ $lt: ['$rating', 1] }, 1, { $cond: [{ $gt: ['$rating', 5] }, 5, '$rating'] }]
            }
          }
        }
      ]
    );

    logger.log(`✅ Fixed ratings for ${result.modifiedCount} reviews\n`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('❌ Error updating review ratings:', error.message, '\n');
    throw error;
  }
};

export const addMissingTimestamps = async () => {
  try {
    logger.log('⏰ Adding missing timestamps...\n');

    const collections = [
      { model: Customer, name: 'Customers' },
      { model: Booking, name: 'Bookings' },
      { model: Payment, name: 'Payments' },
      { model: Review, name: 'Reviews' }
    ];

    let totalUpdated = 0;

    for (const collection of collections) {
      const result = await collection.model.updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: new Date(), updatedAt: new Date() } }
      );

      logger.log(`✅ ${collection.name}: ${result.modifiedCount} documents updated`);
      totalUpdated += result.modifiedCount;
    }

    logger.log(`\n✅ Total ${totalUpdated} documents updated\n`);
    return totalUpdated;
  } catch (error) {
    logger.error('❌ Error adding timestamps:', error.message, '\n');
    throw error;
  }
};

export const removeObsoleteFields = async () => {
  try {
    logger.log('🗑️  Removing obsolete fields...\n');

    const result = await User.updateMany(
      {},
      {
        $unset: {
          oldField: 1,
          deprecatedField: 1,
          tempData: 1
        }
      }
    );

    logger.log(`✅ Removed obsolete fields from ${result.modifiedCount} users\n`);
    return result.modifiedCount;
  } catch (error) {
    logger.error('❌ Error removing obsolete fields:', error.message, '\n');
    throw error;
  }
};

export const getMigrationStatus = async () => {
  try {
    logger.log('\n📊 Migration Status Check:\n');

    const checks = {
      usersWithPhoneVerified: await User.countDocuments({ phoneVerified: { $exists: true } }),
      bookingsWithStatus: await Booking.countDocuments({ status: { $exists: true } }),
      paymentsWithCurrency: await Payment.countDocuments({ currency: { $exists: true } }),
      paymentsWithTransactionId: await Payment.countDocuments({ transactionId: { $exists: true } }),
      reviewsWithRating: await Review.countDocuments({ rating: { $exists: true } }),
      documentsWithTimestamps: await Customer.countDocuments({ createdAt: { $exists: true } })
    };

    logger.log(`   Users with phoneVerified: ${checks.usersWithPhoneVerified}`);
    logger.log(`   Bookings with status: ${checks.bookingsWithStatus}`);
    logger.log(`   Payments with currency: ${checks.paymentsWithCurrency}`);
    logger.log(`   Payments with transactionId: ${checks.paymentsWithTransactionId}`);
    logger.log(`   Reviews with rating: ${checks.reviewsWithRating}`);
    logger.log(`   Documents with timestamps: ${checks.documentsWithTimestamps}\n`);

    return checks;
  } catch (error) {
    logger.error('❌ Error checking migration status:', error.message, '\n');
    throw error;
  }
};

const interactiveMode = async () => {
  try {
    logger.log('================================');
    logger.log('  🔄 DATABASE MIGRATION TOOL');
    logger.log('================================\n');

    logger.log('Available migrations:');
    logger.log('1. Add missing fields to users');
    logger.log('2. Update booking statuses');
    logger.log('3. Consolidate customer data');
    logger.log('4. Fix payment data');
    logger.log('5. Update review ratings');
    logger.log('6. Add missing timestamps');
    logger.log('7. Remove obsolete fields');
    logger.log('8. Run all migrations');
    logger.log('9. Check migration status\n');

    const option = await question('Choose option (1-9): ');

    if (option === '1') {
      await addMissingFields();
    } else if (option === '2') {
      await updateBookingStatus();
    } else if (option === '3') {
      await consolidateCustomerData();
    } else if (option === '4') {
      await fixPaymentData();
    } else if (option === '5') {
      await updateReviewRatings();
    } else if (option === '6') {
      await addMissingTimestamps();
    } else if (option === '7') {
      await removeObsoleteFields();
    } else if (option === '8') {
      const confirm = await question('\n⚠️  Run all migrations? (yes/no): ');
      if (confirm.toLowerCase() === 'yes') {
        await addMissingFields();
        await updateBookingStatus();
        await consolidateCustomerData();
        await fixPaymentData();
        await updateReviewRatings();
        await addMissingTimestamps();
        await removeObsoleteFields();

        logger.log('================================');
        logger.log('  ✅ All migrations completed!');
        logger.log('================================\n');
      } else {
        logger.log('\n❌ Operation cancelled\n');
      }
    } else if (option === '9') {
      await getMigrationStatus();
    } else {
      logger.log('\n❌ Invalid option\n');
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message, '\n');
    rl.close();
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await interactiveMode();
  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message, '\n');
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default {
  addMissingFields,
  updateBookingStatus,
  consolidateCustomerData,
  fixPaymentData,
  updateReviewRatings,
  addMissingTimestamps,
  removeObsoleteFields,
  getMigrationStatus
};
