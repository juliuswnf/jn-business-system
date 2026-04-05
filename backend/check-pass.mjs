import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGODB_URI);
const User = (await import('./models/User.js')).default;

// Test CEO password
const ceo = await User.findOne({ email: 'julius@jn-automation.de' }).select('+password');
if (ceo) {
  const m = await ceo.comparePassword('CEO@12345');
  console.log('CEO CEO@12345:', m);
}

// Test customer password
const cust = await User.findOne({ email: 'customer@demo.jn-business-system.de' }).select('+password');
if (cust) {
  for (const pw of ['Demo@12345', 'TestCustomer123!', 'Customer@12345', 'demo123', 'password']) {
    const m = await cust.comparePassword(pw);
    if (m) console.log('Customer password is:', pw);
  }
}

await mongoose.disconnect();
