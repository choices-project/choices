import { test, expect } from '@playwright/test';

test('minimal polls page test', async ({ page }) => {
  await page.goto('/test-minimal-polls');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check if the page loads without infinite loop
  await expect(page.locator('h1')).toContainText('Polls');
  
  // Wait a bit to see if infinite loop occurs
  await page.waitForTimeout(10000);
  
  // Check console for errors
  const consoleErrors: string[] = [];
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
