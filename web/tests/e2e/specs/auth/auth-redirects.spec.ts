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
        const authHeading = page.locator('h1:has-text("Sign In"), h1:has-text("Sign Up"), h1:has-text("Log In")');
        const authToggle = page.locator('[data-testid="auth-toggle"]');

        const hasForm = await authForm.count();
        const hasHeading = await authHeading.count();
        const hasToggle = await authToggle.count();

        // At least one auth indicator should be present
        expect(hasForm + hasHeading + hasToggle).toBeGreaterThan(0);
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

      // Wait for navigation to update after login
      // Navigation may need time to reflect authentication state
      // Check if we were redirected (login successful)
      await page.waitForTimeout(2_000);

      // Check current URL - if still on /auth, wait a bit more for redirect
      let urlAfterLogin = page.url();
      if (urlAfterLogin.includes('/auth')) {
        // Wait for redirect to complete
        await page.waitForURL(url => !url.includes('/auth'), { timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(2_000);
        urlAfterLogin = page.url();
      }

      // Navigate to feed page to ensure navigation renders with auth state
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for navigation to update - check for logout button or profile link
      // Use waitForFunction to check if navigation has updated
      await page.waitForFunction(
        () => {
          const logoutBtn = document.querySelector('[data-testid="logout-button"]');
          const profileLink = document.querySelector('a[href="/profile"]');
          return logoutBtn !== null || profileLink !== null;
        },
        { timeout: 15_000 }
      ).catch(() => {
        // If function times out, check manually
      });

      await page.waitForTimeout(2_000);

      // Verify we're logged in - check for logout button
      // Also check for profile link as alternative indicator
      const logoutButton = page.locator('[data-testid="logout-button"]');
      const profileLink = page.locator('a[href="/profile"]');

      // Verify at least one is visible
      const hasLogout = await logoutButton.isVisible().catch(() => false);
      const hasProfile = await profileLink.isVisible().catch(() => false);

      if (!hasLogout && !hasProfile) {
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/logout-button-missing.png' });
        // Check what's actually in the navigation
        const navContent = await page.locator('[data-testid="global-navigation"]').textContent().catch(() => '');
        throw new Error(`Neither logout button nor profile link visible after login. Navigation content: ${navContent.substring(0, 200)}`);
      }

      // Click logout button (use the one that's visible)
      if (hasLogout) {
        await logoutButton.click();
      } else {
        // If only profile link is visible, navigation might be in a different state
        throw new Error('Logout button not found - navigation may not be updating correctly');
      }

      await page.waitForTimeout(2_000);

      // Should be redirected (either to /auth or home)
      const urlAfterLogout = page.url();
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

      // Navigate to feed to ensure navigation renders
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for navigation to update
      await page.waitForFunction(
        () => {
          const logoutBtn = document.querySelector('[data-testid="logout-button"]');
          const profileLink = document.querySelector('a[href="/profile"]');
          return logoutBtn !== null || profileLink !== null;
        },
        { timeout: 15_000 }
      ).catch(() => {});

      await page.waitForTimeout(2_000);

      // Logout - check for logout button or profile link
      const logoutButton = page.locator('[data-testid="logout-button"]');
      const profileLink = page.locator('a[href="/profile"]');

      // Wait for at least one to be visible
      const hasLogout = await logoutButton.isVisible().catch(() => false);
      const hasProfile = await profileLink.isVisible().catch(() => false);

      if (!hasLogout && !hasProfile) {
        await page.screenshot({ path: 'test-results/logout-button-missing-before-logout.png' });
        throw new Error('Logout button not visible - cannot test logout functionality');
      }

      // If logout button is visible, click it
      if (hasLogout) {
        await logoutButton.click();
      } else {
        // If only profile link is visible, navigation might be in a different state
        // Try to find logout in mobile menu or check if we need to navigate
        throw new Error('Logout button not found - navigation may not be updating correctly');
      }

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
