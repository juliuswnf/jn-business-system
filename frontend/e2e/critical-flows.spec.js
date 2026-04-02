/**
 * E2E Test: Critical Security and Access Flows
 * Covers route protection, RBAC redirects, session persistence and logout invalidation.
 */

import { test, expect, TEST_USERS } from './fixtures.js';

test.describe.configure({ mode: 'serial' });

async function loginAsOwner(page) {
  await page.goto('/login/business');
  await page.fill('input#email, input[type="email"]', TEST_USERS.owner.email);
  await page.fill('input#password, input[type="password"]', TEST_USERS.owner.password);

  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]')
  ]);

  const rateLimited = await page
    .locator(':has-text("Zu viele Anfragen"), :has-text("Zu viele Login-Versuche"), :has-text("too many requests")')
    .first()
    .isVisible({ timeout: 2500 })
    .catch(() => false);

  return { rateLimited };
}

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
  test.beforeEach(async ({ page }) => {
    const { rateLimited } = await loginAsOwner(page);
    test.skip(rateLimited, 'Backend login rate limit active for this run');

    await page.waitForURL('**/dashboard**', { timeout: 20000 });
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
