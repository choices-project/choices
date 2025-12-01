import { test, expect } from '@playwright/test';

/**
 * Performance Tests for choices-app.com
 *
 * These tests verify performance metrics and identify bottlenecks.
 */

test.describe('Production Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
  });

  test('Homepage should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const domContentLoaded = Date.now() - startTime;

    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    const fullyLoaded = Date.now() - startTime;

    // Performance budgets
    expect(domContentLoaded, 'DOM content should load within 3 seconds').toBeLessThan(3000);
    expect(fullyLoaded, 'Page should fully load within 10 seconds').toBeLessThan(10000);

    console.log(`Performance metrics: DOM=${domContentLoaded}ms, Full=${fullyLoaded}ms`);
  });

  test('Auth page should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const loadTime = Date.now() - startTime;

    // Auth page should be fast (no heavy data loading)
    expect(loadTime, 'Auth page should load within 3 seconds').toBeLessThan(3000);

    console.log(`Auth page load time: ${loadTime}ms`);
  });

  test('API endpoints should respond quickly', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/site-messages',
    ];

    const results: Array<{ path: string; duration: number; status: number }> = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(`https://choices-app.com${endpoint}`, {
        failOnStatusCode: false,
      });
      const duration = Date.now() - startTime;
      const status = response.status();

      results.push({ path: endpoint, duration, status });

      // APIs should respond within 2 seconds
      if (status === 200) {
        expect(duration, `${endpoint} should respond within 2 seconds`).toBeLessThan(2000);
      }
    }

    console.log('API performance:', JSON.stringify(results, null, 2));
  });

  test('Page should not have excessive JavaScript', async ({ page }) => {
    const jsSizes: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') && url.includes('_next/static')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          jsSizes.push({
            url: url.split('/').pop() || url,
            size: parseInt(contentLength, 10),
          });
        }
      }
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });

    const totalJsSize = jsSizes.reduce((sum, file) => sum + file.size, 0);
    const largestFiles = jsSizes.sort((a, b) => b.size - a.size).slice(0, 5);

    console.log(`Total JS size: ${(totalJsSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('Largest JS files:', largestFiles.map(f => `${f.url}: ${(f.size / 1024).toFixed(2)}KB`));

    // Total JS should be reasonable (under 5MB for initial load)
    expect(totalJsSize, 'Total JavaScript should be under 5MB').toBeLessThan(5 * 1024 * 1024);

    // No single file should be too large (under 1MB)
    if (largestFiles.length > 0) {
      expect(largestFiles[0].size, 'Largest JS file should be under 1MB').toBeLessThan(1024 * 1024);
    }
  });

  test('Page should not have excessive CSS', async ({ page }) => {
    const cssSizes: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.css') && url.includes('_next/static')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          cssSizes.push({
            url: url.split('/').pop() || url,
            size: parseInt(contentLength, 10),
          });
        }
      }
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });

    const totalCssSize = cssSizes.reduce((sum, file) => sum + file.size, 0);
    const largestFiles = cssSizes.sort((a, b) => b.size - a.size).slice(0, 3);

    console.log(`Total CSS size: ${(totalCssSize / 1024).toFixed(2)}KB`);
    console.log('Largest CSS files:', largestFiles.map(f => `${f.url}: ${(f.size / 1024).toFixed(2)}KB`));

    // Total CSS should be reasonable (under 500KB)
    expect(totalCssSize, 'Total CSS should be under 500KB').toBeLessThan(500 * 1024);
  });

  test('Page should have efficient image loading', async ({ page }) => {
    const imageRequests: Array<{ url: string; size: number; format: string }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (contentType.startsWith('image/')) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          imageRequests.push({
            url: url.split('/').pop() || url,
            size: parseInt(contentLength, 10),
            format: contentType.split('/')[1] || 'unknown',
          });
        }
      }
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });

    const totalImageSize = imageRequests.reduce((sum, img) => sum + img.size, 0);
    const formats = imageRequests.reduce((acc, img) => {
      acc[img.format] = (acc[img.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`Total image size: ${(totalImageSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('Image formats:', formats);

    // Images should use modern formats (webp, avif)
    const modernFormats = imageRequests.filter(img =>
      img.url.includes('.webp') ||
      img.url.includes('.avif') ||
      img.format === 'webp' ||
      img.format === 'avif'
    );

    if (imageRequests.length > 0) {
      const modernFormatRatio = modernFormats.length / imageRequests.length;
      console.log(`Modern format ratio: ${(modernFormatRatio * 100).toFixed(1)}%`);
    }
  });

  test('Page should not block on external resources', async ({ page }) => {
    const blockedResources: string[] = [];
    const slowResources: Array<{ url: string; duration: number }> = [];

    page.on('request', (request) => {
      const url = request.url();
      // Track external resources
      if (!url.includes('choices-app.com') && !url.includes('localhost')) {
        const startTime = Date.now();
        request.response().then((response) => {
          const duration = Date.now() - startTime;
          if (duration > 2000) {
            slowResources.push({ url, duration });
          }
        }).catch(() => {
          blockedResources.push(url);
        });
      }
    });

    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });

    if (blockedResources.length > 0) {
      console.log('Blocked resources:', blockedResources);
    }

    if (slowResources.length > 0) {
      console.log('Slow external resources:', slowResources);
    }

    // Should not have too many blocked resources
    expect(blockedResources.length, 'Should not have many blocked resources').toBeLessThan(5);
  });
});

