/**
 * Civics Voting Records E2E Tests
 *
 * Covers CIVICS_VOTING_RECORDS:
 * - Accountability card "Voting Record" tab content
 * - Detailed API includes recent votes
 */
import { test, expect } from '@playwright/test';
import { waitForPageReady, setupExternalAPIMocks } from './helpers/e2e-setup';

test.describe('Civics Voting Records', () => {
  test.beforeEach(async ({ page }) => {
    await setupExternalAPIMocks(page);
    await page.route('**/api/v1/civics/by-state**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          count: 1,
          data: [{
            id: '301',
            name: 'Riley Thompson',
            party: 'Democratic',
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

  test('shows voting record tab and recent votes', async ({ page }) => {
    await page.goto('/civics');
    await waitForPageReady(page);
    await expect(page.getByTestId('candidate-accountability-card')).toBeVisible();
    await page.getByRole('button', { name: 'Voting Record' }).click();
    await expect(page.locator('text=Recent Votes')).toBeVisible();
    await expect(page.locator('text=Party:')).toBeVisible();
    await expect(page.locator('text=Constituents:')).toBeVisible();
  });

  test('representative detail API returns voting snapshot', async ({ page }) => {
    await page.route('**/api/v1/civics/representative/555**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            id: 555,
            name: 'Jamie Patel',
            office: 'U.S. Senator',
            level: 'federal',
            jurisdiction: 'CA',
            voting_behavior: {
              analysis_period: 'current_session',
              total_votes: 100,
              party_unity_score: 0.92,
              bipartisan_score: 0.35,
              attendance_rate: 0.98,
              ideology_score: 0.4,
              key_vote_positions: [],
              last_updated: new Date().toISOString()
            },
            recent_votes: [
              { bill_id: 'hr-1', bill_title: 'HR 1', vote_date: '2025-01-01', vote_position: 'Yea', party_position: 'Yea' }
            ]
          }
        })
      });
    });
    const res = await page.request.get('/api/v1/civics/representative/555');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.data.voting_behavior).toBeTruthy();
    expect(Array.isArray(json.data.recent_votes)).toBeTruthy();
  });
});

