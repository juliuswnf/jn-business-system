const { chromium } = require('@playwright/test');

const tiers = [
  {
    label: 'starter',
    credentials: { email: 'barber.starter@demo.jn-business-system.de', password: 'Demo@12345' },
    access: {
      '/dashboard/branding': false,
      '/dashboard/locations': false,
      '/dashboard/marketing': false,
      '/dashboard/marketing/sms': false,
      '/dashboard/billing/invoices': false
    }
  },
  {
    label: 'professional',
    credentials: { email: 'barber.professional@demo.jn-business-system.de', password: 'Demo@12345' },
    access: {
      '/dashboard/branding': true,
      '/dashboard/locations': false,
      '/dashboard/marketing': true,
      '/dashboard/marketing/sms': false,
      '/dashboard/billing/invoices': false
    }
  },
  {
    label: 'enterprise',
    credentials: { email: 'barber.enterprise@demo.jn-business-system.de', password: 'Demo@12345' },
    access: {
      '/dashboard/branding': true,
      '/dashboard/locations': true,
      '/dashboard/marketing': true,
      '/dashboard/marketing/sms': true,
      '/dashboard/billing/invoices': true
    }
  }
];

async function loginAs(page, credentials) {
  const response = await page.request.post('http://localhost:3000/api/v1/auth/login', { data: credentials });
  const body = await response.json().catch(() => ({}));
  if (response.status() !== 200 || body.success !== true) {
    throw new Error(`login failed: HTTP ${response.status()} body=${JSON.stringify(body).slice(0, 200)}`);
  }
}

async function verifyPricingPage(page) {
  await page.goto('http://localhost:5173/pricing', { waitUntil: 'networkidle' });

  const content = await page.content();
  const hasStarter = /starter/i.test(content);
  const hasProfessional = /professional/i.test(content);
  const hasEnterprise = /enterprise/i.test(content);

  if (!hasStarter || !hasProfessional || !hasEnterprise) {
    throw new Error(`pricing page missing tier labels starter=${hasStarter} professional=${hasProfessional} enterprise=${hasEnterprise}`);
  }

  console.log('PASS pricing page shows starter/professional/enterprise labels');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let hasFailure = false;

  try {
    await verifyPricingPage(page);

    for (const tier of tiers) {
      const tierContext = await browser.newContext();
      const tierPage = await tierContext.newPage();

      try {
        await loginAs(tierPage, tier.credentials);

        for (const [route, shouldAccess] of Object.entries(tier.access)) {
          await tierPage.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' });
          const currentUrl = tierPage.url();
          const allowed = currentUrl.includes(route);

          const pass = shouldAccess ? allowed : currentUrl.includes('/pricing');
          const status = pass ? 'PASS' : 'FAIL';

          console.log(`${status} tier=${tier.label} route=${route} url=${currentUrl} expectedAccess=${shouldAccess}`);

          if (!pass) {
            hasFailure = true;
          }
        }
      } catch (error) {
        console.log(`FAIL tier=${tier.label} setup=${error.message}`);
        hasFailure = true;
      } finally {
        await tierContext.close();
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  process.exit(hasFailure ? 1 : 0);
})();
