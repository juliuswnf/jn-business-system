// JN Business System - k6 Load Test Script
// Tests booking system under various load conditions

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // Warm-up: 20 users
    { duration: '2m', target: 100 },   // Load: 100 users
    { duration: '2m', target: 200 },   // Peak: 200 users
    { duration: '1m', target: 500 },   // Stress test: 500 users
    { duration: '2m', target: 100 },   // Recovery: back to 100
    { duration: '1m', target: 0 },     // Cool-down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],     // 95% requests < 500ms
    'http_req_duration{type:health}': ['p(95)<100'],   // Health check < 100ms
    'http_req_duration{type:booking}': ['p(95)<1000'], // Booking < 1s
    'http_req_failed': ['rate<0.01'],       // Error rate < 1%
    'errors': ['rate<0.05'],                // Custom error rate < 5%
  },
};

// Configuration (update these!)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_SALON_ID = __ENV.SALON_ID || '64a5f8e9c8e7d1234567890a';
const TEST_SALON_SLUG = __ENV.SALON_SLUG || 'test-salon';

export default function () {
  // Test 1: Health Check
  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/api/system/health`, {
      tags: { type: 'health' },
    });

    const success = check(res, {
      'health check is 200': (r) => r.status === 200,
      'health check has status': (r) => r.json('status') === 'healthy',
      'health check < 100ms': (r) => r.timings.duration < 100,
    });

    if (!success) errorRate.add(1);
    else errorRate.add(0);
  });

  sleep(1);

  // Test 2: Get Salon Info (Public)
  group('Get Salon Info', function () {
    const res = http.get(`${BASE_URL}/api/salons/${TEST_SALON_SLUG}`, {
      tags: { type: 'salon' },
    });

    const success = check(res, {
      'salon info is 200': (r) => r.status === 200,
      'salon has name': (r) => r.json('salon.name') !== undefined,
      'salon response < 200ms': (r) => r.timings.duration < 200,
    });

    if (!success) errorRate.add(1);
    else errorRate.add(0);
  });

  sleep(1);

  // Test 3: Get Available Time Slots
  group('Get Availability', function () {
    const date = '2025-12-20';
    const res = http.get(
      `${BASE_URL}/api/salons/${TEST_SALON_SLUG}/availability?date=${date}`,
      { tags: { type: 'availability' } }
    );

    const success = check(res, {
      'availability is 200': (r) => r.status === 200,
      'availability has slots': (r) => Array.isArray(r.json('slots')),
      'availability < 300ms': (r) => r.timings.duration < 300,
    });

    if (!success) errorRate.add(1);
    else errorRate.add(0);
  });

  sleep(1);

  // Test 4: Create Booking (Read-only test - use test salon)
  group('Create Booking', function () {
    const payload = JSON.stringify({
      salonId: TEST_SALON_ID,
      service: 'Herrenhaarschnitt',
      date: '2025-12-20',
      time: `${Math.floor(Math.random() * 8) + 10}:00`, // Random time 10-18
      customer: {
        name: `Load Test User ${__VU}`,
        email: `test-${__VU}-${__ITER}@example.com`,
        phone: '+491701234567',
      },
      idempotencyKey: `load-test-${__VU}-${__ITER}-${Date.now()}`,
      notes: 'Load test booking',
    });

    const res = http.post(
      `${BASE_URL}/api/bookings/public`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { type: 'booking' },
      }
    );

    const success = check(res, {
      'booking status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'booking has success flag': (r) => r.json('success') === true,
      'booking has booking object': (r) => r.json('booking') !== undefined,
      'booking < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (!success) {
      console.error(`Booking failed: ${res.status} - ${res.body}`);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(2);
}

// Teardown function (optional)
export function teardown(data) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           JN Business System Load Test Complete              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Check the summary above for detailed metrics.');
  console.log('');
  console.log('🎯 Key Metrics to Review:');
  console.log('   - http_req_duration (p95): Should be < 500ms');
  console.log('   - http_req_failed: Should be < 1%');
  console.log('   - errors: Should be < 5%');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Review slowest endpoints');
  console.log('   2. Check backend logs for errors');
  console.log('   3. Optimize database queries');
  console.log('   4. Re-run test to verify improvements');
  console.log('');
}
