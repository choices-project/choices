/**
 * Candidate Cards E2E Tests
 *
 * Covers CANDIDATE_CARDS:
 * - Rendering and responsiveness of candidate/accountability cards on civics page
 * - Basic content presence for user-facing cards
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, setupExternalAPIMocks, E2E_CONFIG } from './helpers/e2e-setup';

test.describe('Candidate Cards', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    await page.route('**/api/v1/civics/by-state**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true, count: 1, data: [{
            id: '401',
            name: 'Morgan Diaz',
            party: 'Independent',
            office: 'U.S. House (CA-12)',
            level: 'federal',
            jurisdiction: 'CA',
            district: 'CA-12',
            contact: { email: 'mdiaz@example.com', phone: '555-0001', website: 'https://example.com' },
          }]
        })
      });
    });
  });

  test('renders candidate/accountability card with content', async ({ page }) => {
    await page.goto('/civics', { waitUntil: 'commit' });
    await waitForPageReady(page);
    await expect(page.getByTestId('candidate-accountability-card')).toBeVisible();
    await expect(page.locator('text=Accountability Score')).toBeVisible();
    // Tabs present
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Promises' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Campaign Finance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voting Record' })).toBeVisible();
  });

  test('is responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);
    await page.goto('/civics');
    await waitForPageReady(page);
    await expect(page.getByTestId('candidate-accountability-card')).toBeVisible();
  });
});

