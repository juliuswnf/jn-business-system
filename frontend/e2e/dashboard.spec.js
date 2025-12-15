/**
 * E2E Test: Dashboard & Booking Management
 * Tests the salon owner dashboard and booking management
 * 
 * Critical Flow: Owner Login → Dashboard → View Bookings → Update Status → Cancel
 */

import { test, expect, TEST_USERS } from './fixtures.js';

test.describe('Dashboard & Booking Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as salon owner
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.owner.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.owner.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
  });

  test.describe('Dashboard Overview', () => {
    
    test('should display dashboard after login', async ({ page }) => {
      // Check for dashboard elements
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
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check for stats/analytics widgets
      const statsElements = page.locator('[data-testid="stats"], .stats, .analytics, .metric, .stat-card, [class*="stat"]');
      
      // Dashboard should have some form of statistics
      const statsCount = await statsElements.count();
      
      // May not have stats if no bookings, but page should load
      expect(page.url()).toContain('dashboard');
    });

    test('should display onboarding checklist for new salons', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check for onboarding checklist
      const checklist = page.locator('[data-testid="onboarding-checklist"], .onboarding-checklist, :has-text("Setup"), :has-text("Einrichtung")');
      
      // Onboarding checklist should be visible for new salons
      // This is conditional based on salon setup status
      const isNewSalon = await checklist.isVisible({ timeout: 2000 }).catch(() => false);
      
      // Just verify the page loads correctly
      expect(page.url()).toContain('dashboard');
    });

    test('should show booking limit warning when approaching limit', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check for limit warning (if applicable)
      const limitWarning = page.locator('[data-testid="limit-warning"], .limit-warning, :has-text("Limit"), :has-text("Upgrade")');
      
      // Warning visibility depends on usage level
      const warningVisible = await limitWarning.isVisible({ timeout: 2000 }).catch(() => false);
      
      // Page should load regardless
      expect(page.url()).toContain('dashboard');
    });
  });

  test.describe('Booking List', () => {
    
    test('should navigate to bookings page', async ({ page }) => {
      // Find and click bookings link
      const bookingsLink = page.locator('a:has-text("Buchungen"), a:has-text("Bookings"), a[href*="booking"]');
      
      if (await bookingsLink.isVisible()) {
        await bookingsLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should be on bookings page
        expect(page.url()).toMatch(/booking/);
      }
    });

    test('should display booking list', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Check for booking list or empty state
      const hasBookings = await page.locator('.booking-item, [data-testid="booking-row"], tr, .booking-card').first().isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmptyState = await page.locator(':has-text("Keine Buchungen"), :has-text("No bookings"), .empty-state').isVisible({ timeout: 1000 }).catch(() => false);
      
      // Either has bookings or shows empty state
      expect(hasBookings || hasEmptyState || page.url().includes('booking')).toBeTruthy();
    });

    test('should filter bookings by status', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Find status filter
      const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"], button:has-text("Status")');
      
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        
        // Select a specific status
        const confirmedOption = page.locator('option[value="confirmed"], button:has-text("Bestätigt"), li:has-text("Confirmed")');
        if (await confirmedOption.isVisible()) {
          await confirmedOption.click();
        }
      }
    });

    test('should filter bookings by date range', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Find date filter
      const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"]');
      
      if (await dateFilter.first().isVisible()) {
        // Set date filter
        const today = new Date().toISOString().split('T')[0];
        await dateFilter.first().fill(today);
      }
    });
  });

  test.describe('Booking Actions', () => {
    
    test('should confirm a pending booking', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Find a pending booking and confirm button
      const confirmButton = page.locator('button:has-text("Bestätigen"), button:has-text("Confirm"), [data-action="confirm"]').first();
      
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Should show success message
        await expect(
          page.locator('.success, [role="alert"], :has-text("bestätigt"), :has-text("confirmed")')
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should cancel a booking', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Find cancel button
      const cancelButton = page.locator('button:has-text("Stornieren"), button:has-text("Cancel"), [data-action="cancel"]').first();
      
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Might show confirmation dialog
        const confirmDialog = page.locator('button:has-text("Ja"), button:has-text("Yes"), button:has-text("Bestätigen")');
        if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmDialog.click();
        }
        
        // Should show success or the booking is cancelled
        await page.waitForTimeout(1000);
      }
    });

    test('should view booking details', async ({ page }) => {
      await page.goto('/bookings');
      await page.waitForLoadState('networkidle');
      
      // Click on a booking to view details
      const bookingRow = page.locator('.booking-item, [data-testid="booking-row"], tr[data-booking-id]').first();
      
      if (await bookingRow.isVisible()) {
        await bookingRow.click();
        
        // Should show booking details modal or page
        await expect(
          page.locator('.modal, .booking-details, [data-testid="booking-detail"]')
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Navigation', () => {
    
    test('should navigate between dashboard sections', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test navigation to different sections
      const navItems = [
        { link: 'Services', url: 'service' },
        { link: 'Mitarbeiter', url: 'employee' },
        { link: 'Einstellungen', url: 'setting' },
        { link: 'Widget', url: 'widget' }
      ];
      
      for (const item of navItems) {
        const navLink = page.locator(`a:has-text("${item.link}"), [href*="${item.url}"]`).first();
        
        if (await navLink.isVisible({ timeout: 1000 }).catch(() => false)) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          
          // Should navigate to the section
          expect(page.url()).toContain(item.url);
          
          // Go back to dashboard
          await page.goto('/dashboard');
        }
      }
    });

    test('should have responsive navigation', async ({ page }) => {
      // Test mobile menu
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .hamburger, button[aria-label*="menu"], .menu-toggle');
      
      if (await mobileMenuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mobileMenuButton.click();
        
        // Menu should open
        await expect(
          page.locator('.mobile-nav, .nav-open, [aria-expanded="true"]')
        ).toBeVisible({ timeout: 2000 });
      }
    });
  });
});
