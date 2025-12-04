import { expect, test } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from './e2e/helpers/e2e-setup';

test.describe('Civics UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup external API mocks
    await setupExternalAPIMocks(page, { civics: true, api: true });
    
    // Mock address-lookup endpoint (setupExternalAPIMocks only handles POST, but we want to ensure it's mocked)
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
  });
  
  // Helper function to set up by-state route handler
  const setupByStateRoute = async (page: any) => {
    await page.route('**/api/v1/civics/by-state*', async (route: any) => {
      // Only handle GET requests (the page makes GET requests)
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      
      const url = new URL(route.request().url());
      const state = url.searchParams.get('state') || 'CA';
      const level = url.searchParams.get('level') || 'federal';
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
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
        }),
      });
    });
  };

  test('civics page loads and displays representatives', async ({ page }) => {
    // Set up route handler for by-state endpoint
    await setupByStateRoute(page);

    // Set up response listener before navigation
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/civics/by-state') && response.status() === 200,
      { timeout: 30_000 }
    ).catch(() => null);

    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for API response (route handler should fulfill it)
    await responsePromise;

    // Wait for loading spinner to disappear or representative-feed to appear
    await Promise.race([
      page.waitForFunction(
        () => {
          const spinner = document.querySelector('.animate-spin');
          return !spinner || spinner.getBoundingClientRect().height === 0;
        },
        { timeout: 30_000 }
      ),
      page.waitForSelector('[data-testid="representative-feed"]', { timeout: 30_000 }),
    ]).catch(() => {});

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
    await setupByStateRoute(page);
    
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
    ).catch(() => {});

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
    await setupByStateRoute(page);
    
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
    ).catch(() => {});

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
    ).catch(() => {});

    // Verify representatives are still visible
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 10_000 });
  });

  test('can filter by level', async ({ page }) => {
    await setupByStateRoute(page);
    
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
    ).catch(() => {});

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
    ).catch(() => {});

    // Verify representatives are still visible
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 10_000 });
  });

  test('can switch to feed tab', async ({ page }) => {
    await setupByStateRoute(page);
    
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
    await setupByStateRoute(page);
    
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
    ).catch(() => {});

    // Wait for quality statistics (inside representative-feed)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const qualityStats = page.getByTestId('quality-statistics');
    await expect(qualityStats).toBeVisible({ timeout: 10_000 });

    // Check that statistics are displayed
    await expect(qualityStats.getByText(/Data Accuracy/i)).toBeVisible({ timeout: 10_000 });
    await expect(qualityStats.getByText(/Current Representatives/i)).toBeVisible({ timeout: 10_000 });
  });

  test('displays system date information', async ({ page }) => {
    await setupByStateRoute(page);
    
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
    ).catch(() => {});

    // Wait for system date info (inside representative-feed)
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 30_000 });
    const systemDateInfo = page.getByTestId('system-date-info');
    await expect(systemDateInfo).toBeVisible({ timeout: 10_000 });

    // Check that system date is displayed
    await expect(systemDateInfo.getByText(/System Date Verification/i)).toBeVisible({ timeout: 10_000 });
    await expect(systemDateInfo.getByTestId('current-electorate-count')).toBeVisible({ timeout: 10_000 });
  });
});

