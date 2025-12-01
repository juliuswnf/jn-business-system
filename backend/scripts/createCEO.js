import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const createCEO = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');

    const existingCEO = await User.findOne({ role: 'ceo' });
    if (existingCEO) {
      console.log(`✅ CEO already exists: ${existingCEO.email}`);
      await User.deleteOne({ role: 'ceo' });
      console.log('🗑️  Old CEO deleted');
    }

    const ceo = await User.create({
      name: 'Julius CEO',
      email: 'julius@jn-automation.de',
      password: 'CEO@12345',
      role: 'ceo',
      isActive: true,
      emailVerified: true
    });

    console.log('✅ CEO created successfully:');
    console.log(`   Email: ${ceo.email}`);
    console.log(`   Name: ${ceo.name}`);
    console.log(`   Role: ${ceo.role}`);
    console.log(`   Password: CEO@12345`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createCEO();
