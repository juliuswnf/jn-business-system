const { chromium } = require('@playwright/test');

const scenarios = [
  {
    label: 'tattoo-starter',
    credentials: { email: 'tattoo.starter@demo.jn-business-system.de', password: 'Demo@12345' },
    checks: [
      { route: '/dashboard/tattoo/projects', expected: 'allow' },
      { route: '/dashboard/workflows', expected: 'pricing' },
      { route: '/dashboard/workflow-projects', expected: 'pricing' },
      { route: '/dashboard/packages-memberships', expected: 'pricing' }
    ],
    publicSlug: '/s/demo-tattoo-starter'
  },
  {
    label: 'tattoo-professional',
    credentials: { email: 'tattoo.professional@demo.jn-business-system.de', password: 'Demo@12345' },
    checks: [
      { route: '/dashboard/tattoo/projects', expected: 'allow' },
      { route: '/dashboard/workflows', expected: 'allow' },
      { route: '/dashboard/workflow-projects', expected: 'allow' },
      { route: '/dashboard/packages-memberships', expected: 'allow' }
    ],
    publicSlug: '/s/demo-tattoo-professional'
  },
  {
    label: 'medical-professional',
    credentials: { email: 'medical.professional@demo.jn-business-system.de', password: 'Demo@12345' },
    checks: [
      { route: '/dashboard/workflows', expected: 'allow' },
      { route: '/dashboard/workflow-projects', expected: 'allow' },
      { route: '/dashboard/packages-memberships', expected: 'allow' }
    ],
    publicSlug: '/s/demo-medical-professional'
  },
  {
    label: 'medical-starter',
    credentials: { email: 'medical.starter@demo.jn-business-system.de', password: 'Demo@12345' },
    checks: [
      { route: '/dashboard/workflows', expected: 'pricing' },
      { route: '/dashboard/workflow-projects', expected: 'pricing' },
      { route: '/dashboard/packages-memberships', expected: 'pricing' }
    ],
    publicSlug: '/s/demo-medical-starter'
  }
];

async function loginAs(page, credentials) {
  const response = await page.request.post('http://localhost:3000/api/v1/auth/login', { data: credentials });
  const body = await response.json().catch(() => ({}));
  if (response.status() !== 200 || body.success !== true) {
    throw new Error(`login failed: HTTP ${response.status()} body=${JSON.stringify(body).slice(0, 220)}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let hasFailure = false;

  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await loginAs(page, scenario.credentials);

        for (const check of scenario.checks) {
          await page.goto(`http://localhost:5173${check.route}`, { waitUntil: 'networkidle' });
          const currentUrl = page.url();

          const pass = check.expected === 'allow'
            ? currentUrl.includes(check.route)
            : currentUrl.includes('/pricing');

          const status = pass ? 'PASS' : 'FAIL';
          console.log(`${status} scenario=${scenario.label} route=${check.route} url=${currentUrl} expected=${check.expected}`);

          if (!pass) {
            hasFailure = true;
          }
        }

        await page.goto(`http://localhost:5173${scenario.publicSlug}`, { waitUntil: 'networkidle' });
        const publicUrl = page.url();
        const publicPass = publicUrl.includes(scenario.publicSlug);
        const publicStatus = publicPass ? 'PASS' : 'FAIL';
        console.log(`${publicStatus} scenario=${scenario.label} publicBooking=${scenario.publicSlug} url=${publicUrl}`);
        if (!publicPass) {
          hasFailure = true;
        }
      } catch (error) {
        console.log(`FAIL scenario=${scenario.label} setup=${error.message}`);
        hasFailure = true;
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  process.exit(hasFailure ? 1 : 0);
})();
