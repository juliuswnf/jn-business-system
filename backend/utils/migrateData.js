import dotenv from 'dotenv';
import mongoose from 'mongoose';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('\n✅ Database connected\n');
  } catch (error) {
    console.error('\n❌ Database connection error:', error.message, '\n');
    process.exit(1);
  }
};

export const addMissingFields = async () => {
  try {
    console.log('🔧 Adding missing fields to users...\n');

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

    console.log(`✅ Updated ${result.modifiedCount} users\n`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error adding missing fields:', error.message, '\n');
    throw error;
  }
};

export const updateBookingStatus = async () => {
  try {
    console.log('📅 Updating booking statuses...\n');

    const cancelResult = await Booking.updateMany(
      {
        appointmentDate: { $lt: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      },
      { $set: { status: 'completed' } }
    );

    console.log(`✅ Updated ${cancelResult.modifiedCount} bookings to completed\n`);
    return cancelResult.modifiedCount;
  } catch (error) {
    console.error('❌ Error updating booking status:', error.message, '\n');
    throw error;
  }
};

export const consolidateCustomerData = async () => {
  try {
    console.log('👥 Consolidating customer data...\n');

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

    console.log(`✅ Merged ${mergedCount} duplicate customers\n`);
    return mergedCount;
  } catch (error) {
    console.error('❌ Error consolidating customer data:', error.message, '\n');
    throw error;
  }
};

export const fixPaymentData = async () => {
  try {
    console.log('💳 Fixing payment data...\n');

    const currencyResult = await Payment.updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'EUR' } }
    );

    console.log(`✅ Added currency to ${currencyResult.modifiedCount} payments`);

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

    console.log(`✅ Added transaction IDs to ${txnResult.modifiedCount} payments\n`);
    return currencyResult.modifiedCount + txnResult.modifiedCount;
  } catch (error) {
    console.error('❌ Error fixing payment data:', error.message, '\n');
    throw error;
  }
};

export const updateReviewRatings = async () => {
  try {
    console.log('⭐ Updating review ratings...\n');

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

    console.log(`✅ Fixed ratings for ${result.modifiedCount} reviews\n`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error updating review ratings:', error.message, '\n');
    throw error;
  }
};

export const addMissingTimestamps = async () => {
  try {
    console.log('⏰ Adding missing timestamps...\n');

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

      console.log(`✅ ${collection.name}: ${result.modifiedCount} documents updated`);
      totalUpdated += result.modifiedCount;
    }

    console.log(`\n✅ Total ${totalUpdated} documents updated\n`);
    return totalUpdated;
  } catch (error) {
    console.error('❌ Error adding timestamps:', error.message, '\n');
    throw error;
  }
};

export const removeObsoleteFields = async () => {
  try {
    console.log('🗑️  Removing obsolete fields...\n');

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

    console.log(`✅ Removed obsolete fields from ${result.modifiedCount} users\n`);
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error removing obsolete fields:', error.message, '\n');
    throw error;
  }
};

export const getMigrationStatus = async () => {
  try {
    console.log('\n📊 Migration Status Check:\n');

    const checks = {
      usersWithPhoneVerified: await User.countDocuments({ phoneVerified: { $exists: true } }),
      bookingsWithStatus: await Booking.countDocuments({ status: { $exists: true } }),
      paymentsWithCurrency: await Payment.countDocuments({ currency: { $exists: true } }),
      paymentsWithTransactionId: await Payment.countDocuments({ transactionId: { $exists: true } }),
      reviewsWithRating: await Review.countDocuments({ rating: { $exists: true } }),
      documentsWithTimestamps: await Customer.countDocuments({ createdAt: { $exists: true } })
    };

    console.log(`   Users with phoneVerified: ${checks.usersWithPhoneVerified}`);
    console.log(`   Bookings with status: ${checks.bookingsWithStatus}`);
    console.log(`   Payments with currency: ${checks.paymentsWithCurrency}`);
    console.log(`   Payments with transactionId: ${checks.paymentsWithTransactionId}`);
    console.log(`   Reviews with rating: ${checks.reviewsWithRating}`);
    console.log(`   Documents with timestamps: ${checks.documentsWithTimestamps}\n`);

    return checks;
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message, '\n');
    throw error;
  }
};

const interactiveMode = async () => {
  try {
    console.log('================================');
    console.log('  🔄 DATABASE MIGRATION TOOL');
    console.log('================================\n');

    console.log('Available migrations:');
    console.log('1. Add missing fields to users');
    console.log('2. Update booking statuses');
    console.log('3. Consolidate customer data');
    console.log('4. Fix payment data');
    console.log('5. Update review ratings');
    console.log('6. Add missing timestamps');
    console.log('7. Remove obsolete fields');
    console.log('8. Run all migrations');
    console.log('9. Check migration status\n');

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

        console.log('================================');
        console.log('  ✅ All migrations completed!');
        console.log('================================\n');
      } else {
        console.log('\n❌ Operation cancelled\n');
      }
    } else if (option === '9') {
      await getMigrationStatus();
    } else {
      console.log('\n❌ Invalid option\n');
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message, '\n');
    rl.close();
    process.exit(1);
  }
};

const main = async () => {
  try {
    await connectDB();
    await interactiveMode();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message, '\n');
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
