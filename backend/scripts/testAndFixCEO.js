/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const testAndFixCEO = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('âœ… Connected to DB');

    // Get CEO with password field
    const ceo = await User.findOne({ email: 'julius@jn-automation.de' }).select('+password');

    if (!ceo) {
      console.log('âŒ CEO not found');
      process.exit(1);
    }

    console.log('\n📋 CEO Account Info:');
    console.log('   Email:', ceo.email);
    console.log('   Role:', ceo.role);
    console.log('   Has password:', !!ceo.password);
    console.log('   Password length:', ceo.password?.length);

    // Test current password
    const testPassword = 'CEO@12345';
    const isMatch = await bcrypt.compare(testPassword, ceo.password);
    console.log('\n🔐 Password Test:');
    console.log('   Testing: (default password)');
    console.log('   Match:', isMatch);

    if (!isMatch) {
      console.log('\nðŸ”§ Fixing password...');

      // Generate new hash
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);

      // Update directly in DB
      await User.updateOne(
        { email: 'julius@jn-automation.de' },
        { $set: { password: newHash } }
      );

      // Verify
      const updated = await User.findOne({ email: 'julius@jn-automation.de' }).select('+password');
      const verifyMatch = await bcrypt.compare(testPassword, updated.password);
      console.log('   New password set:', verifyMatch);
    }

    await mongoose.disconnect();
    console.log('\nâœ… Done!');
  } catch (error) {
    console.error('âŒ Error:', error);
    process.exit(1);
  }
};

testAndFixCEO();
