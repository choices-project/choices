import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully
    expect(page.url()).toContain('localhost:3000');
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should load auth page', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    expect(page.url()).toContain('/auth');
  });
});
