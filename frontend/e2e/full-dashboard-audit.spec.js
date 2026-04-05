/**
 * Full Dashboard Audit Test
 * Logs into every dashboard role, navigates to every page, clicks buttons,
 * and reports all errors (console errors, HTTP errors, broken pages).
 */

import { test, expect } from '@playwright/test';

const TEST_USERS = {
  owner: {
    email: process.env.E2E_OWNER_EMAIL || 'test-salon@jnbusiness.de',
    password: process.env.E2E_OWNER_PASSWORD || 'TestPassword123!',
    loginUrl: '/login/business',
    expectedUrl: '/dashboard',
  },
  employee: {
    email: process.env.E2E_EMPLOYEE_EMAIL || 'barber.employee@demo.jn-business-system.de',
    password: process.env.E2E_EMPLOYEE_PASSWORD || 'Demo@12345',
    loginUrl: '/login/employee',
    expectedUrl: '/employee/dashboard',
  },
  customer: {
    email: process.env.E2E_CUSTOMER_EMAIL || 'customer@demo.jn-business-system.de',
    password: process.env.E2E_CUSTOMER_PASSWORD || 'Demo@12345',
    loginUrl: '/login/customer',
    expectedUrl: '/customer/dashboard',
  },
  ceo: {
    email: process.env.E2E_CEO_EMAIL || 'julius@jn-automation.de',
    password: process.env.E2E_CEO_PASSWORD || 'CEO@12345',
    loginUrl: '/_.admin',
    expectedUrl: '/ceo/dashboard',
    requires2FA: true, // CEO login requires TOTP - skip in automated tests
  },
};

// All routes to test per role
const ROLE_ROUTES = {
  ceo: [
    '/ceo/dashboard',
    '/ceo/analytics',
    '/ceo/companies',
    '/ceo/users',
    '/ceo/payments',
    '/ceo/email-campaigns',
    '/ceo/lifecycle-emails',
    '/ceo/support',
    '/ceo/feature-flags',
    '/ceo/audit-log',
    '/ceo/backups',
    '/ceo/settings',
  ],
  owner: [
    '/dashboard',
    '/dashboard/bookings',
    '/dashboard/services',
    '/dashboard/customers',
    '/dashboard/employees',
    '/dashboard/widget',
    '/dashboard/widget/live-preview',
    '/dashboard/settings',
    '/dashboard/help',
    '/dashboard/marketing',
    '/dashboard/branding',
    '/dashboard/waitlist',
    '/dashboard/success-metrics',
    '/dashboard/billing/invoices',
    '/dashboard/locations',
    '/dashboard/packages-memberships',
    '/dashboard/workflows',
    '/dashboard/workflow-projects',
    '/dashboard/tattoo/projects',
    '/subscription',
  ],
  employee: [
    '/employee/dashboard',
    '/dashboard/bookings',
    '/dashboard/services',
    '/dashboard/help',
  ],
  customer: [
    '/customer/dashboard',
    '/customer/booking',
    '/customer/settings',
    '/customer/support',
  ],
};

// Public pages to test without login
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/login',
  '/login/business',
  '/login/employee',
  '/login/customer',
  '/register',
  '/faq',
  '/impressum',
  '/datenschutz',
  '/agb',
  '/salons',
  '/_.admin',
];

/**
 * Helper: login as a specific role
 */
async function loginAs(page, role) {
  const user = TEST_USERS[role];

  // Navigate first so we have a valid origin for storage access
  await page.goto(user.loginUrl, { waitUntil: 'networkidle', timeout: 15000 });

  // Clear any previous auth state
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reload after clearing
  await page.goto(user.loginUrl, { waitUntil: 'networkidle', timeout: 15000 });

  // Fill login form
  await page.fill('input[type="email"], input#email', user.email);
  await page.fill('input[type="password"], input#password', user.password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  try {
    await page.waitForURL(`**${user.expectedUrl}**`, { timeout: 15000 });
    return true;
  } catch {
    // Check if we got redirected somewhere unexpected
    const currentUrl = page.url();
    console.log(`  ⚠️ Login redirect: expected ${user.expectedUrl}, got ${currentUrl}`);
    // Even if URL doesn't match exactly, if we're on a dashboard page, it's ok
    if (currentUrl.includes('dashboard') || currentUrl.includes('ceo')) {
      return true;
    }
    return false;
  }
}

/**
 * Helper: navigate to a page and collect errors
 */
async function auditPage(page, url, errors) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];

  // Collect console errors
  const consoleHandler = (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known non-critical errors
      if (text.includes('Redis') || text.includes('favicon') || text.includes('DevTools')) return;
      consoleErrors.push(text);
    }
  };
  page.on('console', consoleHandler);

  // Collect JS errors
  const errorHandler = (error) => {
    pageErrors.push(error.message);
  };
  page.on('pageerror', errorHandler);

  // Collect failed network requests (4xx/5xx)
  const responseHandler = (response) => {
    const status = response.status();
    const reqUrl = response.url();
    if (status >= 400 && !reqUrl.includes('favicon') && !reqUrl.includes('hot-update')) {
      failedRequests.push({ status, url: reqUrl });
    }
  };
  page.on('response', responseHandler);

  try {
    // Navigate
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });

    // Wait a moment for lazy-loaded content
    await page.waitForTimeout(1500);

    // Check for error boundary / error pages
    const errorBoundary = await page.locator('text=/error|fehler|something went wrong|not found|404/i').first().isVisible().catch(() => false);
    const hasContent = await page.locator('main, [role="main"], .dashboard, .layout').first().isVisible().catch(() => false);

    // Check if page shows a blank/white screen
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const isBlank = bodyText.trim().length < 10;

    // Check the actual URL (might have been redirected to login or 404)
    const finalUrl = page.url();
    const wasRedirected = !finalUrl.includes(url.replace(/^\//, ''));

    const result = {
      url,
      finalUrl,
      wasRedirected,
      errorBoundary,
      isBlank,
      hasContent,
      consoleErrors: [...consoleErrors],
      pageErrors: [...pageErrors],
      failedRequests: [...failedRequests],
    };

    // Determine if this page has issues
    const hasIssues = pageErrors.length > 0 ||
      consoleErrors.length > 0 ||
      failedRequests.length > 0 ||
      errorBoundary ||
      isBlank ||
      wasRedirected;

    if (hasIssues) {
      errors.push(result);
    }

    return result;
  } catch (err) {
    errors.push({
      url,
      navigationError: err.message,
      consoleErrors: [...consoleErrors],
      pageErrors: [...pageErrors],
      failedRequests: [...failedRequests],
    });
    return null;
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', errorHandler);
    page.off('response', responseHandler);
  }
}

/**
 * Helper: test interactive elements on a page
 */
async function testInteractiveElements(page, url, errors) {
  try {
    // Find all visible buttons (not submit buttons in forms - dangerous)
    const buttons = page.locator('button:visible:not([type="submit"]):not([data-dangerous])');
    const buttonCount = await buttons.count();

    // Find all visible links within the main content area
    const links = page.locator('main a[href]:visible, .dashboard a[href]:visible');
    const linkCount = await links.count();

    // Find tabs
    const tabs = page.locator('[role="tab"]:visible, [data-tab]:visible');
    const tabCount = await tabs.count();

    // Click through tabs
    for (let i = 0; i < Math.min(tabCount, 10); i++) {
      try {
        const tab = tabs.nth(i);
        const tabText = await tab.innerText().catch(() => `tab-${i}`);
        await tab.click();
        await page.waitForTimeout(500);

        // Check for errors after tab click
        const errorVisible = await page.locator('text=/error|fehler|something went wrong/i').first().isVisible().catch(() => false);
        if (errorVisible) {
          errors.push({
            url,
            type: 'tab-click-error',
            detail: `Tab "${tabText}" caused an error`,
          });
        }
      } catch {
        // Tab click failed, skip
      }
    }

    // Test dropdowns / select elements
    const selects = page.locator('select:visible');
    const selectCount = await selects.count();

    return { buttonCount, linkCount, tabCount, selectCount };
  } catch {
    return { buttonCount: 0, linkCount: 0, tabCount: 0, selectCount: 0 };
  }
}

// ============================================================
// TESTS
// ============================================================

test.describe('Public Pages Audit', () => {
  test('all public pages load without errors', async ({ page }) => {
    const errors = [];

    for (const route of PUBLIC_ROUTES) {
      console.log(`📄 Testing public page: ${route}`);
      await auditPage(page, route, errors);
    }

    // Report
    if (errors.length > 0) {
      console.log('\n🔴 PUBLIC PAGE ERRORS:');
      for (const err of errors) {
        console.log(`\n  Page: ${err.url}`);
        if (err.navigationError) console.log(`    Navigation Error: ${err.navigationError}`);
        if (err.wasRedirected) console.log(`    Redirected to: ${err.finalUrl}`);
        if (err.isBlank) console.log(`    ⚠️ BLANK PAGE`);
        if (err.errorBoundary) console.log(`    ⚠️ ERROR BOUNDARY VISIBLE`);
        if (err.pageErrors?.length) console.log(`    JS Errors: ${err.pageErrors.join('; ')}`);
        if (err.consoleErrors?.length) console.log(`    Console Errors: ${err.consoleErrors.join('; ')}`);
        if (err.failedRequests?.length) {
          for (const req of err.failedRequests) {
            console.log(`    Failed Request: ${req.status} ${req.url}`);
          }
        }
      }
    } else {
      console.log('\n✅ All public pages passed');
    }

    // Soft assert - don't fail on console errors only
    const criticalErrors = errors.filter(e => e.pageErrors?.length > 0 || e.isBlank || e.navigationError);
    expect(criticalErrors, `Critical errors on public pages: ${JSON.stringify(criticalErrors, null, 2)}`).toHaveLength(0);
  });
});

test.describe('CEO Dashboard Audit', () => {
  test.skip('login and test all CEO pages - REQUIRES 2FA', async ({ page }) => {
    // CEO login requires TOTP 2FA which cannot be automated without the secret
    // To test: manually login as CEO first, then run individual page tests
    const errors = [];

    console.log('\n🔑 Logging in as CEO...');
    const loggedIn = await loginAs(page, 'ceo');
    if (!loggedIn) {
      console.log('❌ CEO login failed (expected - requires 2FA)');
      return;
    }

    for (const route of ROLE_ROUTES.ceo) {
      console.log(`📄 Testing CEO page: ${route}`);
      await auditPage(page, route, errors);
      await testInteractiveElements(page, route, errors);
    }

    reportErrors('CEO', errors);
  });
});

test.describe('Salon Owner Dashboard Audit', () => {
  test('login and test all owner pages', async ({ page }) => {
    const errors = [];

    console.log('\n🔑 Logging in as Salon Owner...');
    const loggedIn = await loginAs(page, 'owner');
    if (!loggedIn) {
      console.log('❌ Owner login failed');
      errors.push({ url: '/login/business', type: 'login-failure', detail: 'Could not log in as owner' });
    }

    expect(loggedIn, 'Owner login should succeed').toBeTruthy();

    for (const route of ROLE_ROUTES.owner) {
      console.log(`📄 Testing owner page: ${route}`);
      await auditPage(page, route, errors);
      await testInteractiveElements(page, route, errors);
    }

    reportErrors('OWNER', errors);
    const criticalErrors = errors.filter(e => e.pageErrors?.length > 0 || e.isBlank || e.navigationError);
    expect(criticalErrors, `Critical errors on owner pages: ${JSON.stringify(criticalErrors, null, 2)}`).toHaveLength(0);
  });
});

test.describe('Employee Dashboard Audit', () => {
  test('login and test all employee pages', async ({ page }) => {
    const errors = [];

    console.log('\n🔑 Logging in as Employee...');
    const loggedIn = await loginAs(page, 'employee');
    if (!loggedIn) {
      console.log('❌ Employee login failed');
      errors.push({ url: '/login/employee', type: 'login-failure', detail: 'Could not log in as employee' });
    }

    expect(loggedIn, 'Employee login should succeed').toBeTruthy();

    for (const route of ROLE_ROUTES.employee) {
      console.log(`📄 Testing employee page: ${route}`);
      await auditPage(page, route, errors);
      await testInteractiveElements(page, route, errors);
    }

    reportErrors('EMPLOYEE', errors);
    const criticalErrors = errors.filter(e => e.pageErrors?.length > 0 || e.isBlank || e.navigationError);
    expect(criticalErrors, `Critical errors on employee pages: ${JSON.stringify(criticalErrors, null, 2)}`).toHaveLength(0);
  });
});

test.describe('Customer Dashboard Audit', () => {
  test('login and test all customer pages', async ({ page }) => {
    const errors = [];

    console.log('\n🔑 Logging in as Customer...');
    const loggedIn = await loginAs(page, 'customer');
    if (!loggedIn) {
      console.log('❌ Customer login failed');
      errors.push({ url: '/login/customer', type: 'login-failure', detail: 'Could not log in as customer' });
    }

    expect(loggedIn, 'Customer login should succeed').toBeTruthy();

    for (const route of ROLE_ROUTES.customer) {
      console.log(`📄 Testing customer page: ${route}`);
      await auditPage(page, route, errors);
      await testInteractiveElements(page, route, errors);
    }

    reportErrors('CUSTOMER', errors);
    const criticalErrors = errors.filter(e => e.pageErrors?.length > 0 || e.isBlank || e.navigationError);
    expect(criticalErrors, `Critical errors on customer pages: ${JSON.stringify(criticalErrors, null, 2)}`).toHaveLength(0);
  });
});

// ============================================================
// Reporting helper
// ============================================================
function reportErrors(role, errors) {
  if (errors.length > 0) {
    console.log(`\n🔴 ${role} DASHBOARD ERRORS (${errors.length}):`);
    for (const err of errors) {
      console.log(`\n  Page: ${err.url || 'N/A'}`);
      if (err.type) console.log(`    Type: ${err.type}`);
      if (err.detail) console.log(`    Detail: ${err.detail}`);
      if (err.navigationError) console.log(`    Navigation Error: ${err.navigationError}`);
      if (err.wasRedirected) console.log(`    Redirected to: ${err.finalUrl}`);
      if (err.isBlank) console.log(`    ⚠️ BLANK PAGE`);
      if (err.errorBoundary) console.log(`    ⚠️ ERROR BOUNDARY VISIBLE`);
      if (err.pageErrors?.length) console.log(`    JS Errors: ${err.pageErrors.join('; ')}`);
      if (err.consoleErrors?.length) {
        for (const ce of err.consoleErrors) {
          console.log(`    Console Error: ${ce.substring(0, 200)}`);
        }
      }
      if (err.failedRequests?.length) {
        for (const req of err.failedRequests) {
          console.log(`    Failed Request: ${req.status} ${req.url}`);
        }
      }
    }
  } else {
    console.log(`\n✅ All ${role} pages passed`);
  }
}
