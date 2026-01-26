import { expect, test, type Page } from '@playwright/test';

import type { FeedsStoreHarness } from '@/app/(app)/e2e/feeds-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __feedsStoreHarness?: FeedsStoreHarness;
  }
}

const MOCK_FEED = {
  id: 'feed-1',
  title: 'Test Feed 1',
  content: 'Test content 1',
  summary: 'Test summary 1',
  description: 'Test description 1',
  category: 'politics',
  tags: [] as string[],
  type: 'poll' as const,
  author: { id: 'system', name: 'System', verified: true },
  source: { name: 'Choices Platform', url: '/', verified: true },
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  readTime: 1,
  engagement: { likes: 0, shares: 0, comments: 0, bookmarks: 0, views: 0 },
  userInteraction: { liked: false, shared: false, bookmarked: false, read: false },
};

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__feedsStoreHarness), { timeout: 60_000 });
  await page.waitForFunction(
    () => document.documentElement.dataset.feedsStoreHarness === 'ready',
    { timeout: 30_000 },
  );
};

test.describe('Feeds Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.resetFeedsState({
        preserveFilters: false,
        preservePreferences: true,
        preserveRecentSearches: false,
      });
    });
  });

  test('harness exposes feeds store API', async ({ page }) => {
    const harnessExists = await page.evaluate(() => Boolean(window.__feedsStoreHarness));
    expect(harnessExists).toBe(true);

    const hasLoadFeeds = await page.evaluate(
      () => typeof window.__feedsStoreHarness?.actions?.loadFeeds === 'function',
    );
    expect(hasLoadFeeds).toBe(true);

    const hasSetFilters = await page.evaluate(
      () => typeof window.__feedsStoreHarness?.actions?.setFilters === 'function',
    );
    expect(hasSetFilters).toBe(true);

    const hasBookmarkFeed = await page.evaluate(
      () => typeof window.__feedsStoreHarness?.actions?.bookmarkFeed === 'function',
    );
    expect(hasBookmarkFeed).toBe(true);

    const hasGetState = await page.evaluate(
      () => typeof window.__feedsStoreHarness?.selectors?.getState === 'function',
    );
    expect(hasGetState).toBe(true);
  });

  test('loads feeds via harness', async ({ page }) => {
    await page.route('**/api/feeds*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              feeds: [MOCK_FEED],
              count: 1,
              filters: { category: 'all', district: null, sort: 'trending' },
              pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
            },
            metadata: { timestamp: new Date().toISOString() },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.evaluate(async () => {
      await window.__feedsStoreHarness?.actions.loadFeeds('all');
    });

    await page.waitForFunction(
      () => {
        const s = window.__feedsStoreHarness?.selectors.getState();
        return Array.isArray(s?.feeds) && s.feeds.length > 0;
      },
      { timeout: 15_000 },
    );

    const state = await page.evaluate(() => window.__feedsStoreHarness?.selectors.getState());
    expect(state?.feeds?.length).toBeGreaterThan(0);
  });

  test('applies filters via harness', async ({ page }) => {
    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.setFilters({
        categories: ['politics'],
        types: ['article'],
      });
    });

    const filters = await page.evaluate(() =>
      window.__feedsStoreHarness?.selectors.getFilters(),
    );
    expect(filters?.categories).toContain('politics');
    expect(filters?.types).toContain('article');
  });

  test('resets feeds state', async ({ page }) => {
    await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      harness?.actions.setFilters({ categories: ['politics'] });
      harness?.actions.setSelectedCategory('politics');
    });

    await page.waitForFunction(
      () => {
        const f = window.__feedsStoreHarness?.selectors.getFilters();
        return Array.isArray(f?.categories) && f.categories.includes('politics');
      },
      { timeout: 5_000 },
    );

    let state = await page.evaluate(() => window.__feedsStoreHarness?.selectors.getState());
    expect(state?.filters?.categories).toContain('politics');
    expect(state?.selectedCategory).toBe('politics');

    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.resetFeedsState({
        preserveFilters: false,
        preservePreferences: true,
        preserveRecentSearches: true,
      });
    });

    await page.waitForFunction(
      () => {
        const s = window.__feedsStoreHarness?.selectors.getState();
        const cats = s?.filters?.categories ?? [];
        return Array.isArray(cats) && cats.length === 0;
      },
      { timeout: 5_000 },
    );

    state = await page.evaluate(() => window.__feedsStoreHarness?.selectors.getState());
    expect(state?.filters?.categories).toHaveLength(0);
    expect(state?.selectedCategory).toBeNull();
  });
});
