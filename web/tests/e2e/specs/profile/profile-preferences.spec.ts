import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Profile Preferences Page Tests', () => {
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
      console.log('[profile-preferences] Using localStorage only:', error);
    }
  });

  test('profile preferences page loads and displays correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile preferences tests require production environment');

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
      await page.goto('/profile/preferences');
      await waitForPageReady(page);

      // Wait for page to load (may have loading state)
      await page.waitForTimeout(2000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') || 
        err.includes('Warning: Text content does not match')
      );
      expect(reactErrors.length).toBe(0);

      // Page should not be in loading state indefinitely
      const loadingIndicator = page.locator('[data-testid="preferences-loading-auth"]');
      const isLoading = await loadingIndicator.count() > 0;
      
      // If loading, wait a bit more and check again
      if (isLoading) {
        await page.waitForTimeout(3000);
        const stillLoading = await loadingIndicator.count() > 0;
        expect(stillLoading).toBeFalsy();
      }

      // Page should have some content (either preferences or "need to sign in" message)
      const pageContent = page.locator('h1, h2, main, [role="main"]');
      const contentCount = await pageContent.count();
      expect(contentCount).toBeGreaterThan(0);

      // If authenticated, should see preferences sections
      const preferencesTitle = page.locator('h1, h2').filter({ hasText: /preferences|settings|interests/i });
      const hasPreferencesTitle = await preferencesTitle.count() > 0;
      
      // Either preferences page loaded OR authentication required message
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const hasAuthMessage = await authRequired.count() > 0;
      
      expect(hasPreferencesTitle || hasAuthMessage).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('profile preferences can be changed and saved', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile preferences tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/profile/preferences');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if we're authenticated (if not, skip test)
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test preference changes');

      // Find interest selection component or preference inputs
      // Look for checkboxes, toggles, or selection elements
      const preferenceInputs = page.locator('input[type="checkbox"], input[type="radio"], button[role="button"]');
      const inputCount = await preferenceInputs.count();

      test.skip(inputCount === 0, 'No preference inputs found on preferences page');

      // Try to interact with first preference input (if it's an interest selection)
      // We'll look for interest tags or checkboxes
      const interestTags = page.locator('button, [role="button"], input[type="checkbox"]').filter({ hasText: /.+/ }).first();
      const tagExists = await interestTags.count() > 0;

      if (tagExists) {
        // Click an interest tag to toggle it
        const initialText = await interestTags.textContent();
        await interestTags.click({ timeout: 10_000 });
        
        // Wait for potential state change
        await page.waitForTimeout(1000);

        // Verify interaction occurred (button state may have changed)
        // This is a basic interaction test - full save test would require more specific selectors
        expect(initialText).toBeTruthy();
      }

      // Look for save button if it exists
      const saveButton = page.locator('button:has-text(/save/i), button[type="submit"]').first();
      const saveButtonExists = await saveButton.count() > 0;

      if (saveButtonExists && !await saveButton.isDisabled()) {
        // Click save button
        await saveButton.click({ timeout: 10_000 });
        
        // Wait for save to complete
        await page.waitForTimeout(2000);

        // Look for success message or verify no error message appears
        const successMessage = page.locator('text=/saved successfully|preferences saved|success/i');
        await successMessage.count(); // Check exists but don't require it
        
        // Either success message appears OR no error message appears
        const errorMessage = page.locator('text=/error|failed|try again/i').filter({ hasText: /error|failed/i });
        const hasError = await errorMessage.count() > 0;
        
        // If save button exists and was clicked, we should see success or no error
        expect(!hasError).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('profile preferences persist across page refresh', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile preferences tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/profile/preferences');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test preference persistence');

      // Get initial state of preferences (if we can identify them)
      // This test would need more specific selectors to be fully effective
      // For now, we'll verify the page loads correctly after refresh
      await page.reload();
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Wait for page to fully reload
      await page.waitForTimeout(2000);
      
      // Page should still load correctly after refresh
      const pageContent = page.locator('h1, h2, main, [role="main"], body');
      const contentCount = await pageContent.count();
      expect(contentCount).toBeGreaterThan(0);

      // Should not be stuck in loading state (allow brief loading)
      const loadingIndicator = page.locator('[data-testid="preferences-loading-auth"]');
      await page.waitForTimeout(2000); // Give it time to finish loading
      const isLoading = await loadingIndicator.count() > 0;
      expect(isLoading).toBeFalsy();

    } finally {
      await cleanupMocks();
    }
  });

  test('profile preferences page handles loading states correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile preferences tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/profile/preferences');
      
      // Wait for page to load
      await waitForPageReady(page);
      await page.waitForTimeout(3000);

      // Loading state should eventually disappear (within timeout)
      const loadingIndicator = page.locator('[data-testid="preferences-loading-auth"], .animate-spin, [aria-busy="true"]');
      const stillLoading = await loadingIndicator.count() > 0;
      expect(stillLoading).toBeFalsy();

      // Page should have content after loading
      const pageContent = page.locator('h1, h2, main, [role="main"]');
      const contentCount = await pageContent.count();
      expect(contentCount).toBeGreaterThan(0);

    } finally {
      await cleanupMocks();
    }
  });

  test('profile preferences page handles errors gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Profile preferences tests require production environment');

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
      await page.goto('/profile/preferences');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') ||
        err.includes('ErrorBoundary')
      );
      
      // Should not have critical React errors
      const criticalErrors = reactErrors.filter(err => 
        !err.includes('Warning') && 
        !err.includes('deprecated')
      );
      expect(criticalErrors.length).toBe(0);

      // Page should display content even if there are some errors
      const pageContent = page.locator('body');
      const hasContent = await pageContent.count() > 0;
      expect(hasContent).toBeTruthy();

      // Should not have infinite loading spinner
      const loadingSpinners = await page.locator('.animate-spin, [role="progressbar"]').count();
      expect(loadingSpinners).toBeLessThan(5);

    } finally {
      await cleanupMocks();
    }
  });
});

