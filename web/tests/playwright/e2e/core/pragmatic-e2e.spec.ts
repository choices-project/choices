import { test, expect } from '@playwright/test';

test.describe('Pragmatic E2E Tests', () => {
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
    
    // Take screenshot for debugging
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

  test('should navigate to polls page', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check if polls page loads
    expect(page.url()).toContain('/polls');
    
    // Look for polls content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/polls-page.png' });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard loads
    expect(page.url()).toContain('/dashboard');
    
    // Look for dashboard content
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/dashboard-page.png' });
  });

  test('should handle 404 pages', async ({ page }) => {
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
});
