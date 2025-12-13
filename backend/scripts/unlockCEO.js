/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const unlockAndResetCEO = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Database connected');

    // Find and unlock CEO
    const ceo = await User.findOne({ email: 'julius@jn-automation.de' });

    if (!ceo) {
      console.log('❌ CEO not found');
      process.exit(1);
    }

    console.log('✅ CEO found');
    console.log('   Current loginAttempts:', ceo.loginAttempts);
    console.log('   Current lockUntil:', ceo.lockUntil);

    // Reset password and unlock
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('CEO@12345', salt);

    ceo.password = hashedPassword;
    ceo.loginAttempts = 0;
    ceo.lockUntil = undefined;
    ceo.isActive = true;

    await ceo.save();

    console.log('\n? CEO account unlocked and password reset!');
    console.log('   Email: julius@jn-automation.de');
    console.log('   Password: (check script for default)');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

unlockAndResetCEO();
