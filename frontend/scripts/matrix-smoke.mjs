/* eslint-env node */
/* global console, process */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const TARGET_BASE_URL = process.env.BASE_URL || BASE_URL;
const PASSWORD = 'Demo@12345';

const industries = ['barber', 'beauty', 'tattoo', 'medical', 'nails', 'massage', 'physio'];
const tiers = ['starter', 'professional', 'enterprise'];

const businessCommonRoutes = [
  '/dashboard',
  '/dashboard/bookings',
  '/dashboard/services',
  '/dashboard/customers',
  '/dashboard/settings'
];

const businessProRoutes = ['/dashboard/branding', '/dashboard/marketing', '/dashboard/waitlist'];
const businessEnterpriseRoutes = ['/dashboard/locations', '/dashboard/marketing/sms'];

const industryRoutes = {
  tattoo: ['/dashboard/tattoo/projects'],
  medical: ['/dashboard/workflows'],
  physio: ['/dashboard/workflows']
};

function businessAccounts() {
  const accounts = [];
  for (const industry of industries) {
    for (const tier of tiers) {
      accounts.push({
        kind: 'business',
        industry,
        tier,
        email: `${industry}.${tier}@demo.jn-business-system.de`,
        loginPath: '/login/business',
        expectedPath: '/dashboard'
      });
    }
  }
  return accounts;
}

function employeeAccounts() {
  return industries.map((industry) => ({
    kind: 'employee',
    industry,
    tier: null,
    email: `${industry}.employee@demo.jn-business-system.de`,
    loginPath: '/login/employee',
    expectedPath: '/employee/dashboard'
  }));
}

const customerAccount = {
  kind: 'customer',
  industry: null,
  tier: null,
  email: 'customer@demo.jn-business-system.de',
  loginPath: '/login/customer',
  expectedPath: '/customer/dashboard'
};

function accountLabel(account) {
  if (account.kind === 'business') {
    return `${account.kind}:${account.industry}:${account.tier}`;
  }
  return `${account.kind}:${account.industry || 'global'}`;
}

async function checkRoute(page, route) {
  await page.goto(`${TARGET_BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(250);

  const bodyText = (await page.locator('body').innerText()).slice(0, 2000);
  const hasFatalText = /something went wrong|unexpected application error|interner serverfehler|internal server error/i.test(bodyText);

  return {
    route,
    url: page.url(),
    ok: !hasFatalText,
    note: hasFatalText ? 'fatal-error-text-detected' : 'ok'
  };
}

function buildAccountRoutes(account) {
  if (account.kind === 'business') {
    const routes = [...businessCommonRoutes];
    if (account.tier === 'professional' || account.tier === 'enterprise') {
      routes.push(...businessProRoutes);
    }
    if (account.tier === 'enterprise') {
      routes.push(...businessEnterpriseRoutes);
    }
    if (industryRoutes[account.industry]) {
      routes.push(...industryRoutes[account.industry]);
    }
    return routes;
  }
  if (account.kind === 'employee') {
    return ['/employee/dashboard', '/dashboard', '/dashboard/bookings'];
  }
  if (account.kind === 'customer') {
    return ['/customer/dashboard', '/customer/booking', '/customer/settings', '/customer/support'];
  }
  return [];
}

async function runAccount(browser, account) {
  const context = await browser.newContext();
  const page = await context.newPage();

  const jsErrors = [];
  const failedRequests = [];

  page.on('pageerror', (err) => jsErrors.push(err.message));
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('favicon.ico')) {
      failedRequests.push(`${req.method()} ${url} => ${req.failure()?.errorText || 'FAILED'}`);
    }
  });

  const row = {
    account: accountLabel(account),
    email: account.email,
    loginOk: false,
    loginUrl: null,
    routes: [],
    jsErrors: [],
    failedRequests: []
  };

  try {
    await page.goto(`${TARGET_BASE_URL}${account.loginPath}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.fill('input#email, input[type="email"]', account.email);
    await page.fill('input#password, input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    row.loginUrl = page.url();
    row.loginOk = row.loginUrl.includes(account.expectedPath);

    if (row.loginOk) {
      for (const route of buildAccountRoutes(account)) {
        row.routes.push(await checkRoute(page, route));
      }
    }
  } catch (error) {
    row.jsErrors.push(`runner-exception: ${error.message}`);
  }

  row.jsErrors.push(...jsErrors);
  row.failedRequests.push(...failedRequests);

  await context.close();
  return row;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const rows = [];

  const accounts = [
    ...businessAccounts(),
    ...employeeAccounts(),
    customerAccount
  ];

  for (const account of accounts) {
    rows.push(await runAccount(browser, account));
  }

  await browser.close();

  const failures = rows.filter((row) => {
    if (!row.loginOk) return true;
    if (row.jsErrors.length > 0) return true;
    return row.routes.some((routeResult) => !routeResult.ok);
  });

  console.log('===== MATRIX SUMMARY =====');
  console.log(JSON.stringify({
    totalAccounts: rows.length,
    passedAccounts: rows.length - failures.length,
    failedAccounts: failures.length
  }, null, 2));

  if (failures.length > 0) {
    console.log('===== FAILURES =====');
    for (const row of failures) {
      console.log(JSON.stringify({
        account: row.account,
        email: row.email,
        loginOk: row.loginOk,
        loginUrl: row.loginUrl,
        routeFailures: row.routes.filter((r) => !r.ok),
        jsErrors: row.jsErrors.slice(0, 5),
        failedRequests: row.failedRequests.slice(0, 5)
      }, null, 2));
    }
  }

  process.exit(failures.length > 0 ? 2 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
