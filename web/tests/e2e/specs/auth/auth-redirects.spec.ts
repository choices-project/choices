import { expect, test } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

const BASE_URL = process.env.BASE_URL || 'https://www.choices-app.com';

/**
 * Authentication Redirect Tests
 * 
 * Verifies that unauthenticated users are properly redirected to /auth
 * when attempting to access protected pages.
 * 
 * CRITICAL: These tests ensure security by preventing unauthorized access.
 */
test.describe('Authentication Redirects', () => {
  // Clear any existing auth state before each test
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and localStorage
    await context.clearCookies();
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Protected Pages Redirect to Auth', () => {
    const protectedPages = [
      { path: '/feed', name: 'Feed' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/profile', name: 'Profile' },
      { path: '/profile/edit', name: 'Profile Edit' },
      { path: '/polls/templates', name: 'Poll Templates' },
      { path: '/polls/analytics', name: 'Poll Analytics' },
      { path: '/account/privacy', name: 'Account Privacy' },
      { path: '/account/export', name: 'Account Export' },
      { path: '/account/delete', name: 'Account Delete' },
      { path: '/profile/biometric-setup', name: 'Biometric Setup' },
    ];

    for (const pageInfo of protectedPages) {
      test(`unauthenticated user accessing ${pageInfo.name} redirects to /auth`, async ({ page }) => {
        test.setTimeout(60_000);

        // Navigate to protected page
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
        
        // Wait a bit for any redirects to complete
        await page.waitForTimeout(2_000);

        // Should be redirected to /auth
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/auth/);

        // Should see auth page content
        const authForm = page.locator('[data-testid="login-form"]');
        const authHeading = page.locator('h1:has-text(/sign in|log in/i), h1:has-text(/sign up/i)');
        
        const hasForm = await authForm.count();
        const hasHeading = await authHeading.count();
        
        expect(hasForm + hasHeading).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Public Pages Allow Access', () => {
    const publicPages = [
      { path: '/', name: 'Home' },
      { path: '/auth', name: 'Auth' },
      { path: '/civics', name: 'Civics' },
      { path: '/representatives', name: 'Representatives' },
      { path: '/polls', name: 'Polls (public listing)' },
    ];

    for (const pageInfo of publicPages) {
      test(`unauthenticated user can access ${pageInfo.name}`, async ({ page }) => {
        test.setTimeout(60_000);

        // Navigate to public page
        await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
        await page.waitForTimeout(2_000);

        // Should NOT be redirected to /auth
        const currentUrl = page.url();
        expect(currentUrl).not.toMatch(/\/auth/);
        expect(currentUrl).toContain(pageInfo.path === '/' ? BASE_URL : pageInfo.path);
      });
    }
  });

  test.describe('Authenticated User Access', () => {
    test('authenticated user can access protected pages', async ({ page }) => {
      test.setTimeout(120_000);

      const regularEmail = process.env.E2E_USER_EMAIL;
      const regularPassword = process.env.E2E_USER_PASSWORD;

      if (!regularEmail || !regularPassword) {
        test.skip('E2E credentials not available');
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Use the login helper from e2e-setup
      const { loginTestUser } = await import('../helpers/e2e-setup');
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Try accessing protected pages - should NOT redirect to /auth
      const protectedPages = ['/feed', '/dashboard', '/profile'];
      
      for (const path of protectedPages) {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
        await page.waitForTimeout(2_000);

        const currentUrl = page.url();
        // Should be on the page, not redirected to /auth
        expect(currentUrl).not.toMatch(/\/auth/);
        expect(currentUrl).toContain(path);
      }
    });
  });

  test.describe('Logout Functionality', () => {
    test('user can logout and is redirected appropriately', async ({ page }) => {
      test.setTimeout(120_000);

      const regularEmail = process.env.E2E_USER_EMAIL;
      const regularPassword = process.env.E2E_USER_PASSWORD;

      if (!regularEmail || !regularPassword) {
        test.skip('E2E credentials not available');
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      const { loginTestUser } = await import('../helpers/e2e-setup');
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Verify we're logged in - check for logout button
      const logoutButton = page.locator('[data-testid="logout-button"]');
      await expect(logoutButton).toBeVisible({ timeout: 10_000 });

      // Click logout button
      await logoutButton.click();
      await page.waitForTimeout(2_000);

      // Should be redirected (either to /auth or home)
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(auth|$|\?)/);

      // Verify we're logged out - try accessing protected page
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Should be redirected to /auth
      const finalUrl = page.url();
      expect(finalUrl).toMatch(/\/auth/);
    });

    test('after logout, login button is visible in navigation', async ({ page }) => {
      test.setTimeout(120_000);

      const regularEmail = process.env.E2E_USER_EMAIL;
      const regularPassword = process.env.E2E_USER_PASSWORD;

      if (!regularEmail || !regularPassword) {
        test.skip('E2E credentials not available');
        return;
      }

      // Log in first
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      const { loginTestUser } = await import('../helpers/e2e-setup');
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });

      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Logout
      const logoutButton = page.locator('[data-testid="logout-button"]');
      await logoutButton.click();
      await page.waitForTimeout(3_000);

      // Navigate to a public page
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Should see login button, not logout button
      const loginLink = page.locator('a[href="/login"], a[href="/auth"], button:has-text(/log in|sign in/i)');
      const logoutButtonAfter = page.locator('[data-testid="logout-button"]');
      
      const hasLogin = await loginLink.count();
      const hasLogout = await logoutButtonAfter.count();
      
      expect(hasLogin).toBeGreaterThan(0);
      expect(hasLogout).toBe(0);
    });
  });
});
