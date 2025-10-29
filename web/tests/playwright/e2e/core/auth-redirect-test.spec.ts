import { test, expect } from '@playwright/test';

test.describe('Authentication Redirect Tests', () => {
  test('should redirect to auth when accessing protected dashboard (no E2E bypass)', async ({ page }) => {
    // Remove E2E bypass header completely
    await page.setExtraHTTPHeaders({});
    
    // Add console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    // Add page error monitoring
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log('Page error:', error.message);
    });
    
    console.log('🔍 Testing dashboard redirect without E2E bypass...');
    
    // Try to access dashboard without authentication
    const response = await page.goto('/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('🔍 Response status:', response?.status());
    console.log('🔍 Final URL:', page.url());
    console.log('🔍 Console errors:', consoleErrors.length);
    console.log('🔍 Page errors:', pageErrors.length);
    
    // Should redirect to auth page
    expect(page.url()).toContain('/auth');
    
    // Check for infinite loops
    expect(consoleErrors.some(error => error.includes('Maximum update depth exceeded'))).toBe(false);
    expect(pageErrors.some(error => error.includes('Maximum update depth exceeded'))).toBe(false);
  });

  test('should redirect to auth when accessing protected profile (no E2E bypass)', async ({ page }) => {
    // Remove E2E bypass header completely
    await page.setExtraHTTPHeaders({});
    
    // Add console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    // Add page error monitoring
    const pageErrors: string[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log('Page error:', error.message);
    });
    
    console.log('🔍 Testing profile redirect without E2E bypass...');
    
    // Try to access profile without authentication
    const response = await page.goto('/profile', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('🔍 Response status:', response?.status());
    console.log('🔍 Final URL:', page.url());
    console.log('🔍 Console errors:', consoleErrors.length);
    console.log('🔍 Page errors:', pageErrors.length);
    
    // Should redirect to auth page
    expect(page.url()).toContain('/auth');
    
    // Check for infinite loops
    expect(consoleErrors.some(error => error.includes('Maximum update depth exceeded'))).toBe(false);
    expect(pageErrors.some(error => error.includes('Maximum update depth exceeded'))).toBe(false);
  });

  test('should work with E2E bypass for other tests', async ({ page }) => {
    // Keep E2E bypass for this test
    console.log('🔍 Testing with E2E bypass enabled...');
    
    // Try to access dashboard with E2E bypass (should work)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should NOT redirect to auth page (E2E bypass active)
    expect(page.url()).toContain('/dashboard');
  });
});
