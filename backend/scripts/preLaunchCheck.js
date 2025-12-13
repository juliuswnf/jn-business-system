/* eslint-disable no-console */
/**
 * Pre-Launch Checklist Script
 * Validates the entire system is ready for production
 * Usage: node scripts/preLaunchCheck.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// ANSI colors
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const results = [];

function addResult(category, check, status, message = '') {
  results.push({ category, check, status, message });
  const icon = status === 'pass' ? `${c.green}✓` : status === 'warn' ? `${c.yellow}⚠` : `${c.red}✗`;
  console.log(`  ${icon}${c.reset} ${check}${message ? c.dim + ' - ' + message + c.reset : ''}`);
}

async function checkMongoDB() {
  console.log(`\n${c.cyan}═══ Database ═══${c.reset}`);

  if (!process.env.MONGODB_URI) {
    addResult('Database', 'MongoDB URI', 'fail', 'MONGODB_URI not set');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    addResult('Database', 'MongoDB Connection', 'pass', 'Connected successfully');

    // Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const requiredCollections = ['users', 'salons', 'services', 'bookings'];
    for (const col of requiredCollections) {
      if (collectionNames.includes(col)) {
        addResult('Database', `Collection: ${col}`, 'pass');
      } else {
        addResult('Database', `Collection: ${col}`, 'warn', 'Not found (will be created on first use)');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    addResult('Database', 'MongoDB Connection', 'fail', error.message);
  }
  }

function checkEnvironment() {
  console.log(`\n${c.cyan}═══ Environment ═══${c.reset}`);

  const env = process.env.NODE_ENV || 'development';
  addResult('Environment', 'NODE_ENV', 'pass', env);

  // JWT secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
    addResult('Environment', 'JWT_SECRET', 'pass', 'Set and secure');
  } else if (process.env.JWT_SECRET) {
    addResult('Environment', 'JWT_SECRET', 'warn', 'Too short (min 32 chars)');
  } else {
    addResult('Environment', 'JWT_SECRET', 'fail', 'Not set');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length >= 32) {
    addResult('Environment', 'JWT_REFRESH_SECRET', 'pass', 'Set and secure');
  } else {
    addResult('Environment', 'JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET ? 'warn' : 'fail');
  }

  // CORS
  if (process.env.CORS_ORIGIN) {
    addResult('Environment', 'CORS_ORIGIN', 'pass', process.env.CORS_ORIGIN.substring(0, 50));
  } else {
    addResult('Environment', 'CORS_ORIGIN', 'warn', 'Not set - using defaults');
  }
  }

function checkSecurity() {
  console.log(`\n${c.cyan}═══ Security ═══${c.reset}`);

  const isProduction = process.env.NODE_ENV === 'production';

  // Check for default/weak secrets in production
  if (isProduction) {
    const weakSecrets = ['secret', 'password', '12345', 'test', 'dev'];
    const jwtSecret = (process.env.JWT_SECRET || '').toLowerCase();

    if (weakSecrets.some(weak => jwtSecret.includes(weak))) {
      addResult('Security', 'JWT Secret Strength', 'fail', 'Contains weak patterns');
    } else {
      addResult('Security', 'JWT Secret Strength', 'pass');
    }
  } else {
    addResult('Security', 'JWT Secret Strength', 'warn', 'Skipped (not production)');
  }

  // Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
      addResult('Security', 'Stripe API Key', 'pass', 'Live key configured');
    } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      addResult('Security', 'Stripe API Key', isProduction ? 'warn' : 'pass', 'Test key');
    }
  } else {
    addResult('Security', 'Stripe API Key', 'warn', 'Not configured');
  }

  // Webhook secret
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    addResult('Security', 'Stripe Webhook Secret', 'pass');
  } else {
    addResult('Security', 'Stripe Webhook Secret', 'warn', 'Not configured');
  }
  }

function checkEmail() {
  console.log(`\n${c.cyan}═══ Email Service ═══${c.reset}`);

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    addResult('Email', 'SMTP Configuration', 'pass', process.env.EMAIL_HOST);
  } else if (process.env.EMAIL_HOST) {
    addResult('Email', 'SMTP Configuration', 'warn', 'Partial configuration');
  } else {
    addResult('Email', 'SMTP Configuration', 'warn', 'Not configured - emails disabled');
  }
  }

function checkMonitoring() {
  console.log(`\n${c.cyan}═══ Monitoring ═══${c.reset}`);

  if (process.env.SENTRY_DSN) {
    addResult('Monitoring', 'Sentry DSN', 'pass', 'Error tracking enabled');
  } else {
    addResult('Monitoring', 'Sentry DSN', 'warn', 'Not configured');
  }

  if (process.env.LOG_LEVEL) {
    addResult('Monitoring', 'Log Level', 'pass', process.env.LOG_LEVEL);
  } else {
    addResult('Monitoring', 'Log Level', 'pass', 'Default (info)');
  }
  }

async function runChecks() {
  console.log('\n' + '═'.repeat(50));
  console.log('  JN AUTOMATION - Pre-Launch Checklist');
  console.log('═'.repeat(50));

  checkEnvironment();
  await checkMongoDB();
  checkSecurity();
  checkEmail();
  checkMonitoring();

  // Summary
  console.log(`\n${c.cyan}═══ Summary ═══${c.reset}`);

  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;

  console.log(`  ${c.green}Passed:${c.reset}   ${passed}`);
  console.log(`  ${c.yellow}Warnings:${c.reset} ${warnings}`);
  console.log(`  ${c.red}Failed:${c.reset}   ${failed}`);
  console.log('');

  if (failed > 0) {
    console.log(`${c.red}❌ NOT READY FOR LAUNCH${c.reset}`);
    console.log('   Fix the failed checks before deploying.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${c.yellow}⚠️  READY WITH WARNINGS${c.reset}`);
    console.log('   Review warnings before going live.\n');
    process.exit(0);
  } else {
    console.log(`${c.green}✅ READY FOR LAUNCH!${c.reset}\n`);
    process.exit(0);
  }
}

runChecks().catch(error => {
  console.error('Check failed:', error);
  process.exit(1);
});

