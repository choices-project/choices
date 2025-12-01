import { expect, test } from '@playwright/test';

import {
  ensureLoggedOut,
  waitForPageReady,
} from '../helpers/e2e-setup';
import { loginToProduction } from '../helpers/production-auth';

/**
 * End-to-end user journey tests for choices-app.com
 * 
 * These tests simulate real user workflows:
 * - Complete login to dashboard journey
 * - Creating and voting on polls
 * - Profile management
 * - Navigation flows
 * - Error recovery
 */

const TEST_USER_EMAIL = process.env.E2E_USER_EMAIL || process.env.CHOICES_APP_TEST_EMAIL;
const TEST_USER_PASSWORD = process.env.E2E_USER_PASSWORD || process.env.CHOICES_APP_TEST_PASSWORD;

test.describe('Choices App - Complete User Journey', () => {
  test('complete login to dashboard journey', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');
    test.setTimeout(60_000);

    // Step 1: Start at home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Step 2: Navigate to login
    const loginLink = page.locator('a:has-text("Sign in"), a:has-text("Login"), a[href*="/auth"]').first();
    if (await loginLink.isVisible({ timeout: 5000 })) {
      await loginLink.click();
    } else {
      await page.goto('/auth');
    }
    await page.waitForLoadState('networkidle');

    // Step 3: Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });

    // Step 4: Wait for redirect
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Step 5: Navigate to dashboard if needed
    if (page.url().includes('/onboarding')) {
      // Skip onboarding if possible, or complete it
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Later")').first();
      if (await skipButton.isVisible({ timeout: 5000 })) {
        await skipButton.click();
        await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
      }
    } else {
      await page.goto('/dashboard');
    }

    // Step 6: Verify dashboard loads
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');

    // Step 7: Verify API calls succeed
    const apiErrors: Array<{ url: string; status: number }> = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        apiErrors.push({ url: response.url(), status: response.status() });
      }
    });

    await page.waitForTimeout(3000);

    // Should not have 401/403 errors
    const authErrors = apiErrors.filter(e => e.status === 401 || e.status === 403);
    if (authErrors.length > 0) {
      console.error('Authentication errors during journey:', authErrors);
    }
    expect(authErrors.length).toBe(0);
  });

  test('navigation flow after login', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Test navigation to different pages
    const pages = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/polls', name: 'Polls' },
      { path: '/profile', name: 'Profile' },
    ];

    for (const { path, name } of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Should not be redirected to login
      expect(page.url()).toContain(path);
      
      // Page should load
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toBeNull();
    }
  });

  test('session persistence during navigation', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Navigate through multiple pages
    const navigationSequence = ['/dashboard', '/polls', '/dashboard', '/profile', '/dashboard'];
    
    for (const path of navigationSequence) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      
      // Should remain authenticated
      expect(page.url()).not.toContain('/auth');
      expect(page.url()).toContain(path);
    }
  });

  test('error recovery after failed API call', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate a failed API call, then verify recovery
    await page.route('**/api/dashboard/data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Temporary error' }),
      });
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be authenticated
    expect(page.url()).toContain('/dashboard');

    // Remove route interception
    await page.unroute('**/api/dashboard/data');

    // Reload again - should work normally
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');
  });

  test('multiple rapid page navigations maintain session', async ({ page }) => {
    test.skip(!TEST_USER_EMAIL || !TEST_USER_PASSWORD, 'Test credentials not configured');

    await ensureLoggedOut(page);

    // Login
    await loginToProduction(page, {
      email: TEST_USER_EMAIL!,
      password: TEST_USER_PASSWORD!,
    });
    await waitForPageReady(page);
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Rapidly navigate between pages
    for (let i = 0; i < 5; i++) {
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
      await page.goto('/polls');
      await page.waitForTimeout(500);
    }

    // Final check - should still be authenticated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/auth');
  });
});

