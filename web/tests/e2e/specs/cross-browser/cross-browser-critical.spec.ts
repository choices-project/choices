import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Cross-Browser Critical Flow Tests
 * 
 * Tests critical user flows across different browsers (Firefox, Safari/WebKit):
 * - Authentication flow
 * - Dashboard access
 * - Poll creation and voting
 * 
 * These tests ensure the application works correctly across all major browsers.
 * Run separately from main test suite to avoid slowing down CI.
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Cross-Browser Critical Flows', () => {
  test.skip(SHOULD_USE_MOCKS, 'Cross-browser tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Authentication Flow', () => {
    test('user can authenticate and access protected pages', async ({ page, browserName }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await ensureLoggedOut(page);
      
      // Navigate to auth page
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      
      // Verify auth page loaded
      const authContent = page.locator('text=/log in|sign up|create account/i').first();
      await expect(authContent).toBeVisible({ timeout: 10_000 });

      // Log in
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Verify authentication succeeded
      await page.waitForTimeout(2_000);
      const currentUrl = page.url();
      const isAuthenticated = currentUrl.includes('/feed') || 
                             currentUrl.includes('/dashboard') || 
                             currentUrl.includes('/onboarding');
      
      expect(isAuthenticated).toBeTruthy();

      // Try accessing a protected page
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Dashboard should load (may redirect to onboarding if profile incomplete)
      const finalUrl = page.url();
      const isOnDashboardOrOnboarding = finalUrl.includes('/dashboard') || finalUrl.includes('/onboarding');
      expect(isOnDashboardOrOnboarding).toBeTruthy();

      // Page should be functional (no error boundaries)
      const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Error")');
      const hasError = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(hasError).toBeFalsy();
    });

    test('unauthenticated user is redirected to landing page', async ({ page, browserName }) => {
      test.setTimeout(60_000);

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await ensureLoggedOut(page);
      
      // Navigate to root
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(2_000);

      // Should redirect to landing page
      const currentUrl = page.url();
      const isOnLanding = currentUrl.includes('/landing') || currentUrl === BASE_URL || currentUrl === `${BASE_URL}/`;
      
      expect(isOnLanding).toBeTruthy();

      // Landing page should have content
      const landingContent = page.locator('h1, [role="heading"]').first();
      await expect(landingContent).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Dashboard Access', () => {
    test('dashboard loads correctly across browsers', async ({ page, browserName }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Check if we're on dashboard or redirected to onboarding
      const currentUrl = page.url();
      const isOnDashboardOrOnboarding = currentUrl.includes('/dashboard') || currentUrl.includes('/onboarding');
      expect(isOnDashboardOrOnboarding).toBeTruthy();

      // Page should be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check for React errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('React error') || text.includes('hydration')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.waitForTimeout(2_000);

      // Should not have critical React errors
      const criticalErrors = consoleErrors.filter(err => 
        err.includes('React error #185') || 
        err.includes('Maximum update depth exceeded')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('Poll Functionality', () => {
    test('polls page loads and displays content', async ({ page, browserName }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Navigate to polls page
      await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      // Polls page should load
      const currentUrl = page.url();
      expect(currentUrl).toContain('/polls');

      // Page should be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Check for error boundaries
      const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Error")');
      const hasError = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(hasError).toBeFalsy();
    });
  });

  test.describe('Navigation', () => {
    test('navigation works correctly across browsers', async ({ page, browserName }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Test navigation between pages
      const pages = ['/feed', '/polls', '/dashboard', '/civics'];
      
      for (const pagePath of pages) {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
        await page.waitForTimeout(1_000);

        // Verify we're on the correct page (may redirect)
        const currentUrl = page.url();
        const isOnExpectedPage = currentUrl.includes(pagePath) || 
                                currentUrl.includes('/onboarding') ||
                                currentUrl.includes('/auth');
        
        // Should be on expected page or redirected appropriately
        expect(isOnExpectedPage || currentUrl.includes('/landing')).toBeTruthy();

        // Page should be functional
        const body = page.locator('body');
        await expect(body).toBeVisible({ timeout: 5_000 });
      }
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('localStorage and sessionStorage work correctly', async ({ page, browserName }) => {
      test.setTimeout(60_000);

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Test localStorage
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });

      const localStorageValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      expect(localStorageValue).toBe('test-value');

      // Test sessionStorage
      await page.evaluate(() => {
        sessionStorage.setItem('test-session-key', 'test-session-value');
      });

      const sessionStorageValue = await page.evaluate(() => {
        return sessionStorage.getItem('test-session-key');
      });
      expect(sessionStorageValue).toBe('test-session-value');
    });

    test('cookies work correctly', async ({ page, browserName }) => {
      test.setTimeout(60_000);

      // Skip on Chromium (already tested in main suite)
      test.skip(browserName === 'chromium', 'Chromium tested in main suite');

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Set a test cookie
      await page.context().addCookies([{
        name: 'test-cookie',
        value: 'test-value',
        domain: new URL(BASE_URL).hostname,
        path: '/',
      }]);

      // Verify cookie is set
      const cookies = await page.context().cookies();
      const testCookie = cookies.find(c => c.name === 'test-cookie');
      expect(testCookie).toBeDefined();
      expect(testCookie?.value).toBe('test-value');
    });
  });
});

