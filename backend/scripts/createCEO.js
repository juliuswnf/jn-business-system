import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import logger from '../utils/logger.js';

dotenv.config();

const createCEO = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.log('✅ Database connected');

    const existingCEO = await User.findOne({ role: 'ceo' });
    if (existingCEO) {
      logger.log(`✅ CEO already exists: ${existingCEO.email}`);
      await User.deleteOne({ role: 'ceo' });
      logger.log('🗑️  Old CEO deleted');
    }

    const ceo = await User.create({
      name: 'Julius CEO',
      email: 'julius@jn-automation.de',
      password: 'CEO@12345',
      role: 'ceo',
      isActive: true,
      emailVerified: true
    });

    logger.log('✅ CEO created successfully:');
    logger.log(`   Email: ${ceo.email}`);
    logger.log(`   Name: ${ceo.name}`);
    logger.log(`   Role: ${ceo.role}`);
    logger.log('   Password: CEO@12345');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createCEO();
