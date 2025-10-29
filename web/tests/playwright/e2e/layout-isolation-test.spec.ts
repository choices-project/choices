import { test, expect } from '@playwright/test';

test('layout isolation test', async ({ page }) => {
  const consoleErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console error:', msg.text());
    }
  });

  await page.goto('/test-layout-isolation');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit to see if infinite loops occur
  await page.waitForTimeout(3000);
  
  // Check for infinite loops
  const hasInfiniteLoop = consoleErrors.some(error => 
    error.includes('Maximum update depth exceeded') || 
    error.includes('getServerSnapshot')
  );
  
  expect(hasInfiniteLoop).toBe(false);
  expect(await page.textContent('h1')).toContain('Layout Component Isolation Test');
});
