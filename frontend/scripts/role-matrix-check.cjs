const { chromium } = require('@playwright/test');

async function runScenario({ name, loginEndpoint, credentials, dashboardPath, deniedPath, expectedRedirectPattern }) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const loginRes = await page.request.post(`http://localhost:3000/api/v1/auth/${loginEndpoint}`, { data: credentials });
    const loginJson = await loginRes.json().catch(() => ({}));

    if (loginRes.status() !== 200 || !loginJson.success) {
      return {
        name,
        pass: false,
        details: `login failed: HTTP ${loginRes.status()} body=${JSON.stringify(loginJson).slice(0, 180)}`
      };
    }

    await page.goto(`http://localhost:5173${dashboardPath}`, { waitUntil: 'networkidle' });
    const dashboardUrl = page.url();

    await page.goto(`http://localhost:5173${deniedPath}`, { waitUntil: 'networkidle' });
    const deniedUrl = page.url();

    const deniedOk = expectedRedirectPattern.test(deniedUrl);

    return {
      name,
      pass: deniedOk,
      details: `dashboard=${dashboardUrl} denied=${deniedUrl} expected=${expectedRedirectPattern}`
    };
  } finally {
    await browser.close();
  }
}

(async () => {
  const scenarios = [
    {
      name: 'OWNER',
      loginEndpoint: 'login',
      credentials: { email: 'test-salon@jnbusiness.de', password: 'TestPassword123!' },
      dashboardPath: '/dashboard',
      deniedPath: '/ceo/dashboard',
      expectedRedirectPattern: /\/dashboard$/
    },
    {
      name: 'CUSTOMER',
      loginEndpoint: 'login',
      credentials: { email: 'customer@demo.jn-business-system.de', password: 'Demo@12345' },
      dashboardPath: '/customer/dashboard',
      deniedPath: '/dashboard',
      expectedRedirectPattern: /\/customer\/dashboard/
    },
    {
      name: 'EMPLOYEE',
      loginEndpoint: 'employee-login',
      credentials: { email: 'barber.employee@demo.jn-business-system.de', password: 'Demo@12345' },
      dashboardPath: '/employee/dashboard',
      deniedPath: '/dashboard/employees',
      expectedRedirectPattern: /\/dashboard$/
    }
  ];

  let hasFailure = false;

  for (const scenario of scenarios) {
    const result = await runScenario(scenario);
    const status = result.pass ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.name} ${result.details}`);
    if (!result.pass) {
      hasFailure = true;
    }
  }

  process.exit(hasFailure ? 1 : 0);
})();
