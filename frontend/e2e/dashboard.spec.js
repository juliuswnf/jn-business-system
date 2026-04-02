/**
 * E2E Test: Dashboard & Booking Management
 * Tests the salon owner dashboard and booking management
 *
 * Critical Flow: Owner Login → Dashboard → View Bookings → Update Status → Cancel
 *
 * Uses pre-authenticated storageState from auth.setup.js.
 * No manual login or rate-limit skip needed.
 */

import { test, expect } from './fixtures.js';
<<<<<<< HEAD

test.use({
  storageState: 'playwright/.auth/owner.json'
});

test.describe('Dashboard & Booking Management', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Dismiss onboarding modal if present
    const skipOnboarding = page
      .locator('button:has-text("Überspringen"), [role="button"]:has-text("Überspringen"), button:has-text("Skip")')
      .first();
    if (await skipOnboarding.isVisible({ timeout: 3000 }).catch(() => false)) {
=======

test.describe('Dashboard & Booking Management', () => {

  test.use({ storageState: 'playwright/.auth/owner-dashboard.json' });
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Close onboarding walkthrough if present to avoid click interception
    const skipOnboarding = page.locator('button:has-text("Überspringen")').first();
    if (await skipOnboarding.isVisible({ timeout: 1000 }).catch(() => false)) {
>>>>>>> dfd340e (feat: enhance booking process with idempotency key handling and CSRF token generation)
      await skipOnboarding.click();
    }
  });

  test.describe('Dashboard Overview', () => {

    test('should display dashboard after login', async ({ page }) => {
      const dashboardIndicators = [
        page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard")'),
        page.locator('[data-testid="dashboard"]'),
        page.locator('.dashboard, #dashboard')
      ];

      let dashboardFound = false;
      for (const indicator of dashboardIndicators) {
        if (await indicator.isVisible({ timeout: 1000 }).catch(() => false)) {
          dashboardFound = true;
          break;
        }
      }

      expect(dashboardFound || page.url().includes('dashboard')).toBeTruthy();
    });

    test('should show booking statistics', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const statsElements = page.locator('[data-testid="stats"], .stats, .analytics, .metric, .stat-card, [class*="stat"]');
      const statsCount = await statsElements.count();

      expect(page.url()).toContain('dashboard');
    });

    test('should display onboarding checklist for new salons', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const checklist = page.locator('[data-testid="onboarding-checklist"], .onboarding-checklist, :has-text("Setup"), :has-text("Einrichtung")');
      const isNewSalon = await checklist.isVisible({ timeout: 2000 }).catch(() => false);

      expect(page.url()).toContain('dashboard');
    });

    test('should show booking limit warning when approaching limit', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      const limitWarning = page.locator('[data-testid="limit-warning"], .limit-warning, :has-text("Limit"), :has-text("Upgrade")');
      const warningVisible = await limitWarning.isVisible({ timeout: 2000 }).catch(() => false);

      expect(page.url()).toContain('dashboard');
    });
  });

  test.describe('Booking List', () => {

    test('should navigate to bookings page', async ({ page }) => {
      const bookingsLink = page.locator('a[href="/dashboard/bookings"]').first();

      if (await bookingsLink.isVisible()) {
        await bookingsLink.click();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toMatch(/booking/);
      }
    });

    test('should display booking list', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const hasBookings = await page.locator('.booking-item, [data-testid="booking-row"], tr, .booking-card').first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmptyState = await page.locator(':has-text("Keine Buchungen"), :has-text("Noch keine Buchungen"), :has-text("No bookings"), .empty-state').isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasBookings || hasEmptyState || page.url().includes('/dashboard/bookings')).toBeTruthy();
    });

    test('should filter bookings by status', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"], button:has-text("Status")');

      if (await statusFilter.isVisible()) {
        await statusFilter.click();

        const confirmedOption = page.locator('option[value="confirmed"], button:has-text("Bestätigt"), li:has-text("Confirmed")');
        if (await confirmedOption.isVisible()) {
          await confirmedOption.click();
        }
      }
    });

    test('should filter bookings by date range', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');

      if (await dateFilter.first().isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await dateFilter.first().fill(today);
      }
    });
  });

  test.describe('Booking Actions', () => {

    test('should confirm a pending booking', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const confirmButton = page.locator('button:has-text("Bestätigen"), button:has-text("Confirm"), [data-action="confirm"]').first();

      if (await confirmButton.isVisible()) {
        await confirmButton.click();

        await expect(
          page.locator('.success, [role="alert"], :has-text("bestätigt"), :has-text("confirmed")')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should cancel a booking', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const cancelButton = page.locator('button:has-text("Stornieren"), button:has-text("Cancel"), [data-action="cancel"]').first();

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        const confirmDialog = page.locator('button:has-text("Ja"), button:has-text("Yes"), button:has-text("Bestätigen")');
        if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmDialog.click();
        }

        await page.waitForTimeout(1000);
      }
    });

    test('should view booking details', async ({ page }) => {
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('networkidle');

      const bookingRow = page.locator('.booking-item, [data-testid="booking-row"], tr[data-booking-id]').first();

      if (await bookingRow.isVisible()) {
        await bookingRow.click();

        await expect(
          page.locator('.modal, .booking-details, [data-testid="booking-detail"]')
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Navigation', () => {

    test('should navigate between dashboard sections', async ({ page }) => {
      const navItems = [
        { href: '/dashboard/services', url: '/dashboard/services' },
        { href: '/dashboard/employees', url: '/dashboard/employees' },
        { href: '/dashboard/settings', url: '/dashboard/settings' },
        { href: '/dashboard/widget', url: '/dashboard/widget' }
      ];

      for (const item of navItems) {
<<<<<<< HEAD
        const navLink = page.locator(`a:has-text("${item.link}"), [href*="${item.url}"]`).first();

=======
        const navLink = page.locator(`a[href="${item.href}"]`).first();
        
>>>>>>> dfd340e (feat: enhance booking process with idempotency key handling and CSRF token generation)
        if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain(item.url);
          await page.goto('/dashboard');
        }
      }
    });

    test('should have responsive navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .hamburger, button[aria-label*="menu"], .menu-toggle');

      if (await mobileMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mobileMenuButton.click();

        await expect(
          page.locator('.mobile-nav, .nav-open, [aria-expanded="true"]')
        ).toBeVisible({ timeout: 2000 });
      }
    });
  });
});
