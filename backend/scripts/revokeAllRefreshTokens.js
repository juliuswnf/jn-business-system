/**
 * Security Script: Revoke all refresh tokens
 *
 * Run when refresh tokens may have been leaked
 * (e.g. after accidental git commit of backup data).
 *
 * Usage:
 *   cd backend && node scripts/revokeAllRefreshTokens.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import RefreshToken from '../models/RefreshToken.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI ist nicht gesetzt. Bitte .env prüfen.');
    process.exit(1);
  }

  console.log('🔌 Verbinde mit Datenbank...');
  await mongoose.connect(uri);
  console.log('✅ Verbunden.\n');

  const total = await RefreshToken.countDocuments({});
  const active = await RefreshToken.countDocuments({ isRevoked: false });

  console.log(`📊 Tokens gesamt:  ${total}`);
  console.log(`🔓 Davon aktiv:    ${active}`);

  if (active === 0) {
    console.log('\nℹ️  Keine aktiven Tokens — nichts zu tun.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await RefreshToken.updateMany(
    { isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

  console.log(`\n✅ ${result.modifiedCount} Tokens widerrufen.`);
  console.log('   Alle Nutzer müssen sich neu einloggen.\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
