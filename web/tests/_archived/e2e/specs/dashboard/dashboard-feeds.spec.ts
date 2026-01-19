import { expect, test, type Page } from '@playwright/test';

import type { FeedsStoreHarness } from '@/app/(app)/e2e/feeds-store/page';

import {
  setupExternalAPIMocks,
  SHOULD_USE_MOCKS,
  waitForPageReady,
} from '../../helpers/e2e-setup';

declare global {
   
  interface Window {
    __feedsStoreHarness?: FeedsStoreHarness;
  }
   
}

const gotoFeedsHarness = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem('feeds-store');
    } catch (error) {
      console.warn('[E2E] unable to clear feeds-store from localStorage', error);
    }
  });
  await page.goto('/e2e/feeds-store', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await waitForPageReady(page);
  await page.waitForFunction(() => {
    const isReady =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.feedsStoreHarness === 'ready';
    return isReady || Boolean(window.__feedsStoreHarness);
  }, { timeout: 60_000 });
  await page.evaluate(() => {
    window.__feedsStoreHarness?.actions.resetFeedsState({
      preserveFilters: false,
      preservePreferences: false,
      preserveRecentSearches: false,
    });
    window.__feedsStoreHarness?.actions.clearFilters();
    window.__feedsStoreHarness?.actions.setSelectedCategory(null);
    window.__feedsStoreHarness?.actions.updatePreferences({
      itemsPerPage: 2,
    });
  });
};

const waitForFeedsResponse = (page: Page, matcher?: (url: string) => boolean) =>
  page.waitForResponse((response) => {
    if (!response.url().includes('/api/feeds')) {
      return false;
    }
    if (matcher) {
      return matcher(response.url());
    }
    return true;
  });

test.describe('Dashboard feeds harness', () => {
  test.skip(!SHOULD_USE_MOCKS, 'Feed mocks disabled for this run');

  test('loads feeds, filters by tags, and toggles bookmarks', async ({ page }) => {
    const cleanupMocks = await setupExternalAPIMocks(page, { feeds: true });

    try {
      await gotoFeedsHarness(page);

      await Promise.all([
        waitForFeedsResponse(page),
        page.evaluate(() => window.__feedsStoreHarness?.actions.loadFeeds()),
      ]);

      await expect(page.getByTestId('feeds-total-count')).toHaveText('2');
      await expect(page.getByTestId('feeds-filtered-count')).toHaveText('2');
      await expect(page.getByTestId('feeds-has-more')).toHaveText('true');

      const filteredList = page.getByTestId('feeds-filtered-list');
      await expect(filteredList).toContainText('Climate Action Now');
      await expect(filteredList).toContainText('Community Garden Expansion');

      await page.evaluate(() =>
        window.__feedsStoreHarness?.actions.setFilters({ tags: ['climate'] }),
      );
      await expect(page.getByTestId('feeds-filters-tags')).toHaveText('#climate');
      await expect(filteredList).toContainText('Climate Action Now');
      await expect(filteredList).not.toContainText('Community Garden Expansion');

      await Promise.all([
        waitForFeedsResponse(page, (url) => url.includes('limit=')),
        page.evaluate(() => window.__feedsStoreHarness?.actions.loadMoreFeeds()),
      ]);

      await expect(page.getByTestId('feeds-total-count')).toHaveText('3');
      await expect(page.getByTestId('feeds-filtered-count')).toHaveText('1');
      await expect(page.getByTestId('feeds-has-more')).toHaveText('false');

      await page.evaluate(() =>
        window.__feedsStoreHarness?.actions.clearFilters(),
      );
      await expect(page.getByTestId('feeds-filters-tags')).toHaveText('none');
      await expect(filteredList).toContainText('Community Garden Expansion');
      await expect(filteredList).toContainText('Youth Civic Summit');

      await page.evaluate(() =>
        window.__feedsStoreHarness?.actions.bookmarkFeed('feed-1'),
      );
      await expect(
        page.getByTestId('feed-item-feed-1-bookmarked'),
      ).toHaveText('bookmarked: true');

    } finally {
      await cleanupMocks();
    }
  });

  test('refreshes feeds without leaving stale state', async ({ page }) => {
    const cleanupMocks = await setupExternalAPIMocks(page, { feeds: true });

    try {
      await gotoFeedsHarness(page);

      await Promise.all([
        waitForFeedsResponse(page),
        page.evaluate(() => window.__feedsStoreHarness?.actions.loadFeeds()),
      ]);

      await Promise.all([
        waitForFeedsResponse(page),
        page.evaluate(() => window.__feedsStoreHarness?.actions.refreshFeeds()),
      ]);

      await expect(page.getByTestId('feeds-refreshing')).toHaveText('false');
      await expect(page.getByTestId('feeds-error')).toHaveText('none');
      await expect(page.getByTestId('feeds-total-count')).toHaveText('2');
    } finally {
      await cleanupMocks();
    }
  });
});


