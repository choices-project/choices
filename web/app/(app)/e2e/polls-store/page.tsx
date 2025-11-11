'use client';

import { useEffect } from 'react';

import {
  useFilteredPolls,
  usePollFilters,
  usePollPagination,
  usePollSearch,
  usePolls,
  usePollsActions,
  usePollsStats,
  usePollsStore,
  type PollsStore,
} from '@/lib/stores/pollsStore';
import type { PollRow, PollUpdate } from '@/features/polls/types';

type PollsHarnessActions = ReturnType<typeof usePollsActions>;

export type PollsStoreHarness = {
  getSnapshot: () => PollsStore;
  actions: {
    setPolls: (polls: PollRow[]) => void;
    addPoll: (poll: PollRow) => void;
    updatePoll: (id: string, updates: PollUpdate) => void;
    removePoll: (id: string) => void;
    resetPollsState: PollsHarnessActions['resetPollsState'];
    setFilters: PollsHarnessActions['setFilters'];
    clearFilters: PollsHarnessActions['clearFilters'];
    setTrendingOnly: PollsHarnessActions['setTrendingOnly'];
    setSearchQuery: PollsHarnessActions['setSearchQuery'];
    clearSearch: PollsHarnessActions['clearSearch'];
    setCurrentPage: PollsHarnessActions['setCurrentPage'];
  };
};

declare global {
  interface Window {
    __pollsStoreHarness?: PollsStoreHarness;
  }
}

export default function PollsStoreHarnessPage() {
  const polls = usePolls();
  const filteredPolls = useFilteredPolls();
  const filters = usePollFilters();
  const search = usePollSearch();
  const pagination = usePollPagination();
  const stats = usePollsStats();

  const {
    resetPollsState,
    setFilters,
    clearFilters,
    setTrendingOnly,
    setSearchQuery,
    clearSearch,
    setCurrentPage,
  } = usePollsActions();

  useEffect(() => {
    const harness: PollsStoreHarness = {
      getSnapshot: () => usePollsStore.getState(),
      actions: {
        setPolls: (nextPolls) => usePollsStore.getState().setPolls(nextPolls),
        addPoll: (poll) => usePollsStore.getState().addPoll(poll),
        updatePoll: (id, updates) => usePollsStore.getState().updatePoll(id, updates),
        removePoll: (id) => usePollsStore.getState().removePoll(id),
        resetPollsState,
        setFilters,
        clearFilters,
        setTrendingOnly,
        setSearchQuery,
        clearSearch,
        setCurrentPage,
      },
    };

    window.__pollsStoreHarness = harness;
    return () => {
      if (window.__pollsStoreHarness === harness) {
        delete window.__pollsStoreHarness;
      }
    };
  }, [
    clearFilters,
    clearSearch,
    resetPollsState,
    setCurrentPage,
    setFilters,
    setSearchQuery,
    setTrendingOnly,
  ]);

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

