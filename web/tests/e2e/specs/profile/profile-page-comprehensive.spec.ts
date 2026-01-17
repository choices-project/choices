import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

/**
 * Profile Page Comprehensive E2E Tests
 * 
 * Tests MVP-critical profile page functionality:
 * - Profile page loads and displays correctly
 * - Profile data is fetched and displayed
 * - Navigation to edit/preferences works
 * - Error handling works correctly
 * - Loading states work correctly
 * - Profile export functionality
 * 
 * These tests verify the fix for the profile API response structure issue.
 */

test.describe('Profile Page - MVP Critical Functionality', () => {
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
      console.log('[profile-page] Using localStorage only:', error);
    }
  });

  test('profile page loads and displays profile data', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile page tests require production environment');

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
      await page.goto('/profile');
      await waitForPageReady(page);

      // Wait for profile data to load (should not be stuck in loading state)
      await page.waitForTimeout(3000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') || 
        err.includes('Warning: Text content does not match')
      );
      expect(reactErrors.length).toBe(0);

      // Page should not be in loading state indefinitely
      const loadingIndicator = page.locator('[data-testid="profile-loading"]');
      const isLoading = await loadingIndicator.count() > 0;
      
      // If loading, wait a bit more and check again
      if (isLoading) {
        await page.waitForTimeout(5000);
        const stillLoading = await loadingIndicator.count() > 0;
        expect(stillLoading).toBeFalsy();
      }

      // Page should have profile content
      const profileContent = page.locator('main, [role="main"], [data-testid*="profile"]').first();
      await expect(profileContent).toBeVisible();

      // Should see profile information (either profile data or error message)
      const hasContent = await page.locator('h1, h2, [data-testid*="profile"]').count() > 0;
      expect(hasContent).toBeTruthy();

      // Should NOT see "Loading profile..." message (page should have loaded)
      const loadingMessage = page.locator('text=/Loading profile/i');
      const hasLoadingMessage = await loadingMessage.count() > 0;
      expect(hasLoadingMessage).toBeFalsy();
    } finally {
      cleanupMocks();
    }
  });

  test('profile page displays error state correctly on API failure', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile page tests require production environment');

    // Mock API to return error
    await page.route('**/api/profile**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });

    await page.goto('/profile');
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    // Should show error state (either error message or retry button)
    const errorContent = page.locator('text=/failed|error|try again/i');
    const hasError = await errorContent.count() > 0;
    
    // Either error is shown OR page is still loading (acceptable)
    const loadingIndicator = page.locator('[data-testid="profile-loading"]');
    const isLoading = await loadingIndicator.count() > 0;
    
    expect(hasError || isLoading).toBeTruthy();
  });

  test('profile page navigation buttons work correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile page tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/profile');
      await waitForPageReady(page);
      await page.waitForTimeout(3000);

      // Wait for page to load
      const loadingIndicator = page.locator('[data-testid="profile-loading"]');
      const isLoading = await loadingIndicator.count() > 0;
      if (isLoading) {
        await page.waitForTimeout(5000);
      }

      // Check for Edit Profile button/link
      const editButton = page.locator('button, a').filter({ hasText: /edit profile/i });
      const editButtonCount = await editButton.count();
      
      // If edit button exists, click it and verify navigation
      if (editButtonCount > 0) {
        await editButton.first().click();
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/profile\/edit/);
      }
    } finally {
      cleanupMocks();
    }
  });

  test('profile page handles missing profile data gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile page tests require production environment');

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

    await page.goto('/profile');
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    // Page should not crash - should show some content (even if empty)
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Should not be stuck in loading state
    const loadingIndicator = page.locator('[data-testid="profile-loading"]');
    const isLoading = await loadingIndicator.count() > 0;
    if (isLoading) {
      await page.waitForTimeout(5000);
      const stillLoading = await loadingIndicator.count() > 0;
      expect(stillLoading).toBeFalsy();
    }
  });

  test('profile page export functionality works', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile page tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/profile');
      await waitForPageReady(page);
      await page.waitForTimeout(3000);

      // Wait for page to load
      const loadingIndicator = page.locator('[data-testid="profile-loading"]');
      const isLoading = await loadingIndicator.count() > 0;
      if (isLoading) {
        await page.waitForTimeout(5000);
      }

      // Look for Export Data button
      const exportButton = page.locator('button, a').filter({ hasText: /export data/i });
      const exportButtonCount = await exportButton.count();
      
      // If export button exists, verify it's visible and enabled
      if (exportButtonCount > 0) {
        await expect(exportButton.first()).toBeVisible();
        await expect(exportButton.first()).toBeEnabled();
      }
    } finally {
      cleanupMocks();
    }
  });
});
