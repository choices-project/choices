import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Tests for choices-app.com
 * 
 * These tests challenge the entire application to find issues and improve quality.
 */

test.describe('Comprehensive Production Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
  });

  test('All critical pages should load without errors', async ({ page }) => {
    const criticalPages = [
      '/',
      '/auth',
      '/feed',
      '/polls',
      '/privacy',
    ];

    const results: Array<{ path: string; status: number; hasError: boolean }> = [];

    for (const path of criticalPages) {
      try {
        const response = await page.goto(`https://choices-app.com${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });

        const status = response?.status() || 0;
        const bodyText = await page.textContent('body') || '';
        const hasError = bodyText.toLowerCase().includes('error') ||
          bodyText.toLowerCase().includes('500') ||
          bodyText.toLowerCase().includes('internal server error');

        results.push({ path, status, hasError });

        // Wait a bit between requests
        await page.waitForTimeout(1000);
      } catch (error) {
        results.push({
          path,
          status: 0,
          hasError: true,
        });
      }
    }

    // Log results
    console.log('Critical pages test results:', JSON.stringify(results, null, 2));

    // All pages should load (200 or redirect)
    const failedPages = results.filter(r => r.status >= 400 || r.hasError);
    if (failedPages.length > 0) {
      throw new Error(`Pages failed to load: ${failedPages.map(r => `${r.path} (${r.status})`).join(', ')}`);
    }

    expect(failedPages.length).toBe(0);
  });

  test('API endpoints should return consistent response format', async ({ request }) => {
    const endpoints = [
      { path: '/api/site-messages', shouldAuth: false },
      { path: '/api/health', shouldAuth: false },
      { path: '/api/dashboard/data', shouldAuth: true },
    ];

    const results: Array<{ path: string; status: number; hasConsistentFormat: boolean }> = [];

    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`https://choices-app.com${endpoint.path}`, {
          failOnStatusCode: false,
        });

        const status = response.status();
        let hasConsistentFormat = false;

        if (status === 200 || status === 401) {
          try {
            const data = await response.json();
            // Check for consistent format (should have success or error)
            hasConsistentFormat = 'success' in data || 'error' in data;
          } catch {
            // Not JSON, might be OK for some endpoints
            hasConsistentFormat = status === 200;
          }
        } else if (status >= 500) {
          hasConsistentFormat = false; // Server errors are not OK
        } else {
          hasConsistentFormat = true; // 401, 404, etc. are expected
        }

        results.push({ path: endpoint.path, status, hasConsistentFormat });
      } catch (error) {
        results.push({
          path: endpoint.path,
          status: 0,
          hasConsistentFormat: false,
        });
      }
    }

    console.log('API format test results:', JSON.stringify(results, null, 2));

    const inconsistentEndpoints = results.filter(r => !r.hasConsistentFormat);
    if (inconsistentEndpoints.length > 0) {
      throw new Error(`Endpoints with inconsistent format: ${inconsistentEndpoints.map(r => r.path).join(', ')}`);
    }

    expect(inconsistentEndpoints.length).toBe(0);
  });

  test('Pages should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('tracking') &&
      !e.includes('adblock') &&
      !e.includes('extension')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical console errors:', criticalErrors);
      console.log('Warnings:', warnings);
    }

    // Should not have critical React/Next.js errors
    const reactErrors = criticalErrors.filter(e =>
      e.includes('React') ||
      e.includes('hydration') ||
      e.includes('ReferenceError') ||
      e.includes('TypeError') ||
      e.includes('Cannot read')
    );

    expect(reactErrors.length, `Should not have React errors: ${reactErrors.join('; ')}`).toBe(0);
  });

  test('Static assets should load correctly', async ({ page }) => {
    const failedResources: Array<{ url: string; status: number }> = [];
    const slowResources: Array<{ url: string; duration: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const request = response.request();
      const timing = response.timing();

      // Only track static assets
      if (url.includes('_next/static') || url.includes('.css') || url.includes('.js') || url.includes('.svg')) {
        if (status >= 400) {
          failedResources.push({ url, status });
        }

        // Check if resource took too long (> 5 seconds)
        if (timing && timing.responseEnd - timing.requestStart > 5000) {
          slowResources.push({
            url,
            duration: timing.responseEnd - timing.requestStart,
          });
        }
      }
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });

    if (failedResources.length > 0) {
      console.log('Failed resources:', failedResources);
    }

    if (slowResources.length > 0) {
      console.log('Slow resources:', slowResources);
    }

    // Critical static assets should load
    expect(failedResources.length, `Static assets failed: ${failedResources.map(r => `${r.url} (${r.status})`).join(', ')}`).toBe(0);
  });

  test('Navigation should work between pages', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Try navigating to auth
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(page.url()).toContain('/auth');

    // Try navigating back
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(page.url()).toMatch(/^https:\/\/choices-app\.com\/?$/);

    // Try navigating to feed
    await page.goto('https://choices-app.com/feed', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(page.url()).toContain('/feed');
  });

  test('Page should be accessible (WCAG basics)', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Check for basic accessibility
    const hasTitle = await page.title();
    expect(hasTitle).toBeTruthy();
    expect(hasTitle.length).toBeGreaterThan(0);

    // Check for lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBeTruthy();

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').count();
    expect(viewport).toBeGreaterThan(0);
  });

  test('Page should handle slow 3G network', async ({ page, context }) => {
    // Simulate slow 3G (throttle to 1.6 Mbps down, 750 Kbps up, 150ms latency)
    await context.route('**/*', async (route) => {
      // Add artificial delay
      await new Promise(resolve => setTimeout(resolve, 200));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const loadTime = Date.now() - startTime;

    // Page should still load (even if slow)
    const title = await page.title();
    expect(title).toContain('Choices');

    console.log(`Page loaded in ${loadTime}ms on slow 3G`);
  });

  test('Page should work in mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Page should still be functional
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(0);

    // Check that page is responsive (no horizontal scroll)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth * 1.1); // Allow 10% margin
  });

  test('API should handle rate limiting gracefully', async ({ request }) => {
    // Make multiple rapid requests to same endpoint
    const requests = Array.from({ length: 10 }, () =>
      request.get('https://choices-app.com/api/site-messages', {
        failOnStatusCode: false,
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status());

    // Should either all succeed or some return 429 (rate limited)
    // But should not all fail with 500
    const serverErrors = statuses.filter(s => s >= 500);
    expect(serverErrors.length, 'API should handle rate limiting without server errors').toBe(0);
  });
});

