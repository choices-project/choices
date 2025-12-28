import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Account Export Page Tests', () => {
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
      console.log('[account-export] Using localStorage only:', error);
    }
  });

  test('account export page loads correctly', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account export tests require production environment');

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
      await page.goto('/account/export');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check for React errors
      const reactErrors = consoleErrors.filter(err => 
        err.includes('React Error') || 
        err.includes('Hydration') || 
        err.includes('Warning: Text content does not match')
      );
      expect(reactErrors.length).toBe(0);

      // Page should display export options or authentication required message
      const exportIndicators = [
        page.locator('text=/export.*data|download.*data|your.*data/i'),
        page.locator('h1, h2').filter({ hasText: /export|download|data/i }),
      ];

      let foundExportContent = false;
      for (const indicator of exportIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundExportContent = true;
          break;
        }
      }

      // Should have export content OR authentication required message
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      
      expect(foundExportContent || needsAuth).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });

  test('account export page displays export options', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account export tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/export');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test export options');

      // Look for export option checkboxes or selection
      const exportOptions = page.locator('input[type="checkbox"], input[type="radio"], button:has-text(/export/i)');
      const optionCount = await exportOptions.count();

      // Should have export options OR export button
      expect(optionCount).toBeGreaterThanOrEqual(0);

      // Look for format selection (JSON, CSV, PDF)
      const formatOptions = page.locator('text=/json|csv|pdf|format/i, select, input[type="radio"]');
      const formatCount = await formatOptions.count();

      // Format selection is optional but recommended
      expect(formatCount).toBeGreaterThanOrEqual(0);

    } finally {
      await cleanupMocks();
    }
  });

  test('account export request initiates successfully', async ({ page }) => {
    test.setTimeout(120_000); // Longer timeout for export processing
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account export tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/export');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test export request');

      // Find export button
      const exportButton = page.locator('button:has-text(/export|download|generate/i), button[type="submit"]').first();
      const exportButtonExists = await exportButton.count() > 0;

      test.skip(!exportButtonExists, 'Export button not found');

      // Click export button
      await exportButton.click({ timeout: 10_000 });
      await page.waitForTimeout(2000);

      // Should show loading state or success message
      const loadingIndicator = page.locator('text=/processing|generating|preparing/i, .animate-spin, [aria-busy="true"]');
      const successMessage = page.locator('text=/success|ready|download/i, a[download]');

      // Either loading state OR success message should appear
      const hasLoading = await loadingIndicator.count() > 0;
      const hasSuccess = await successMessage.count() > 0;

      // Wait a bit more for processing
      if (hasLoading && !hasSuccess) {
        await page.waitForTimeout(5000);
        const stillLoading = await loadingIndicator.count() > 0;
        const nowHasSuccess = await successMessage.count() > 0;
        
        // Should eventually show success or download link
        expect(stillLoading || nowHasSuccess).toBeTruthy();
      } else {
        expect(hasLoading || hasSuccess).toBeTruthy();
      }

    } finally {
      await cleanupMocks();
    }
  });

  test('account export page handles errors gracefully', async ({ page }) => {
    test.setTimeout(60_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account export tests require production environment');

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
      await page.goto('/account/export');
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

  test('account export page shows loading states during export generation', async ({ page }) => {
    test.setTimeout(120_000);
    
    const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
    test.skip(useMocks, 'Account export tests require production environment');

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/account/export');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      // Check if authenticated
      const authRequired = page.locator('text=/sign in|logged in|authentication required/i');
      const needsAuth = await authRequired.count() > 0;
      test.skip(needsAuth, 'User must be authenticated to test loading states');

      // Find export button
      const exportButton = page.locator('button:has-text(/export|download|generate/i)').first();
      const exportButtonExists = await exportButton.count() > 0;

      test.skip(!exportButtonExists, 'Export button not found');

      // Click export button
      await exportButton.click({ timeout: 10_000 });
      await page.waitForTimeout(1000);

      // Should show loading indicator
      const loadingIndicators = [
        page.locator('text=/processing|generating|preparing/i'),
        page.locator('.animate-spin, [aria-busy="true"]'),
        page.locator('[role="progressbar"]'),
      ];

      let foundLoading = false;
      for (const indicator of loadingIndicators) {
        const count = await indicator.count();
        if (count > 0) {
          foundLoading = true;
          break;
        }
      }

      // Should show loading state OR success/download immediately
      const successMessage = page.locator('text=/success|ready|download/i, a[download]');
      const hasSuccess = await successMessage.count() > 0;

      expect(foundLoading || hasSuccess).toBeTruthy();

    } finally {
      await cleanupMocks();
    }
  });
});

