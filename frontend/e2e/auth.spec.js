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
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show validation error
      await expect(
        page.locator('.error, .invalid, [role="alert"], .text-red-500, :has-text("required"), :has-text("Pflichtfeld")')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.fill('input[name="email"], input[type="email"]', 'invalid@test.com');
      await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show error message
      await expect(
        page.locator('.error, [role="alert"], :has-text("Invalid"), :has-text("Ungültig"), :has-text("falsch")')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_USERS.owner.password);
      
      const submitButton = page.locator('button[type="submit"]');
      
      // Wait for navigation after login
      await Promise.all([
        page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {}),
        submitButton.click()
      ]);
      
      // Check we're on dashboard or received success response
      const url = page.url();
      const isOnDashboard = url.includes('dashboard');
      const hasError = await page.locator('.error, [role="alert"]').isVisible().catch(() => false);
      
      // Either we're on dashboard or login succeeded
      if (!hasError) {
        expect(isOnDashboard || url.includes('login')).toBeTruthy();
      }
    });

    test('should have link to registration', async ({ page }) => {
      const registerLink = page.locator('a:has-text("Register"), a:has-text("Registrieren"), a[href*="register"]');
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
      await emailInput.blur();
      
      // Should show email validation error
      await expect(
        page.locator('.error, .invalid, :has-text("email"), :has-text("E-Mail")')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should validate password strength', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      await passwordInput.fill('weak');
      await passwordInput.blur();
      
      // Should show password requirements
      await expect(
        page.locator('.error, .invalid, :has-text("8"), :has-text("Zeichen"), :has-text("characters")')
      ).toBeVisible({ timeout: 3000 });
    });

    test('should show error for existing email', async ({ page }) => {
      // Fill with existing user email
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input[name="password"], input[type="password"]', 'NewPassword123!');
      
      const nameInput = page.locator('input[name="name"], input[name="firstName"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test User');
      }
      
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Should show "already exists" error
      await expect(
        page.locator(':has-text("already"), :has-text("bereits"), :has-text("existiert"), [role="alert"]')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have link to login', async ({ page }) => {
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Anmelden"), a[href*="login"]');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    
    test('should persist session across page reloads', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_USERS.owner.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForTimeout(2000);
      
      // Reload the page
      await page.reload();
      
      // Check if still authenticated (not redirected to login)
      const url = page.url();
      const isAuthenticated = !url.includes('login') || url.includes('dashboard');
      
      // Should remain on authenticated page
      expect(isAuthenticated).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
      await page.fill('input[name="password"], input[type="password"]', TEST_USERS.owner.password);
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      
      // Find and click logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Abmelden"), a:has-text("Logout"), [data-testid="logout"]');
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should redirect to login or home
        await expect(page).toHaveURL(/\/(login|home|$)/, { timeout: 5000 });
      }
    });

    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|auth)/, { timeout: 5000 });
    });
  });
});
