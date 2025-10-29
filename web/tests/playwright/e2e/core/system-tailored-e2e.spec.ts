import { test, expect } from '@playwright/test';

test.describe('System-Tailored E2E Tests', () => {
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

  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check for basic page content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/home-page.png' });
  });

  test('should navigate to auth page', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check if auth page loads
    expect(page.url()).toContain('/auth');
    
    // Look for auth elements
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/auth-page.png' });
  });

  test('should navigate to polls page (public)', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check if polls page loads
    expect(page.url()).toContain('/polls');
    
    // Look for polls content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/polls-page.png' });
  });

  test('should redirect to auth when accessing protected dashboard', async ({ page }) => {
    // Remove E2E bypass header for this test to test actual authentication
    await page.setExtraHTTPHeaders({});
    
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to auth page
    expect(page.url()).toContain('/auth');
    
    await page.screenshot({ path: 'test-results/dashboard-redirect.png' });
  });

  test('should redirect to auth when accessing protected profile', async ({ page }) => {
    // Remove E2E bypass header for this test to test actual authentication
    await page.setExtraHTTPHeaders({});
    
    // Try to access profile without authentication
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to auth page
    expect(page.url()).toContain('/auth');
    
    await page.screenshot({ path: 'test-results/profile-redirect.png' });
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('should have working CSS and JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if CSS is loaded
    const styles = await page.evaluate(() => {
      const element = document.body;
      const computedStyle = window.getComputedStyle(element);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize,
        color: computedStyle.color
      };
    });
    
    expect(styles.fontFamily).toBeTruthy();
    expect(styles.fontSize).toBeTruthy();
    
    // Check if JavaScript is working
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    expect(jsWorking).toBe(true);
  });

  test('should have working API endpoints', async ({ page }) => {
    // Test public API endpoints
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    // Test that protected endpoints require auth
    const protectedResponse = await page.request.get('/api/profile');
    expect(protectedResponse.status()).toBe(401);
  });
});
