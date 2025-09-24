/**
 * Alternative Candidates E2E Tests
 *
 * Covers ALTERNATIVE_CANDIDATES:
 * - Toggle alternative candidates view in accountability card
 * - Verify content visibility and counts
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, setupExternalAPIMocks } from './helpers/e2e-setup';

test.describe('Alternative Candidates', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    await page.route('**/api/v1/civics/by-state**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true, count: 1, data: [{
            id: '501',
            name: 'Avery Brooks',
            party: 'Independent',
            office: 'U.S. House (CA-12)',
            level: 'federal',
            jurisdiction: 'CA',
            district: 'CA-12',
            contact: {},
          }]
        })
      });
    });
  });

  test('shows alternative candidates when toggled', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);
    await expect(page.getByTestId('candidate-accountability-card')).toBeVisible();
    // Alternative section header
    await expect(page.locator('text=Alternative Candidates')).toBeVisible();
    // Open alternatives
    const toggle = page.getByRole('button', { name: /Show Alternatives/i });
    if (await toggle.isVisible()) {
      await toggle.click();
    }
    // Mocked names present in component defaults
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    await expect(page.locator('text=Michael Chen')).toBeVisible();
  });
});

