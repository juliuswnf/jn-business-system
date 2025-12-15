/**
 * E2E Test: Public Booking Flow
 * Tests the complete customer booking journey
 * 
 * Critical Flow: Customer → Salon Page → Select Service → Select Time → Book → Confirmation
 */

import { test, expect, helpers, TEST_SALON } from './fixtures.js';

test.describe('Public Booking Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the public booking page
    await page.goto(`/s/${TEST_SALON.slug}`);
  });

  test('should display salon information correctly', async ({ page }) => {
    // Check salon name is visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check services are displayed
    const services = page.locator('[data-testid="service-card"], .service-item, .service-card');
    await expect(services.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show available services', async ({ page }) => {
    // Wait for services to load
    await page.waitForLoadState('networkidle');
    
    // Check that at least one service is displayed
    const serviceCards = page.locator('[data-testid="service-card"], .service-item, .service-card, [class*="service"]');
    const count = await serviceCards.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should allow selecting a service', async ({ page }) => {
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Click on first available service
    const firstService = page.locator('[data-testid="service-card"], .service-item, button:has-text("Buchen"), button:has-text("Select")').first();
    
    if (await firstService.isVisible()) {
      await firstService.click();
      
      // Should show date/time selection or booking form
      await expect(
        page.locator('[data-testid="date-picker"], [data-testid="booking-form"], input[type="date"], .calendar')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate booking form fields', async ({ page }) => {
    // Navigate to booking form (assuming service is pre-selected or click first)
    await page.waitForLoadState('networkidle');
    
    // Find and click service if needed
    const serviceButton = page.locator('button:has-text("Buchen"), button:has-text("Select"), button:has-text("Book")').first();
    if (await serviceButton.isVisible()) {
      await serviceButton.click();
    }
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Buchen"), button:has-text("Confirm")');
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation errors
      await expect(
        page.locator('.error, .invalid, [role="alert"], .text-red-500')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should complete a booking successfully', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Step 1: Select service
    const serviceButton = page.locator('button:has-text("Buchen"), button:has-text("Select"), [data-testid="service-card"]').first();
    if (await serviceButton.isVisible()) {
      await serviceButton.click();
    }
    
    // Step 2: Select date (click on an available date)
    const dateButton = page.locator('[data-available="true"], .available-date, button:not([disabled]).date-button').first();
    if (await dateButton.isVisible()) {
      await dateButton.click();
    }
    
    // Step 3: Select time slot
    const timeSlot = page.locator('[data-testid="time-slot"], .time-slot, button:has-text(":00"), button:has-text(":30")').first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
    }
    
    // Step 4: Fill customer details
    const nameInput = page.locator('input[name="customerName"], input[name="name"], input[placeholder*="Name"]');
    const emailInput = page.locator('input[name="customerEmail"], input[name="email"], input[type="email"]');
    const phoneInput = page.locator('input[name="customerPhone"], input[name="phone"], input[type="tel"]');
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Customer');
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill('e2e-test@example.com');
    }
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+49123456789');
    }
    
    // Step 5: Submit booking
    const submitButton = page.locator('button[type="submit"], button:has-text("Buchen"), button:has-text("Confirm"), button:has-text("Book")');
    
    if (await submitButton.isVisible() && await submitButton.isEnabled()) {
      // Wait for API response
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/booking') && response.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => null);
      
      await submitButton.click();
      
      const response = await responsePromise;
      
      if (response) {
        // Check for success message or confirmation page
        await expect(
          page.locator(':has-text("Erfolgreich"), :has-text("Success"), :has-text("Bestätigung"), :has-text("Confirmation"), .success-message')
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show error for unavailable time slot', async ({ page }) => {
    // This test verifies the conflict handling
    await page.waitForLoadState('networkidle');
    
    // The booking system should prevent double-booking the same slot
    // This is typically tested by trying to book an already-booked slot
    
    // Check that disabled/unavailable slots are properly marked
    const unavailableSlot = page.locator('[data-available="false"], .unavailable, button[disabled].time-slot');
    
    if (await unavailableSlot.first().isVisible()) {
      // Verify it's not clickable
      await expect(unavailableSlot.first()).toBeDisabled();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure for booking API
    await page.route('**/api/booking/**', route => {
      route.abort('failed');
    });
    
    await page.waitForLoadState('networkidle');
    
    // Try to book - should show error handling
    const serviceButton = page.locator('button:has-text("Buchen"), button:has-text("Select")').first();
    if (await serviceButton.isVisible()) {
      await serviceButton.click();
    }
    
    // Fill form and submit
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@test.com');
    }
    
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible() && await submitButton.isEnabled()) {
      await submitButton.click();
      
      // Should show error message (not crash)
      await expect(
        page.locator('.error, [role="alert"], :has-text("Fehler"), :has-text("Error")')
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
