/* eslint-disable no-console */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Atlas Production URI
const MONGODB_URI = 'mongodb+srv://jn_automation_user:2007uf-21LC.JSG@jn-automation.9lulzru.mongodb.net/jn-automation?retryWrites=true&w=majority&appName=jn-automation';

async function resetPasswords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Production)\n');

    // Hash password function
    const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    };

    // Get User collection
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Reset CEO password
    const ceoPassword = await hashPassword('CEO@12345');
    const ceoResult = await User.updateOne(
      { email: 'julius@jn-automation.de' },
      { $set: { password: ceoPassword, isActive: true, emailVerified: true, loginAttempts: 0, lockUntil: null } }
    );
    console.log(`🔐 CEO password reset: ${ceoResult.modifiedCount > 0 ? 'SUCCESS' : 'no change needed'}`);

    // Reset Business password
    const businessPassword = await hashPassword('Business@123');
    const businessResult = await User.updateOne(
      { email: 'business@test.de' },
      { $set: { password: businessPassword, isActive: true, emailVerified: true, loginAttempts: 0, lockUntil: null } }
    );
    console.log(`💼 Business password reset: ${businessResult.modifiedCount > 0 ? 'SUCCESS' : 'no change needed'}`);

    // Reset Customer password
    const customerPassword = await hashPassword('Kunde@123');
    const customerResult = await User.updateOne(
      { email: 'kunde@test.de' },
      { $set: { password: customerPassword, isActive: true, emailVerified: true, loginAttempts: 0, lockUntil: null } }
    );
    console.log(`👤 Customer password reset: ${customerResult.modifiedCount > 0 ? 'SUCCESS' : 'no change needed'}`);

    console.log('\n========================================');
    console.log('       NEUE LOGIN-DATEN');
    console.log('========================================\n');

    console.log('🔐 CEO LOGIN:');
    console.log('   URL:      /_.admin oder Ctrl+Shift+C');
    console.log('   Email:    julius@jn-automation.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('💼 BUSINESS LOGIN:');
    console.log('   URL:      /login/business');
    console.log('   Email:    business@test.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('👤 CUSTOMER LOGIN:');
    console.log('   URL:      /login/customer');
    console.log('   Email:    kunde@test.de');
    console.log('   Passwort: (check script for default)\n');

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Done. Passwords reset successfully.');
  }
}

resetPasswords();
