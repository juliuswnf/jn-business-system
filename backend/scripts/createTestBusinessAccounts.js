/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Salon from '../models/Salon.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Business types mapping
const BUSINESS_TYPES = {
  salon: 'hair-salon',
  tattoo: 'tattoo-piercing',
  medical: 'medical-aesthetics',
  wellness: 'spa-wellness',
  barbershop: 'barbershop',
  beauty: 'beauty-salon',
  nails: 'nail-salon',
  petgrooming: 'other'
};

// Test account configuration
const TEST_ACCOUNTS = [
  {
    key: 'salon',
    label: 'SALON',
    email: 'test-salon@jnbusiness.de',
    name: 'Test Friseursalon'
  },
  {
    key: 'tattoo',
    label: 'TATTOO',
    email: 'test-tattoo@jnbusiness.de',
    name: 'Test Tattoostudio'
  },
  {
    key: 'medical',
    label: 'MEDICAL',
    email: 'test-medical@jnbusiness.de',
    name: 'Test Medizin Ästhetik'
  },
  {
    key: 'wellness',
    label: 'WELLNESS',
    email: 'test-wellness@jnbusiness.de',
    name: 'Test Wellness Spa'
  },
  {
    key: 'barbershop',
    label: 'BARBERSHOP',
    email: 'test-barbershop@jnbusiness.de',
    name: 'Test Barbershop'
  },
  {
    key: 'beauty',
    label: 'BEAUTY',
    email: 'test-beauty@jnbusiness.de',
    name: 'Test Beauty Salon'
  },
  {
    key: 'nails',
    label: 'NAILS',
    email: 'test-nails@jnbusiness.de',
    name: 'Test Nagelstudio'
  },
  {
    key: 'petgrooming',
    label: 'PET GROOMING',
    email: 'test-petgrooming@jnbusiness.de',
    name: 'Test Hundepflege'
  }
];

const TEST_PASSWORD = 'TestPassword123!';
const PHONE = '+49 123 456789';

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Helper function to generate unique salon slug
const generateSlug = (baseName) => {
  return baseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
};

// Main function
const createTestBusinessAccounts = async () => {
  const createdAccounts = [];
  let successCount = 0;
  let skippedCount = 0;

  try {
    // ==================== CONNECTION ====================
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      logger.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.info('Database connected successfully');
    logger.info('');

    // ==================== CREATE TEST ACCOUNTS ====================
    logger.info(`Creating ${TEST_ACCOUNTS.length} test business accounts...`);
    logger.info('========================================');
    logger.info('');

    for (const account of TEST_ACCOUNTS) {
      try {
        // Check if user already exists
        let existingUser = await User.findOne({ email: account.email });

        if (existingUser) {
          logger.warn(`✗ User with email ${account.email} already exists - skipping`);
          logger.info('');
          skippedCount++;
          createdAccounts.push({
            key: account.key,
            label: account.label,
            email: account.email,
            password: TEST_PASSWORD,
            status: 'skipped'
          });
          continue;
        }

        // Step 1: Hash password
        const hashedPassword = await hashPassword(TEST_PASSWORD);

        // Step 2: Create User FIRST (before Salon)
        const user = await User.create({
          email: account.email,
          password: hashedPassword,
          name: account.name,
          phone: PHONE,
          role: 'salon_owner',
          emailVerified: true,
          isActive: true
        });

        logger.info(`[1/3] Created User: ${account.email}`);

        // Step 3: Create Salon with owner and email reference
        const salonSlug = generateSlug(`test-${account.key}`);

        const salon = await Salon.create({
          name: account.name,
          slug: salonSlug,
          businessType: BUSINESS_TYPES[account.key],
          email: account.email,
          owner: user._id,
          phone: PHONE,
          isActive: true,
          subscription: {
            status: 'trial',
            tier: 'enterprise'
          }
        });

        logger.info(`[2/3] Created Salon: ${account.name} (${BUSINESS_TYPES[account.key]})`);

        // Step 4: Link Salon to User
        user.salonId = salon._id;
        await user.save();

        logger.info(`[3/3] Linked Salon to User`);
        logger.info('========================================');
        logger.info('');

        // Add to success list
        createdAccounts.push({
          key: account.key,
          label: account.label,
          email: account.email,
          password: TEST_PASSWORD,
          status: 'created'
        });

        successCount++;
      } catch (error) {
        logger.error(`Error creating account for ${account.key}:`);
        logger.error(`  Message: ${error.message}`);

        if (error.code === 11000) {
          logger.warn(`  Duplicate entry detected - skipping`);
          skippedCount++;
          createdAccounts.push({
            key: account.key,
            label: account.label,
            email: account.email,
            password: TEST_PASSWORD,
            status: 'skipped'
          });
        } else {
          // Log validation errors
          if (error.errors) {
            Object.keys(error.errors).forEach(field => {
              logger.error(`  ${field}: ${error.errors[field].message}`);
            });
          }
          logger.info('');
          throw error;
        }
        logger.info('');
      }
    }

    // ==================== DISPLAY RESULTS ====================
    logger.info('');
    logger.info('========================================');
    logger.info('TEST LOGIN CREDENTIALS');
    logger.info('========================================');
    logger.info('');

    const successfulAccounts = createdAccounts.filter(acc => acc.status === 'created');

    if (successfulAccounts.length > 0) {
      successfulAccounts.forEach((account, index) => {
        logger.info(`${index + 1}. ${account.label}`);
        logger.info(`   Email:    ${account.email}`);
        logger.info(`   Password: ${account.password}`);
        logger.info('');
      });
    } else {
      logger.info('No new accounts were created.');
      logger.info('');
    }

    // Display skipped accounts
    const skippedAccounts = createdAccounts.filter(acc => acc.status === 'skipped');
    if (skippedAccounts.length > 0) {
      logger.info('ALREADY EXISTING ACCOUNTS (SKIPPED)');
      logger.info('========================================');
      skippedAccounts.forEach((account, index) => {
        logger.info(`${index + 1}. ${account.label}: ${account.email}`);
      });
      logger.info('');
    }

    // ==================== SUMMARY ====================
    logger.info('========================================');
    logger.info('SUMMARY');
    logger.info('========================================');
    logger.info(`Total Test Accounts:    ${TEST_ACCOUNTS.length}`);
    logger.info(`Successfully Created:   ${successCount}`);
    logger.info(`Skipped (Already Exist): ${skippedCount}`);
    logger.info('========================================');
    logger.info('');

    // Success message
    if (successCount > 0) {
      logger.info(`SUCCESS: Created ${successCount} test business account(s)`);
    } else if (skippedCount === TEST_ACCOUNTS.length) {
      logger.info('INFO: All test accounts already exist in the database');
    }
    logger.info('');

    process.exit(0);
  } catch (error) {
    logger.error('');
    logger.error('========================================');
    logger.error('FATAL ERROR');
    logger.error('========================================');
    logger.error(error.message);
    if (error.stack) {
      logger.error('Stack trace:');
      logger.error(error.stack);
    }
    logger.error('========================================');
    logger.error('');
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
  }
};

// Run the script
createTestBusinessAccounts();
