import { test, expect } from '@playwright/test';

test('infinite loop test page', async ({ page }) => {
  await page.goto('/test-hashtag-store');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the page loads without infinite loop
  await expect(page.locator('h1')).toContainText('Hashtag Store Test');
  
  // Wait a bit to see if infinite loop occurs
  await page.waitForTimeout(5000);
  
  // Check console for errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Check if we have infinite loop errors
  const hasInfiniteLoop = consoleErrors.some(error => 
    error.includes('Maximum update depth exceeded') || 
    error.includes('infinite loop')
  );
  
  expect(hasInfiniteLoop).toBe(false);
});
