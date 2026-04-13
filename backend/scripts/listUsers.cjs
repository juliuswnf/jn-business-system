/* eslint-disable no-console */
// Run with: MONGODB_URI=<your-connection-string> node scripts/listUsers.cjs
const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}
const MONGODB_URI = process.env.MONGODB_URI;

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas (Production)\n');

    // Get User model
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Find all users
    const users = await User.find({}).select('email name role isActive emailVerified createdAt').lean();

    console.log('========================================');
    console.log('       ALLE BENUTZER IN DATENBANK');
    console.log('========================================\n');

    if (users.length === 0) {
      console.log('❌ KEINE BENUTZER GEFUNDEN!\n');
      console.log('Die Datenbank ist leer. Test-User müssen erstellt werden.');
    } else {
      // Group by role
      const ceos = users.filter(u => u.role === 'ceo');
      const admins = users.filter(u => u.role === 'admin' || u.role === 'salon_owner');
      const employees = users.filter(u => u.role === 'employee');
      const customers = users.filter(u => u.role === 'customer');

      console.log(`📊 Gesamt: ${users.length} Benutzer\n`);

      if (ceos.length > 0) {
        console.log('🔐 CEO ACCOUNTS:');
        ceos.forEach(u => console.log(`   - ${u.email} (${u.name || 'N/A'}) | Active: ${u.isActive} | Verified: ${u.emailVerified}`));
        console.log('');
      }

      if (admins.length > 0) {
        console.log('💼 BUSINESS/ADMIN ACCOUNTS:');
        admins.forEach(u => console.log(`   - ${u.email} (${u.name || 'N/A'}) | Role: ${u.role} | Active: ${u.isActive}`));
        console.log('');
      }

      if (employees.length > 0) {
        console.log('👔 EMPLOYEE ACCOUNTS:');
        employees.forEach(u => console.log(`   - ${u.email} (${u.name || 'N/A'}) | Active: ${u.isActive}`));
        console.log('');
      }

      if (customers.length > 0) {
        console.log('👤 CUSTOMER ACCOUNTS:');
        customers.forEach(u => console.log(`   - ${u.email} (${u.name || 'N/A'}) | Active: ${u.isActive}`));
        console.log('');
      }
    }

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

listUsers();
