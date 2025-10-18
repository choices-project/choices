import { test, expect } from '@playwright/test';

test.describe('Simple Accessibility Test', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
