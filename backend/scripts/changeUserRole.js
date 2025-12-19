import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// ==================== CHANGE USER ROLE SCRIPT ====================
// Usage: node changeUserRole.js <email> <newRole>
// Example: node changeUserRole.js business@test.de salon_owner

const changeUserRole = async () => {
  const email = process.argv[2];
  const newRole = process.argv[3];

  if (!email || !newRole) {
    console.log('❌ Usage: node changeUserRole.js <email> <newRole>');
    console.log('   Roles: customer, salon_owner, employee, admin, ceo');
    process.exit(1);
  }

  const validRoles = ['customer', 'salon_owner', 'employee', 'admin', 'ceo'];
  if (!validRoles.includes(newRole)) {
    console.log(`❌ Invalid role: ${newRole}`);
    console.log(`   Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log('\n📋 Current user info:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);

    if (user.role === newRole) {
      console.log(`\n⚠️  User already has role: ${newRole}`);
      process.exit(0);
    }

    // Update role
    await User.updateOne(
      { _id: user._id },
      { $set: { role: newRole } }
    );

    const updatedUser = await User.findById(user._id);
    console.log('\\n✅ Role changed successfully!');
    console.log(`   Old Role: ${user.role}`);
    console.log(`   New Role: ${updatedUser.role}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

changeUserRole();
