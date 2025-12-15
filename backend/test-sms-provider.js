#!/usr/bin/env node

/**
 * Test SMS Provider Configuration
 * Verifies Twilio credentials and provider setup
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from backend directory FIRST (before any imports that use process.env)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const result = dotenv.config({ path: join(__dirname, '.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  process.exit(1);
}

console.log('✅ .env file loaded from:', join(__dirname, '.env'));
console.log('');

// NOW import the factory (after env is loaded)
const SMSProviderFactory = (await import('./services/smsProviders/SMSProviderFactory.js')).default;

console.log('🔧 SMS Provider Configuration Test\n');
console.log('Environment Variables:');
console.log('  SMS_PROVIDER:', process.env.SMS_PROVIDER || 'NOT SET');
console.log('  TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ SET' : '❌ NOT SET');
console.log('  TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET' : '❌ NOT SET');
console.log('  TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || 'NOT SET');
console.log('  MESSAGEBIRD_API_KEY:', process.env.MESSAGEBIRD_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('');

try {
  const provider = SMSProviderFactory.getProvider();
  
  console.log('✅ Active SMS Provider:', provider.getName().toUpperCase());
  console.log('✅ Provider Available:', provider.isAvailable());
  console.log('');
  
  // Get all available providers
  const available = SMSProviderFactory.getAvailableProviders();
  console.log('Available Providers:', available.map(p => p.getName()).join(', '));
  console.log('');
  
  console.log('🎉 SMS Provider configuration is valid!\n');
  console.log('Next steps:');
  console.log('  1. Start backend: npm start');
  console.log('  2. Test SMS sending via API');
  console.log('  3. Configure Twilio webhook URL\n');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('  1. Check .env file exists in backend/');
  console.log('  2. Verify Twilio credentials are set');
  console.log('  3. Restart terminal to reload environment variables\n');
  
  process.exit(1);
}
