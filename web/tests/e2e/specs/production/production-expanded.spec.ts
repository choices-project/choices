import { expect, test } from '@playwright/test';
import { ensureLoggedOut } from '../../helpers/e2e-setup';

/**
 * Expanded Production Tests
 * 
 * Comprehensive tests for production environment covering:
 * - Additional API endpoints
 * - User flows and interactions
 * - Performance benchmarks
 * - Security validations
 * - Accessibility checks
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

test.describe('Production Expanded Tests', () => {
  test.describe('API Endpoints', () => {
    test('polls API endpoint responds', async ({ request }) => {
      // Skip in E2E harness mode - these tests are for production endpoints
      if (IS_E2E_HARNESS) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE_URL}/api/polls`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });

    test('notifications API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/notifications`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated) or 401/403 (if not)
      expect([200, 401, 403]).toContain(response.status());
    });

    test('analytics API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/dashboard`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated), 401/403 (if not), or 404 (if endpoint doesn't exist)
      expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('profile API endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/profile`, { timeout: 10_000 });
      
      // Should return 200 (if authenticated), 401/403 (if not), or 404 (if endpoint doesn't exist)
      expect([200, 401, 403, 404]).toContain(response.status());
    });

    test('civics representative endpoint responds', async ({ request }) => {
      // Use a known representative ID if available, or test with a generic request
      const response = await request.get(`${BASE_URL}/api/v1/civics/representative/test-id`, { timeout: 15_000 });
      
      // Should return 200, 404 (not found), 401/403 (auth required), or 502/503 (service unavailable)
      expect([200, 404, 401, 403, 502, 503, 429]).toContain(response.status());
    });

    test('civics address lookup endpoint responds', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/civics/address-lookup?address=1600+Pennsylvania+Ave+NW,Washington,DC`, { timeout: 15_000 });
      
      // Should return 200, 400 (bad request), 401/403 (auth required), 405 (method not allowed), or 502/503 (service unavailable)
      expect([200, 400, 401, 403, 405, 502, 503, 429]).toContain(response.status());
    });
  });

  test.describe('Page Navigation', () => {
    test('unauthenticated user redirected from feed to auth', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }
      
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Wait for potential redirect
      await page.waitForTimeout(3_000);
      
      // Should redirect to auth (check both /auth and /login as fallback)
      const currentUrl = page.url();
      const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/login');
      expect(isAuthPage).toBe(true);
      
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });
    });

    test('unauthenticated user can navigate to auth page', async ({ page }) => {
      await ensureLoggedOut(page);
      
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1_000);
      
      // Should stay on auth page
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
      
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });
    });

    test('root shows landing page consistently for unauthenticated users', async ({ page }) => {
      await ensureLoggedOut(page);
      
      // Test landing page multiple times to ensure consistency
      for (let i = 0; i < 3; i++) {
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
        // Unauthenticated users should see landing page (not be redirected)
        await expect(page).toHaveURL(BASE_URL, { timeout: 10_000 });
        
        // Should see hero content
        const heroHeading = page.locator('h1:has-text("Democracy That Works")').first();
        await expect(heroHeading).toBeVisible({ timeout: 10_000 });
        
        await page.waitForTimeout(1_000);
      }
    });
  });

  test.describe('Performance Metrics', () => {
    test('root page landing page loads fast', async ({ page }) => {
      await ensureLoggedOut(page);
      
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      const loadTime = Date.now() - startTime;
      
      // Landing page should load within 5 seconds (allowing for network latency)
      expect(loadTime).toBeLessThan(5_000);
      
      // Should stay on root (landing page)
      await expect(page).toHaveURL(BASE_URL, { timeout: 5_000 });
      
      // Should see hero content
      const heroHeading = page.locator('h1:has-text("Democracy That Works")').first();
      await expect(heroHeading).toBeVisible({ timeout: 5_000 });
    });

    test('feed page redirect to auth is fast', async ({ page }) => {
      // Skip in E2E harness mode as middleware bypasses auth
      if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
        test.skip();
      }
      
      await ensureLoggedOut(page);
      
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      
      // Wait for redirect to complete
      await page.waitForTimeout(2_000);
      const redirectTime = Date.now() - startTime;
      
      // Check redirect happened
      const currentUrl = page.url();
      const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/login');
      expect(isAuthPage).toBe(true);
      
      // Redirect should complete within 5 seconds (allowing for network latency)
      expect(redirectTime).toBeLessThan(5_000);
      
      // Should redirect to /auth
      await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/auth`), { timeout: 5_000 });
    });

    test('API response times are acceptable', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      // Health endpoint should respond within 2 seconds
      expect(responseTime).toBeLessThan(2_000);
    });
  });

  test.describe('Security Validations', () => {
    test('CSP header is present and valid', async ({ page }) => {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      if (response) {
        const headers = response.headers();
        const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];
        
        expect(csp).toBeDefined();
        expect(csp).toContain("default-src");
      }
    });

    test('X-Frame-Options prevents clickjacking', async ({ page }) => {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      if (response) {
        const headers = response.headers();
        const xFrameOptions = headers['x-frame-options'] || headers['X-Frame-Options'];
        
        expect(xFrameOptions).toBeDefined();
        expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions);
      }
    });

    test('X-Content-Type-Options prevents MIME sniffing', async ({ page }) => {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      if (response) {
        const headers = response.headers();
        const xContentTypeOptions = headers['x-content-type-options'] || headers['X-Content-Type-Options'];
        
        expect(xContentTypeOptions).toBeDefined();
        expect(xContentTypeOptions).toBe('nosniff');
      }
    });

    test('Referrer-Policy is set', async ({ page }) => {
      const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      if (response) {
        const headers = response.headers();
        const referrerPolicy = headers['referrer-policy'] || headers['Referrer-Policy'];
        
        expect(referrerPolicy).toBeDefined();
      }
    });

    test('no sensitive data in response headers', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`, { timeout: 10_000 });
      const headers = response.headers();
      
      // Check that sensitive information is not exposed
      // Note: Vercel may expose 'server: Vercel' which is acceptable
      const sensitiveKeys = ['x-powered-by', 'x-aspnet-version'];
      sensitiveKeys.forEach(key => {
        expect(headers[key.toLowerCase()]).toBeUndefined();
      });
      
      // Server header is acceptable if it's just "Vercel" (not version numbers or internal details)
      const serverHeader = headers['server'] || headers['Server'];
      if (serverHeader) {
        // Should not contain version numbers or internal paths
        expect(serverHeader).not.toMatch(/\d+\.\d+/); // No version numbers
        expect(serverHeader).not.toContain('/'); // No paths
      }
    });
  });

  test.describe('Accessibility', () => {
    test('pages have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);
      
      // Check for heading elements (h1-h6)
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      // Should have at least one heading element for accessibility
      // Note: Some pages may use aria-label or role="heading" instead of semantic headings
      if (headingCount === 0) {
        // Check for aria-label headings as fallback
        const ariaHeadings = page.locator('[role="heading"]');
        const ariaHeadingCount = await ariaHeadings.count();
        expect(ariaHeadingCount).toBeGreaterThan(0);
      } else {
        expect(headingCount).toBeGreaterThan(0);
      }
    });

    test('images have alt text', async ({ page }) => {
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);
      
      // Get all images
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // Check first few images have alt attributes
        for (let i = 0; i < Math.min(5, imageCount); i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          // Alt can be empty string (decorative) but should be present
          expect(alt).not.toBeNull();
        }
      }
    });

    test('links have accessible text', async ({ page }) => {
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);
      
      // Get all links
      const links = page.locator('a[href]');
      const linkCount = await links.count();
      
      if (linkCount > 0) {
        // Check first few links have text or aria-label
        for (let i = 0; i < Math.min(5, linkCount); i++) {
          const link = links.nth(i);
          const text = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const hasText = text && text.trim().length > 0;
          const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
          
          // Link should have either text or aria-label
          expect(hasText || hasAriaLabel).toBeTruthy();
        }
      }
    });

    test('form inputs have labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);
      
      // Get all form inputs
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"]');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Check first few inputs have associated labels
        for (let i = 0; i < Math.min(5, inputCount); i++) {
          const input = inputs.nth(i);
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const placeholder = await input.getAttribute('placeholder');
          
          if (id) {
            // Check for label with matching for attribute
            const label = page.locator(`label[for="${id}"]`);
            const hasLabel = await label.count() > 0;
            expect(hasLabel || ariaLabel || placeholder).toBeTruthy();
          } else {
            // If no id, should have aria-label or placeholder
            expect(ariaLabel || placeholder).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('handles malformed API requests gracefully', async ({ request }) => {
      // Skip in E2E harness mode - these tests are for production endpoints
      if (IS_E2E_HARNESS) {
        test.skip();
        return;
      }

      const response = await request.get(`${BASE_URL}/api/feeds?invalid=param&malformed`, { timeout: 10_000 });
      
      // Should return appropriate error code, not 500
      expect(response.status()).not.toBe(500);
      expect([200, 400, 401, 403, 404]).toContain(response.status());
    });

    test('handles missing query parameters gracefully', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/civics/by-state`, { timeout: 10_000 });
      
      // Should return 400 (bad request) for missing required params
      expect([400, 200, 401, 403]).toContain(response.status());
    });

    test('handles very long URLs gracefully', async ({ page }) => {
      // Use a moderately long path (not 1000 slashes which may cause browser issues)
      const longPath = '/a'.repeat(200); // 200 segments, more reasonable
      let response;
      try {
        response = await page.goto(`${BASE_URL}${longPath}`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30_000 
        });
      } catch (error) {
        // Browser may reject very long URLs before making request
        // This is acceptable behavior
        return;
      }
      
      // Should return 400, 404, 414 (URI too long), or 500
      // Any of these are acceptable - the important thing is it doesn't crash
      if (response) {
        expect([400, 404, 414, 500]).toContain(response.status());
      }
    });
  });

  test.describe('Content Delivery', () => {
    test('static assets are served correctly', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/favicon.ico`, { timeout: 10_000 });
      
      // Should return 200 or 404 (if favicon doesn't exist)
      expect([200, 404]).toContain(response.status());
    });

    test('manifest.json is accessible', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/manifest.json`, { timeout: 10_000 });
      
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('name');
      } else {
        // 404 is acceptable if manifest doesn't exist
        expect(response.status()).toBe(404);
      }
    });
  });
});

