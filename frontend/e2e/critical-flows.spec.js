/**
 * E2E Test: Critical Security and Access Flows
 * Covers route protection, RBAC redirects, session persistence and logout invalidation.
 */

import { test, expect } from './fixtures.js';

test.describe.configure({ mode: 'serial' });

async function dismissOnboardingIfPresent(page) {
  const skipOnboarding = page
    .locator('button:has-text("Überspringen"), [role="button"]:has-text("Überspringen"), button:has-text("Skip"), [role="button"]:has-text("Skip")')
    .first();
  if (await skipOnboarding.isVisible({ timeout: 10000 }).catch(() => false)) {
    await skipOnboarding.click({ force: true });
    await expect(page.locator(':has-text("Willkommen bei JN Business System")').first())
      .toBeHidden({ timeout: 5000 })
      .catch(() => {});
  }
}

async function clearBrowserAuthState(page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test.describe('Critical Access Flows', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect unauthenticated user away from protected route', async ({ page }) => {
    await clearBrowserAuthState(page);

    await page.goto('/dashboard/bookings');

    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('should redirect legacy public booking route to /s/:slug', async ({ page }) => {
    await page.goto('/book/demo-barber-starter');
    await expect(page).toHaveURL(/\/s\/demo-barber-starter$/);
  });
});

test.describe('Critical Owner Session and RBAC Flows', () => {
  test.use({ storageState: 'playwright/.auth/owner-critical.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await dismissOnboardingIfPresent(page);
  });

  test('should block salon owner from admin dashboard route', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test('should block salon owner from CEO routes', async ({ page }) => {
    await page.goto('/ceo/settings');

    await expect(page).not.toHaveURL(/\/ceo\/settings/);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test('should preserve authenticated session across reload', async ({ page }) => {
    await page.goto('/dashboard/bookings');
    await expect(page).toHaveURL(/\/dashboard\/(bookings|.*)/, { timeout: 8000 });

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test('should invalidate protected access after logout', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissOnboardingIfPresent(page);

    const logoutButton = page.locator('button:has-text("Abmelden"), button:has-text("Logout")').last();
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
    await logoutButton.click({ force: true });

    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
