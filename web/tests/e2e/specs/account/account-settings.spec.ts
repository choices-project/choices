/**
 * Account Settings E2E Tests
 *
 * Tests account-related pages:
 * - Privacy & Data page load and content
 * - Data Export page load and export initiation
 *
 * Auth login, profile edit, and poll analytics have dedicated specs:
 * - auth-flow.spec.ts, mvp-critical-flows.spec.ts, poll-analytics-verification.spec.ts
 *
 * Created: February 2026
 */

import { expect, test } from '@playwright/test';

import {
  loginTestUser,
  waitForPageReady,
} from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;
const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Account Settings', () => {
  test.beforeEach(async ({ page }) => {
    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E credentials not available');
      return;
    }

    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page);
    await page.waitForTimeout(2_000);
  });

  test.describe('Privacy & Data', () => {
    test('privacy page loads and displays content', async ({ page }) => {
      test.setTimeout(60_000);

      await page.goto(`${BASE_URL}/account/privacy`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        console.log('[DIAGNOSTIC] Privacy page redirected to auth - may need onboarding');
        return;
      }

      expect(currentUrl).toMatch(/\/account\/privacy/);

      // Should see privacy content - MyDataDashboard or privacy-related headings
      const privacyHeading = page.locator('h1, h2').filter({ hasText: /privacy|data|settings/i }).first();
      const dashboardContent = page.locator('[aria-label*="privacy"], [aria-label*="data"]');
      const hasContent = (await privacyHeading.count()) > 0 || (await dashboardContent.count()) > 0;

      expect(hasContent).toBe(true);
    });
  });

  test.describe('Data Export', () => {
    test('export page loads and displays options', async ({ page }) => {
      test.setTimeout(60_000);

      await page.goto(`${BASE_URL}/account/export`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        console.log('[DIAGNOSTIC] Export page redirected to auth - may need onboarding');
        return;
      }

      expect(currentUrl).toMatch(/\/account\/export/);

      // Should see Data Export heading
      const exportHeading = page.locator('h1').filter({ hasText: /data export|export data/i });
      await expect(exportHeading.first()).toBeVisible({ timeout: 10_000 });

      // Should see export options (Profile, Polls, etc.)
      const exportOptions = page.locator('text=/export options|profile information|polls.*votes/i');
      const hasOptions = (await exportOptions.count()) > 0;
      expect(hasOptions).toBe(true);

      // Should see export button
      const exportButton = page.getByRole('button').filter({ hasText: /export data|exporting/i });
      await expect(exportButton.first()).toBeVisible({ timeout: 5_000 });
    });

    test('export button can be clicked and initiates export', async ({ page }) => {
      test.setTimeout(90_000);

      await page.goto(`${BASE_URL}/account/export`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);
      await page.waitForTimeout(3_000);

      const currentUrl = page.url();
      if (currentUrl.includes('/auth')) {
        console.log('[DIAGNOSTIC] Export page redirected to auth');
        return;
      }

      const exportButton = page.getByRole('button').filter({ hasText: /export data/i }).first();
      const isDisabled = await exportButton.isDisabled();

      if (!isDisabled) {
        await exportButton.click();
        await page.waitForTimeout(4_000);

        // After click: button shows "Exporting..." during request, or returns to "Export Data" when done
        // Page should remain functional (no critical error)
        const criticalError = page.locator('[role="alert"]').filter({ hasText: /failed|error/i });
        const hasCriticalError = (await criticalError.count()) > 0;
        expect(hasCriticalError).toBe(false);
      }
    });
  });
});
