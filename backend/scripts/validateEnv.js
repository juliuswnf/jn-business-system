/* eslint-disable no-console */
/**
 * Environment Validation Script
 * Run before deployment to ensure all required variables are set
 * Usage: node scripts/validateEnv.js
 */

import dotenv from 'dotenv';
dotenv.config();

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`)
};

// Environment variable definitions
const envConfig = {
  required: [
    { key: 'NODE_ENV', description: 'Environment (development/production)', values: ['development', 'production', 'test'] },
    { key: 'MONGODB_URI', description: 'MongoDB connection string', pattern: /^mongodb/ },
    { key: 'JWT_SECRET', description: 'JWT signing secret', minLength: 32 },
    { key: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret', minLength: 32 }
  ],
  recommended: [
    { key: 'PORT', description: 'Server port', default: '5000' },
    { key: 'CORS_ORIGIN', description: 'Allowed CORS origins' },
    { key: 'FRONTEND_URL', description: 'Frontend URL for emails/redirects' },
    { key: 'LOG_LEVEL', description: 'Logging level', values: ['debug', 'info', 'warn', 'error'] }
  ],
  optional: [
    { key: 'STRIPE_SECRET_KEY', description: 'Stripe API key', pattern: /^sk_/ },
    { key: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook secret', pattern: /^whsec_/ },
    { key: 'EMAIL_HOST', description: 'SMTP host' },
    { key: 'EMAIL_USER', description: 'SMTP username' },
    { key: 'EMAIL_PASS', description: 'SMTP password' },
    { key: 'SENTRY_DSN', description: 'Sentry error tracking DSN' },
    { key: 'REDIS_URL', description: 'Redis connection URL' },
    { key: 'METRICS_SECRET', description: 'Secret for metrics endpoint' }
  ]
};

// Validation results
const results = {
  passed: 0,
  warnings: 0,
  errors: 0
};

function validateVar(config, isRequired = true) {
  const value = process.env[config.key];

  if (!value) {
    if (isRequired) {
      log.error(`${config.key} - MISSING (${config.description})`);
      results.errors++;
      return false;
    } else {
      log.warn(`${config.key} - Not set (${config.description})`);
      results.warnings++;
      return true;
    }
  }

  // Check allowed values
  if (config.values && !config.values.includes(value)) {
    log.error(`${config.key} = "${value}" - Invalid (allowed: ${config.values.join(', ')})`);
    results.errors++;
    return false;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    log.error(`${config.key} - Invalid format`);
    results.errors++;
    return false;
  }

  // Check minimum length
  if (config.minLength && value.length < config.minLength) {
    log.warn(`${config.key} - Too short (min ${config.minLength} chars, got ${value.length})`);
    results.warnings++;
    return true;
  }

  // Mask sensitive values
  const displayValue = config.key.includes('SECRET') || config.key.includes('PASS') || config.key.includes('KEY')
    ? value.substring(0, 4) + '****'
    : value.substring(0, 30) + (value.length > 30 ? '...' : '');

  log.success(`${config.key} = "${displayValue}"`);
  results.passed++;
  return true;
}

function runValidation() {
  console.log('\n' + '═'.repeat(50));
  console.log('  JN AUTOMATION - Environment Validation');
  console.log('═'.repeat(50));

  // Check required variables
  log.header('Required Variables');
  envConfig.required.forEach(config => validateVar(config, true));

  // Check recommended variables
  log.header('Recommended Variables');
  envConfig.recommended.forEach(config => validateVar(config, false));

  // Check optional variables (production only)
  if (process.env.NODE_ENV === 'production') {
    log.header('Production Variables');
    envConfig.optional.forEach(config => validateVar(config, false));
  }

  // Summary
  log.header('Validation Summary');
  console.log(`  Passed:   ${colors.green}${results.passed}${colors.reset}`);
  console.log(`  Warnings: ${colors.yellow}${results.warnings}${colors.reset}`);
  console.log(`  Errors:   ${colors.red}${results.errors}${colors.reset}`);
  console.log('');

  if (results.errors > 0) {
    log.error('Validation FAILED - Fix the errors above before deploying');
    process.exit(1);
  } else if (results.warnings > 0) {
    log.warn('Validation passed with warnings');
    process.exit(0);
  } else {
    log.success('Validation PASSED - Ready for deployment!');
    process.exit(0);
  }
}

// Run validation
runValidation();
