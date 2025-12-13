/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Database connected');

    // Hash password function
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    // ==================== 1. CEO USER ====================
    let ceo = await User.findOne({ role: 'ceo' });
    if (ceo) {
      console.log(`✅ CEO already exists: ${ceo.email}`);
    } else {
      ceo = await User.create({
        name: 'Julius CEO',
        email: 'julius@jn-automation.de',
        password: await hashPassword('CEO@12345'),
        role: 'ceo',
        isActive: true,
        emailVerified: true
      });
      console.log('✅ CEO created');
    }

    // ==================== 2. BUSINESS USER (Admin) ====================
    let business = await User.findOne({ email: 'business@test.de' });
    if (business) {
      console.log(`✅ Business user already exists: ${business.email}`);
    } else {
      business = await User.create({
        name: 'Test Business',
        email: 'business@test.de',
        password: await hashPassword('Business@123'),
        role: 'admin',
        companyName: 'Test Salon',
        subscription: {
          plan: 'pro',
          status: 'active'
        },
        isActive: true,
        emailVerified: true
      });
      console.log('✅ Business user created');
    }

    // ==================== 3. CUSTOMER USER ====================
    let customer = await User.findOne({ email: 'kunde@test.de' });
    if (customer) {
      console.log(`✅ Customer already exists: ${customer.email}`);
    } else {
      customer = await User.create({
        name: 'Test Kunde',
        firstName: 'Test',
        lastName: 'Kunde',
        email: 'kunde@test.de',
        password: await hashPassword('Kunde@123'),
        role: 'customer',
        phone: '+49123456789',
        isActive: true,
        emailVerified: true
      });
      console.log('✅ Customer created');
    }

    console.log('\n========================================');
    console.log('       TEST LOGIN CREDENTIALS');
    console.log('========================================\n');

    console.log('?? CEO LOGIN (Ctrl+Shift+C oder /system/admin):');
    console.log('   Email:    julius@jn-automation.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('?? BUSINESS LOGIN (/login/business):');
    console.log('   Email:    business@test.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('?? CUSTOMER LOGIN (/login/customer):');
    console.log('   Email:    kunde@test.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUsers();
