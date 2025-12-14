import { expect, test, type Page } from '@playwright/test';

import type { FeedsStoreHarness } from '@/app/(app)/e2e/feeds-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __feedsStoreHarness?: FeedsStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__feedsStoreHarness), { timeout: 60_000 });
  // Wait for harness ready attribute, but don't fail if it's not set (persistence might not hydrate in test env)
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.feedsStoreHarness === 'ready',
      { timeout: 30_000 },
    );
  } catch {
    // If dataset attribute isn't set, that's okay - harness is still available
    // This can happen if persistence hasn't hydrated yet
    console.warn('Feeds store harness ready attribute not set, but harness is available');
  }
};

test.describe('Feeds Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes feeds store API', async ({ page }) => {
    // Check harness exists
    const harnessExists = await page.evaluate(() => Boolean(window.__feedsStoreHarness));
    expect(harnessExists).toBe(true);

    // Check methods exist in page context (functions can't be serialized through evaluate)
    const hasLoadFeeds = await page.evaluate(() => 
      typeof window.__feedsStoreHarness?.actions?.loadFeeds === 'function'
    );
    expect(hasLoadFeeds).toBe(true);

    const hasSetFilters = await page.evaluate(() => 
      typeof window.__feedsStoreHarness?.actions?.setFilters === 'function'
    );
    expect(hasSetFilters).toBe(true);

    const hasBookmarkFeed = await page.evaluate(() => 
      typeof window.__feedsStoreHarness?.actions?.bookmarkFeed === 'function'
    );
    expect(hasBookmarkFeed).toBe(true);

    const hasGetState = await page.evaluate(() => 
      typeof window.__feedsStoreHarness?.selectors?.getState === 'function'
    );
    expect(hasGetState).toBe(true);
  });

  test('loads feeds via harness', async ({ page }) => {
    // Mock API endpoint
    await page.route('**/api/feeds', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            feeds: [
              {
                id: 'feed-1',
                title: 'Test Feed 1',
                category: 'politics',
                publishedAt: new Date().toISOString(),
              },
              {
                id: 'feed-2',
                title: 'Test Feed 2',
                category: 'technology',
                publishedAt: new Date().toISOString(),
              },
            ],
            total: 2,
          }),
        });
      }
    });

    await page.evaluate(() => {
      void window.__feedsStoreHarness?.actions.loadFeeds('all');
    });

    await page.waitForTimeout(1000);

    const state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    expect(state?.feeds.length).toBeGreaterThan(0);
  });

  test('applies filters via harness', async ({ page }) => {
    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.setFilters({
        categories: ['politics'],
        types: ['article'],
      });
    });

    const filters = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getFilters();
    });

    expect(filters?.categories).toContain('politics');
    expect(filters?.types).toContain('article');
  });

  test('bookmarks and unbookmarks feeds', async ({ page }) => {
    // Set up initial feed
    await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      void harness?.actions.loadFeeds('all');
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.bookmarkFeed('feed-1');
    });

    await page.waitForTimeout(500);

    let state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    const feed = state?.feeds.find((f: any) => f.id === 'feed-1');
    expect(feed?.userInteraction?.bookmarked).toBe(true);

    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.unbookmarkFeed('feed-1');
    });

    await page.waitForTimeout(500);

    state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    const unbookmarkedFeed = state?.feeds.find((f: any) => f.id === 'feed-1');
    expect(unbookmarkedFeed?.userInteraction?.bookmarked).toBe(false);
  });

  test('handles feed loading errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/feeds', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      }
    });

    await page.evaluate(() => {
      void window.__feedsStoreHarness?.actions.loadFeeds('all');
    });

    await page.waitForTimeout(1000);

    const state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    expect(state?.error).toBeTruthy();
  });

  test('resets feeds state', async ({ page }) => {
    // Set up some state
    await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      harness?.actions.setFilters({
        categories: ['politics'],
      });
      harness?.actions.setSelectedCategory('politics');
    });

    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.resetFeedsState();
    });

    const state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    expect(state?.filters.categories).toHaveLength(0);
    expect(state?.selectedCategory).toBeNull();
  });
});

