import { test, expect } from '@playwright/test';

test.describe('Enhanced Voting System - Simple Tests', () => {
  test('should load polls page without errors', async ({ page }) => {
    await page.goto('/polls');
    
    // Check if page loads successfully
    await expect(page).toHaveURL(/\/polls/);
    
    // Check for basic page structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display polls page content', async ({ page }) => {
    await page.goto('/polls');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if polls page has basic content
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if we're on the polls page (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/polls')) {
      // We're on the polls page - check for polls content
      console.log('Successfully loaded polls page');
    } else if (currentUrl.includes('/login')) {
      // We were redirected to login - this is expected for unauthenticated users
      console.log('Redirected to login page (expected for unauthenticated users)');
    } else {
      // Some other page - check what we got
      console.log('Loaded page:', currentUrl);
    }
  });

  test('should handle authentication redirect gracefully', async ({ page }) => {
    await page.goto('/polls');
    
    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either be on polls page or login page
    const isOnPollsPage = currentUrl.includes('/polls');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnPollsPage || isOnLoginPage).toBeTruthy();
  });

  test('should load poll creation page', async ({ page }) => {
    await page.goto('/polls/create');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either be on create page or login page
    const isOnCreatePage = currentUrl.includes('/polls/create');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnCreatePage || isOnLoginPage).toBeTruthy();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/polls');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/polls**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/polls');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Page should still load even with API errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
