const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: 'http://localhost:5173' });
  const page = await context.newPage();

  try {
    await page.goto('/login/employee');
    await page.fill('input#email, input[type="email"]', 'barber.employee@demo.jn-business-system.de');
    await page.fill('input#password, input[type="password"]', 'Demo@12345');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForTimeout(1500)
    ]);

    const currentUrl = page.url();
    const hasUserMenuTrigger = await page.locator('button:has(.w-9.h-9)').first().isVisible().catch(() => false);
    const hasLoginNav = await page.locator('a:has-text("Anmelden")').first().isVisible().catch(() => false);

    const storage = await context.storageState();
    const cookieNames = storage.cookies.map((c) => c.name);

    console.log(JSON.stringify({
      url: currentUrl,
      hasUserMenuTrigger,
      hasLoginNav,
      cookies: cookieNames
    }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
