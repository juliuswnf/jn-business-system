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

async function promptRequired(label) {
  let value = '';
  while (!value) {
    value = await question(`${label}: `);
    if (!value) { logger.log(`❌ ${label} is required`); }
  }
  return value;
}

async function promptEmail(label) {
  while (true) {
    const email = await question(`${label}: `);
    if (!validateEmail(email)) { logger.log('❌ Invalid email format'); continue; }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) { logger.log('❌ Email already exists'); continue; }
    return email;
  }
}

async function promptPassword() {
  while (true) {
    const password = await question('Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special): ');
    if (!validatePassword(password)) {
      logger.log('❌ Password does not meet requirements');
      logger.log('   Requirements: min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character\n');
      continue;
    }
    const confirmPassword = await question('Confirm Password: ');
    if (password.length !== confirmPassword.length ||
        !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(confirmPassword))) {
      logger.log('❌ Passwords do not match\n');
      continue;
    }
    return password;
  }
}

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

    const name = await promptRequired('Full Name');
    const email = await promptEmail('Email Address');
    const password = await promptPassword();

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

    const businessName = await promptRequired('Business Name');

    let businessEmail = '';
    while (!businessEmail) {
      businessEmail = await question('Business Email: ');
      if (!validateEmail(businessEmail)) { logger.log('❌ Invalid email format\n'); businessEmail = ''; }
    }

    const businessPhone = await promptRequired('Business Phone (e.g., +49123456789)');
    const businessCity = await promptRequired('Business City');
    const businessZipCode = await promptRequired('Business Zip Code');

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
