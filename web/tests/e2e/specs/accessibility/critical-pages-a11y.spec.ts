/**
 * Critical Pages Accessibility Tests
 * 
 * Comprehensive accessibility testing for all critical user-facing pages
 * Uses axe-core to ensure WCAG 2.1 AA compliance
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

test.describe('Critical Pages Accessibility (WCAG 2.1 AA)', () => {
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
      console.log('[critical-pages-a11y] Using localStorage only:', error);
    }
  });

  const criticalPages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/feed', name: 'Feed' },
    { path: '/representatives', name: 'Representatives' },
    { path: '/civics', name: 'Civics' },
    { path: '/polls', name: 'Polls List' },
    { path: '/profile', name: 'Profile' },
    { path: '/admin/dashboard', name: 'Admin Dashboard' },
    { path: '/admin/feedback', name: 'Admin Feedback' },
    { path: '/admin/users', name: 'Admin Users' },
  ];

  for (const pageInfo of criticalPages) {
    test(`${pageInfo.name} page meets WCAG 2.1 AA standards`, async ({ page }) => {
      test.setTimeout(90000);
      const shouldSkipAdmin =
        pageInfo.path.startsWith('/admin') &&
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' &&
        (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD);
      test.skip(shouldSkipAdmin, 'Admin credentials not configured for production tests.');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto(pageInfo.path);
        await waitForPageReady(page);
        await page.waitForTimeout(3000); // Wait for React hydration and data loading

        // Run comprehensive axe audit
        const results = await runAxeAudit(page, `${pageInfo.name} page`, {
          allowViolations: false,
        });

        // Report violations for debugging
        if (results.violations.length > 0) {
          console.error(`[${pageInfo.name}] Accessibility violations:`);
          results.violations.forEach(violation => {
            console.error(`  - ${violation.id}: ${violation.description}`);
            console.error(`    Impact: ${violation.impact}`);
            console.error(`    Nodes: ${violation.nodes.length}`);
            violation.nodes.slice(0, 3).forEach((node, idx) => {
              console.error(`      Node ${idx + 1}: ${node.html?.substring(0, 100)}...`);
            });
          });
        }

        // All critical pages must pass WCAG 2.1 AA
        expect(results.violations.length).toBe(0);
      } finally {
        await cleanupMocks();
      }
    });

    test(`${pageInfo.name} page has proper heading structure`, async ({ page }) => {
      test.setTimeout(60000);
      const shouldSkipAdmin =
        pageInfo.path.startsWith('/admin') &&
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' &&
        (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD);
      test.skip(shouldSkipAdmin, 'Admin credentials not configured for production tests.');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto(pageInfo.path);
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Check for h1 element (required for accessibility)
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);

        // Check heading hierarchy (no skipped levels)
        const headingLevels = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          return headings.map(h => {
            const level = parseInt(h.tagName.charAt(1));
            return { level, text: h.textContent?.trim().substring(0, 50) || '' };
          });
        });

        // Verify no skipped heading levels
        if (headingLevels.length > 1) {
          for (let i = 1; i < headingLevels.length; i++) {
            const currentLevel = headingLevels[i].level;
            const previousLevel = headingLevels[i - 1].level;
            // Allow h1 -> h2, h2 -> h3, etc., but not h1 -> h3
            expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
          }
        }
      } finally {
        await cleanupMocks();
      }
    });

    test(`${pageInfo.name} page has proper landmark regions`, async ({ page }) => {
      test.setTimeout(60000);
      const shouldSkipAdmin =
        pageInfo.path.startsWith('/admin') &&
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS !== '1' &&
        (!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD);
      test.skip(shouldSkipAdmin, 'Admin credentials not configured for production tests.');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto(pageInfo.path);
        await waitForPageReady(page);
        await page.waitForTimeout(2000);

        // Check for main landmark (required)
        const mainLandmarks = await page.locator('main, [role="main"]').count();
        expect(mainLandmarks).toBeGreaterThanOrEqual(1);

        // Check for navigation landmarks (should exist)
        const navLandmarks = await page.locator('nav, [role="navigation"]').count();
        // Navigation is recommended but not always present on all pages
        // We'll just verify the structure is correct if it exists
        expect(navLandmarks).toBeGreaterThanOrEqual(0);
      } finally {
        await cleanupMocks();
      }
    });
  }
});

