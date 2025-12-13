/**
 * Verify Database Backup Integrity
 *
 * Run after restoring from backup to verify:
 * - Record counts match expectations
 * - All references are valid
 * - No duplicate data
 * - Data integrity constraints are met
 *
 * Usage:
 *   node backend/scripts/verify-backup.js
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Salon } from '../models/Salon.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import logger from '../utils/logger.js';

config();

let hasErrors = false;

function logSuccess(message) {
  console.log(`? ${message}`);
}

function logError(message) {
  console.error(`? ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  logger.warn(`? ${message}`);
}

async function verifyBackup() {
  try {
    console.log('');
    console.log('+----------------------------------------------------------+');
    console.log('¦       Database Backup Integrity Verification            ¦');
    console.log('+----------------------------------------------------------+');
    console.log('');

    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    logSuccess('Connected to database');
    console.log('');

    // 1. Verify Record Counts
    console.log('?? Verifying record counts...');
    const salonCount = await Salon.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const userCount = await User.countDocuments();

    logSuccess(`Salons: ${salonCount}`);
    logSuccess(`Bookings: ${bookingCount}`);
    logSuccess(`Users: ${userCount}`);
    console.log('');

    if (salonCount === 0) {
      logError('No salons found! Database may be empty.');
    }
    if (userCount === 0) {
      logError('No users found! Database may be empty.');
    }

    // 2. Verify Salon References in Bookings
    console.log('?? Verifying salon references...');
    const salonIds = await Salon.find().distinct('_id');
    const bookingsWithInvalidSalon = await Booking.countDocuments({
      salon: { $nin: salonIds, $ne: null }
    });

    if (bookingsWithInvalidSalon > 0) {
      logError(`Found ${bookingsWithInvalidSalon} bookings with invalid salon references`);
    } else {
      logSuccess('All booking salon references are valid');
    }

    // 3. Verify User References in Bookings
    console.log('?? Verifying user references...');
    const userIds = await User.find().distinct('_id');
    const bookingsWithInvalidCustomer = await Booking.countDocuments({
      customer: { $nin: userIds, $ne: null }
    });

    if (bookingsWithInvalidCustomer > 0) {
      logWarning(`Found ${bookingsWithInvalidCustomer} bookings with missing customer references (may be anonymous)`);
    } else {
      logSuccess('All booking customer references are valid');
    }

    // 4. Check for Duplicate Idempotency Keys
    console.log('');
    console.log('?? Checking for duplicate idempotency keys...');
    const duplicateKeys = await Booking.aggregate([
      {
        $match: {
          idempotencyKey: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$idempotencyKey',
          count: { $sum: 1 },
          bookings: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateKeys.length > 0) {
      logError(`Found ${duplicateKeys.length} duplicate idempotency keys:`);
      duplicateKeys.forEach(dup => {
        console.error(`  - Key: ${dup._id} (${dup.count} bookings)`);
      });
    } else {
      logSuccess('No duplicate idempotency keys found');
    }

    // 5. Verify Required Fields
    console.log('');
    console.log('?? Verifying required fields...');

    const salonsWithoutName = await Salon.countDocuments({ name: { $in: [null, ''] } });
    const salonsWithoutSlug = await Salon.countDocuments({ slug: { $in: [null, ''] } });
    const bookingsWithoutDate = await Booking.countDocuments({ date: { $in: [null, ''] } });
    const bookingsWithoutTime = await Booking.countDocuments({ time: { $in: [null, ''] } });

    if (salonsWithoutName > 0) logError(`${salonsWithoutName} salons missing name`);
    if (salonsWithoutSlug > 0) logError(`${salonsWithoutSlug} salons missing slug`);
    if (bookingsWithoutDate > 0) logError(`${bookingsWithoutDate} bookings missing date`);
    if (bookingsWithoutTime > 0) logError(`${bookingsWithoutTime} bookings missing time`);

    if (salonsWithoutName === 0 && salonsWithoutSlug === 0) {
      logSuccess('All salons have required fields');
    }
    if (bookingsWithoutDate === 0 && bookingsWithoutTime === 0) {
      logSuccess('All bookings have required fields');
    }

    // 6. Verify Date Formats
    console.log('');
    console.log('?? Verifying date formats...');

    const bookingsWithInvalidDate = await Booking.countDocuments({
      date: { $not: /^\d{4}-\d{2}-\d{2}$/ }
    });

    if (bookingsWithInvalidDate > 0) {
      logError(`${bookingsWithInvalidDate} bookings have invalid date format (expected YYYY-MM-DD)`);
    } else {
      logSuccess('All booking dates have correct format');
    }

    // 7. Check for Orphaned Data
    console.log('');
    console.log('??? Checking for orphaned data...');

    const salonsWithoutOwner = await Salon.countDocuments({
      owner: { $nin: userIds }
    });

    if (salonsWithoutOwner > 0) {
      logWarning(`${salonsWithoutOwner} salons have missing owner references`);
    } else {
      logSuccess('All salons have valid owners');
    }

    // 8. Summary Statistics
    console.log('');
    console.log('?? Summary Statistics:');

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('  Bookings by status:');
    bookingsByStatus.forEach(stat => {
      console.log(`    - ${stat._id}: ${stat.count}`);
    });

    const activeSalons = await Salon.countDocuments({ isActive: true });
    const inactiveSalons = await Salon.countDocuments({ isActive: false });
    console.log('  Salons:');
    console.log(`    - Active: ${activeSalons}`);
    console.log(`    - Inactive: ${inactiveSalons}`);

    // 9. Final Verdict
    console.log('');
    console.log('-----------------------------------------------------------');

    if (hasErrors) {
      console.log('');
      console.error('? BACKUP VERIFICATION FAILED');
      console.error('   Issues were found. Review the errors above.');
      console.log('');
      process.exit(1);
    } else {
      console.log('');
      console.log('? BACKUP VERIFICATION SUCCESSFUL');
      console.log('   All checks passed. Database integrity is confirmed.');
      console.log('');
      process.exit(0);
    }

  } catch (error) {
    console.error('');
    console.error('? Verification failed with error:');
    console.error(error);
    console.error('');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run verification
verifyBackup();
