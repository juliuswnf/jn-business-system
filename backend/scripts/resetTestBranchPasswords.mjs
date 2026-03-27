/* eslint-env node */
/* global console, process */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const emails = [
  'test-tattoo@jnbusiness.de',
  'test-medical@jnbusiness.de',
  'test-wellness@jnbusiness.de',
  'test-barbershop@jnbusiness.de',
  'test-beauty@jnbusiness.de',
  'test-nails@jnbusiness.de',
  'test-other@jnbusiness.de'
];

const password = 'TestPassword123!';

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI/MONGO_URI ist nicht gesetzt');
  }

  await mongoose.connect(mongoUri);

  const hash = await bcrypt.hash(password, 10);
  let updated = 0;

  for (const email of emails) {
    const result = await User.updateOne(
      { email },
      {
        $set: {
          password: hash,
          isActive: true,
          emailVerified: true,
          loginAttempts: 0,
          lockUntil: null
        }
      }
    );

    if ((result.modifiedCount || 0) > 0) {
      updated += 1;
    }

    console.log(`${email} => matched:${result.matchedCount} modified:${result.modifiedCount}`);
  }

  await mongoose.disconnect();
  console.log(`UPDATED=${updated}`);
}

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
