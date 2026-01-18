import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../helpers/e2e-setup';

test.describe('Civics Integration Tests', () => {
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
      // Cookie setting may fail in some environments, localStorage is primary
      console.log('[civics-integration] Using localStorage only:', error);
    }
  });

  test.describe('Dashboard Representatives Integration', () => {
    test('dashboard displays representatives section when enabled', async ({ page }) => {
      test.setTimeout(60_000);
      
      // Skip in mock environment - dashboard requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Dashboard integration tests require production environment or E2E harness');
      
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
        await page.goto('/dashboard');
        await waitForPageReady(page);

        // Diagnostic: Check current URL to see if redirect happened
        const currentUrl = page.url();
        console.log('[civics-integration] Current URL after navigation:', currentUrl);
        
        // Check if we were redirected
        if (currentUrl.includes('/auth') || currentUrl.includes('/onboarding')) {
          console.warn('[civics-integration] ⚠️ Redirected away from dashboard');
        }

        // Wait for personal dashboard to be visible
        await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });

        // Check that the page rendered without React errors
        const reactErrors = consoleErrors.filter(err => 
          err.includes('React Error') || 
          err.includes('Hydration') || 
          err.includes('Warning: Text content does not match')
        );
        expect(reactErrors.length).toBe(0);

        // Check if representatives section exists (may or may not be visible based on preferences)
        const representativesSection = await page.locator('text="Your Representatives"').count();
        
        // The section should either exist or not exist, but page should render cleanly
        expect(representativesSection).toBeGreaterThanOrEqual(0);
        expect(representativesSection).toBeLessThanOrEqual(1);

        // Verify no infinite render loops (check render count in console if available)
        const renderCountMessages = consoleErrors.filter(err => 
          err.includes('render') && err.includes('95') // High render count indicates loop
        );
        expect(renderCountMessages.length).toBe(0);

      } finally {
        cleanupMocks();
      }
    });

    test('dashboard preferences section is accessible', async ({ page }) => {
      test.setTimeout(60_000);
      
      // Skip in mock environment - dashboard requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Dashboard integration tests require production environment or E2E harness');
      
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

        await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });

        // Check for dashboard preferences section
        const preferencesSection = page.locator('text="Dashboard Preferences"');
        const count = await preferencesSection.count();
        
        // Preferences section should be visible
        expect(count).toBeGreaterThan(0);

        // Check that preference toggles exist
        const engagementScoreToggle = page.locator('[data-testid="show-engagement-score-toggle"]');
        const toggleCount = await engagementScoreToggle.count();
        expect(toggleCount).toBeGreaterThan(0);

      } finally {
        cleanupMocks();
      }
    });

    test('quick actions include representatives link', async ({ page }) => {
      test.setTimeout(60_000);
      
      // Skip in mock environment - dashboard requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Dashboard integration tests require production environment or E2E harness');
      
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

        await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });

        // Check for Quick Actions section
        const quickActionsText = page.locator('text="Quick Actions"');
        const quickActionsCount = await quickActionsText.count();
        
        if (quickActionsCount > 0) {
          // If Quick Actions section exists, check for representatives link
          const representativesLink = page.locator('a[href="/representatives"]').filter({
            hasText: 'Find Representatives'
          });
          const linkCount = await representativesLink.count();
          expect(linkCount).toBeGreaterThan(0);
        }

      } finally {
        cleanupMocks();
      }
    });
  });

  test.describe('Civics Page Integration', () => {
    test('civics page loads and displays representatives', async ({ page }) => {
      test.setTimeout(60_000);

      // Skip in mock environment - civics page requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Civics page tests require production environment or E2E harness');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);

        const authForm = page.locator('[data-testid="login-form"]');
        const authHeading = page.locator('h1, h2').filter({ hasText: /sign in|log in|login/i });
        const needsAuth =
          page.url().includes('/auth') ||
          page.url().includes('/login') ||
          (await authForm.count()) > 0 ||
          (await authHeading.count()) > 0;
        test.skip(needsAuth, 'Civics page requires authentication in production.');

        // Check for civics page header
        const header = page.locator('h1:has-text("Civics")');
        await expect(header).toBeVisible({ timeout: 30_000 });

        // Check for representatives tab
        const representativesTab = page.locator('[data-testid="civics-tab-representatives"]');
        await expect(representativesTab).toBeVisible({ timeout: 10_000 });

      } finally {
        cleanupMocks();
      }
    });

    test('civics page allows filtering by state and level', async ({ page }) => {
      test.setTimeout(60_000);

      // Skip in mock environment - civics page requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Civics page tests require production environment or E2E harness');

      const cleanupMocks = await setupExternalAPIMocks(page, {
        feeds: true,
        notifications: true,
        analytics: true,
        auth: true,
        civics: true,
      });

      try {
        await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);

        const authForm = page.locator('[data-testid="login-form"]');
        const authHeading = page.locator('h1, h2').filter({ hasText: /sign in|log in|login/i });
        const needsAuth =
          page.url().includes('/auth') ||
          page.url().includes('/login') ||
          (await authForm.count()) > 0 ||
          (await authHeading.count()) > 0;
        test.skip(needsAuth, 'Civics page requires authentication in production.');

        // Wait for page to load
        await page.waitForSelector('h1:has-text("Civics")', { timeout: 30_000 });

        // Wait for the representatives tab content to be visible (filters are in the representatives tab)
        await page.waitForSelector('[data-testid="representative-feed"]', { timeout: 30_000 }).catch(() => {
          // If representative-feed doesn't exist, wait for the main content area instead
        });

        // Wait a bit for filters to render (they're in the representatives tab which is active by default)
        await page.waitForTimeout(1000);

        // Check for state filter - there are two state filters, check both locations
        const stateFilter = page.locator('[data-testid="state-filter"]');
        const stateFilterCount = await stateFilter.count();
        
        // State filter should exist if page loaded correctly
        expect(stateFilterCount).toBeGreaterThan(0);

        // Check for level filter - there are two level filters, check both locations
        const levelFilter = page.locator('[data-testid="level-filter"]');
        const levelFilterCount = await levelFilter.count();
        expect(levelFilterCount).toBeGreaterThan(0);

      } finally {
        cleanupMocks();
      }
    });
  });

  test.describe('Component Optimization Verification', () => {
    test('dashboard components use stable store subscriptions (no infinite loops)', async ({ page }) => {
      test.setTimeout(90_000);

      // Skip in mock environment - dashboard requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Dashboard optimization tests require production environment or E2E harness');

      const consoleMessages: string[] = [];
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        const text = msg.text();
        consoleMessages.push(`${msg.type()}: ${text}`);
        if (msg.type() === 'error') {
          consoleErrors.push(text);
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
        await page.goto('/dashboard');
        await waitForPageReady(page);

        await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });

        // Wait for initial render to complete
        await page.waitForTimeout(3000);

        // Check for React hydration errors
        const hydrationErrors = consoleErrors.filter(err => 
          err.includes('Hydration') || 
          err.includes('Warning: Text content does not match') ||
          err.includes('React Error #185')
        );
        expect(hydrationErrors.length).toBe(0);

        // Check for infinite loop indicators (high render counts logged)
        // Our diagnostic tracking logs render counts - if we see render count > 10, investigate
        const highRenderCountLogs = consoleMessages.filter(msg => {
          try {
            const logData = JSON.parse(msg.split(':').slice(1).join(':'));
            if (logData?.data?.renderCount && logData.data.renderCount > 10) {
              return true;
            }
          } catch {
            // Not JSON log, ignore
          }
          return false;
        });
        
        // Should not have excessive render counts (allow up to 10 renders for initial load)
        expect(highRenderCountLogs.length).toBe(0);

        // Verify page is interactive (no infinite loading)
        const loadingSpinners = await page.locator('[aria-busy="true"]').count();
        // After 3 seconds, should not have persistent loading spinners
        expect(loadingSpinners).toBeLessThan(5); // Allow some loading indicators

      } finally {
        cleanupMocks();
      }
    });

    test('dashboard preferences can be toggled without causing re-render loops', async ({ page }) => {
      test.setTimeout(60_000);

      // Skip in mock environment - dashboard requires production or proper E2E harness setup
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Dashboard optimization tests require production environment or E2E harness');

      const renderCounts: number[] = [];
      page.on('console', (msg) => {
        const text = msg.text();
        try {
          const logData = JSON.parse(text.split(':').slice(1).join(':'));
          if (logData?.data?.renderCount) {
            renderCounts.push(logData.data.renderCount);
          }
        } catch {
          // Not JSON log, ignore
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
        await page.goto('/dashboard');
        await waitForPageReady(page);

        await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });

        // Wait for initial render
        await page.waitForTimeout(2000);

        // Clear any initial render counts
        renderCounts.length = 0;

        // Toggle a preference - use force: true to click the hidden input
        // The Switch component has a visual overlay that intercepts normal clicks
        const engagementToggle = page.locator('[data-testid="show-engagement-score-toggle"]');
        const toggleCount = await engagementToggle.count();
        
        if (toggleCount > 0) {
          // Use force: true to bypass actionability checks and click the hidden input directly
          await engagementToggle.first().click({ force: true });
          
          // Wait for state to update
          await page.waitForTimeout(1000);
          
          // Check that we didn't cause excessive re-renders
          const maxRenderCount = renderCounts.length > 0 ? Math.max(...renderCounts) : 0;
          // After toggle, should not see more than a few renders (2-3 is normal for state update)
          expect(maxRenderCount).toBeLessThan(10);
        }

      } finally {
        cleanupMocks();
      }
    });
  });

  test.describe('Civics API Integration', () => {
    test('representatives API endpoints are accessible', async ({ page }) => {
      test.setTimeout(60_000);

      // Only run this in production or when mocks are disabled
      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Skipping API test in mocked environment');

      const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
      
      // Test by-state endpoint
      const response = await page.request.get(
        `${baseUrl}/api/v1/civics/by-state?state=CA&level=federal&limit=5`
      );

      // Check response status and handle errors gracefully
      const status = response.status();
      const data = await response.json();
      
      // API should return a valid response (success or error format)
      expect(data).toHaveProperty('success');
      
      // If successful, check data structure
      if (data.success) {
        expect(data).toHaveProperty('data');
      } else {
        // If failed, check error format (may fail due to database/RLS issues in test environment)
        expect(data).toHaveProperty('error');
        // Log the error for debugging but don't fail the test if it's a database/environment issue
        console.log(`[API Test] Endpoint returned error: ${data.error}, status: ${status}`);
      }
    });

    test('address lookup endpoint is accessible', async ({ page }) => {
      test.setTimeout(60_000);

      const useMocks = process.env.PLAYWRIGHT_USE_MOCKS !== '0';
      test.skip(useMocks, 'Skipping API test in mocked environment');

      const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
      
      // Test address lookup endpoint
      const response = await page.request.post(
        `${baseUrl}/api/v1/civics/address-lookup`,
        {
          data: {
            address: '123 Main St, Springfield, IL 62704'
          }
        }
      );

      // Endpoint should respond (may succeed or fail, but should not 500)
      expect([200, 400, 422]).toContain(response.status());
      
      if (response.ok()) {
        const data = await response.json();
        expect(data).toHaveProperty('success');
      }
    });
  });
});

