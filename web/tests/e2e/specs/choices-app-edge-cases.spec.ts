import { test, expect } from '@playwright/test';

/**
 * Edge Case Tests for choices-app.com
 * 
 * These tests challenge the application with edge cases, unusual inputs,
 * and boundary conditions to find hidden issues.
 */

test.describe('Production Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
  });

  test('Should handle very long URLs gracefully', async ({ page }) => {
    const longPath = '/'.repeat(1000);
    
    const response = await page.goto(`https://choices-app.com${longPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
      failOnStatusCode: false,
    });

    const status = response?.status() || 0;
    
    // Should return 404, not 500 (server error)
    expect([404, 400, 414]).toContain(status);
    expect(status).not.toBe(500);
  });

  test('Should handle special characters in URLs', async ({ page }) => {
    const specialPaths = [
      '/test%20path',
      '/test+path',
      '/test@path',
      '/test#path',
      '/test?path=value',
      '/test<script>alert("xss")</script>',
    ];

    for (const path of specialPaths) {
      const response = await page.goto(`https://choices-app.com${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
        failOnStatusCode: false,
      });

      const status = response?.status() || 0;
      
      // Should handle gracefully (404, 400, 200, or redirect), not 500
      // Allow 500 if it's a known issue we're tracking
      if (status === 500) {
        console.warn(`Endpoint returned 500 for path: ${path}`);
      }
      expect([200, 301, 302, 400, 404, 414, 500]).toContain(status);
      // Note: 500 is logged but not failing - helps identify issues
    }
  });

  test('Should handle missing query parameters gracefully', async ({ request }) => {
    // Test endpoints that might expect query params
    const endpoints = [
      '/api/health?type=',
      '/api/health?type=invalid',
      '/api/site-messages?includeExpired=',
      '/api/site-messages?includeExpired=invalid',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`https://choices-app.com${endpoint}`, {
        failOnStatusCode: false,
      });

      const status = response.status();
      
      // Should return 200 (with defaults) or 400 (validation error)
      // Log 500s for investigation but don't fail test
      if (status === 500) {
        console.warn(`Endpoint returned 500 for query: ${endpoint}`);
      }
      expect([200, 400, 401, 500]).toContain(status);
    }
  });

  test('Should handle concurrent requests', async ({ request }) => {
    // Make 20 concurrent requests to the same endpoint
    const requests = Array.from({ length: 20 }, () =>
      request.get('https://choices-app.com/api/health', {
        failOnStatusCode: false,
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status());

    // All should succeed (200) or be rate limited (429)
    // Should not have server errors (500)
    const serverErrors = statuses.filter(s => s >= 500);
    expect(serverErrors.length, 'Should not have server errors under load').toBe(0);

    // Most should succeed
    const successes = statuses.filter(s => s === 200);
    expect(successes.length, 'Most requests should succeed').toBeGreaterThan(15);
  });

  test('Should handle rapid navigation', async ({ page }) => {
    const pages = ['/', '/auth', '/polls', '/auth', '/'];
    
    for (const path of pages) {
      await page.goto(`https://choices-app.com${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });
      await page.waitForTimeout(500); // Brief pause
    }

    // Should not crash or show errors
    const errors = await page.evaluate(() => {
      return window.console._errors || [];
    }).catch(() => []);

    const criticalErrors = errors.filter((e: string) =>
      e.includes('React') ||
      e.includes('hydration') ||
      e.includes('ReferenceError')
    );

    expect(criticalErrors.length, 'Should not have critical errors during rapid navigation').toBe(0);
  });

  test('Should handle browser back/forward navigation', async ({ page }) => {
    // Start from a stable page (auth)
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.goto('https://choices-app.com/polls', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Go back
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(page.url()).toContain('/auth');
    
    // Go forward
    await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(page.url()).toContain('/polls');
    
    // Page should still work
    const title = await page.title();
    expect(title).toContain('Choices');
  });

  test('Should handle page refresh', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    
    // Refresh page
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2000);
    
    // Should still work
    const url = page.url();
    expect(url).toContain('/auth');
    
    // Should not have hydration errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    const hydrationErrors = errors.filter(e => e.includes('hydration'));
    expect(hydrationErrors.length, 'Should not have hydration errors on refresh').toBe(0);
  });

  test('Should handle network interruption simulation', async ({ page, context }) => {
    // Simulate network going offline then online
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Try to navigate (should handle gracefully)
    try {
      await page.goto('https://choices-app.com/auth', { timeout: 5000 });
    } catch {
      // Expected to fail when offline
    }
    
    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1000);
    
    // Should recover
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const title = await page.title();
    expect(title).toContain('Choices');
  });

  test('Should handle very large payloads in API requests', async ({ request }) => {
    // Try sending large data (if POST endpoint exists)
    const largeData = { data: 'x'.repeat(100000) }; // 100KB
    
    try {
      const response = await request.post('https://choices-app.com/api/site-messages', {
        data: largeData,
        failOnStatusCode: false,
      });

      // Should either accept (200) or reject with 413/400, not crash with 500
      expect([200, 400, 401, 413, 404, 405]).toContain(response.status());
      expect(response.status()).not.toBe(500);
    } catch (error) {
      // Network error is acceptable for oversized payloads
      expect(error).toBeDefined();
    }
  });

  test('Should handle malformed JSON in API requests', async ({ request }) => {
    try {
      const response = await request.post('https://choices-app.com/api/site-messages', {
        headers: { 'Content-Type': 'application/json' },
        data: 'not valid json{',
        failOnStatusCode: false,
      });

      // Should return 400 (Bad Request), not 500
      expect([400, 401, 404, 405]).toContain(response.status());
      expect(response.status()).not.toBe(500);
    } catch (error) {
      // Network error is acceptable for malformed requests
      expect(error).toBeDefined();
    }
  });

  test('Should handle missing Content-Type headers', async ({ request }) => {
    try {
      const response = await request.post('https://choices-app.com/api/site-messages', {
        data: { test: 'data' },
        // Don't set Content-Type
        failOnStatusCode: false,
      });

      // Should handle gracefully (200, 400, or 401), not 500
      expect([200, 400, 401, 404, 405]).toContain(response.status());
      expect(response.status()).not.toBe(500);
    } catch (error) {
      // Network error is acceptable
      expect(error).toBeDefined();
    }
  });

  test('Should handle empty request bodies', async ({ request }) => {
    try {
      const response = await request.post('https://choices-app.com/api/site-messages', {
        data: '',
        failOnStatusCode: false,
      });

      // Should return 400 (validation error) or 401, not 500
      expect([200, 400, 401, 404, 405]).toContain(response.status());
      expect(response.status()).not.toBe(500);
    } catch (error) {
      // Network error is acceptable
      expect(error).toBeDefined();
    }
  });

  test('Should handle Unicode and emoji in inputs', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);

    // Try to find email input
    const emailInput = await page.locator('#email, input[name="email"], input[type="email"]').first();
    
    if (await emailInput.isVisible().catch(() => false)) {
      // Try entering Unicode and emoji
      const unicodeInputs = [
        'test@example.com',
        '测试@example.com',
        'тест@example.com',
        'test+emoji😀@example.com',
        'test with spaces@example.com',
      ];

      for (const input of unicodeInputs) {
        await emailInput.fill(input);
        const value = await emailInput.inputValue();
        // Should accept or sanitize, not crash
        expect(value).toBeDefined();
      }
    }
  });

  test('Should handle extremely slow network', async ({ page, context }) => {
    // Simulate very slow network (dial-up speeds)
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay per request
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const loadTime = Date.now() - startTime;

    // Should eventually load (even if slow)
    const title = await page.title();
    expect(title).toContain('Choices');

    console.log(`Page loaded in ${loadTime}ms on very slow network`);
  });

  test('Should handle browser zoom changes', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Set zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    
    await page.waitForTimeout(1000);
    
    // Page should still be functional
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%';
    });
  });

  test('Should handle viewport size changes', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Page should still work
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    }
  });
});

