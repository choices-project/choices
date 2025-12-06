import { expect, test } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from './e2e/helpers/e2e-setup';

test.describe('Civics UI Tests', () => {
  // Helper function to set up by-state route handler
  const setupByStateRoute = async (page: import('@playwright/test').Page) => {
    // Use a regex pattern to match the exact path with any query parameters
    // This should be more reliable than string patterns
    console.log('[setupByStateRoute] Registering route handler with regex pattern');
    await page.route(/\/api\/v1\/civics\/by-state/, async (route) => {
      const requestUrl = route.request().url();
      const method = route.request().method();
      console.log(`[Route Handler] ✅ INTERCEPTED ${method} ${requestUrl}`);

      // Only handle GET requests (the page makes GET requests)
      if (method !== 'GET') {
        console.log(`[Route Handler] Continuing non-GET request: ${method}`);
        await route.continue();
        return;
      }

      const url = new URL(route.request().url());
      const state = url.searchParams.get('state') || 'CA';
      const level = url.searchParams.get('level') || 'federal';

      // The API route returns: successResponse({ representatives: [...], state, level, count, attribution })
      // Which becomes: { success: true, data: { representatives: [...], state, level, ... } }
      // The page now correctly accesses data.data.representatives

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            state: state,
            level: level,
            representatives: [
            {
              id: '1',
              name: 'Test Representative',
              party: 'Democratic',
              office: 'U.S. House of Representatives',
              level: level === 'all' ? 'federal' : level,
              state: state,
              district: '12',
              dataQualityScore: 95,
              verificationStatus: 'verified',
              dataSource: ['OpenStates', 'FEC'],
              lastVerified: new Date().toISOString(),
              enhancedContacts: [
                { type: 'email', value: 'test@example.com' },
                { type: 'phone', value: '555-0100' },
              ],
            },
            {
              id: '2',
              name: 'Another Representative',
              party: 'Republican',
              office: 'U.S. Senate',
              level: level === 'all' ? 'federal' : level,
              state: state,
              dataQualityScore: 92,
              verificationStatus: 'verified',
              dataSource: ['OpenStates'],
              lastVerified: new Date().toISOString(),
            },
          ],
            count: 2,
            attribution: {},
          },
        }),
      });
    });
  };

  test.beforeEach(async ({ page }) => {
    // Setup external API mocks first (they handle POST requests and other routes)
    // We set civics: false to avoid the address-lookup handler
    // We set api: true to get other API mocks, but we'll override the by-state handler
    await setupExternalAPIMocks(page, { civics: false, api: true });

    // Unroute the default by-state handler that setupExternalAPIMocks set up
    // Try multiple patterns to ensure we remove any existing handlers
    await page.unroute('**/api/v1/civics/by-state**');
    await page.unroute('**/api/v1/civics/by-state*');
    await page.unroute(/\/api\/v1\/civics\/by-state/);

    // Set up our custom by-state route handler AFTER unrouting the default one
    // This ensures our handler takes precedence
    await setupByStateRoute(page);

    // Mock address-lookup endpoint
    await page.route('**/api/v1/civics/address-lookup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jurisdiction: {
              state: 'CA',
              district: '12',
              fallback: false,
            },
          },
        }),
      });
    });

    // Add network request logging to debug route interception
    // Log ALL requests to see what's happening
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/v1/civics/by-state')) {
        console.log(`[Request Listener] ${request.method()} ${url}`);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/v1/civics/by-state')) {
        console.log(`[Response Listener] ${response.status()} ${url}`);
        if (response.status() >= 400) {
          const text = await response.text().catch(() => 'Unable to read response');
          console.log(`[Response Listener] Error body: ${text.substring(0, 200)}`);
        }
      }
    });

    // Also log when route handler is set up
    console.log('[beforeEach] Route handler setup complete');
  });

  test('civics page loads and displays representatives', async ({ page }) => {
    // Ensure route handler is set up before navigation
    // Set it up again in the test to be absolutely sure it's active
    console.log('[Test] Setting up route handler before navigation');
    await setupByStateRoute(page);
    console.log('[Test] Route handler setup complete, about to navigate');

    // Set up console error tracking
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Set up response listener before navigation
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for API response (route handler should fulfill it)
    const response = await responsePromise;

    // Debug: Check for console errors
    if (consoleErrors.length > 0) {
      console.warn('Console errors detected:', consoleErrors);
    }

    // Wait for loading to complete - check if isLoading state is false
    await page.waitForFunction(
      () => {
        const spinner = document.querySelector('.animate-spin');
        return !spinner || spinner.getBoundingClientRect().height === 0;
      },
      { timeout: 30_000 }
    );

    // Wait for representatives to be loaded - check if the state has data
    await page.waitForFunction(
      () => {
        // Check if representative-feed exists OR if there's an error message
        const feed = document.querySelector('[data-testid="representative-feed"]');
        const bodyText = document.body.textContent || '';
        const noResults = bodyText.includes('No representatives found');
        return feed || noResults;
      },
      { timeout: 30_000 }
    );

    // Check if we have representatives or if there's an error
    const hasRepresentatives = await page.evaluate(() => {
      const feed = document.querySelector('[data-testid="representative-feed"]');
      return feed !== null;
    });

    if (!hasRepresentatives) {
      // Debug: Check what's actually on the page
      const pageContent = await page.content();
      const bodyText = await page.locator('body').textContent();
      console.warn('representative-feed not found. Page content length:', pageContent.length);
      console.warn('Body text preview:', bodyText?.substring(0, 500));

      // Check if there's an error message
      const errorVisible = await page.locator('text=/Error|Failed|No representatives/i').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('text=/Error|Failed|No representatives/i').first().textContent();
        throw new Error(`Page shows error: ${errorText}`);
      }
    }

    // Wait for the representative-feed to be visible (only renders when data is loaded)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });

    // Verify page content
    await expect(page.getByText('Civics', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Your Democratic Voice/i)).toBeVisible({ timeout: 10_000 });

    // Check that representatives tab is active
    await expect(page.getByRole('button', { name: /Representatives/i })).toBeVisible({ timeout: 10_000 });

    // Check that representative cards are displayed
    await expect(page.getByText('Test Representative')).toBeVisible({ timeout: 10_000 });
  });

  test('can search for representatives', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Wait for representative-feed to be visible
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });

    // Wait for search input
    const searchInput = page.getByPlaceholder('Search representatives...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type in search
    await searchInput.fill('Test');

    // Wait a bit for filtering
    await page.waitForTimeout(500);

    // Verify filtered results
    await expect(page.getByText('Test Representative')).toBeVisible({ timeout: 10_000 });
  });

  test('can filter by state', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Wait for state filter (it's inside the representative-feed section)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const stateFilter = page.getByTestId('state-filter');
    await expect(stateFilter).toBeVisible({ timeout: 10_000 });

    // Change state
    await stateFilter.selectOption('NY');

    // Wait for new API call
    await page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.url().includes('state=NY'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Verify representatives are still visible
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 10_000 });
  });

  test('can filter by level', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Wait for level filter (it's inside the representative-feed section)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const levelFilter = page.getByTestId('level-filter');
    await expect(levelFilter).toBeVisible({ timeout: 10_000 });

    // Change level
    await levelFilter.selectOption('state');

    // Wait for new API call
    await page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.url().includes('level=state'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Verify representatives are still visible
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 10_000 });
  });

  test('can switch to feed tab', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    // Click feed tab
    const feedTab = page.getByRole('button', { name: /Feed/i });
    await expect(feedTab).toBeVisible({ timeout: 10_000 });
    await feedTab.click();

    // Wait for tab switch
    await page.waitForTimeout(500);

    // Verify feed is displayed
    await expect(page.getByTestId('mobile-feed')).toBeVisible({ timeout: 30_000 });
  });

  test('displays quality statistics', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Wait for quality statistics (inside representative-feed)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const qualityStats = page.getByTestId('quality-statistics');
    await expect(qualityStats).toBeVisible({ timeout: 10_000 });

    // Check that statistics are displayed
    await expect(qualityStats.getByText(/Data Accuracy/i)).toBeVisible({ timeout: 10_000 });
    await expect(qualityStats.getByText(/Current Representatives/i)).toBeVisible({ timeout: 10_000 });
  });

  test('displays system date information', async ({ page }) => {
    // Route handler already set up in beforeEach
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);
    await responsePromise;

    await page.waitForFunction(
      () => !document.querySelector('.animate-spin'),
      { timeout: 30_000 }
    ).catch(() => {
      // Ignore timeout - spinner may already be gone
    });

    // Wait for system date info (inside representative-feed)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const systemDateInfo = page.getByTestId('system-date-info');
    await expect(systemDateInfo).toBeVisible({ timeout: 10_000 });

    // Check that system date is displayed
    await expect(systemDateInfo.getByText(/System Date Verification/i)).toBeVisible({ timeout: 10_000 });
    await expect(systemDateInfo.getByTestId('current-electorate-count')).toBeVisible({ timeout: 10_000 });
  });
});

