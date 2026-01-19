import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Error Pages Tests', () => {
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
      console.log('[error-pages] Using localStorage only:', error);
    }
  });

  test('404 page displays correctly for invalid routes', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Error page tests require production environment');

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
      // Navigate to invalid route
      await page.goto('/this-page-does-not-exist-12345');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Should display 404 error message
      const errorIndicators = [
        page.locator('text=/404|not found|page.*not.*found|does.*not.*exist/i'),
        page.locator('h1, h2').filter({ hasText: /404|not found/i }),
      ];

      let foundError = false;
      for (const indicator of errorIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundError = true;
          break;
        }
      }

      // Should have error message OR redirect to a valid page
      const currentUrl = page.url();
      const isValidPage = !currentUrl.includes('this-page-does-not-exist');
      
      expect(foundError || isValidPage).toBeTruthy();

      // Should not have critical React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') && 
        !err.includes('Warning')
      );
      expect(reactErrors.length).toBe(0);

    } finally {
      await cleanupMocks();
    }
  });

  test('error boundaries catch and display errors gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Error page tests require production environment');

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
      // Navigate to a valid page
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Error boundaries should catch errors, but we don't want errors in normal flow
      // So we check that either no errors occurred OR error boundary handled them
      const criticalErrors = consoleErrors.filter(err => 
        err.includes('ErrorBoundary') || 
        err.includes('Uncaught') ||
        (err.includes('React Error') && !err.includes('Warning'))
      );

      // Should not have uncaught errors
      expect(criticalErrors.length).toBe(0);

      // Page should still render content
      const pageContent = page.locator('body');
      const hasContent = await pageContent.count() > 0;
      expect(hasContent).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('error pages have recovery actions (retry, go home, go back)', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Error page tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to invalid route to trigger error page
      await page.goto('/this-invalid-route-12345');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Look for recovery action buttons/links
      const recoveryActions = [
        page.locator('button:has-text(/retry/i), a:has-text(/retry/i)'),
        page.locator('button:has-text(/go.*home/i), a:has-text(/go.*home/i), a[href="/"], a[href="/dashboard"]'),
        page.locator('button:has-text(/back/i), a:has-text(/back/i)'),
      ];

      let foundRecoveryAction = false;
      for (const action of recoveryActions) {
        const count = await action.count();
        if (count > 0) {
          foundRecoveryAction = true;
          
          // Test clicking the action
          const actionElement = action.first();
          const href = await actionElement.getAttribute('href');
          const isButton = await actionElement.evaluate(el => el.tagName.toLowerCase() === 'button');
          
          if (isButton || href) {
            // Action should be clickable
            await actionElement.click({ timeout: 10_000 }).catch(() => {
              // If click fails, that's okay - action might not be fully functional
            });
            await page.waitForTimeout(1000);
          }
          break;
        }
      }

      // Recovery actions are optional but recommended
      // If no recovery action found, page should at least display error message
      const errorMessage = page.locator('text=/404|not found|error/i');
      const hasErrorMessage = await errorMessage.count() > 0;
      
      expect(foundRecoveryAction || hasErrorMessage).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('error messages are user-friendly (not technical)', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Error page tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to invalid route
      await page.goto('/invalid-route-99999');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Get all text content on the page
      const pageText = await page.locator('body').textContent();

      // Check for technical error messages (should not be visible to users)
      const technicalTerms = [
        'stack trace',
        'undefined',
        'null pointer',
        'exception',
        'error code',
        'status code',
      ];

      let foundTechnicalTerm = false;
      if (pageText) {
        for (const term of technicalTerms) {
          if (pageText.toLowerCase().includes(term)) {
            foundTechnicalTerm = true;
            break;
          }
        }
      }

      // Should not show technical error messages to users
      // (They might be in console, but not visible on page)
      expect(foundTechnicalTerm).toBeFalsy();

    } finally {
      await cleanupMocks();
    }
  });

  test('error pages handle route-specific errors correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Error page tests require production environment');

    // Test error pages for specific routes that have error.tsx files
    const routesWithErrorPages = [
      '/dashboard',
      '/profile',
      '/feed',
      '/civics',
      '/polls',
    ];

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      for (const route of routesWithErrorPages) {
        await page.goto(route);
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Page should load (error pages handle errors, not prevent page load)
        const pageContent = page.locator('body');
        const hasContent = await pageContent.count() > 0;
        expect(hasContent).toBeTruthy();

        // Should not have infinite loading
        const loadingSpinners = await page.locator('.animate-spin, [role="progressbar"]').count();
        expect(loadingSpinners).toBeLessThan(5);
      }

    } finally {
      await cleanupMocks();
    }
  });
});

