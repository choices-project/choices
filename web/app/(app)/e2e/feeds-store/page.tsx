'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  feedsStoreUtils,
  useFeedFilters,
  useFeedPreferences,
  useFeedCategories,
  useFeeds,
  useFeedsError,
  useFeedsLoading,
  useFeedsPagination,
  useFeedsRefreshing,
  useFeedsStore,
  useFilteredFeeds,
} from '@/lib/stores/feedsStore';
import type {
  FeedFilters,
  FeedItem,
  FeedsStore,
} from '@/lib/stores/feedsStore';

export type FeedsStoreHarness = {
  actions: {
    loadFeeds: FeedsStore['loadFeeds'];
    refreshFeeds: FeedsStore['refreshFeeds'];
    loadMoreFeeds: FeedsStore['loadMoreFeeds'];
    setFilters: FeedsStore['setFilters'];
    clearFilters: FeedsStore['clearFilters'];
    bookmarkFeed: FeedsStore['bookmarkFeed'];
    unbookmarkFeed: FeedsStore['unbookmarkFeed'];
    setSelectedCategory: FeedsStore['setSelectedCategory'];
    resetFeedsState: FeedsStore['resetFeedsState'];
    updatePreferences: FeedsStore['updatePreferences'];
  };
  selectors: {
    getState: () => FeedsStore;
    getSummary: () => ReturnType<typeof feedsStoreUtils.getFeedsSummary>;
    getFilters: () => FeedFilters;
    getFeedById: (id: string) => FeedItem | null;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __feedsStoreHarness: FeedsStoreHarness | undefined;
}

const formatList = (values: string[]) =>
  values.length ? values.map((value) => `#${value}`).join(', ') : 'none';

function FeedsStoreHarnessView() {
  const feeds = useFeeds();
  const filteredFeeds = useFilteredFeeds();
  const isLoading = useFeedsLoading();
  const isRefreshing = useFeedsRefreshing();
  const error = useFeedsError();
  const filters = useFeedFilters();
  const preferences = useFeedPreferences();
  const categories = useFeedCategories();
  const pagination = useFeedsPagination();

  const loadFeeds = useFeedsStore((state) => state.loadFeeds);
  const refreshFeeds = useFeedsStore((state) => state.refreshFeeds);
  const loadMoreFeeds = useFeedsStore((state) => state.loadMoreFeeds);
  const setFilters = useFeedsStore((state) => state.setFilters);
  const clearFilters = useFeedsStore((state) => state.clearFilters);
  const bookmarkFeed = useFeedsStore((state) => state.bookmarkFeed);
  const unbookmarkFeed = useFeedsStore((state) => state.unbookmarkFeed);
  const setSelectedCategory = useFeedsStore((state) => state.setSelectedCategory);
  const resetFeedsState = useFeedsStore((state) => state.resetFeedsState);
  const updatePreferences = useFeedsStore((state) => state.updatePreferences);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[E2E] Initializing feeds store harness');
    }

    const harness: FeedsStoreHarness = {
      actions: {
        loadFeeds,
        refreshFeeds,
        loadMoreFeeds,
        setFilters,
        clearFilters,
        bookmarkFeed,
        unbookmarkFeed,
        setSelectedCategory,
        resetFeedsState,
        updatePreferences,
      },
      selectors: {
        getState: () => useFeedsStore.getState(),
        getSummary: () => feedsStoreUtils.getFeedsSummary(),
        getFilters: () => useFeedsStore.getState().filters,
        getFeedById: (id: string) => feedsStoreUtils.getFeedById(id),
      },
    };

    window.__feedsStoreHarness = harness;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.feedsStoreHarness = 'ready';
    }

    return () => {
      if (window.__feedsStoreHarness === harness) {
        delete window.__feedsStoreHarness;
      }
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.feedsStoreHarness;
      }
    };
  }, [
    loadFeeds,
    refreshFeeds,
    loadMoreFeeds,
    setFilters,
    clearFilters,
    bookmarkFeed,
    unbookmarkFeed,
    setSelectedCategory,
    resetFeedsState,
  ]);

  const summary = useMemo(
    () => ({
      totalFeeds: feeds.length,
      filteredFeeds: filteredFeeds.length,
      totalAvailable: pagination.totalAvailable,
      hasMore: pagination.hasMore,
      remaining: pagination.remaining,
    }),
    [feeds.length, filteredFeeds.length, pagination],
  );

  return (
    <main
      data-testid="feeds-store-harness"
      className="mx-auto flex max-w-4xl flex-col gap-6 p-6"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Feeds Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the feeds store via <code>window.__feedsStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Summary</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total feeds</dt>
              <dd data-testid="feeds-total-count">{summary.totalFeeds}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Filtered feeds</dt>
              <dd data-testid="feeds-filtered-count">{summary.filteredFeeds}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total available</dt>
              <dd data-testid="feeds-total-available">{summary.totalAvailable}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Has more</dt>
              <dd data-testid="feeds-has-more">{String(summary.hasMore)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Remaining</dt>
              <dd data-testid="feeds-remaining">{summary.remaining}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Loading</dt>
              <dd data-testid="feeds-loading">{String(isLoading)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Refreshing</dt>
              <dd data-testid="feeds-refreshing">{String(isRefreshing)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Error</dt>
              <dd data-testid="feeds-error">{error ?? 'none'}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Filters &amp; Preferences</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Categories</dt>
              <dd data-testid="feeds-filters-categories">
                {formatList(filters.categories)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Tags</dt>
              <dd data-testid="feeds-filters-tags">
                {formatList(filters.tags)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Read status</dt>
              <dd data-testid="feeds-filters-read-status">{filters.readStatus}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>District</dt>
              <dd data-testid="feeds-filters-district">
                {filters.district ?? 'none'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Sort by</dt>
              <dd data-testid="feeds-preferences-sort">{preferences.sortBy}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Categories available</dt>
              <dd data-testid="feeds-categories-count">{categories.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Filtered Feeds</h2>
        <ul className="mt-4 space-y-3" data-testid="feeds-filtered-list">
          {filteredFeeds.map((feed) => (
            <li
              key={feed.id}
              className="rounded-md border border-slate-100 bg-slate-50 p-4"
              data-testid={`feed-item-${feed.id}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="font-medium"
                    data-testid={`feed-item-${feed.id}-title`}
                  >
                    {feed.title}
                  </p>
                  <p className="text-sm text-slate-600">{feed.summary}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div data-testid={`feed-item-${feed.id}-category`}>
                    {feed.category}
                  </div>
                  <div data-testid={`feed-item-${feed.id}-tags`}>
                    {formatList(feed.tags)}
                  </div>
                  <div data-testid={`feed-item-${feed.id}-bookmarked`}>
                    bookmarked: {String(feed.userInteraction.bookmarked)}
                  </div>
                </div>
              </div>
            </li>
          ))}
          {filteredFeeds.length === 0 && (
            <li className="text-sm text-slate-500">No feeds available</li>
          )}
        </ul>
      </section>
    </main>
  );
}

export default function FeedsStoreHarnessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main
        data-testid="feeds-store-harness-loading"
        className="mx-auto flex max-w-4xl flex-col gap-6 p-6 text-sm text-slate-500"
      >
        Preparing feeds store harness…
      </main>
    );
  }

  return <FeedsStoreHarnessView />;
}
