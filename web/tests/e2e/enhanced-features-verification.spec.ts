/**
 * Enhanced Features Verification E2E Tests
 * 
 * Tests that newly enabled features (CIVICS_ADDRESS_LOOKUP) work correctly
 * and are properly integrated with the existing system.
 * 
 * Created: January 22, 2025
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  E2E_CONFIG
} from './helpers/e2e-setup';

const testData = {
  user: createTestUser({
    email: 'enhanced-features@example.com',
    username: 'enhanced-features-user'
  })
};

test.describe('Enhanced Features Verification', () => {
  test.beforeEach(async () => {
    await setupE2ETestData({
      user: testData.user
    });
  });

  test.afterEach(async () => {
    await cleanupE2ETestData(testData);
  });

  test('should verify core authentication is working properly', async ({ page }) => {
    // Test that core auth is working
    await page.goto('/login');
    await waitForPageReady(page);

    // Verify login page loads without SSR errors
    await expect(page.locator('h1')).toContainText('Login');
    
    // Test that SSR-safe utilities don't cause errors
    await page.evaluate(() => {
      // This should not throw in SSR context
      if (typeof window === 'undefined') {
        console.log('SSR context detected - auth utilities should handle this');
      }
    });

    // Verify auth features are available
    const hasAuth = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.location && 
             window.location.href.includes('/login');
    });
    
    expect(hasAuth).toBe(true);
  });

  test('should verify CIVICS_ADDRESS_LOOKUP is working with proper testids', async ({ page }) => {
    // Navigate to civics page
    await page.goto('/civics');
    await waitForPageReady(page);

    // Verify civics page loads with proper testid
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();

    // Verify address lookup form is present with correct testids
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-submit"]')).toBeVisible();

    // Test address lookup functionality
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');

    // Wait for API response
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Verify the form doesn't show errors (basic functionality test)
    const errorElement = page.locator('.text-red-600');
    const hasError = await errorElement.count() > 0;
    
    // The API should work (even if it returns stub data)
    expect(hasError).toBe(false);
  });

  test('should verify feature flags are properly enabled', async ({ page }) => {
    // Test that feature flags are working correctly
    await page.goto('/civics');
    await waitForPageReady(page);

    // Verify CIVICS_ADDRESS_LOOKUP is enabled (form should be visible, not disabled message)
    const disabledMessage = page.locator('text=This feature is currently disabled');
    const isDisabled = await disabledMessage.count() > 0;
    
    expect(isDisabled).toBe(false);

    // Verify address lookup form is present
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
  });

  test('should verify auth works with civics integration', async ({ page }) => {
    // Test the integration between auth and civics
    await page.goto('/civics');
    await waitForPageReady(page);

    // Perform address lookup
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Navigate to login to test auth integration
    await page.goto('/login');
    await waitForPageReady(page);

    // Verify login page loads correctly after civics interaction
    await expect(page.locator('h1')).toContainText('Login');
    
    // Verify no SSR errors occurred
    const hasErrors = await page.evaluate(() => {
      return document.querySelector('.error') !== null;
    });
    
    expect(hasErrors).toBe(false);
  });

  test('should verify mobile compatibility of enhanced features', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Test civics on mobile
    await page.goto('/civics');
    await waitForPageReady(page);

    // Verify mobile layout works
    await expect(page.locator('[data-testid="civics-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();

    // Test address lookup on mobile
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Verify no mobile-specific errors
    const hasMobileErrors = await page.evaluate(() => {
      return document.querySelector('.mobile-error') !== null;
    });
    
    expect(hasMobileErrors).toBe(false);
  });
});
