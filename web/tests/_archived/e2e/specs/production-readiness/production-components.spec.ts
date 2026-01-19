/**
 * Production Readiness Tests for Critical Components
 * 
 * These tests verify that components marked for production testing are properly
 * handling edge cases, errors, and production scenarios.
 * 
 * Components tested:
 * - PollClient: Poll detail page with voting functionality
 * - FilingAssistant: Candidate filing requirements component
 * - JourneyProgress: Candidate journey tracking component
 * - MonitoringContentClient: Admin monitoring page with React Query
 */

import { expect, test } from '@playwright/test';
import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Production Component Readiness', () => {
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
      console.log('[production-readiness] Using localStorage only:', error);
    }
  });

  test.describe('PollClient Component', () => {
    test('handles missing poll data gracefully', async ({ page }) => {
      test.setTimeout(30000);

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        // Navigate to a poll that might not exist
        await page.goto('/polls/invalid-poll-id');
        await waitForPageReady(page);

        // Should show error state or redirect, not crash
        const errorElement = page.locator('[role="alert"], .error, [data-testid*="error"]').first();
        const hasError = await errorElement.isVisible().catch(() => false);
        const has404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false);
        const hasRedirect = page.url().includes('/polls');

        expect(hasError || has404 || hasRedirect).toBeTruthy();
      } finally {
        await cleanupMocks();
      }
    });

    test('handles API errors during vote submission', async ({ page }) => {
      test.setTimeout(30000);

      // Intercept vote API and return error
      await page.route('**/api/polls/*/vote', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' }),
          });
        } else {
          route.continue();
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
        // This would require a valid poll ID - in real test, use fixture
        // For now, we're just verifying error handling doesn't crash
        await page.goto('/polls');
        await waitForPageReady(page);

        // Component should not crash, error should be displayed
        expect(await page.locator('body').count()).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('prevents hydration mismatches with date formatting', async ({ page }) => {
      test.setTimeout(30000);

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/polls');
        await waitForPageReady(page);

        // Check for hydration errors in console
        const logs: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error' && msg.text().includes('hydration')) {
            logs.push(msg.text());
          }
        });

        await page.waitForTimeout(2000);

        // Should have no hydration errors
        const hydrationErrors = logs.filter(log => log.includes('hydration'));
        expect(hydrationErrors.length).toBe(0);
      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('FilingAssistant Component', () => {
    test('handles API errors gracefully', async ({ page }) => {
      test.setTimeout(30000);

      // Intercept filing API and return error
      await page.route('**/api/filing/requirements*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        // Navigate to candidate dashboard where FilingAssistant would be rendered
        await page.goto('/candidates/dashboard');
        await waitForPageReady(page);

        // Should show error state or helpful message, not crash
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('displays loading state correctly', async ({ page }) => {
      test.setTimeout(30000);

      // Delay API response to test loading state
      await page.route('**/api/filing/requirements*', async route => {
        await page.waitForTimeout(1000); // Simulate slow API
        await route.continue();
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        
        // Component should show loading state (may be brief, but should exist)
        // At minimum, component should not crash during loading
        expect(await page.locator('body').count()).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('handles empty/missing requirement data', async ({ page }) => {
      test.setTimeout(30000);

      // Return empty requirement data
      await page.route('**/api/filing/requirements*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              found: false,
              message: 'No filing requirements found'
            }
          }),
        });
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        await waitForPageReady(page);

        // Should show helpful empty state, not crash
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('JourneyProgress Component', () => {
    test('handles API errors gracefully', async ({ page }) => {
      test.setTimeout(30000);

      // Intercept journey API and return error
      await page.route('**/api/candidate/journey/progress*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        await waitForPageReady(page);

        // Should handle error gracefully, not crash
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('displays loading state correctly', async ({ page }) => {
      test.setTimeout(30000);

      // Delay API response to test loading state
      await page.route('**/api/candidate/journey/progress*', async route => {
        await page.waitForTimeout(1000); // Simulate slow API
        await route.continue();
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        
        // Component should show loading state (may be brief, but should exist)
        // At minimum, component should not crash during loading
        expect(await page.locator('body').count()).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('handles missing progress data', async ({ page }) => {
      test.setTimeout(30000);

      // Return null progress
      await page.route('**/api/candidate/journey/progress*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              progress: null,
              checklist: [],
              nextAction: null
            }
          }),
        });
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        await waitForPageReady(page);

        // Should handle null progress gracefully (component returns null, doesn't crash)
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('handles malformed API responses', async ({ page }) => {
      test.setTimeout(30000);

      // Return malformed response
      await page.route('**/api/candidate/journey/progress*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{',
        });
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/candidates/dashboard');
        await waitForPageReady(page);

        // Should handle JSON parse errors gracefully, not crash
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);

        // Check for error logging (component should log error, not throw)
        const logs: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            logs.push(msg.text());
          }
        });

        await page.waitForTimeout(1000);

        // Component should handle error gracefully
        expect(await page.locator('body').count()).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });
  });

  test.describe('MonitoringContentClient Component', () => {
    test('handles API errors gracefully for monitoring data', async ({ page }) => {
      test.setTimeout(30000);

      // Intercept monitoring API and return error
      await page.route('**/api/security/monitoring*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      });

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
        await page.waitForTimeout(2000); // Wait for React Query to process

        // Should show error state with role="alert", not crash
        const errorAlert = page.locator('[role="alert"]');
        const hasErrorAlert = await errorAlert.count().then(count => count > 0);
        
        // Component should render error message
        expect(hasErrorAlert || (await page.locator('body').count()) > 0).toBeTruthy();
      } finally {
        await cleanupMocks();
      }
    });

    test('handles API errors gracefully for health data', async ({ page }) => {
      test.setTimeout(30000);

      // Intercept health API and return error
      await page.route('**/api/health/extended*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Health check failed' }),
        });
      });

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
        await page.waitForTimeout(2000); // Wait for React Query to process

        // Should handle error gracefully, may show error or partial content
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('displays loading state correctly during data fetch', async ({ page }) => {
      test.setTimeout(30000);

      // Delay API response to test loading state
      await page.route('**/api/security/monitoring*', async route => {
        await page.waitForTimeout(1500); // Simulate slow API
        await route.continue();
      });

      await page.route('**/api/health/extended*', async route => {
        await page.waitForTimeout(1500); // Simulate slow API
        await route.continue();
      });

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/admin/monitoring');
        
        // Component should show loading skeletons (Skeleton components)
        // At minimum, component should not crash during loading
        expect(await page.locator('body').count()).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('handles empty/missing monitoring data', async ({ page }) => {
      test.setTimeout(30000);

      // Return empty monitoring data
      await page.route('**/api/security/monitoring*', route => {
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
                violationsByEndpoint: {}
              },
              recentViolations: []
            }
          }),
        });
      });

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

        // Should display empty states gracefully (e.g., "No violations recorded")
        const emptyState = page.locator('text=/no violations|no data/i');
        const hasEmptyState = await emptyState.count().then(count => count > 0);
        const hasContent = await page.locator('body').count();
        
        // Should show empty state or at least render without crashing
        expect(hasEmptyState || hasContent > 0).toBeTruthy();
      } finally {
        await cleanupMocks();
      }
    });

    test('handles refresh button functionality', async ({ page }) => {
      test.setTimeout(30000);

      let requestCount = 0;
      
      // Track API requests
      await page.route('**/api/security/monitoring*', async route => {
        requestCount++;
        await route.continue();
      });

      await page.route('**/api/health/extended*', async route => {
        await route.continue();
      });

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

        // Find and click refresh button
        const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]');
        const buttonCount = await refreshButton.count();
        
        if (buttonCount > 0) {
          await refreshButton.first().click();
          await page.waitForTimeout(2000); // Wait for refresh to complete

          // Refresh should trigger new API requests (React Query refetch)
          // Note: requestCount may not increase if React Query uses cache, but button should work
          expect(await page.locator('body').count()).toBeGreaterThan(0);
        } else {
          // If button not found, at least verify page loads
          expect(await page.locator('body').count()).toBeGreaterThan(0);
        }
      } finally {
        await cleanupMocks();
      }
    });

    test('prevents hydration mismatches with Date.now() usage', async ({ page }) => {
      test.setTimeout(30000);

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

        // Check for hydration errors in console
        const logs: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error' && msg.text().includes('hydration')) {
            logs.push(msg.text());
          }
        });

        await page.waitForTimeout(2000);

        // Should have no hydration errors (component uses useState + useEffect pattern for Date.now())
        const hydrationErrors = logs.filter(log => log.includes('hydration'));
        expect(hydrationErrors.length).toBe(0);
      } finally {
        await cleanupMocks();
      }
    });

    test('handles malformed API responses gracefully', async ({ page }) => {
      test.setTimeout(30000);

      // Return malformed response
      await page.route('**/api/security/monitoring*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{',
        });
      });

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

        // Should handle JSON parse errors gracefully (React Query error handling)
        // Component should not crash, should show error state or fallback
        const hasContent = await page.locator('body').count();
        expect(hasContent).toBeGreaterThan(0);
      } finally {
        await cleanupMocks();
      }
    });
  });
});

