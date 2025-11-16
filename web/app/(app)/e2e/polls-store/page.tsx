'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PollRow, PollUpdate } from '@/features/polls/types';
import { derivePollAnalytics } from '@/lib/polls/validation';
import { usePollsStore, type PollsStore } from '@/lib/stores/pollsStore';

export type PollsStoreHarness = {
  getSnapshot: () => PollsStore;
  actions: {
    setPolls: (polls: PollRow[]) => void;
    addPoll: (poll: PollRow) => void;
    updatePoll: (id: string, updates: PollUpdate) => void;
    removePoll: (id: string) => void;
    resetPollsState: PollsStore['resetPollsState'];
    setFilters: PollsStore['setFilters'];
    clearFilters: PollsStore['clearFilters'];
    setTrendingOnly: PollsStore['setTrendingOnly'];
    setSearchQuery: PollsStore['setSearchQuery'];
    clearSearch: PollsStore['clearSearch'];
    setCurrentPage: PollsStore['setCurrentPage'];
    setLastFetchedAt: (timestamp: string | null) => void;
  };
};

declare global {
  var __pollsStoreHarness: PollsStoreHarness | undefined;
}

export default function PollsStoreHarnessPage() {
  const [pollsState, setPollsState] = useState<PollsStore>(() => usePollsStore.getState());

  useEffect(() => {
    const unsubscribe = usePollsStore.subscribe((state) => {
      setPollsState(state);
    });
    return unsubscribe;
  }, []);

  const { polls, filters, search, preferences } = pollsState;

  const filteredPolls = useMemo(() => {
    return polls.filter((poll) => {
      if (filters.status.length > 0 && poll.status && !filters.status.includes(poll.status)) {
        return false;
      }

      if (filters.category.length > 0 && poll.category && !filters.category.includes(poll.category)) {
        return false;
      }

      if (filters.tags.length > 0 && poll.tags) {
        const pollTags = Array.isArray(poll.tags) ? poll.tags : [];
        if (!filters.tags.some((tag) => pollTags.includes(tag))) {
          return false;
        }
      }

      if (filters.trendingOnly) {
        const trendingPosition = (poll as PollRow & { trending_position?: number }).trending_position;
        if (!(typeof trendingPosition === 'number' && trendingPosition > 0)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, polls]);

  const analytics = useMemo(() => {
    return derivePollAnalytics(
      polls.map((poll) => {
        const meta = poll as Record<string, unknown>;
        const totalVotes =
          typeof poll.total_votes === 'number'
            ? poll.total_votes
            : (typeof meta.totalVotes === 'number' ? (meta.totalVotes as number) : null);
        const trendingPosition =
          typeof meta.trending_position === 'number'
            ? (meta.trending_position as number)
            : (typeof meta.trendingPosition === 'number'
                ? (meta.trendingPosition as number)
                : null);

        return {
          status: poll.status,
          total_votes: totalVotes,
          trending_position: trendingPosition,
        };
      }),
    );
  }, [polls]);

  const stats = useMemo(
    () => ({
      total: analytics.total,
      active: analytics.active,
      closed: analytics.closed,
      draft: analytics.draft,
      archived: analytics.archived,
      trending: analytics.trending,
      totalVotes: analytics.totalVotes,
    }),
    [analytics],
  );

  const pagination = useMemo(
    () => ({
      currentPage: search.currentPage,
      totalPages: search.totalPages,
      totalResults: search.totalResults,
      itemsPerPage: preferences.itemsPerPage,
    }),
    [preferences.itemsPerPage, search.currentPage, search.totalPages, search.totalResults],
  );

  useEffect(() => {
    const harness: PollsStoreHarness = {
      getSnapshot: () => usePollsStore.getState(),
      actions: {
        setPolls: (nextPolls) => usePollsStore.getState().setPolls(nextPolls),
        addPoll: (poll) => usePollsStore.getState().addPoll(poll),
        updatePoll: (id, updates) => usePollsStore.getState().updatePoll(id, updates),
        removePoll: (id) => usePollsStore.getState().removePoll(id),
        resetPollsState: () => usePollsStore.getState().resetPollsState(),
        setFilters: (partial) => usePollsStore.getState().setFilters(partial),
        clearFilters: () => usePollsStore.getState().clearFilters(),
        setTrendingOnly: (value) => usePollsStore.getState().setTrendingOnly(value),
        setSearchQuery: (value) => usePollsStore.getState().setSearchQuery(value),
        clearSearch: () => usePollsStore.getState().clearSearch(),
        setCurrentPage: (page) => usePollsStore.getState().setCurrentPage(page),
        setLastFetchedAt: (timestamp) =>
          usePollsStore.setState((state) => {
            state.lastFetchedAt = timestamp;
          }),
      },
    };

    window.__pollsStoreHarness = harness;
    return () => {
      if (window.__pollsStoreHarness === harness) {
        delete window.__pollsStoreHarness;
      }
    };
  }, []);

  useEffect(() => {
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.pollsStoreHarness = 'ready';
      }
    };

    const persist = (usePollsStore as typeof usePollsStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribeHydration: (() => void) | void;

    if (persist?.hasHydrated?.()) {
      markReady();
    } else if (persist?.onFinishHydration) {
      unsubscribeHydration = persist.onFinishHydration(() => {
        markReady();
      });
    } else {
      markReady();
    }

    return () => {
      if (typeof unsubscribeHydration === 'function') {
        unsubscribeHydration();
      }
      if (ready && typeof document !== 'undefined') {
        delete document.documentElement.dataset.pollsStoreHarness;
      }
    };
  }, []);

  return (
    <main
      data-testid="polls-store-harness"
      className="mx-auto flex max-w-5xl flex-col gap-6 p-6 text-slate-900"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Polls Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the polls store via <code>window.__pollsStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Summary</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Total polls</dt>
              <dd data-testid="polls-total-count">{String(stats.total)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Active</dt>
              <dd data-testid="polls-active-count">{String(stats.active)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Closed</dt>
              <dd data-testid="polls-closed-count">{String(stats.closed)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Draft</dt>
              <dd data-testid="polls-draft-count">{String(stats.draft)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Trending</dt>
              <dd data-testid="polls-trending-count">{String(stats.trending)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Archived</dt>
              <dd data-testid="polls-archived-count">{String(stats.archived ?? 0)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total votes</dt>
              <dd data-testid="polls-total-votes">{String(stats.totalVotes ?? 0)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Filters</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Status</dt>
              <dd data-testid="polls-filters-status">{filters.status.join(', ') || 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Categories</dt>
              <dd data-testid="polls-filters-category">{filters.category.join(', ') || 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Tags</dt>
              <dd data-testid="polls-filters-tags">{filters.tags.join(', ') || 'none'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Trending only</dt>
              <dd data-testid="polls-filters-trending">{String(filters.trendingOnly)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Search</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Query</dt>
              <dd data-testid="polls-search-query">{search.query || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total results</dt>
              <dd data-testid="polls-search-total">{String(search.totalResults)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Pagination</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Current page</dt>
              <dd data-testid="polls-page-current">{String(pagination.currentPage)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total pages</dt>
              <dd data-testid="polls-page-total">{String(pagination.totalPages)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Results per page</dt>
              <dd data-testid="polls-page-size">{String(pagination.itemsPerPage)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total results</dt>
              <dd data-testid="polls-page-results">{String(pagination.totalResults)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Filtered Polls</h2>
        <ul
          data-testid="polls-filtered-list"
          className="mt-2 space-y-2 text-sm"
        >
          {filteredPolls.length === 0 && <li className="text-slate-500">No polls match the current filters.</li>}
          {filteredPolls.map((poll) => (
            <li
              key={poll.id}
              className="rounded border border-slate-200 bg-slate-50 p-2"
              data-status={poll.status ?? 'unknown'}
              data-category={poll.category ?? 'unknown'}
            >
              <div className="font-medium">{poll.title}</div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Status: {poll.status ?? 'n/a'}</span>
                <span>Category: {poll.category ?? 'n/a'}</span>
                <span>Trending: {((poll as Record<string, unknown>).trending_position as number | undefined) ? 'yes' : 'no'}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">All Poll IDs</h2>
        <ul data-testid="polls-id-list" className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          {polls.length === 0 && <li>No polls loaded.</li>}
          {polls.map((poll) => (
            <li key={poll.id} className="rounded bg-slate-100 px-2 py-1">
              {poll.id}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

