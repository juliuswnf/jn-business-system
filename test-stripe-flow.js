#!/usr/bin/env node

/**
 * Stripe Subscription Flow - Quick Test Script
 * 
 * Tests Stripe Price IDs configuration
 * Run with: node test-stripe-flow.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'backend', '.env') });

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}\n`),
};

// Test Price IDs Configuration
function testPriceIdsConfig() {
  log.section('STRIPE PRICE IDs CONFIGURATION TEST');

  const priceIds = {
    'Starter Monthly': process.env.STRIPE_STARTER_MONTHLY,
    'Starter Yearly': process.env.STRIPE_STARTER_YEARLY,
    'Professional Monthly': process.env.STRIPE_PROFESSIONAL_MONTHLY,
    'Professional Yearly': process.env.STRIPE_PROFESSIONAL_YEARLY,
    'Enterprise Monthly': process.env.STRIPE_ENTERPRISE_MONTHLY,
    'Enterprise Yearly': process.env.STRIPE_ENTERPRISE_YEARLY,
  };

  let allConfigured = true;
  let configuredCount = 0;

  Object.entries(priceIds).forEach(([key, value]) => {
    if (value && value.startsWith('price_')) {
      log.success(`${key.padEnd(25)}: ${value}`);
      configuredCount++;
    } else {
      log.error(`${key.padEnd(25)}: NOT CONFIGURED`);
      allConfigured = false;
    }
  });

  console.log('');
  if (allConfigured) {
    log.success(`All ${configuredCount}/6 Price IDs configured correctly ✅`);
  } else {
    log.error(`Only ${configuredCount}/6 Price IDs configured ❌`);
  }

  return allConfigured;
}

// Test Stripe API Key
function testStripeKeys() {
  log.section('STRIPE API KEYS TEST');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secretKey) {
    if (secretKey.startsWith('sk_test_')) {
      log.success(`Secret Key: ${secretKey.substring(0, 20)}... (TEST MODE)`);
    } else if (secretKey.startsWith('sk_live_')) {
      log.warn(`Secret Key: ${secretKey.substring(0, 20)}... (LIVE MODE ⚠️)`);
    } else {
      log.error('Secret Key: Invalid format');
      return false;
    }
  } else {
    log.error('Secret Key: NOT CONFIGURED');
    return false;
  }

  if (webhookSecret) {
    if (webhookSecret.startsWith('whsec_')) {
      log.success(`Webhook Secret: ${webhookSecret.substring(0, 20)}...`);
    } else {
      log.error('Webhook Secret: Invalid format');
      return false;
    }
  } else {
    log.warn('Webhook Secret: NOT CONFIGURED (optional for local dev)');
  }

  return true;
}

// Test Environment Configuration
function testEnvironment() {
  log.section('ENVIRONMENT CONFIGURATION');

  const checks = [
    { name: 'Node Environment', value: process.env.NODE_ENV || 'development', expected: true },
    { name: 'API URL', value: API_URL, expected: true },
    { name: 'Port', value: process.env.PORT || '5000', expected: true },
  ];

  checks.forEach(check => {
    if (check.value) {
      log.success(`${check.name.padEnd(20)}: ${check.value}`);
    } else {
      log.error(`${check.name.padEnd(20)}: NOT SET`);
    }
  });
}

// Display Pricing Information
function displayPricingInfo() {
  log.section('PRICING TIERS');

  const tiers = [
    {
      name: 'Starter',
      monthly: '€69',
      yearly: '€690',
      priceIds: {
        monthly: process.env.STRIPE_STARTER_MONTHLY,
        yearly: process.env.STRIPE_STARTER_YEARLY,
      }
    },
    {
      name: 'Professional',
      monthly: '€169',
      yearly: '€1,690',
      priceIds: {
        monthly: process.env.STRIPE_PROFESSIONAL_MONTHLY,
        yearly: process.env.STRIPE_PROFESSIONAL_YEARLY,
      }
    },
    {
      name: 'Enterprise',
      monthly: '€399',
      yearly: '€3,990',
      priceIds: {
        monthly: process.env.STRIPE_ENTERPRISE_MONTHLY,
        yearly: process.env.STRIPE_ENTERPRISE_YEARLY,
      }
    },
  ];

  tiers.forEach(tier => {
    console.log(`\n${colors.cyan}${tier.name}${colors.reset}`);
    console.log(`  Monthly: ${tier.monthly}/month`);
    console.log(`  Yearly:  ${tier.yearly}/year (17% discount)`);
    console.log(`  Price IDs:`);
    console.log(`    - Monthly: ${tier.priceIds.monthly || 'NOT SET'}`);
    console.log(`    - Yearly:  ${tier.priceIds.yearly || 'NOT SET'}`);
  });
}

// Display API Endpoints
function displayApiEndpoints() {
  log.section('AVAILABLE API ENDPOINTS');

  const endpoints = [
    { method: 'GET ', path: '/api/subscriptions/manage/status', desc: 'Get current subscription' },
    { method: 'POST', path: '/api/subscriptions/manage/create', desc: 'Create new subscription' },
    { method: 'POST', path: '/api/subscriptions/manage/upgrade', desc: 'Upgrade subscription' },
    { method: 'POST', path: '/api/subscriptions/manage/downgrade', desc: 'Downgrade subscription' },
    { method: 'POST', path: '/api/subscriptions/manage/cancel', desc: 'Cancel subscription' },
    { method: 'POST', path: '/api/subscriptions/manage/sepa/setup', desc: 'Setup SEPA (Enterprise)' },
    { method: 'POST', path: '/api/subscriptions/manage/invoice/create', desc: 'Create invoice (Enterprise)' },
    { method: 'POST', path: '/api/subscriptions/manage/trial/convert', desc: 'Convert trial to paid' },
  ];

  endpoints.forEach(ep => {
    console.log(`${colors.green}${ep.method}${colors.reset} ${ep.path}`);
    console.log(`     ${colors.blue}→ ${ep.desc}${colors.reset}`);
  });
}

// Display Frontend Routes
function displayFrontendRoutes() {
  log.section('FRONTEND ROUTES');

  const routes = [
    { path: '/pricing', desc: 'Pricing page with all tiers' },
    { path: '/subscription', desc: 'Subscription management dashboard', protected: true },
    { path: '/checkout/:plan', desc: 'Checkout flow (future)', protected: false },
  ];

  routes.forEach(route => {
    const protection = route.protected ? `${colors.yellow}🔒 Protected${colors.reset}` : `${colors.green}🌍 Public${colors.reset}`;
    console.log(`${protection} ${route.path}`);
    console.log(`     ${colors.blue}→ ${route.desc}${colors.reset}`);
  });
}

// Main test runner
function runTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║         STRIPE SUBSCRIPTION FLOW - CONFIGURATION TEST              ║
║         JN Automation - Backend Integration                        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  `);

  log.info(`Test Started: ${new Date().toLocaleString('de-DE')}`);
  log.info(`Test Directory: ${__dirname}`);

  const priceIdsOk = testPriceIdsConfig();
  const stripeKeysOk = testStripeKeys();
  testEnvironment();
  displayPricingInfo();
  displayApiEndpoints();
  displayFrontendRoutes();

  log.section('TEST SUMMARY');

  if (priceIdsOk && stripeKeysOk) {
    log.success('✅ Configuration Complete - Ready for Integration!');
    console.log('');
    log.info('Next Steps:');
    console.log('  1. Start backend: cd backend && npm run dev');
    console.log('  2. Start frontend: cd frontend && npm run dev');
    console.log('  3. Open http://localhost:5173/subscription');
    console.log('  4. Test subscription flow with Stripe test cards');
    console.log('');
    log.info('Stripe Test Cards:');
    console.log('  • Success: 4242 4242 4242 4242');
    console.log('  • 3D Secure: 4000 0025 0000 3155');
    console.log('  • Decline: 4000 0000 0000 9995');
  } else {
    log.error('❌ Configuration Incomplete - Please fix the errors above');
    console.log('');
    log.info('Missing configuration:');
    if (!priceIdsOk) console.log('  • Set all 6 Stripe Price IDs in backend/.env');
    if (!stripeKeysOk) console.log('  • Set STRIPE_SECRET_KEY in backend/.env');
    console.log('');
    log.info('Copy from .env.example and fill in your values');
  }

  console.log('');
  log.info('Documentation: See STRIPE_SETUP_GUIDE.md for detailed setup instructions');
  console.log('');
}

// Run tests
runTests();
