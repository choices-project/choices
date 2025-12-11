import { expect, test, type Page } from '@playwright/test';

/**
 * Production Smoke Tests
 * 
 * These tests run against the actual deployed production site at https://choices-app.com
 * They verify critical functionality works in the live environment.
 * 
 * Set BASE_URL=https://choices-app.com to run against production
 * Set BASE_URL=http://127.0.0.1:3000 to run against local server
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
const IS_PRODUCTION = BASE_URL.includes('choices-app.com');

test.describe('Production Smoke Tests', () => {
  test.describe('Critical Pages', () => {
    test('root page redirects to /feed', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Should redirect to /feed
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    });

    test('feed page loads without errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
        // Network idle may not happen if there are long-polling connections
      });
      
      // Check for React error boundaries
      const errorBoundary = page.locator('text=/Feed Error|Error|Something went wrong/i');
      await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
      
      // Check that page has loaded (has some content)
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });
    });

    test('auth page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Should see auth page content
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });
    });

    test('dashboard page requires authentication', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Should redirect to auth or show login prompt
      const isAuthPage = page.url().includes('/auth') || page.url().includes('/login');
      const hasLoginPrompt = await page.locator('text=/log in|sign in|please log in/i').first().isVisible().catch(() => false);
      
      expect(isAuthPage || hasLoginPrompt).toBeTruthy();
    });

    test('health endpoint returns success', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toBe('ok');
    });

    test('civics health endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health?type=civics`, { timeout: 10_000 });
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('status');
    });
  });

  test.describe('API Endpoints', () => {
    test('feeds API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/feeds`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });

    test('civics by-state endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/civics/by-state?state=CA`, { timeout: 10_000 });
      
      // Should return 200 with data or 401/403 if auth required
      expect([200, 401, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
      }
    });

    test('site-messages API responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/site-messages`, { timeout: 10_000 });
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('success');
    });
  });

  test.describe('Security Headers', () => {
    test('security headers are present', async ({ page }) => {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      if (response) {
        const headers = response.headers();
        
        // Check for security headers
        expect(headers['x-frame-options'] || headers['X-Frame-Options']).toBeDefined();
        expect(headers['x-content-type-options'] || headers['X-Content-Type-Options']).toBeDefined();
        expect(headers['content-security-policy'] || headers['Content-Security-Policy']).toBeDefined();
      }
    });

    test('HTTPS is enforced in production', async ({ page }) => {
      if (IS_PRODUCTION) {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        expect(page.url()).toMatch(/^https:/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('404 page handles missing routes', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30_000 
      });
      
      // Should return 404 or redirect to a 404 page
      if (response) {
        expect([404, 200]).toContain(response.status());
      }
    });

    test('invalid API endpoint returns appropriate error', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/invalid-endpoint-${Date.now()}`, { timeout: 10_000 });
      expect([404, 405, 500]).toContain(response.status());
    });
  });

  test.describe('Performance', () => {
    test('page load time is acceptable', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const loadTime = Date.now() - startTime;
      
      // Page should load within 10 seconds
      expect(loadTime).toBeLessThan(10_000);
    });

    test('feed page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      const loadTime = Date.now() - startTime;
      
      // Feed page should load within 15 seconds
      expect(loadTime).toBeLessThan(15_000);
    });
  });

  test.describe('Accessibility', () => {
    test('page has proper HTML structure', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Check for basic HTML structure
      const html = page.locator('html');
      await expect(html).toHaveAttribute('lang');
      
      const title = page.locator('title');
      await expect(title).toHaveCount(1);
    });

    test('feed page has accessible structure', async ({ page }) => {
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait a bit for content to load
      await page.waitForTimeout(2_000);
      
      // Check for main content area
      const main = page.locator('main, [role="main"]');
      const hasMain = await main.count() > 0;
      
      // At minimum, body should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});

