import { test, expect } from '@playwright/test';

test('minimal dashboard test', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('Console error:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log('Page error:', error.message);
  });

  await page.goto('/test-minimal-dashboard');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit to see if infinite loops occur
  await page.waitForTimeout(5000);
  
  // Check for infinite loops
  const hasInfiniteLoop = consoleErrors.some(error => 
    error.includes('Maximum update depth exceeded') || 
    error.includes('getServerSnapshot')
  );
  
  expect(hasInfiniteLoop).toBe(false);
  expect(await page.textContent('h1')).toContain('Minimal Dashboard Test');
});
