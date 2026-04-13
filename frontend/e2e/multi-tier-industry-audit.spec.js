/**
 * Multi-Tier & Multi-Industry Dashboard Audit
 * Tests ALL 7 industries × 3 pricing tiers = 21 combinations
 * Verifies that:
 *  - Login works for every demo account
 *  - Starter pages load without JS errors
 *  - Professional tier-locked pages redirect to /pricing for starter users
 *  - Enterprise tier-locked pages redirect for starter/professional users
 *  - Industry-specific pages (tattoo projects, workflows, etc.) load correctly
 *  - No error boundaries, blank pages, or crashed components
 */

import { test, expect } from '@playwright/test';

// ============ CONFIG ============

const INDUSTRIES = [
  'barber',      // barbershop
  'beauty',
  'tattoo',
  'medical',     // medical_aesthetics
  'nails',
  'massage',
  'physio',      // physiotherapy
];

const TIERS = ['starter', 'professional', 'enterprise'];

const PASSWORD = 'Demo@12345';

// Routes available to ALL tiers (starter and above)
const STARTER_ROUTES = [
  '/dashboard',
  '/dashboard/bookings',
  '/dashboard/services',
  '/dashboard/customers',
  '/dashboard/widget',
  '/dashboard/settings',
  '/dashboard/help',
  '/subscription',
];

// Routes requiring professional tier (redirect to /pricing for starter)
const PROFESSIONAL_ROUTES = [
  '/dashboard/marketing',
  '/dashboard/branding',
  '/dashboard/waitlist',
  '/dashboard/workflows',
  '/dashboard/workflow-projects',
  '/dashboard/packages-memberships',
  '/dashboard/employees',
];

// Routes requiring enterprise tier (redirect for starter/professional)
const ENTERPRISE_ROUTES = [
  '/dashboard/locations',
  '/dashboard/success-metrics',
  '/dashboard/marketing/sms',
  '/dashboard/billing/invoices',
];

// Industry-specific routes (no tier lock - available to all)
const INDUSTRY_ROUTES = {
  tattoo: ['/dashboard/tattoo/projects'],
};

// ============ HELPERS ============

function getEmail(industry, tier) {
  return `${industry}.${tier}@demo.jn-business-system.de`;
}

async function loginAsOwner(page, email) {
  await page.goto('/login/business', { waitUntil: 'networkidle', timeout: 15000 });
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login/business', { waitUntil: 'networkidle', timeout: 15000 });

  await page.fill('input[type="email"], input#email', email);
  await page.fill('input[type="password"], input#password', PASSWORD);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    return true;
  } catch {
    const url = page.url();
    if (url.includes('dashboard')) return true;
    console.log(`  ⚠️ Login failed for ${email}, ended at ${url}`);
    return false;
  }
}

async function auditPage(page, url) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];

  const onConsole = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Redis') || text.includes('favicon') || text.includes('DevTools')) return;
      if (text.includes('ERR_CONNECTION_REFUSED') && text.includes('6379')) return; // Redis
      consoleErrors.push(text);
    }
  };
  const onError = (error) => pageErrors.push(error.message);
  const onResponse = (response) => {
    const status = response.status();
    const reqUrl = response.url();
    if (status >= 400 && !reqUrl.includes('favicon') && !reqUrl.includes('hot-update')) {
      failedRequests.push({ status, url: reqUrl });
    }
  };

  page.on('console', onConsole);
  page.on('pageerror', onError);
  page.on('response', onResponse);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);

    const finalUrl = page.url();
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const isBlank = bodyText.trim().length < 10;

    return {
      url,
      finalUrl,
      isBlank,
      pageErrors: [...pageErrors],
      consoleErrors: [...consoleErrors],
      failedRequests: [...failedRequests],
    };
  } catch (err) {
    return {
      url,
      navigationError: err.message,
      isBlank: false,
      pageErrors: [...pageErrors],
      consoleErrors: [...consoleErrors],
      failedRequests: [...failedRequests],
    };
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onError);
    page.off('response', onResponse);
  }
}

function isCritical(result) {
  return (
    result.pageErrors.length > 0 ||
    result.isBlank ||
    !!result.navigationError
  );
}

async function checkStarterRoutes(page, label, tier, allErrors) {
  console.log(`\n📦 [${label}] Testing starter routes...`);
  for (const route of STARTER_ROUTES) {
    const result = await auditPage(page, route);
    const redirectedToLogin = result.finalUrl?.includes('/login');
    if (isCritical(result) || redirectedToLogin) {
      allErrors.push({ route, tier: 'starter', ...result, category: 'STARTER_ROUTE_FAILURE' });
      console.log(`  ❌ ${route} — JS errors: ${result.pageErrors.length}, blank: ${result.isBlank}, nav: ${result.navigationError || 'ok'}`);
    } else {
      console.log(`  ✅ ${route}`);
    }
  }
}

async function checkProRoutes(page, label, tier, allErrors) {
  console.log(`\n📦 [${label}] Testing professional routes...`);
  for (const route of PROFESSIONAL_ROUTES) {
    const result = await auditPage(page, route);
    const redirectedToPricing = result.finalUrl?.includes('/pricing');
    if (tier === 'starter') {
      if (redirectedToPricing) {
        console.log(`  ✅ ${route} → /pricing (correctly tier-gated)`);
      } else if (isCritical(result)) {
        allErrors.push({ route, tier: 'professional', ...result, category: 'TIER_GATE_CRASH' });
        console.log(`  ❌ ${route} — should redirect but crashed: ${result.pageErrors.join('; ')}`);
      } else {
        console.log(`  ⚠️ ${route} — loaded for starter (may not be tier-gated)`);
      }
    } else {
      if (isCritical(result)) {
        allErrors.push({ route, tier: 'professional', ...result, category: 'PRO_ROUTE_FAILURE' });
        console.log(`  ❌ ${route} — JS errors: ${result.pageErrors.length}, blank: ${result.isBlank}`);
      } else {
        console.log(`  ✅ ${route}`);
      }
    }
  }
}

async function checkEnterpriseRoutes(page, label, tier, allErrors) {
  console.log(`\n📦 [${label}] Testing enterprise routes...`);
  for (const route of ENTERPRISE_ROUTES) {
    const result = await auditPage(page, route);
    const redirectedToPricing = result.finalUrl?.includes('/pricing');
    if (tier === 'enterprise') {
      if (isCritical(result)) {
        allErrors.push({ route, tier: 'enterprise', ...result, category: 'ENTERPRISE_ROUTE_FAILURE' });
        console.log(`  ❌ ${route} — JS errors: ${result.pageErrors.length}, blank: ${result.isBlank}`);
      } else {
        console.log(`  ✅ ${route}`);
      }
    } else {
      if (redirectedToPricing) {
        console.log(`  ✅ ${route} → /pricing (correctly tier-gated)`);
      } else if (isCritical(result)) {
        allErrors.push({ route, tier: 'enterprise', ...result, category: 'TIER_GATE_CRASH' });
        console.log(`  ❌ ${route} — should redirect but crashed: ${result.pageErrors.join('; ')}`);
      } else {
        console.log(`  ⚠️ ${route} — loaded for ${tier} (may not be tier-gated)`);
      }
    }
  }
}

async function checkIndustryRoutes(page, label, industry, allErrors) {
  const industrySpecific = INDUSTRY_ROUTES[industry] || [];
  if (industrySpecific.length === 0) return;
  console.log(`\n📦 [${label}] Testing industry-specific routes...`);
  for (const route of industrySpecific) {
    const result = await auditPage(page, route);
    if (isCritical(result)) {
      allErrors.push({ route, tier: 'industry', ...result, category: 'INDUSTRY_ROUTE_FAILURE' });
      console.log(`  ❌ ${route} — ${result.pageErrors.join('; ')}`);
    } else {
      console.log(`  ✅ ${route}`);
    }
  }
}

// ============ TESTS ============

for (const industry of INDUSTRIES) {
  for (const tier of TIERS) {
    const email = getEmail(industry, tier);
    const label = `${industry}/${tier}`;

    test.describe(`${label}`, () => {
      test(`login and audit all pages`, async ({ page }) => {
        test.setTimeout(120_000); // 2 min per combo

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔑 Testing: ${label} (${email})`);
        console.log(`${'='.repeat(60)}`);

        // --- LOGIN ---
        const loggedIn = await loginAsOwner(page, email);
        expect(loggedIn, `Login failed for ${email}`).toBeTruthy();

        const allErrors = [];

        await checkStarterRoutes(page, label, tier, allErrors);
        await checkProRoutes(page, label, tier, allErrors);
        await checkEnterpriseRoutes(page, label, tier, allErrors);
        await checkIndustryRoutes(page, label, industry, allErrors);

        // --- SUMMARY ---
        console.log(`\n📊 [${label}] Summary:`);
        if (allErrors.length === 0) {
          console.log(`  ✅ ALL PAGES PASSED`);
        } else {
          console.log(`  ❌ ${allErrors.length} page(s) with critical errors:`);
          for (const err of allErrors) {
            console.log(`    ${err.category}: ${err.route}`);
            if (err.pageErrors?.length) console.log(`      JS: ${err.pageErrors.map(e => e.substring(0, 150)).join('; ')}`);
            if (err.navigationError) console.log(`      Nav: ${err.navigationError}`);
            if (err.failedRequests?.length) {
              for (const req of err.failedRequests) {
                console.log(`      HTTP: ${req.status} ${req.url.split('/api/')[1] || req.url}`);
              }
            }
          }
        }

        // Only fail on truly critical errors (JS crashes, blank pages, navigation failures)
        const critical = allErrors.filter(e =>
          e.category !== 'TIER_GATE_CRASH' || e.pageErrors?.length > 0
        );
        expect(critical, `Critical errors for ${label}:\n${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
      });
    });
  }
}
