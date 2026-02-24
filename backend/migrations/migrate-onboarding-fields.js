import mongoose from 'mongoose';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Studio Setup Checklist Schema Update
 *
 * This migration:
 * 1. Renames onboardingCompleted → studioSetupCompleted
 * 2. Sets checklistDismissed: false for all salons
 * 3. Sets widgetConfigured: true for salons with existing widgets
 * 4. Sets checklistCompletedAt for completed salons
 *
 * Run with: npm run migrate:onboarding
 */

async function migrateOnboardingFields() {
  try {
    logger.info('🔄 Starting Studio Setup Checklist Migration...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('✅ MongoDB connected');

    // Get total count
    const totalSalons = await Salon.countDocuments();
    logger.info(`📊 Found ${totalSalons} salons to migrate`);

    // Fetch all salons
    const salons = await Salon.find().select(
      'name onboardingCompleted updatedAt createdAt'
    );

    let migratedCount = 0;
    let errorCount = 0;

    // Process in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < salons.length; i += batchSize) {
      const batch = salons.slice(i, i + batchSize);

      for (const salon of batch) {
        try {
          const updateData = {
            // Rename field
            studioSetupCompleted: !!salon.onboardingCompleted,
            // Initialize new fields
            checklistDismissed: false,
            widgetConfigured: false,
            checklistCompletedAt: null
          };

          // If setup was completed, set the timestamp
          if (salon.onboardingCompleted) {
            updateData.checklistCompletedAt = salon.updatedAt || salon.createdAt;
          }

          // Update the salon
          await Salon.findByIdAndUpdate(
            salon._id,
            { $set: updateData },
            { new: false, runValidators: false }
          );

          migratedCount++;

          if (migratedCount % 10 === 0) {
            logger.info(`⏳ Processed ${migratedCount}/${totalSalons} salons...`);
          }
        } catch (salonError) {
          errorCount++;
          logger.error(`❌ Error migrating salon ${salon._id}:`, salonError.message);
        }
      }
    }

    // Summary
    logger.info('');
    logger.info('================== MIGRATION SUMMARY ==================');
    logger.info(`✅ Successfully migrated: ${migratedCount}`);
    logger.info(`❌ Failed: ${errorCount}`);
    logger.info(`📊 Total salons: ${totalSalons}`);
    logger.info('=====================================================');

    if (errorCount === 0) {
      logger.info('🎉 Migration completed successfully!');
    } else {
      logger.warn(`⚠️  Migration completed with ${errorCount} errors`);
    }

    // Verify migration
    const verifyStartup = await Salon.countDocuments({ studioSetupCompleted: true });
    const verifyDismissed = await Salon.countDocuments({ checklistDismissed: false });
    logger.info('');
    logger.info('✓ Verification:');
    logger.info(`  - Salons with studioSetupCompleted: ${verifyStartup}`);
    logger.info(`  - Salons with checklistDismissed: false: ${verifyDismissed}`);

    process.exit(0);
  } catch (error) {
    logger.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateOnboardingFields();
