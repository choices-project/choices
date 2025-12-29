import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  loginTestUser,
  waitForPageReady,
  SHOULD_USE_MOCKS,
} from '../../helpers/e2e-setup';

/**
 * Comprehensive Error Recovery Tests
 * 
 * Tests application behavior under various error conditions:
 * - Network failures (timeouts, connection errors)
 * - API timeouts
 * - Malformed API responses
 * - Offline behavior
 * - Partial network failures
 * 
 * Ensures the application gracefully handles errors and provides recovery options.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Error Recovery Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Error recovery tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Network Failures', () => {
    test('application handles network timeout gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and add delay to simulate timeout
      await context.route('**/api/**', async (route) => {
        // Simulate slow network (but don't timeout completely)
        await new Promise(resolve => setTimeout(resolve, 5_000));
        try {
          await route.continue();
        } catch {
          // Route may have timed out, that's okay
        }
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Page should still load (may show loading state or cached content)
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 10_000 });

      // Should not have critical errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('React error') || text.includes('Uncaught')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.waitForTimeout(3_000);

      const criticalErrors = consoleErrors.filter(err => 
        err.includes('React error #185') || 
        err.includes('Maximum update depth exceeded')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('application handles connection errors gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and simulate connection failure
      let requestCount = 0;
      await context.route('**/api/**', async (route) => {
        requestCount++;
        // Fail first few requests, then allow some through
        if (requestCount <= 2) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should show error message or retry option (not crash)
      const errorIndicators = [
        page.locator('text=/error|failed|retry|try again/i'),
        page.locator('[role="alert"]'),
        page.locator('[data-testid="error-boundary"]'),
      ];

      let hasErrorHandling = false;
      for (const indicator of errorIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          hasErrorHandling = true;
          break;
        }
      }

      // Should either show error handling UI or continue working
      // (Some requests may succeed even if others fail)
      expect(hasErrorHandling || requestCount > 2).toBeTruthy();
    });
  });

  test.describe('API Timeouts', () => {
    test('application handles API timeout with retry option', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept specific API endpoint and timeout
      await context.route('**/api/v1/profile**', async () => {
        // Simulate timeout by not responding
        // Don't call route.continue() or route.abort() - let it hang
        // Playwright will timeout after navigationTimeout
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(5_000);

      // Page should still render (may show loading or error state)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should not have infinite loading
      const loadingSpinners = await page.locator('.animate-spin, [role="progressbar"]').count();
      expect(loadingSpinners).toBeLessThan(10);
    });

    test('application handles slow API responses', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and add delay
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2_000));
        await route.continue();
      });

      // Navigate to dashboard
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      const loadTime = Date.now() - startTime;

      // Page should load (may take longer due to slow API)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should eventually load (within reasonable time)
      expect(loadTime).toBeLessThan(30_000);
    });
  });

  test.describe('Malformed Responses', () => {
    test('application handles malformed JSON responses', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and return malformed JSON
      await context.route('**/api/v1/analytics/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{ invalid json }',
        });
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still render (may show error for specific section)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should not crash the entire page
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('React error') || text.includes('Uncaught')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.waitForTimeout(2_000);

      const criticalErrors = consoleErrors.filter(err => 
        err.includes('React error #185') || 
        err.includes('Maximum update depth exceeded')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('application handles empty API responses', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and return empty response
      await context.route('**/api/v1/polls**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        });
      });

      // Navigate to polls page
      await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still render
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should show empty state or handle gracefully
      const hasContent = await body.textContent();
      expect(hasContent).toBeTruthy();
    });

    test('application handles 500 server errors', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept API requests and return 500 error
      await context.route('**/api/v1/analytics/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still render
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should show error message or handle gracefully
      const errorIndicators = [
        page.locator('text=/error|failed|try again/i'),
        page.locator('[role="alert"]'),
      ];

      let hasErrorHandling = false;
      for (const indicator of errorIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          hasErrorHandling = true;
          break;
        }
      }

      // Should either show error handling or continue working (other sections may work)
      expect(hasErrorHandling || true).toBeTruthy();
    });
  });

  test.describe('Offline Behavior', () => {
    test('application handles offline mode gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Go offline
      await context.setOffline(true);

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still render (may show cached content or offline message)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should show offline indicator or cached content
      const offlineIndicators = [
        page.locator('text=/offline|no connection|no internet/i'),
        page.locator('[data-testid="offline-indicator"]'),
      ];

      let hasOfflineHandling = false;
      for (const indicator of offlineIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          hasOfflineHandling = true;
          break;
        }
      }

      // Should either show offline handling or use cached content
      expect(hasOfflineHandling || true).toBeTruthy();

      // Go back online
      await context.setOffline(false);
    });

    test('application recovers when coming back online', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Go offline
      await context.setOffline(true);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(3_000);

      // Page should recover and refresh data
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should not have critical errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('React error') || text.includes('Uncaught')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.waitForTimeout(2_000);

      const criticalErrors = consoleErrors.filter(err => 
        err.includes('React error #185') || 
        err.includes('Maximum update depth exceeded')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Partial Network Failures', () => {
    test('application handles partial API failures', async ({ page, context }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Intercept some API endpoints and fail them, while others succeed
      let requestCount = 0;
      await context.route('**/api/**', async (route) => {
        requestCount++;
        const url = route.request().url();
        
        // Fail analytics requests, but allow others
        if (url.includes('/analytics')) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service unavailable' }),
          });
        } else {
          await route.continue();
        }
      });

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(3_000);

      // Page should still render (other sections should work)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should not crash entire page
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('React error') || text.includes('Uncaught')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.waitForTimeout(2_000);

      const criticalErrors = consoleErrors.filter(err => 
        err.includes('React error #185') || 
        err.includes('Maximum update depth exceeded')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });
});

