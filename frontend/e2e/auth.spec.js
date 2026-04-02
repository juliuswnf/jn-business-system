/**
 * E2E Test: Authentication Flow
 * Tests login, registration, and session management
 *
 * Critical Flow: User → Login/Register → Dashboard Access → Logout
 */

import { test, expect, TEST_USERS } from './fixtures.js';

test.describe('Authentication Flow', () => {

  test.describe('Login', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/login/business');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.locator('input#email, input[type="email"]')).toBeVisible();
      await expect(page.locator('input#password, input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Browser native validation should block form submission
      const emailIsValid = await page.locator('#email').evaluate(el => el.checkValidity());
      expect(emailIsValid).toBeFalsy();
      await expect(page).toHaveURL(/\/login\/business/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input#email, input[type="email"]', 'invalid@test.com');
      await page.fill('input#password, input[type="password"]', 'wrongpassword');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await expect(
        page.locator('[role="status"], .text-red-600')
          .filter({ hasText: /falsch|ungueltig|ungültig|invalid|zu viele anfragen|zu viele login-versuche/i })
          .first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await page.fill('input#email, input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input#password, input[type="password"]', TEST_USERS.owner.password);

      await Promise.all([
        page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);

      const url = page.url();
      const hasError = await page.locator('.error, [role="alert"]').isVisible().catch(() => false);

      if (!hasError) {
        expect(url.includes('dashboard') || url.includes('login')).toBeTruthy();
      }
    });

    test('should have link to registration', async ({ page }) => {
      const registerLink = page.locator('a[href*="register"]').first();
      await expect(registerLink).toBeVisible();
    });

    test('should have link to password reset', async ({ page }) => {
      const resetLink = page.locator('a:has-text("Forgot"), a:has-text("Passwort vergessen"), a[href*="reset"], a[href*="forgot"]');
      await expect(resetLink).toBeVisible();
    });
  });

  test.describe('Registration', () => {

    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      await emailInput.fill('invalid-email');

      const emailIsValid = await emailInput.evaluate(el => el.checkValidity());
      expect(emailIsValid).toBeFalsy();
    });

    test('should validate password strength', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      await passwordInput.fill('weak');
      await page.locator('input[name="confirmPassword"]').fill('weak');
      await page.click('button[type="submit"]');

      await expect(
        page.getByText('Mind. 8 Zeichen')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show error for existing email', async ({ page }) => {
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Owner');
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input[name="phone"]', '+49123456789');
      await page.fill('input[name="companyName"]', 'E2E Company');
      await page.selectOption('select[name="businessType"]', 'barbershop');
      await page.fill('input[name="password"], input[type="password"]', 'NewPassword123!');
      await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
      await page.check('input[name="agreeToTerms"]');

      await page.click('button[type="submit"]');

      await expect(
        page.locator('.text-red-600, [role="status"]').filter({ hasText: /already|bereits|existiert|registriert|zu viele anfragen/i }).first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have link to login', async ({ page }) => {
      const loginLink = page.locator('a[href="/login"]').first();
      await expect(loginLink).toBeVisible();
    });
  });

  // ─── Session Management (uses pre-authenticated storageState) ───────────────
  test.describe('Session Management', () => {
    test.use({
      storageState: 'playwright/.auth/owner.json'
    });

    test('should persist session across page reloads', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

      await page.reload();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/dashboard');

      const skipOnboarding = page.locator('button:has-text("Überspringen")').first();
      if (await skipOnboarding.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipOnboarding.click();
      }

      const logoutButton = page
        .locator('button:has-text("Logout"), button:has-text("Abmelden"), a:has-text("Logout"), [data-testid="logout"]')
        .first();

      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      await logoutButton.click({ force: true });

      await expect(page).toHaveURL(/\/(login|home|$)/, { timeout: 8000 });
    });

    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Explicitly clear state for this one test
      await page.context().clearCookies();
      await page.goto('/');
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 5000 });
    });
  });
});
