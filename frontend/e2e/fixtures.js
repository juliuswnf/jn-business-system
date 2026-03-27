/**
 * E2E Test Fixtures and Helpers
 * Shared utilities for all E2E tests
 */

import { test as base, expect } from '@playwright/test';

// Test user credentials
export const TEST_USERS = {
  owner: {
    email: 'test-salon@jnbusiness.de',
    password: 'TestPassword123!',
    name: 'Test Owner'
  },
  customer: {
    email: 'test-customer@jn-business-system.test',
    password: 'TestCustomer123!',
    name: 'Test Customer'
  },
  ceo: {
    email: 'ceo@jn-business-system.test',
    password: 'TestCEO123!',
    name: 'Test CEO'
  }
};

// Test salon data
export const TEST_SALON = {
  name: 'E2E Test Salon',
  slug: 'demo-barber-starter',
  address: 'Test Street 123, 12345 Berlin',
  phone: '+49123456789'
};

// Extend base test with custom fixtures
export const test = base.extend({
  // Auto-login as salon owner
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login/business');
    await page.fill('input#email, input[type="email"]', TEST_USERS.owner.email);
    await page.fill('input#password, input[type="password"]', TEST_USERS.owner.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**');
    await use(page);
  }
});

// Re-export expect
export { expect };

// Helper functions
export const helpers = {
  /**
   * Wait for API response
   */
  async waitForAPI(page, urlPattern, method = 'GET') {
    return page.waitForResponse(
      response => response.url().includes(urlPattern) && response.request().method() === method
    );
  },

  /**
   * Fill booking form
   */
  async fillBookingForm(page, data) {
    if (data.name) await page.fill('input[name="customerName"]', data.name);
    if (data.email) await page.fill('input[name="customerEmail"]', data.email);
    if (data.phone) await page.fill('input[name="customerPhone"]', data.phone);
    if (data.notes) await page.fill('textarea[name="notes"]', data.notes);
  },

  /**
   * Select date in date picker
   */
  async selectDate(page, date) {
    const dateStr = date.toISOString().split('T')[0];
    await page.click(`[data-date="${dateStr}"]`);
  },

  /**
   * Select time slot
   */
  async selectTimeSlot(page, time) {
    await page.click(`[data-time="${time}"]`);
  },

  /**
   * Check for notification/toast
   */
  async expectNotification(page, message, type = 'success') {
    const notification = page.locator(`.notification-${type}, [role="alert"]`);
    await expect(notification).toContainText(message);
  },

  /**
   * Navigate to page and wait for load
   */
  async navigateAndWait(page, path) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
};
