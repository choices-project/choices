import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';
import type { PollsStoreHarness } from '@/app/(app)/e2e/polls-store/page';

declare global {
  interface Window {
    __pollsStoreHarness?: PollsStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/polls-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__pollsStoreHarness));
  await page.evaluate(() => {
    window.__pollsStoreHarness?.actions.resetPollsState();
    window.__pollsStoreHarness?.actions.clearFilters();
    window.__pollsStoreHarness?.actions.clearSearch();
  });
};

const seedPolls = (page: Page) =>
  page.evaluate(() => {
    const harness = window.__pollsStoreHarness;
    if (!harness) {
      return;
    }

    const now = new Date().toISOString();

    const activeTrending = {
      id: 'poll-active-trending',
      title: 'Green Transit Plan',
      description: 'Decide on dedicated bus lanes.',
      status: 'active',
      category: 'transport',
      tags: ['transit', 'climate'],
      total_votes: 420,
      totalvotes: 420,
      trending_position: 1,
      created_at: now,
      updated_at: now,
      closed_at: null,
      archived_at: null,
      author_id: 'user-1',
    } as any;

    const closedPoll = {
      id: 'poll-closed',
      title: 'School Funding Measure',
      description: 'Allocate surplus toward schools.',
      status: 'closed',
      category: 'education',
      tags: ['schools'],
      total_votes: 275,
      totalvotes: 275,
      trending_position: null,
      created_at: now,
      updated_at: now,
      closed_at: now,
      archived_at: null,
      author_id: 'user-2',
    } as any;

    harness.actions.setPolls([activeTrending, closedPoll]);
  });

test.describe('Polls store harness', () => {
  test('summarises seeded polls and exposes filtered list', async ({ page }) => {
    await gotoHarness(page);
    await seedPolls(page);

    await expect(page.getByTestId('polls-total-count')).toHaveText('2');
    await expect(page.getByTestId('polls-active-count')).toHaveText('1');
    await expect(page.getByTestId('polls-closed-count')).toHaveText('1');
    await expect(page.getByTestId('polls-trending-count')).toHaveText('1');

    const filteredList = page.getByTestId('polls-filtered-list');
    await expect(filteredList).toContainText('Green Transit Plan');
    await expect(filteredList).not.toContainText('School Funding Measure');
  });

  test('responds to filter changes and trending-only flag', async ({ page }) => {
    await gotoHarness(page);
    await seedPolls(page);

    const filteredList = page.getByTestId('polls-filtered-list');

    await page.evaluate(() => {
      window.__pollsStoreHarness?.actions.setFilters({ status: ['closed'] });
    });
    await expect(page.getByTestId('polls-filters-status')).toHaveText('closed');
    await expect(filteredList).toContainText('School Funding Measure');
    await expect(filteredList).not.toContainText('Green Transit Plan');

    await page.evaluate(() => {
      window.__pollsStoreHarness?.actions.clearFilters();
      window.__pollsStoreHarness?.actions.setTrendingOnly(true);
    });
    await expect(page.getByTestId('polls-filters-trending')).toHaveText('true');
    await expect(filteredList).toContainText('Green Transit Plan');
    await expect(filteredList).not.toContainText('School Funding Measure');
  });
});

