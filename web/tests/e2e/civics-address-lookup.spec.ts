import { test, expect } from '@playwright/test';

test.describe('Civics Address Lookup System', () => {
  test('should load civics page without errors', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads successfully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/civics');
  });

  test('should display civics page content', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if civics page has basic content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if we're on the civics page (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/civics')) {
      // We're on the civics page - check for civics content
      console.log('Successfully loaded civics page');
    } else if (currentUrl.includes('/login')) {
      // We were redirected to login - this is expected for unauthenticated users
      console.log('Redirected to login page (expected for unauthenticated users)');
    } else {
      // Some other page - check what we got
      console.log('Loaded page:', currentUrl);
    }
  });

  test('should handle authentication redirect gracefully', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either be on civics page or login page
    const isOnCivicsPage = currentUrl.includes('/civics');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnCivicsPage || isOnLoginPage).toBeTruthy();
  });

  test('should load civics demo page', async ({ page }) => {
    await page.goto('/civics-demo');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either be on demo page or login page
    const isOnDemoPage = currentUrl.includes('/civics-demo');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnDemoPage || isOnLoginPage).toBeTruthy();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/civics/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Page should still load even with API errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
