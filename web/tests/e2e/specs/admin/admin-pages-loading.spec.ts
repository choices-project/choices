/**
 * Admin Pages Loading Test
 *
 * Verifies that all admin pages load correctly when navigating via the sidebar.
 * This test ensures the AdminLayout pattern is correctly applied to all pages.
 */

import { test, expect } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
  loginAsAdmin,
  SHOULD_USE_MOCKS,
} from '../../helpers/e2e-setup';

test.describe('Admin Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocks (E2E harness mode will bypass server-side admin auth)
    await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
      admin: true,
    });

    if (!SHOULD_USE_MOCKS) {
      const hasAdminCreds = Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
      test.skip(!hasAdminCreds, 'E2E admin credentials are required for production admin pages');
      await loginAsAdmin(page);
    }
  });

  test('admin dashboard page loads', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setDefaultNavigationTimeout(60_000);
    await page.setDefaultTimeout(40_000);

    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Wait for sidebar to be visible (AdminLayout provides it)
    // Sidebar might be hidden on mobile, so check for desktop view
    await page.waitForSelector('nav[aria-label="Admin navigation"]', { state: 'visible', timeout: 30_000 });
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Wait for main content area - it might take time for React to hydrate
    // Check for either the main element or the dashboard content
    const mainContent = page.locator('main[id="admin-main"]');
    const dashboardContent = page.locator('[data-testid="comprehensive-admin-dashboard"], h1:has-text("Comprehensive Admin Dashboard")');
    
    // Wait for either main content or dashboard to be visible
    await Promise.race([
      mainContent.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
      dashboardContent.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => null),
    ]);

    // Verify at least one content area is visible
    const hasMain = await mainContent.isVisible().catch(() => false);
    const hasDashboard = await dashboardContent.isVisible().catch(() => false);
    
    expect(hasMain || hasDashboard).toBeTruthy();

    // Verify no critical console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (including React Query auth errors which are expected)
    const criticalErrors = errors.filter(
      (e) => 
        !e.includes('favicon') && 
        !e.includes('404') && 
        !e.includes('Failed to load resource') &&
        !e.includes('Authentication required') &&
        !e.includes('auth') &&
        !e.includes('unauthorized')
    );

    // Log errors for debugging but don't fail on expected auth errors
    if (criticalErrors.length > 0) {
      console.log('Console errors (non-critical filtered):', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('admin users page loads', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });

    // Verify page content loads (check for users management content)
    await expect(page.locator('main')).toBeVisible({ timeout: 30_000 });
  });

  test('admin feedback page loads', async ({ page }) => {
    await page.goto('/admin/feedback', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('admin analytics page loads', async ({ page }) => {
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });

    // Verify analytics content loads
    await expect(page.locator('h1:has-text("Analytics")')).toBeVisible({ timeout: 10000 });
  });

  test('admin performance page loads', async ({ page }) => {
    await page.goto('/admin/performance', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('admin system page loads', async ({ page }) => {
    await page.goto('/admin/system', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('admin site-messages page loads', async ({ page }) => {
    await page.goto('/admin/site-messages', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('admin feature-flags page loads', async ({ page }) => {
    await page.goto('/admin/feature-flags', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('admin monitoring page loads', async ({ page }) => {
    // Monitoring page makes async API calls that may be slow, so use domcontentloaded
    await page.goto('/admin/monitoring', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Verify sidebar is visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    // Verify main content area is visible
    await expect(page.locator('main[id="admin-main"]')).toBeVisible({ timeout: 30_000 });
  });

  test('sidebar navigation works for all pages', async ({ page }) => {
    // Start from a page that's not in the navigation list to test all links
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page);

    // Wait for sidebar to be visible
    await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 30_000 });

    const sidebarLinks = [
      { href: '/admin', name: 'Dashboard' },
      { href: '/admin/users', name: 'Users' },
      { href: '/admin/feedback', name: 'Feedback' },
      { href: '/admin/analytics', name: 'Analytics' },
      { href: '/admin/performance', name: 'Performance' },
      { href: '/admin/system', name: 'System' },
      { href: '/admin/site-messages', name: 'Site Messages' },
      { href: '/admin/feature-flags', name: 'Feature Flags' },
    ];

    for (const link of sidebarLinks) {
      // Get current URL to skip if we're already on this page
      const currentUrl = page.url();
      if (currentUrl.includes(link.href)) {
        // Skip clicking the link if we're already on this page
        continue;
      }

      // Wait for sidebar link to be visible and clickable
      const linkLocator = page.locator(`nav[aria-label="Admin navigation"] a[href="${link.href}"]`);
      await expect(linkLocator).toBeVisible({ timeout: 10_000 });

      // Click sidebar link
      await linkLocator.click({ timeout: 10_000 });

      // Wait for navigation with domcontentloaded (faster than networkidle)
      await page.waitForURL(`**${link.href}`, { timeout: 30_000 });
      await waitForPageReady(page);

      // Verify sidebar is still visible (AdminLayout persists)
      await expect(page.locator('nav[aria-label="Admin navigation"]')).toBeVisible({ timeout: 10_000 });

      // Verify main content area is visible (with flexible check)
      const mainContent = page.locator('main[id="admin-main"]');
      const hasMain = await mainContent.isVisible().catch(() => false);
      
      // If main not visible immediately, wait a bit for React to hydrate
      if (!hasMain) {
        await page.waitForTimeout(1000);
        const mainAfterWait = await mainContent.isVisible().catch(() => false);
        expect(mainAfterWait).toBeTruthy();
      } else {
        expect(hasMain).toBeTruthy();
      }

      // Verify no critical console errors (filter out expected auth errors)
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.waitForTimeout(1000);

      const criticalErrors = errors.filter(
        (e) => 
          !e.includes('favicon') && 
          !e.includes('404') && 
          !e.includes('Failed to load resource') &&
          !e.includes('Authentication required') &&
          !e.includes('auth') &&
          !e.includes('unauthorized')
      );

      // Log errors for debugging but don't fail on expected auth errors
      if (criticalErrors.length > 0) {
        console.log(`Console errors on ${link.name} page (non-critical filtered):`, criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    }
  });
});

