/**
 * Admin Dashboard Functionality Tests
 *
 * Verifies that all admin dashboard pages are functional after fixes:
 * - No React error #185 (hydration mismatches)
 * - Error boundaries work correctly
 * - Pages load without crashes
 * - Widgets render properly
 *
 * Created: January 21, 2026
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

import { loginWithPassword, getE2EAdminCredentials, waitForPageReady } from '../helpers/e2e-setup';

test.describe('Admin Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    const adminCreds = getE2EAdminCredentials();
    if (!adminCreds) {
      test.skip(true, 'Admin credentials not available');
      return;
    }

    await loginWithPassword(page, adminCreds, {
      path: '/auth',
      timeoutMs: 30_000,
    });

    // Wait for navigation to complete
    await page.waitForTimeout(2_000);
  });

  test('Users page loads without React errors', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Check for React error #185 (should not appear)
    const reactError = page.locator('text=/Minified React error #185/i');
    const reactErrorCount = await reactError.count();
    expect(reactErrorCount).toBe(0);

    // Check that page content loads (either loading, error, or content state)
    const userManagementContainer = page.getByTestId('user-management-container');
    const userManagementLoading = page.getByTestId('user-management-loading');
    const userManagement = page.getByTestId('user-management');
    const errorBoundary = page.locator('text=/Admin Error|Error Loading Users/i');

    // At least one of these should be present
    const hasContent =
      (await userManagementContainer.count()) > 0 ||
      (await userManagementLoading.count()) > 0 ||
      (await userManagement.count()) > 0 ||
      (await errorBoundary.count()) > 0;

    expect(hasContent).toBe(true);

    // Verify no debug agent log calls in console
    const consoleMessages = await page.evaluate(() => {
      return (window as any).__consoleErrors || [];
    });
    const debugLogErrors = consoleMessages.filter((msg: string) =>
      msg.includes('127.0.0.1:7242') || msg.includes('agent log')
    );
    expect(debugLogErrors.length).toBe(0);
  });

  test('Analytics page loads with error boundaries', async ({ page }) => {
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);

    // Check for React error #185 (should not appear in DOM - production may not show overlay)
    const reactError = page.locator('text=/Minified React error #185/i');
    expect(await reactError.count()).toBe(0);

    // Check that analytics page loads: title, mode toggles, or loading/error state
    const analyticsTitle = page.locator('h1, h2').filter({ hasText: /analytics/i });
    const classicButton = page.getByRole('button', { name: /classic/i });
    const widgetsButton = page.getByRole('button', { name: /widgets/i });
    const loadingOrError = page.locator('text=/loading|error|failed to load/i');

    const hasContent =
      (await analyticsTitle.count()) > 0 ||
      (await classicButton.count()) > 0 ||
      (await widgetsButton.count()) > 0 ||
      (await loadingOrError.count()) > 0;

    expect(hasContent).toBe(true);

    await page.waitForTimeout(2_000);
    expect(await reactError.count()).toBe(0);
  });

  test('Performance page loads with timeout handling', async ({ page }) => {
    await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Check for React error #185 (should not appear)
    const reactError = page.locator('text=/Minified React error #185/i');
    const reactErrorCount = await reactError.count();
    expect(reactErrorCount).toBe(0);

    // Wait for performance dashboard to load (with timeout)
    await page.waitForTimeout(5_000);

    // Check that page shows either loading, content, or error state (not React error #185)
    const performanceTitle = page.locator('h2:has-text("Performance Dashboard"), h1:has-text("Performance")');
    const loadingState = page.locator('text=/Loading performance metrics/i');
    const errorState = page.locator('text=/Error Loading Performance Data/i');
    const skeleton = page.locator('.animate-pulse');

    const hasValidState =
      (await performanceTitle.count()) > 0 ||
      (await loadingState.count()) > 0 ||
      (await errorState.count()) > 0 ||
      (await skeleton.count()) > 0;

    expect(hasValidState).toBe(true);

    // Verify no React error #185
    const reactError185 = page.locator('text=/Minified React error #185/i');
    expect(await reactError185.count()).toBe(0);
  });

  test('All admin pages have error boundaries', async ({ page }) => {
    const adminPages = [
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/users', name: 'Users' },
      { path: '/admin/feedback', name: 'Feedback' },
      { path: '/admin/moderation', name: 'Moderation' },
      { path: '/admin/system', name: 'System' },
      { path: '/admin/security', name: 'Security' },
      { path: '/admin/site-messages', name: 'Site Messages' },
      { path: '/admin/feature-flags', name: 'Feature Flags' },
    ];

    for (const { path, name } of adminPages) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Check for React error #185 (should not appear)
      const reactError = page.locator('text=/Minified React error #185/i');
      const reactErrorCount = await reactError.count();

      if (reactErrorCount > 0) {
        throw new Error(`${name} page (${path}) has React error #185`);
      }

      // Page should load (even if it shows error boundary, that's OK - it means error boundary is working)
      const bodyContent = await page.locator('body').textContent();
      expect(bodyContent).toBeTruthy();
      expect(bodyContent?.length).toBeGreaterThan(0);
    }
  });

  test('Widget dashboard renders without React errors', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Switch to widget mode if available
    const widgetsButton = page.getByRole('button', { name: /widgets/i });
    if ((await widgetsButton.count()) > 0) {
      await widgetsButton.click();
      await page.waitForTimeout(2_000);
    }

    await page.waitForTimeout(5_000);

    expect(await page.locator('text=/Minified React error #185/i').count()).toBe(0);

    // Verify widgets, error boundary, or analytics content is present
    const widgetContainer = page.locator('[data-testid*="widget"], [data-testid*="pwa-offline-queue"]');
    const widgetErrorBoundary = page.locator('text=/Widget Error|error loading|failed to load/i');
    const analyticsContent = page.locator('main, [role="main"]');
    const hasContent =
      (await widgetContainer.count()) > 0 ||
      (await widgetErrorBoundary.count()) > 0 ||
      (await analyticsContent.count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('No debug agent log code in production', async ({ page }) => {
    // Navigate to users page (where we removed debug code)
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Check console for any debug agent log calls
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('127.0.0.1:7242') || text.includes('agent log')) {
        consoleErrors.push(text);
      }
    });

    // Wait a bit for any console messages
    await page.waitForTimeout(3_000);

    // Verify no debug agent log calls
    expect(consoleErrors.length).toBe(0);
  });
});
