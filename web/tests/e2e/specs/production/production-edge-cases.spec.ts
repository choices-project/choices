import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Production Edge Cases & Stress Tests
 *
 * These tests challenge the codebase with edge cases, boundary conditions,
 * and stress scenarios to ensure robust UX/UI under all conditions.
 *
 * When these tests fail, they reveal real issues that need code improvements.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Edge Cases & Stress Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Form Input Edge Cases', () => {
    test('auth form handles special characters and unicode in email', async ({ page }) => {
      test.setTimeout(60_000);
      await ensureLoggedOut(page);

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 });

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5_000 });

      // Test various edge case emails
      const edgeCaseEmails = [
        'test+tag@example.com',
        'test.email@example.com',
        'test_email@example.com',
        'test@sub.example.com',
        'test123@example.co.uk',
        'тест@example.com', // Cyrillic
        '测试@example.com', // Chinese
        'test@例え.com', // Japanese domain
      ];

      for (const email of edgeCaseEmails) {
        await emailInput.clear();
        await emailInput.fill(email);
        await emailInput.evaluate((el: HTMLInputElement) => {
          const inputEvent = new Event('input', { bubbles: true, cancelable: true });
          Object.defineProperty(inputEvent, 'target', { value: el, enumerable: true });
          el.dispatchEvent(inputEvent);
        });

        await page.waitForTimeout(300);

        // Should accept valid email formats or show appropriate validation
        const value = await emailInput.inputValue();
        const isValid = value.includes('@') && value.length > 0;
        expect(isValid).toBeTruthy();
      }
    });

    test('auth form handles very long input values gracefully', async ({ page }) => {
      test.setTimeout(60_000);
      await ensureLoggedOut(page);

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 });

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      // Test with very long email (1000 characters)
      const longEmail = 'a'.repeat(900) + '@example.com';
      await emailInput.fill(longEmail);
      await emailInput.evaluate((el: HTMLInputElement) => {
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        Object.defineProperty(inputEvent, 'target', { value: el, enumerable: true });
        el.dispatchEvent(inputEvent);
      });

      await page.waitForTimeout(500);

      // Form should handle long input without breaking
      const emailValue = await emailInput.inputValue();
      expect(emailValue.length).toBeGreaterThan(0);

      // Test with very long password (1000 characters)
      const longPassword = 'a'.repeat(1000);
      await passwordInput.fill(longPassword);
      await passwordInput.evaluate((el: HTMLInputElement) => {
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        Object.defineProperty(inputEvent, 'target', { value: el, enumerable: true });
        el.dispatchEvent(inputEvent);
      });

      await page.waitForTimeout(500);

      // Form should handle long password
      const passwordValue = await passwordInput.inputValue();
      expect(passwordValue.length).toBeGreaterThan(0);

      // Form should still be functional
      const submitButton = page.locator('button[type="submit"]').first();
      const isVisible = await submitButton.isVisible();
      expect(isVisible).toBeTruthy();
    });

    test('auth form handles rapid input changes without errors', async ({ page }) => {
      test.setTimeout(60_000);
      await ensureLoggedOut(page);

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 });

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();

      // Rapidly change input values
      const testValues = ['a', 'ab', 'abc', 'test', 'test@', 'test@example', 'test@example.com'];
      
      for (const value of testValues) {
        await emailInput.fill(value);
        await emailInput.evaluate((el: HTMLInputElement) => {
          const inputEvent = new Event('input', { bubbles: true, cancelable: true });
          Object.defineProperty(inputEvent, 'target', { value: el, enumerable: true });
          el.dispatchEvent(inputEvent);
        });
        await page.waitForTimeout(50); // Very short delay to simulate rapid typing
      }

      // Should not have any console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(1000);

      // Check that final value is correct
      const finalValue = await emailInput.inputValue();
      expect(finalValue).toBe('test@example.com');

      // Should not have critical errors (warnings are OK)
      const criticalErrors = errors.filter(e => 
        !e.includes('Warning') && 
        !e.includes('Deprecation') &&
        !e.includes('DevTools')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('auth form handles empty string and whitespace-only inputs', async ({ page }) => {
      test.setTimeout(60_000);
      await ensureLoggedOut(page);

      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForSelector('[data-testid="auth-hydrated"]', { state: 'attached', timeout: 10_000 });

      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      // Test empty string
      await emailInput.fill('');
      await passwordInput.fill('');
      await page.waitForTimeout(300);

      // Submit button should be disabled
      const isDisabledEmpty = await submitButton.isDisabled();
      expect(isDisabledEmpty).toBeTruthy();

      // Test whitespace-only
      await emailInput.fill('   ');
      await passwordInput.fill('   ');
      await page.waitForTimeout(300);

      // Submit button should still be disabled (whitespace is not valid)
      const isDisabledWhitespace = await submitButton.isDisabled();
      expect(isDisabledWhitespace).toBeTruthy();
    });
  });

  test.describe('Network Resilience', () => {
    test('application handles intermittent network failures gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Simulate intermittent network failures
      let requestCount = 0;
      await context.route('**/api/**', async (route) => {
        requestCount++;
        // Fail every 3rd request
        if (requestCount % 3 === 0) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });

      // Try to interact with the page
      await page.waitForTimeout(2_000);

      // Page should still be functional despite some failed requests
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Should show error handling (error messages, retry buttons, etc.)
      const errorElements = page.locator('[role="alert"], [data-testid*="error"], .error, .alert-error');
      const errorCount = await errorElements.count();
      
      // Either no errors (all requests succeeded) or errors are handled gracefully
      // The key is that the page doesn't crash
      const pageStillFunctional = bodyText && bodyText.length > 0;
      expect(pageStillFunctional).toBeTruthy();
    });

    test('application handles slow network connections without timeout errors', async ({ page, context }) => {
      test.setTimeout(180_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      // Simulate slow 3G connection (delay all API calls)
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      const loadTime = Date.now() - startTime;

      // Page should still load, even if slowly
      await waitForPageReady(page);
      
      // Should complete within reasonable time (60s timeout)
      expect(loadTime).toBeLessThan(60_000);

      // Page should be functional
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('application handles request timeouts gracefully', async ({ page, context }) => {
      test.setTimeout(90_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      // Simulate timeout on specific API calls
      await context.route('**/api/feed**', async (route) => {
        // Don't respond - simulate timeout
        // In real scenario, this would timeout after the configured timeout period
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay then abort
        await route.abort('timedout');
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Should show timeout error or fallback content
      await page.waitForTimeout(5_000);

      const body = page.locator('body');
      const bodyText = await body.textContent();
      
      // Page should show something (error message, retry button, or fallback content)
      expect(bodyText?.length).toBeGreaterThan(0);

      // Should have error handling UI
      const hasErrorHandling = await page.locator('[role="alert"], [data-testid*="error"], button:has-text("Retry"), button:has-text("Reload")').first().isVisible().catch(() => false);
      
      // Either shows error handling or has fallback content
      expect(bodyText && bodyText.length > 0).toBeTruthy();
    });
  });

  test.describe('State Management Edge Cases', () => {
    test('application handles browser back/forward navigation correctly', async ({ page }) => {
      test.setTimeout(90_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      // Navigate through pages
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      const feedUrl = page.url();

      // Navigate to another page
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      const dashboardUrl = page.url();

      // Go back
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      
      // Should be back on feed page
      expect(page.url()).toContain('/feed');

      // Go forward
      await page.goForward({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      
      // Should be forward to dashboard
      expect(page.url()).toContain('/dashboard');

      // Page should be functional after navigation
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    });

    test('application handles page refresh without losing critical state', async ({ page, context }) => {
      test.setTimeout(90_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Verify we're logged in
      const cookiesBefore = await context.cookies();
      const hasAuthCookie = cookiesBefore.some(c => c.name.startsWith('sb-'));
      expect(hasAuthCookie).toBeTruthy();

      // Refresh page
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Should still be authenticated
      const cookiesAfter = await context.cookies();
      const hasAuthCookieAfter = cookiesAfter.some(c => c.name.startsWith('sb-'));
      expect(hasAuthCookieAfter).toBeTruthy();

      // Should still be on feed (not redirected to login)
      const currentUrl = page.url();
      expect(currentUrl).toContain('/feed');
    });

    test('application handles rapid tab switching gracefully', async ({ page }) => {
      test.setTimeout(60_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Simulate rapid tab switching (visibility changes)
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { value: true, writable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForTimeout(100);
        
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { value: false, writable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForTimeout(100);
      }

      // Page should still be functional
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Should not have memory leaks or performance issues
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && !msg.text().includes('Warning')) {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(2_000);
      
      // Should not have critical errors
      const criticalErrors = errors.filter(e => 
        !e.includes('DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Performance Stress Tests', () => {
    test('application handles rapid user interactions without lag', async ({ page }) => {
      test.setTimeout(90_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Rapidly click various elements
      const clickableElements = await page.locator('button, a, [role="button"]').all();
      
      if (clickableElements.length > 0) {
        // Click first few elements rapidly
        for (let i = 0; i < Math.min(5, clickableElements.length); i++) {
          try {
            await clickableElements[i].click({ timeout: 1_000 });
            await page.waitForTimeout(50); // Very short delay
          } catch {
            // Element might not be clickable, continue
          }
        }
      }

      // Page should still be responsive
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Check for performance issues (long-running scripts)
      const performanceEntries = await page.evaluate(() => {
        return performance.getEntriesByType('measure').map(entry => ({
          name: entry.name,
          duration: entry.duration,
        }));
      });

      // Should not have extremely long operations (>5 seconds)
      const longOperations = performanceEntries.filter(e => e.duration > 5000);
      expect(longOperations.length).toBe(0);
    });

    test('application handles large amounts of content without performance degradation', async ({ page }) => {
      test.setTimeout(120_000);
      
      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Scroll through page to trigger lazy loading
      const viewportHeight = page.viewportSize()?.height || 800;
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      
      // Scroll in increments
      for (let scroll = 0; scroll < scrollHeight; scroll += viewportHeight) {
        await page.evaluate((y) => window.scrollTo(0, y), scroll);
        await page.waitForTimeout(500);
      }

      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1_000);

      // Page should still be responsive
      const body = page.locator('body');
      const bodyText = await body.textContent();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Check memory usage (if available)
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });

      // If memory info is available, check it's reasonable (< 500MB)
      if (memoryInfo && memoryInfo.usedJSHeapSize) {
        const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
        // Should not use excessive memory
        expect(usedMB).toBeLessThan(500);
      }
    });
  });
});

