/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const resetCEOPassword = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Database connected');

    // Find CEO
    const ceo = await User.findOne({ email: 'julius@jn-automation.de' });

    if (!ceo) {
      console.log('❌ CEO not found, creating new one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('CEO@12345', salt);

      await User.create({
        name: 'Julius CEO',
        email: 'julius@jn-automation.de',
        password: hashedPassword,
        role: 'ceo',
        isActive: true,
        emailVerified: true
      });
      console.log('? CEO created with default password');
    } else {
      console.log('? CEO found, updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('CEO@12345', salt);

      ceo.password = hashedPassword;
      await ceo.save();
      console.log('? CEO password updated successfully');
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetCEOPassword();
