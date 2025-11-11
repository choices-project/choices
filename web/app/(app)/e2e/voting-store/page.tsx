'use client';

import { useEffect } from 'react';

import {
  useVotingStore,
  type VotingState,
  type VotingActions,
} from '@/lib/stores/votingStore';

export type VotingStoreHarness = {
  setBallots: VotingActions['setBallots'];
  setElections: VotingActions['setElections'];
  setVotingRecords: VotingActions['setVotingRecords'];
  reset: VotingActions['reset'];
  registerTimer: VotingActions['registerTimer'];
  clearTimer: VotingActions['clearTimer'];
  clearAllTimers: VotingActions['clearAllTimers'];
  getSnapshot: () => VotingState;
};

declare global {
  interface Window {
    __votingStoreHarness?: VotingStoreHarness;
  }
}

export default function VotingStoreHarnessPage() {
  const ballots = useVotingStore((state) => state.ballots);
  const elections = useVotingStore((state) => state.elections);
  const votingRecords = useVotingStore((state) => state.votingRecords);
  const searchResults = useVotingStore((state) => state.search.results.length);
  const isLoading = useVotingStore((state) => state.isLoading);
  const isVoting = useVotingStore((state) => state.isVoting);
  const isSearching = useVotingStore((state) => state.isSearching);
  const error = useVotingStore((state) => state.error);
  const setBallots = useVotingStore((state) => state.setBallots);
  const setElections = useVotingStore((state) => state.setElections);
  const setVotingRecords = useVotingStore((state) => state.setVotingRecords);
  const reset = useVotingStore((state) => state.reset);
  const registerTimer = useVotingStore((state) => state.registerTimer);
  const clearTimer = useVotingStore((state) => state.clearTimer);
  const clearAllTimers = useVotingStore((state) => state.clearAllTimers);

  useEffect(() => {
    const harness: VotingStoreHarness = {
      setBallots,
      setElections,
      setVotingRecords,
      reset,
      registerTimer,
      clearTimer,
      clearAllTimers,
      getSnapshot: () => useVotingStore.getState(),
    };

    window.__votingStoreHarness = harness;
    return () => {
      if (window.__votingStoreHarness === harness) {
        delete window.__votingStoreHarness;
      }
    };
  }, [clearAllTimers, clearTimer, registerTimer, reset, setBallots, setElections, setVotingRecords]);

  return (
    <main
      data-testid="voting-store-harness"
      className="mx-auto flex max-w-4xl flex-col gap-6 p-6"
    >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Voting Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the voting store via <code>window.__votingStoreHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Counts</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Ballots</dt>
              <dd data-testid="voting-total-ballots">{ballots.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Elections</dt>
              <dd data-testid="voting-total-elections">{elections.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Voting records</dt>
              <dd data-testid="voting-total-records">{votingRecords.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Search results</dt>
              <dd data-testid="voting-search-results">{searchResults}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Flags</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Loading</dt>
              <dd data-testid="voting-flag-loading">{String(isLoading)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Voting</dt>
              <dd data-testid="voting-flag-voting">{String(isVoting)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Searching</dt>
              <dd data-testid="voting-flag-searching">{String(isSearching)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Error</dt>
              <dd data-testid="voting-error">{error ?? 'none'}</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}

