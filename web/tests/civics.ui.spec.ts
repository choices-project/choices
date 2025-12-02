import { expect, test } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from './e2e/helpers/e2e-setup';

test.describe('Civics UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup external API mocks
    await setupExternalAPIMocks(page, { civics: true, api: true });
    
    // Mock the civics API endpoints (additional mocks for specific test needs)
    await page.route('**/api/v1/civics/by-state*', async (route) => {
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

    // Mock address lookup endpoint
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

  test('civics page loads and displays representatives', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Check page title/header
    await expect(page.getByText('Civics')).toBeVisible();
    await expect(page.getByText(/Your Democratic Voice/i)).toBeVisible();

    // Check that representatives tab is active
    await expect(page.getByRole('button', { name: /Representatives/i })).toBeVisible();

    // Wait for representatives to load
    await expect(page.getByTestId('representative-feed')).toBeVisible({ timeout: 10_000 });

    // Check that representative cards are displayed
    await expect(page.getByText('Test Representative')).toBeVisible({ timeout: 10_000 });
  });

  test('can search for representatives', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for search input
    const searchInput = page.getByPlaceholder('Search representatives...');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type in search
    await searchInput.fill('Test');

    // Verify filtered results
    await expect(page.getByText('Test Representative')).toBeVisible();
    await expect(page.getByText('Another Representative')).not.toBeVisible();
  });

  test('can filter by state', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for state filter
    const stateFilter = page.getByTestId('state-filter');
    await expect(stateFilter).toBeVisible({ timeout: 10_000 });

    // Change state
    await stateFilter.selectOption('NY');

    // Wait for new data to load
    await page.waitForTimeout(1000);

    // Verify API was called with new state
    // (Representatives should reload)
    await expect(page.getByTestId('representative-feed')).toBeVisible();
  });

  test('can filter by level', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for level filter
    const levelFilter = page.getByTestId('level-filter');
    await expect(levelFilter).toBeVisible({ timeout: 10_000 });

    // Change level
    await levelFilter.selectOption('state');

    // Wait for new data to load
    await page.waitForTimeout(1000);

    // Verify representatives are still visible
    await expect(page.getByTestId('representative-feed')).toBeVisible();
  });

  test('can switch to feed tab', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Click feed tab
    const feedTab = page.getByRole('button', { name: /Feed/i });
    await expect(feedTab).toBeVisible();
    await feedTab.click();

    // Verify feed is displayed
    await expect(page.getByTestId('mobile-feed')).toBeVisible({ timeout: 10_000 });
  });

  test('displays quality statistics', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for quality statistics
    const qualityStats = page.getByTestId('quality-statistics');
    await expect(qualityStats).toBeVisible({ timeout: 10_000 });

    // Check that statistics are displayed
    await expect(qualityStats.getByText(/Data Accuracy/i)).toBeVisible();
    await expect(qualityStats.getByText(/Current Representatives/i)).toBeVisible();
  });

  test('displays system date information', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await waitForPageReady(page, 60_000);

    // Wait for system date info
    const systemDateInfo = page.getByTestId('system-date-info');
    await expect(systemDateInfo).toBeVisible({ timeout: 10_000 });

    // Check that current electorate count is displayed
    await expect(page.getByTestId('current-electorate-count')).toBeVisible();
  });
});

