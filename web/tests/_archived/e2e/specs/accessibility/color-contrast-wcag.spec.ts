/**
 * Color Contrast WCAG AA Compliance Tests
 * 
 * Comprehensive automated color contrast verification using axe-core
 * Ensures all text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
 * 
 * Created: January 10, 2026
 * Status: ✅ ACTIVE
 */

import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';
import { runAxeAudit } from '../../helpers/accessibility';

test.describe('Color Contrast WCAG AA Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Set up E2E bypass for auth
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });

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
      console.log('[color-contrast-wcag] Using localStorage only:', error);
    }
  });

  test('dashboard page meets WCAG AA color contrast requirements', async ({ page }) => {
    test.setTimeout(60000);

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000); // Wait for React hydration

      const results = await runAxeAudit(page, 'Dashboard page', {
        allowViolations: false,
      });

      // Filter for color contrast violations specifically
      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.error('Color contrast violations on dashboard:', contrastViolations);
        for (const violation of contrastViolations) {
          console.error(`  - ${violation.description}`);
          console.error(`    Nodes: ${violation.nodes.length}`);
        }
      }

      expect(contrastViolations.length).toBe(0);
    } finally {
      await cleanupMocks();
    }
  });

  test('representatives page meets WCAG AA color contrast requirements', async ({ page }) => {
    test.setTimeout(60000);

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/representatives');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const results = await runAxeAudit(page, 'Representatives page', {
        allowViolations: false,
      });

      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.error('Color contrast violations on representatives page:', contrastViolations);
      }

      expect(contrastViolations.length).toBe(0);
    } finally {
      await cleanupMocks();
    }
  });

  test('admin dashboard meets WCAG AA color contrast requirements', async ({ page }) => {
    test.setTimeout(60000);

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/admin/dashboard');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const results = await runAxeAudit(page, 'Admin dashboard', {
        allowViolations: false,
      });

      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.error('Color contrast violations on admin dashboard:', contrastViolations);
      }

      expect(contrastViolations.length).toBe(0);
    } finally {
      await cleanupMocks();
    }
  });

  test('admin monitoring page meets WCAG AA color contrast requirements', async ({ page }) => {
    test.setTimeout(60000);

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/admin/monitoring');
      await waitForPageReady(page);
      await page.waitForTimeout(2000);

      const results = await runAxeAudit(page, 'Admin monitoring page', {
        allowViolations: false,
        // Exclude decorative histogram bars (visualization elements, not text content)
        exclude: ['div[aria-label*="violations in bucket"]'],
      });

      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.error('Color contrast violations on admin monitoring page:', contrastViolations);
      }

      expect(contrastViolations.length).toBe(0);
    } finally {
      await cleanupMocks();
    }
  });

  test('dark mode meets WCAG AA color contrast requirements', async ({ page }) => {
    test.setTimeout(60000);

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Switch to dark mode
      const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], [data-testid*="theme"]').first();
      if (await themeToggle.isVisible().catch(() => false)) {
        await themeToggle.click();
        await page.waitForTimeout(1000); // Wait for theme transition
      }

      const results = await runAxeAudit(page, 'Dashboard page (dark mode)', {
        allowViolations: false,
      });

      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.error('Color contrast violations in dark mode:', contrastViolations);
      }

      expect(contrastViolations.length).toBe(0);
    } finally {
      await cleanupMocks();
    }
  });
});

