import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'readline';

import User from '../models/User.js';
import BusinessSettings from '../models/BusinessSettings.js';
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

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const createCEO = async () => {
  try {
    logger.log('\n================================');
    logger.log('  🚀 CREATE CEO USER');
    logger.log('================================\n');

    const existingCEO = await User.findOne({ role: 'ceo' });
    if (existingCEO) {
      logger.log('⚠️  CEO already exists!');
      logger.log(`   Email: ${existingCEO.email}\n`);

      const override = await question('Do you want to create another CEO? (yes/no): ');
      if (override.toLowerCase() !== 'yes') {
        logger.log('\n❌ Operation cancelled\n');
        return null;
      }
    }

    logger.log('Please enter CEO details:\n');

    let name = '';
    while (!name) {
      name = await question('Full Name: ');
      if (!name) {logger.log('❌ Name is required');}
    }

    let email = '';
    let isValidEmail = false;
    while (!isValidEmail) {
      email = await question('Email Address: ');
      if (!validateEmail(email)) {
        logger.log('❌ Invalid email format');
        continue;
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        logger.log('❌ Email already exists');
        continue;
      }

      isValidEmail = true;
    }

    let password = '';
    let isValidPassword = false;
    while (!isValidPassword) {
      password = await question('Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special): ');
      if (!validatePassword(password)) {
        logger.log('❌ Password does not meet requirements');
        logger.log('   Requirements: min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character\n');
        continue;
      }

      const confirmPassword = await question('Confirm Password: ');
      if (password !== confirmPassword) {
        logger.log('❌ Passwords do not match\n');
        continue;
      }

      isValidPassword = true;
    }

    const hashedPassword = await hashPassword(password);

    const ceo = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'ceo',
      isActive: true,
      emailVerified: true,
      createdAt: new Date()
    });

    logger.log('\n✅ CEO user created successfully!\n');
    logger.log('📋 CEO Details:');
    logger.log(`   ID: ${ceo._id}`);
    logger.log(`   Name: ${ceo.name}`);
    logger.log(`   Email: ${ceo.email}`);
    logger.log(`   Role: ${ceo.role}\n`);

    return ceo;
  } catch (error) {
    logger.error('\n❌ Error creating CEO:', error.message, '\n');
    throw error;
  }
};

export const createBusinessSettings = async (ceo) => {
  try {
    logger.log('Creating initial business settings...\n');

    const existingSettings = await BusinessSettings.findOne({
      companyId: ceo._id
    });

    if (existingSettings) {
      logger.log('⚠️  Business settings already exist\n');
      return existingSettings;
    }

    let businessName = '';
    while (!businessName) {
      businessName = await question('Business Name: ');
      if (!businessName) {logger.log('❌ Business name is required');}
    }

    let businessEmail = '';
    while (!businessEmail) {
      businessEmail = await question('Business Email: ');
      if (!validateEmail(businessEmail)) {
        logger.log('❌ Invalid email format\n');
        continue;
      }
      break;
    }

    let businessPhone = '';
    while (!businessPhone) {
      businessPhone = await question('Business Phone (e.g., +49123456789): ');
      if (!businessPhone) {logger.log('❌ Phone is required');}
    }

    let businessCity = '';
    while (!businessCity) {
      businessCity = await question('Business City: ');
      if (!businessCity) {logger.log('❌ City is required');}
    }

    let businessZipCode = '';
    while (!businessZipCode) {
      businessZipCode = await question('Business Zip Code: ');
      if (!businessZipCode) {logger.log('❌ Zip code is required');}
    }

    const businessSettings = await BusinessSettings.create({
      companyId: ceo._id,
      businessName,
      businessEmail,
      businessPhone,
      businessAddress: {
        city: businessCity,
        zipCode: businessZipCode,
        country: 'DE'
      },
      timezone: 'Europe/Berlin',
      currency: 'EUR',
      language: 'de',
      businessHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '19:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        features: {
          maxEmployees: 10,
          maxCustomers: 1000,
          apiAccess: true,
          advancedReporting: true,
          customBranding: true,
          prioritySupport: true
        }
      }
    });

    logger.log('\n✅ Business settings created successfully!\n');
    return businessSettings;
  } catch (error) {
    logger.error('\n❌ Error creating business settings:', error.message, '\n');
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();

    const ceo = await createCEO();
    if (!ceo) {
      rl.close();
      process.exit(0);
    }

    const createSettings = await question('\nCreate business settings now? (yes/no): ');
    if (createSettings.toLowerCase() === 'yes') {
      await createBusinessSettings(ceo);
    }

    logger.log('================================');
    logger.log('  ✅ CEO setup completed!');
    logger.log('================================\n');

    logger.log('📧 Login with:');
    logger.log(`   Email: ${ceo.email}`);
    logger.log('   Password: (the password you just entered)\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    logger.error('\n❌ Fatal error:', error.message, '\n');
    rl.close();
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { createCEO, createBusinessSettings };
