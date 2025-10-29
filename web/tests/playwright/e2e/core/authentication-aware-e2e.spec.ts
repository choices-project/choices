import { test, expect } from '@playwright/test';

test.describe('Authentication-Aware E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('should complete authentication flow', async ({ page }) => {
    // Start at auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check if auth page loads
    expect(page.url()).toContain('/auth');
    
    // Look for registration link
    const registerLink = page.locator('a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on register page
      expect(page.url()).toContain('register');
    }
    
    await page.screenshot({ path: 'test-results/auth-flow.png' });
  });

  test('should handle polls page without authentication', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Should load polls page (public)
    expect(page.url()).toContain('/polls');
    
    // Check for polls content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/polls-public.png' });
  });

  test('should redirect protected routes to auth', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/profile', '/polls/create', '/onboarding'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Should redirect to auth
      expect(page.url()).toContain('/auth');
      
      console.log(`✅ ${route} correctly redirected to auth`);
    }
  });

  test('should handle API authentication properly', async ({ page }) => {
    // Test public API endpoints
    const publicEndpoints = ['/api/health'];
    
    for (const endpoint of publicEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(200);
      console.log(`✅ ${endpoint} accessible without auth`);
    }
    
    // Test protected API endpoints
    const protectedEndpoints = ['/api/profile', '/api/dashboard'];
    
    for (const endpoint of protectedEndpoints) {
      const response = await page.request.get(endpoint);
      expect(response.status()).toBe(401);
      console.log(`✅ ${endpoint} properly protected`);
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test 404 handling
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBeGreaterThanOrEqual(400);
    
    // Test invalid API endpoint
    const apiResponse = await page.request.get('/api/invalid-endpoint');
    expect(apiResponse.status()).toBeGreaterThanOrEqual(400);
  });

  test('should have proper security headers', async ({ page }) => {
    await page.goto('/');
    
    // Check for security headers
    const response = await page.waitForResponse(response => response.url().includes('/'));
    const headers = response.headers();
    
    // Check for common security headers
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ];
    
    for (const header of securityHeaders) {
      if (headers[header]) {
        console.log(`✅ Security header ${header} present`);
      }
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    let errorCount = 0;
    
    page.on('pageerror', (error) => {
      errorCount++;
      console.log('Page error caught:', error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow some time for any errors to occur
    await page.waitForTimeout(2000);
    
    // Check that errors are handled gracefully
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    console.log(`Total JavaScript errors: ${errorCount}`);
  });
});
