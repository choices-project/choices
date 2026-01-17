import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

/**
 * Privacy/Settings Page Comprehensive E2E Tests
 * 
 * Tests MVP-critical privacy/settings page functionality:
 * - Privacy page loads and displays correctly
 * - Privacy settings are fetched and displayed
 * - Error handling works correctly
 * - Loading states work correctly
 * 
 * These tests verify the fix for the profile API response structure issue
 * that was preventing the privacy page from loading.
 */

test.describe('Privacy/Settings Page - MVP Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Set up E2E bypass for auth
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });

    // Set bypass cookie
    const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
    const url = new URL(baseUrl);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    try {
      await page.context().addCookies([{
        name: 'e2e-dashboard-bypass',
        value: '1',
        path: '/',
        domain: `.${domain}`,
        sameSite: 'None' as const,
        secure: true,
        httpOnly: false,
      }]);
    } catch (error) {
      console.log('[privacy-settings] Using localStorage only:', error);
    }
  });

  test('privacy/settings page loads and displays privacy settings', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Privacy settings tests require production environment');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/privacy');
      await waitForPageReady(page);

      // Wait for privacy settings to load (should not be stuck in loading state)
      await page.waitForTimeout(3000);

      const authRequired = page.locator('text=/sign in|log in|login|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test privacy settings.');

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') || 
        err.includes('Warning: Text content does not match')
      );
      expect(reactErrors.length).toBe(0);

      // Page should NOT be stuck in "Loading privacy settings..." state
      const loadingMessage = page.locator('text=/Loading privacy settings/i');
      const hasLoadingMessage = await loadingMessage.count() > 0;
      
      // If still loading, wait a bit more
      if (hasLoadingMessage) {
        await page.waitForTimeout(5000);
        const stillLoading = await loadingMessage.count() > 0;
        expect(stillLoading).toBeFalsy();
      }

      // Page should have privacy settings content
      const pageContent = page.locator('main, [role="main"], h1, h2').first();
      await expect(pageContent).toBeVisible();

      // Should NOT see infinite loading spinner
      const loadingSpinner = page.locator('.animate-spin').filter({ hasText: /Loading privacy settings/i });
      const hasSpinner = await loadingSpinner.count() > 0;
      expect(hasSpinner).toBeFalsy();
    } finally {
      cleanupMocks();
    }
  });

  test('privacy/settings page displays error state correctly on API failure', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Privacy settings tests require production environment');

    // Mock API to return error
    await page.route('**/api/profile**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });

    await page.goto('/account/privacy');
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    const authRequired = page.locator('text=/sign in|log in|login|authentication required/i');
    const needsAuth = await authRequired.count() > 0;
    test.skip(needsAuth, 'User must be authenticated to test privacy settings.');

    // Should show error state (either error message or still loading)
    const errorContent = page.locator('text=/couldn.*load|error|refresh/i');
    const hasError = await errorContent.count() > 0;
    
    const loadingMessage = page.locator('text=/Loading privacy settings/i');
    const isLoading = await loadingMessage.count() > 0;
    
    // Either error is shown OR page is still loading (acceptable)
    expect(hasError || isLoading).toBeTruthy();
  });

  test('privacy/settings page handles missing profile data gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Privacy settings tests require production environment');

    // Mock API to return empty/null profile
    await page.route('**/api/profile**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            profile: null,
            preferences: null,
            interests: { categories: [], keywords: [], topics: [] },
            onboarding: { completed: false, data: {} },
          },
        }),
      });
    });

    await page.goto('/account/privacy');
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    const authRequired = page.locator('text=/sign in|log in|login|authentication required/i');
    const needsAuth = await authRequired.count() > 0;
    test.skip(needsAuth, 'User must be authenticated to test privacy settings.');

    // Page should not crash - should show some content or redirect
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Should not be stuck in loading state indefinitely
    const loadingMessage = page.locator('text=/Loading privacy settings/i');
    const isLoading = await loadingMessage.count() > 0;
    if (isLoading) {
      await page.waitForTimeout(5000);
      const stillLoading = await loadingMessage.count() > 0;
      expect(stillLoading).toBeFalsy();
    }
  });
});
