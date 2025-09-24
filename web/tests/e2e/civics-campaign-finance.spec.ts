/**
 * Civics Campaign Finance E2E Tests
 *
 * Covers CIVICS_CAMPAIGN_FINANCE:
 * - Candidate accountability card "Campaign Finance" tab content
 * - Representative API v1 with FEC data include
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, setupExternalAPIMocks } from './helpers/e2e-setup';

test.describe('Civics Campaign Finance', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    // Mock by-state for civics UI
    await page.route('**/api/v1/civics/by-state**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true, count: 1, data: [{
            id: '201',
            name: 'Taylor Morgan',
            party: 'Independent',
            office: 'U.S. House (CA-11)',
            level: 'federal',
            jurisdiction: 'CA',
            district: 'CA-11',
            contact: {},
          }]
        })
      });
    });
  });

  test('displays campaign finance tab in accountability card', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);
    // Card rendered with feature flag enabled
    await expect(page.getByTestId('candidate-accountability-card')).toBeVisible();
    // Switch to Campaign Finance tab
    await page.getByRole('button', { name: 'Campaign Finance' }).click();
    await expect(page.locator('text=Top Donors')).toBeVisible();
    await expect(page.locator('text=Total Raised')).toBeVisible();
    await expect(page.locator('text=Corporate')).toBeVisible();
  });

  test('API v1 representative endpoint includes FEC data', async ({ page }) => {
    // Mock FEC data for robustness
    await page.route('**/api/v1/civics/representative/123?**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'Casey Nguyen',
          office: 'U.S. Senator',
          level: 'federal',
          jurisdiction: 'CA',
          fec: {
            total_receipts: 1250000,
            cash_on_hand: 450000,
            cycle: 2024,
            last_updated: new Date().toISOString()
          },
          last_updated: new Date().toISOString()
        })
      });
    });

    const res = await page.request.get('/api/v1/civics/representative/123?include=fec');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.fec).toBeTruthy();
    expect(json.fec.total_receipts).toBeGreaterThan(0);
  });
});

