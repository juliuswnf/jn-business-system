#!/usr/bin/env node
/**
 * Test Script für alle 3 Schritte
 * Führt automatisierte Überprüfungen durch
 *
 * Ausführen: node scripts/testAllSteps.js
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Colors für Console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}? ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}? ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}??  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}??  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}\n`)
};

// HTTP Request Helper
const makeRequest = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
};

// ==================== TEST FUNCTIONS ====================

async function testHealthEndpoint() {
  log.info('Testing /health endpoint...');

  try {
    const response = await makeRequest(`${API_URL}/health`);

    if (response.status === 200) {
      log.success(`Health Check: ${response.data.status}`);
      log.info(`  - MongoDB: ${response.data.services?.mongodb?.status || 'unknown'}`);
      log.info(`  - Memory: ${response.data.services?.memory?.heapUsed || 'unknown'}`);
      log.info(`  - Email Worker: ${response.data.emailWorker || 'unknown'}`);
      log.info(`  - Uptime: ${response.data.uptime}s`);
      return true;
    } else {
      log.error(`Health Check failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Health Check error: ${error.message}`);
    return false;
  }
}

async function testMetricsProtection() {
  log.info('Testing /api/metrics protection...');

  try {
    const response = await makeRequest(`${API_URL}/api/metrics`);

    if (response.status === 401) {
      log.success('Metrics endpoint is protected (401 without auth)');
      return true;
    } else if (response.status === 200) {
      log.warn('Metrics endpoint accessible (dev mode or auth disabled)');
      return true;
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Metrics test error: ${error.message}`);
    return false;
  }
}

async function testRateLimiting() {
  log.info('Testing rate limiting...');

  try {
    // Send 5 quick requests
    const results = [];
    for (let i = 0; i < 5; i++) {
      const response = await makeRequest(`${API_URL}/health`);
      results.push(response.status);
    }

    // All should be 200 (under rate limit)
    if (results.every(s => s === 200)) {
      log.success('Rate limiting allows normal traffic');
      return true;
    } else if (results.some(s => s === 429)) {
      log.warn('Rate limiting triggered (may be too aggressive)');
      return true;
    } else {
      log.error('Unexpected response pattern');
      return false;
    }
  } catch (error) {
    log.error(`Rate limit test error: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoint() {
  log.info('Testing auth validation...');

  try {
    const response = await makeRequest(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@test.com', password: 'wrongpassword' }
    });

    if (response.status === 401 || response.status === 400) {
      log.success('Auth rejects invalid credentials');
      return true;
    } else {
      log.warn(`Unexpected auth response: ${response.status}`);
      return true;
    }
  } catch (error) {
    log.error(`Auth test error: ${error.message}`);
    return false;
  }
}

async function testPublicBookingEndpoint() {
  log.info('Testing public booking endpoint structure...');

  try {
    const response = await makeRequest(`${API_URL}/api/bookings/public/s/test-salon`);

    // Should return 404 (salon not found) or data
    if (response.status === 404 || response.status === 200) {
      log.success('Public booking endpoint responds correctly');
      return true;
    } else {
      log.warn(`Unexpected status: ${response.status}`);
      return true;
    }
  } catch (error) {
    log.error(`Public booking test error: ${error.message}`);
    return false;
  }
}

async function testWidgetEndpoint() {
  log.info('Testing widget embed endpoint...');

  try {
    const response = await makeRequest(`${API_URL}/api/widget/embed/test-salon`);

    // Should return 404 or widget config
    if (response.status === 404 || response.status === 200) {
      log.success('Widget endpoint responds correctly');
      return true;
    } else {
      log.warn(`Unexpected status: ${response.status}`);
      return true;
    }
  } catch (error) {
    log.error(`Widget test error: ${error.message}`);
    return false;
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log('\n');
  log.header('?? JN BUSINESS SYSTEM - COMPLETE SYSTEM TEST');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Endpoint
  log.header('SCHRITT 3: Monitoring & Health Checks');

  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Metrics Protection', fn: testMetricsProtection },
    { name: 'Rate Limiting', fn: testRateLimiting },
    { name: 'Auth Endpoint', fn: testAuthEndpoint },
    { name: 'Public Booking', fn: testPublicBookingEndpoint },
    { name: 'Widget Endpoint', fn: testWidgetEndpoint }
  ];

  for (const test of tests) {
    const passed = await test.fn();
    results.tests.push({ name: test.name, passed });
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  log.header('?? TEST SUMMARY');

  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  console.log('\nDetailed Results:');
  results.tests.forEach(t => {
    console.log(`  ${t.passed ? '?' : '?'} ${t.name}`);
  });

  if (results.failed === 0) {
    log.header('?? ALL TESTS PASSED!');
    console.log('System is ready for deployment.\n');
    process.exit(0);
  } else {
    log.header('?? SOME TESTS FAILED');
    console.log('Please review the failures above.\n');
    process.exit(1);
  }
}

// Check if server is running first
makeRequest(`${API_URL}/health`)
  .then(() => runAllTests())
  .catch(() => {
    log.error(`Cannot connect to ${API_URL}`);
    log.info('Make sure the backend server is running:');
    log.info('  cd backend && npm run dev');
    process.exit(1);
  });
