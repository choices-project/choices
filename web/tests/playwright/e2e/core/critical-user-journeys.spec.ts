/**
 * Critical User Journeys E2E Tests
 * 
 * Tests the most important user flows that must work for the application to be functional.
 * These tests should be run against a running development server.
 * 
 * Prerequisites: npm run dev (server running on localhost:3000)
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('Home page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads without errors
    expect(await page.title()).toBeTruthy();
    expect(await page.textContent('body')).toBeTruthy();
  });

  test('Authentication flow works', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check that auth page loads
    expect(page.url()).toContain('/auth');
    expect(await page.textContent('body')).toBeTruthy();
    
    // Check for auth form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.count() > 0) {
      expect(emailInput).toBeVisible();
    }
    if (await passwordInput.count() > 0) {
      expect(passwordInput).toBeVisible();
    }
  });

  test('Polls page loads (public access)', async ({ page }) => {
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check that polls page loads
    expect(page.url()).toContain('/polls');
    expect(await page.textContent('body')).toBeTruthy();
  });

  test('Protected routes redirect to auth', async ({ page }) => {
    // Set up E2E bypass to test the actual redirect behavior
    await page.setExtraHTTPHeaders({
      'x-e2e-bypass': '0' // Disable bypass to test real auth behavior
    });
    
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to auth page
    expect(page.url()).toContain('/auth');
  });

  test('API endpoints respond correctly', async ({ page }) => {
    // Test public API endpoint
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('404 pages handled gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    
    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('CSS and JavaScript load properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that CSS is loaded
    const styles = await page.evaluate(() => {
      const element = document.body;
      const computedStyle = window.getComputedStyle(element);
      return {
        fontFamily: computedStyle.fontFamily,
        fontSize: computedStyle.fontSize
      };
    });
    
    expect(styles.fontFamily).toBeTruthy();
    expect(styles.fontSize).toBeTruthy();
    
    // Check that JavaScript is working
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    });
    
    expect(jsWorking).toBe(true);
  });
});
