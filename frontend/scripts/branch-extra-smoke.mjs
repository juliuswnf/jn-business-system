/* eslint-env node */
/* global console, process, setTimeout */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const TARGET_BASE_URL = process.env.BASE_URL || BASE_URL;
const PASSWORDS = ['TestPassword123!', 'Demo@12345'];

const emails = [
  'test-salon@jnbusiness.de',
  'test-tattoo@jnbusiness.de',
  'test-medical@jnbusiness.de',
  'test-wellness@jnbusiness.de',
  'test-barbershop@jnbusiness.de',
  'test-beauty@jnbusiness.de',
  'test-nails@jnbusiness.de',
  'test-other@jnbusiness.de'
];

const routes = ['/dashboard', '/dashboard/bookings', '/dashboard/services', '/dashboard/customers'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await chromium.launch({ headless: true });
  let failed = 0;

  for (const email of emails) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      let loggedIn = false;
      let usedPassword = '';
      let blockedByRateLimit = false;

      // Retry once after waiting when auth limiter responds with 429 message.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.goto(`${TARGET_BASE_URL}/login/business`, { waitUntil: 'domcontentloaded', timeout: 25000 });

        for (const password of PASSWORDS) {
          await page.fill('input#email, input[type="email"]', email);
          await page.fill('input#password, input[type="password"]', password);
          await page.click('button[type="submit"]');
          await page.waitForTimeout(1500);

          if (page.url().includes('/dashboard')) {
            loggedIn = true;
            usedPassword = password;
            break;
          }

          const body = await page.locator('body').innerText();
          if (/zu viele anfragen|too many requests/i.test(body)) {
            blockedByRateLimit = true;
            break;
          }
        }

        if (loggedIn) break;
        if (!blockedByRateLimit) break;

        console.log(`RATE_LIMIT_WAIT ${email} -> waiting 65s before retry`);
        await sleep(65000);
        blockedByRateLimit = false;
      }

      if (!loggedIn) {
        failed += 1;
        const errorText = await page.locator('body').innerText();
        const shortError = errorText.replace(/\s+/g, ' ').slice(0, 180);
        console.log(`FAIL_LOGIN ${email} -> ${page.url()} | ${shortError}`);
        await context.close();
        continue;
      }

      console.log(`OK_LOGIN ${email} (password=${usedPassword})`);

      for (const route of routes) {
        await page.goto(`${TARGET_BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(250);
        const body = (await page.locator('body').innerText()).slice(0, 2000);

        if (/something went wrong|unexpected application error|interner serverfehler|internal server error/i.test(body)) {
          failed += 1;
          console.log(`FAIL_ROUTE ${email} ${route} -> ${page.url()}`);
          break;
        }
      }
    } catch (error) {
      failed += 1;
      console.log(`FAIL_EXCEPTION ${email} -> ${error.message}`);
    }

    await context.close();
    // Keep login volume below strict local auth limits.
    await sleep(12000);
  }

  await browser.close();

  console.log(JSON.stringify({ total: emails.length, passed: emails.length - failed, failed }, null, 2));
  process.exit(failed > 0 ? 2 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
