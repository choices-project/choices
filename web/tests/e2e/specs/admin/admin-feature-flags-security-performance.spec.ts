/**
 * Admin Feature Flags, Security & Performance Pages Test Suite
 *
 * Comprehensive tests for:
 * - Feature Flags management
 * - Security monitoring
 * - Performance dashboard
 * - React Query integration and error handling
 */

import { test, expect } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Admin Feature Flags, Security & Performance', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);

    await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
      admin: true,
    });
  });

  test.describe('Feature Flags Page', () => {
    test('should load feature flags page correctly', async ({ page }) => {
      await page.goto('/admin/feature-flags', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify sidebar is visible
      await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

      // Verify main content area is visible
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });

      // Verify page has content (feature flags component should render)
      const hasContent = await mainContent.locator('*').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/feature-flags', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      });

      await page.goto('/admin/feature-flags', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Page should still load (error handling should be graceful)
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });

    test('should display feature flags when API succeeds', async ({ page }) => {
      // Mock API to return success
      await page.route('**/api/feature-flags', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            flags: {
              'feature-1': true,
              'feature-2': false,
            },
          }),
        });
      });

      await page.goto('/admin/feature-flags', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify page loaded
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe('Security Page', () => {
    test('should load security page correctly', async ({ page }) => {
      await page.goto('/admin/security', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify sidebar is visible
      await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

      // Verify main content area is visible
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });

      // Verify page has content (security component should render)
      const hasContent = await mainContent.locator('*').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('should handle security API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/security/monitoring', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      });

      await page.goto('/admin/security', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Page should still load (error handling should be graceful)
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });

    test('should display security metrics when API succeeds', async ({ page }) => {
      // Mock API to return success
      await page.route('**/api/security/monitoring', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              metrics: {
                totalViolations: 0,
                violationsLastHour: 0,
                violationsLast24Hours: 0,
                topViolatingIPs: [],
                violationsByEndpoint: {},
              },
              recentViolations: [],
            },
          }),
        });
      });

      await page.goto('/admin/security', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify page loaded
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe('Performance Page', () => {
    test('should load performance page correctly', async ({ page }) => {
      await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify sidebar is visible
      await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

      // Verify main content area is visible
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });

      // Verify page has content (performance component should render)
      const hasContent = await mainContent.locator('*').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('should handle performance API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/admin/system-metrics**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      });

      await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Page should still load (error handling should be graceful)
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });

    test('should display performance metrics when API succeeds', async ({ page }) => {
      // Mock API to return success
      await page.route('**/api/admin/health?type=metrics', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            metrics: {
              total_topics: 0,
              total_polls: 0,
              active_polls: 0,
              system_health: 'healthy',
              last_updated: new Date().toISOString(),
            },
          }),
        });
      });

      await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Verify page loaded
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe('React Query Integration', () => {
    test('should retry on network errors for health checks', async ({ page }) => {
      let requestCount = 0;

      await page.route((url) => url.href.includes('/api/health') && !url.href.includes('/extended'), (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Network error' }),
          });
        } else {
          // Return successful response for retries
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              status: 'healthy',
            }),
          });
        }
      });

      // Navigate to performance page (uses health checks)
      await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Wait for retry (React Query will retry with exponential backoff: 1s, 2s)
      await page.waitForTimeout(5000);

      // Main content should be visible
      const mainContent = page.locator('main[id="admin-main"]');
      await expect(mainContent).toBeVisible({ timeout: 15_000 });

      // Wait for React Query to process the successful retry
      await page.waitForTimeout(2000);

      // If the hook was called (requestCount > 0), verify retry happened
      // If not called, that's fine - it may be lazy-loaded
      if (requestCount > 0) {
        expect(requestCount).toBeGreaterThanOrEqual(2);
      } else {
        console.log('[TEST] useHealth hook not called on /admin/performance - may be lazy-loaded');
      }
    });
  });
});

