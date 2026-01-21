/**
 * Admin Dashboard Verification Tests
 *
 * Quick verification that admin dashboard pages load without React errors
 * and have proper error boundaries.
 *
 * Created: January 21, 2026
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';

import { loginWithPassword, getE2EAdminCredentials, waitForPageReady } from '../helpers/e2e-setup';

test.describe('Admin Dashboard Verification', () => {
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

    await page.waitForTimeout(2_000);
  });

  test('Users page loads without React error #185', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    // Check for React error #185 (should not appear)
    const reactError = page.locator('text=/Minified React error #185/i');
    const reactErrorCount = await reactError.count();
    expect(reactErrorCount).toBe(0);

    // Verify page has content (loading, error, or user management)
    const hasContent =
      (await page.getByTestId('user-management-container').count()) > 0 ||
      (await page.getByTestId('user-management-loading').count()) > 0 ||
      (await page.getByTestId('user-management').count()) > 0 ||
      (await page.locator('text=/Error Loading Users/i').count()) > 0;

    expect(hasContent).toBe(true);
  });

  test('Analytics page loads without React error #185', async ({ page }) => {
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3_000);

    // Check for React error #185 (should not appear)
    const reactError = page.locator('text=/Minified React error #185/i');
    const reactErrorCount = await reactError.count();
    expect(reactErrorCount).toBe(0);

    // Verify analytics page has content
    const analyticsTitle = page.locator('h1:has-text("Analytics")');
    await expect(analyticsTitle).toBeVisible({ timeout: 10_000 });
  });

  test('Performance page loads without React error #185', async ({ page }) => {
    await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    await page.waitForTimeout(5_000);

    // Check for React error #185 (should not appear)
    const reactError = page.locator('text=/Minified React error #185/i');
    const reactErrorCount = await reactError.count();
    expect(reactErrorCount).toBe(0);

    // Verify page has some content (loading, error, or dashboard)
    const hasContent =
      (await page.locator('text=/Performance Dashboard/i').count()) > 0 ||
      (await page.locator('text=/Loading performance metrics/i').count()) > 0 ||
      (await page.locator('text=/Error Loading Performance Data/i').count()) > 0 ||
      (await page.locator('.animate-pulse').count()) > 0;

    expect(hasContent).toBe(true);
  });

  test('All admin pages load without React error #185', async ({ page }) => {
    const adminPages = [
      '/admin',
      '/admin/users',
      '/admin/feedback',
      '/admin/moderation',
      '/admin/system',
      '/admin/security',
      '/admin/site-messages',
      '/admin/feature-flags',
    ];

    for (const path of adminPages) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(2_000);

      // Check for React error #185 (should not appear)
      const reactError = page.locator('text=/Minified React error #185/i');
      const reactErrorCount = await reactError.count();

      if (reactErrorCount > 0) {
        throw new Error(`Page ${path} has React error #185`);
      }

      // Page should have some content
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(0);
    }
  });
});
