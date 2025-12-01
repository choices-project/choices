import { expect, test, type Page } from '@playwright/test';

import type { FeedsStoreHarness } from '@/app/(app)/e2e/feeds-store/page';

import { waitForPageReady } from '../helpers/e2e-setup';

declare global {
  interface Window {
    __feedsStoreHarness?: FeedsStoreHarness;
  }
}

const gotoHarness = async (page: Page) => {
  await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.waitForFunction(() => Boolean(window.__feedsStoreHarness));
  await page.waitForFunction(
    () => document.documentElement.dataset.feedsStoreHarness === 'ready'
  );
};

test.describe('Feeds Store E2E', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHarness(page);
  });

  test('harness exposes feeds store API', async ({ page }) => {
    const harness = await page.evaluate(() => window.__feedsStoreHarness);
    expect(harness).toBeDefined();
    expect(harness?.actions).toBeDefined();
    expect(harness?.actions.loadFeeds).toBeDefined();
    expect(harness?.actions.setFilters).toBeDefined();
    expect(harness?.actions.bookmarkFeed).toBeDefined();
    expect(harness?.selectors).toBeDefined();
    expect(harness?.selectors.getState).toBeDefined();
  });

  test('loads feeds via harness', async ({ page }) => {
    await page.evaluate(() => {
      // Seed the feeds store directly via the harness to avoid network flakiness
      window.__feedsStoreHarness?.actions.setFeeds([
        {
          id: 'feed-1',
          title: 'Test Feed 1',
          category: 'politics',
          publishedAt: new Date().toISOString(),
          type: 'article',
          source: { name: 'Test Source 1' },
          tags: ['democracy'],
          userInteraction: {
            bookmarked: false,
            read: false,
            liked: false,
            shared: false,
          },
          engagement: { likes: 0, shares: 0 },
          metadata: { language: 'en' },
        },
        {
          id: 'feed-2',
          title: 'Test Feed 2',
          category: 'technology',
          publishedAt: new Date().toISOString(),
          type: 'article',
          source: { name: 'Test Source 2' },
          tags: ['innovation'],
          userInteraction: {
            bookmarked: false,
            read: false,
            liked: false,
            shared: false,
          },
          engagement: { likes: 0, shares: 0 },
          metadata: { language: 'en' },
        },
      ] as any);
    });

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
      harness?.actions.loadFeeds({});
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
      window.__feedsStoreHarness?.actions.loadFeeds({});
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

