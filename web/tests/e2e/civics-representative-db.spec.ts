/**
 * Civics Representative Database E2E Tests
 *
 * Covers CIVICS_REPRESENTATIVE_DATABASE flows:
 * - Representative data retrieval via by-state API
 * - Search/filter interaction
 * - Performance assertions
 * - Error handling
 */
import { test, expect } from '@playwright/test';

import { waitForPageReady, E2E_CONFIG, setupExternalAPIMocks } from './helpers/e2e-setup';

test.describe('Civics Representative Database', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    // Mock DB-backed API with representative list for robustness in CI/local
    // Updated to reflect actual database state: 1,273 representatives
    await page.route('**/api/v1/civics/by-state**', async route => {
      const url = new URL(route.request().url());
      const state = url.searchParams.get('state') || 'CA';
      const payload = {
        ok: true,
        count: 1273, // Actual database count
        data: [
          {
            id: '101',
            name: 'Alex Rivera',
            party: 'Democratic',
            office: 'U.S. Senator',
            level: 'federal',
            jurisdiction: state,
            district: null,
            contact: { email: 'alex@example.com', phone: '555-0101', website: 'https://senate.example.com' },
            data_source: 'govtrack',
            data_quality_score: 95,
            last_verified: new Date().toISOString(),
          },
          {
            id: '102',
            name: 'Jordan Lee',
            party: 'Republican',
            office: 'U.S. House (CA-12)',
            level: 'federal',
            jurisdiction: state,
            district: 'CA-12',
            contact: { email: 'jordan@example.com', phone: '555-0102', website: 'https://house.example.com' },
            data_source: 'openstates',
            data_quality_score: 85,
            last_verified: new Date().toISOString(),
          }
        ],
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    await expect(page.getByTestId('civics-page')).toBeVisible();
  });

  test('lists representatives and supports search', async ({ page }) => {
    // Ensure mocked representatives load quickly
    const t0 = Date.now();
    await expect(page.locator('text=U.S. Senator')).toBeVisible({ timeout: E2E_CONFIG.TIMEOUTS.ELEMENT_WAIT });
    const loadMs = Date.now() - t0;
    expect(loadMs).toBeLessThan(2000);

    // Search interaction
    await page.getByPlaceholder('Search representatives...').fill('Jordan');
    await expect(page.locator('text=Jordan Lee')).toBeVisible();
    await expect(page.locator('text=Alex Rivera')).toHaveCount(0);
  });

  test('handles API error gracefully with retry', async ({ page }) => {
    // Force error once; then re-allow
    let called = false;
    await page.unroute('**/api/v1/civics/by-state**');
    await page.route('**/api/v1/civics/by-state**', async route => {
      if (!called) {
        called = true;
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Database error' }) });
      }
      return route.continue();
    });

    // Reload triggers first error
    await page.reload();
    await waitForPageReady(page);
    await expect(page.locator('text=Failed to fetch')).toBeVisible();
    await page.getByRole('button', { name: 'Try Again' }).click();

    // After retry, data appears
    await expect(page.locator('text=U.S. Senator')).toBeVisible();
  });
});

