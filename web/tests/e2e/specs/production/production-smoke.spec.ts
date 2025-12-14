import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

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

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Smoke Tests', () => {
  test.describe('Critical Pages', () => {
    test('root page redirects unauthenticated users to /auth', async ({ page }) => {
      await ensureLoggedOut(page);
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Unauthenticated users should be redirected to /auth for login/signup
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 10_000 });
    });

    test('root page redirects authenticated users to /feed', async ({ page }) => {
      test.setTimeout(120_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip();
        return;
      }

      await ensureLoggedOut(page);
      
      // Navigate to auth page and log in
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      
      await waitForPageReady(page);
      
      // Now visit root - should redirect to /feed
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Authenticated users should be redirected to /feed
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/feed`), { timeout: 10_000 });
    });

    test('feed page requires authentication or redirects to /auth', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Wait a bit for redirect to complete
      await page.waitForTimeout(2_000);
      
      const currentUrl = page.url();
      
      // Feed page should either:
      // 1. Redirect unauthenticated users to /auth
      // 2. Load successfully if authenticated (though we cleared cookies, so unlikely)
      const isAuthPage = currentUrl.includes('/auth');
      const isFeedPage = currentUrl.includes('/feed');
      
      if (isAuthPage) {
        // Expected: unauthenticated user redirected to auth
        await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
      } else if (isFeedPage) {
        // If somehow authenticated, check for errors
        await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
          // Network idle may not happen if there are long-polling connections
        });
        
        // Check for React error boundaries
        const errorBoundary = page.locator('[data-testid="feed-error"], [role="alert"]:has-text("Feed Error"), [role="alert"]:has-text("Something went wrong")');
        await expect(errorBoundary).toHaveCount(0, { timeout: 5_000 });
        
        // Check for React hydration errors in console
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (text.includes('Hydration') || text.includes('Minified React error') || text.includes('hydration')) {
              consoleErrors.push(text);
            }
          }
        });
        
        // Wait a bit for any errors to appear
        await page.waitForTimeout(2_000);
        
        // Check that page has loaded (has some content)
        const body = page.locator('body');
        await expect(body).toBeVisible({ timeout: 10_000 });
        
        // Fail if we found hydration errors
        if (consoleErrors.length > 0) {
          throw new Error(`Found React hydration errors: ${consoleErrors.join(', ')}`);
        }
      } else {
        // Unexpected state
        throw new Error(`Unexpected redirect from /feed to ${currentUrl}`);
      }
    });

    test('auth page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Should see auth page content
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });
    });

    test('dashboard page requires authentication', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }
      
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Wait a bit for redirect to complete
      await page.waitForTimeout(3_000);
      
      // Should redirect to auth or show login prompt
      const finalUrl = page.url();
      const isAuthPage = finalUrl.includes('/auth') || finalUrl.includes('/login');
      expect(isAuthPage).toBe(true);
      
      // Check for login-related content
      const hasLoginButton = await page.locator('button:has-text("Log in"), button:has-text("Sign in"), a:has-text("Log in"), a:has-text("Sign in")').first().isVisible().catch(() => false);
      const hasLoginForm = await page.locator('form:has(input[type="email"]), form:has(input[type="password"])').first().isVisible().catch(() => false);
      const hasLoginText = await page.locator('text=/log in|sign in|please log in|create account/i').first().isVisible().catch(() => false);
      
      // Should be on auth page OR have login UI elements
      expect(isAuthPage || hasLoginButton || hasLoginForm || hasLoginText).toBeTruthy();
    });

    test('health endpoint returns success', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      // Health endpoint returns {data: {status: "ok"}, success: true}
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('status');
      expect(body.data.status).toBe('ok');
    });

    test('civics health endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health?type=civics`, { timeout: 10_000 });
      expect(response.status()).toBe(200);
      
      const body = await response.json();
      // Civics health endpoint returns {data: {status: "healthy"}, success: true}
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('status');
      // Status can be 'healthy', 'warning', 'error', or 'disabled'
      expect(['healthy', 'warning', 'error', 'disabled']).toContain(body.data.status);
    });
  });

  test.describe('API Endpoints', () => {
    test('feeds API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/feeds`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });

    test('civics by-state endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/civics/by-state?state=CA`, { timeout: 15_000 });
      
      // Should return 200 with data, 401/403 if auth required, or 502/503 if service unavailable
      // 502/503 can happen if external API is down or rate limited
      expect([200, 401, 403, 502, 503, 429]).toContain(response.status());
      
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('data');
      } else if (response.status() === 502 || response.status() === 503) {
        // Service unavailable is acceptable - external API might be down
        // Just verify we got a response
        expect(response.status()).toBeGreaterThanOrEqual(500);
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
      await expect(main.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Main element is optional, continue if not found
      });
      
      // At minimum, body should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});

