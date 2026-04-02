/**
 * Playwright auth setup.
 * Creates a persistent owner storage state to avoid repeated UI logins in tests.
 */

import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const authFile = path.join(process.cwd(), 'playwright/.auth/owner.json');

setup('authenticate owner account', async ({ page }) => {
  const ownerEmail = process.env.E2E_OWNER_EMAIL || 'test-salon@jnbusiness.de';
  const ownerPassword = process.env.E2E_OWNER_PASSWORD || 'TestPassword123!';

  await fs.mkdir(path.dirname(authFile), { recursive: true });

  await page.goto('/login/business');
  await page.fill('input#email, input[type="email"]', ownerEmail);
  await page.fill('input#password, input[type="password"]', ownerPassword);

  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]')
  ]);

  const rateLimited = await page
    .locator(':has-text("Zu viele Anfragen"), :has-text("Zu viele Login-Versuche"), :has-text("too many requests")')
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (rateLimited) {
    throw new Error(
      'Owner auth setup hit login rate limit. Configure a dedicated E2E_OWNER_EMAIL/E2E_OWNER_PASSWORD account for CI.'
    );
  }

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

  const skipOnboarding = page
    .locator('button:has-text("Überspringen"), [role="button"]:has-text("Überspringen"), button:has-text("Skip"), [role="button"]:has-text("Skip")')
    .first();

  if (await skipOnboarding.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipOnboarding.click({ force: true });
  }

  await page.context().storageState({ path: authFile });
});
