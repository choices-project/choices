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
    // Mock API endpoint - feeds API uses GET, not POST
    // The API returns successResponse({ feeds, count, filters, pagination })
    await page.route('**/api/feeds*', async (route) => {
      if (route.request().method() === 'GET') {
        const mockFeeds = [
          {
            id: 'feed-1',
            title: 'Test Feed 1',
            content: 'Test content 1',
            summary: 'Test summary 1',
            description: 'Test description 1',
            category: 'politics',
            tags: [],
            type: 'poll' as const,
            author: { id: 'system', name: 'System', verified: true },
            source: { name: 'Choices Platform', url: '/', verified: true },
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            readTime: 1,
            engagement: { likes: 0, shares: 0, comments: 0, bookmarks: 0, views: 0 },
            userInteraction: { liked: false, shared: false, bookmarked: false, read: false },
          },
          {
            id: 'feed-2',
            title: 'Test Feed 2',
            content: 'Test content 2',
            summary: 'Test summary 2',
            description: 'Test description 2',
            category: 'technology',
            tags: [],
            type: 'poll' as const,
            author: { id: 'system', name: 'System', verified: true },
            source: { name: 'Choices Platform', url: '/', verified: true },
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            readTime: 1,
            engagement: { likes: 0, shares: 0, comments: 0, bookmarks: 0, views: 0 },
            userInteraction: { liked: false, shared: false, bookmarked: false, read: false },
          },
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              feeds: mockFeeds,
              count: 2,
              filters: {
                category: 'all',
                district: null,
                sort: 'trending',
              },
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            metadata: {
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to harness page first
    await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForSelector('[data-testid="feeds-store-harness"]', { timeout: 30_000 });

    // Wait for harness to be ready
    await page.waitForFunction(() => Boolean(window.__feedsStoreHarness), { timeout: 30_000 });

    // Wait for loadFeeds to complete
    await page.evaluate(async () => {
      await window.__feedsStoreHarness?.actions.loadFeeds('all');
    });

    // Wait for state to update - check multiple times with increasing timeout
    let state: any = null;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(500);
      state = await page.evaluate(() => {
        const harness = window.__feedsStoreHarness;
        return harness?.selectors.getState();
      });
      if (state?.feeds && state.feeds.length > 0) {
        break;
      }
    }

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
    // Mock API endpoint first
    await page.route('**/api/feeds*', async (route) => {
      if (route.request().method() === 'GET') {
        const mockFeeds = [
          {
            id: 'feed-1',
            title: 'Test Feed 1',
            content: 'Test content 1',
            summary: 'Test summary 1',
            description: 'Test description 1',
            category: 'politics',
            tags: [],
            type: 'poll' as const,
            author: { id: 'system', name: 'System', verified: true },
            source: { name: 'Choices Platform', url: '/', verified: true },
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            readTime: 1,
            engagement: { likes: 0, shares: 0, comments: 0, bookmarks: 0, views: 0 },
            userInteraction: { liked: false, shared: false, bookmarked: false, read: false },
          },
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              feeds: mockFeeds,
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

    // Navigate to harness page
    await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForSelector('[data-testid="feeds-store-harness"]', { timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__feedsStoreHarness), { timeout: 30_000 });

    // Load feeds first
    await page.evaluate(async () => {
      await window.__feedsStoreHarness?.actions.loadFeeds('all');
    });

    // Wait for feeds to load
    let state: any = null;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(500);
      state = await page.evaluate(() => {
        const harness = window.__feedsStoreHarness;
        return harness?.selectors.getState();
      });
      if (state?.feeds && state.feeds.length > 0) {
        break;
      }
    }

    expect(state?.feeds.length).toBeGreaterThan(0);

    // Bookmark feed
    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.bookmarkFeed('feed-1');
    });

    await page.waitForTimeout(500);

    state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    const feed = state?.feeds.find((f: any) => f.id === 'feed-1');
    expect(feed?.userInteraction?.bookmarked).toBe(true);

    // Unbookmark feed
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
    // Navigate to harness page first
    await page.goto('/e2e/feeds-store', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForSelector('[data-testid="feeds-store-harness"]', { timeout: 30_000 });
    await page.waitForFunction(() => Boolean(window.__feedsStoreHarness), { timeout: 30_000 });

    // Set up some state
    await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      harness?.actions.setFilters({
        categories: ['politics'],
      });
      harness?.actions.setSelectedCategory('politics');
    });

    await page.waitForTimeout(500);

    // Verify state was set
    let state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });
    expect(state?.filters.categories).toContain('politics');
    expect(state?.selectedCategory).toBe('politics');

    // Reset state
    await page.evaluate(() => {
      window.__feedsStoreHarness?.actions.resetFeedsState();
    });

    await page.waitForTimeout(500);

    state = await page.evaluate(() => {
      const harness = window.__feedsStoreHarness;
      return harness?.selectors.getState();
    });

    expect(state?.filters.categories).toHaveLength(0);
    expect(state?.selectedCategory).toBeNull();
  });
});

