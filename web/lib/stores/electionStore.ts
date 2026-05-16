import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


import { createBaseStoreActions } from './baseStoreActions';

import type { BaseStore } from './types';
import type { CivicElection } from '@/types/civic';
import type { StateCreator } from 'zustand';


type ElectionState = {
  electionsByKey: Record<string, CivicElection[]>;
  errorsByKey: Record<string, string | null>;
  loadingKeys: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
};

type ElectionActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  fetchElectionsForDivisions: (divisions: string[]) => Promise<CivicElection[]>;
  indexElectionsForDivisionGroups: (
    divisionGroups: string[][],
    elections: CivicElection[],
  ) => void;
  clearElections: () => void;
};

export type ElectionStore = ElectionState & ElectionActions;

type ElectionStoreCreator = StateCreator<
  ElectionStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
>;

const inFlightElectionFetches = new Map<string, Promise<CivicElection[]>>();

export const buildElectionKey = (divisions: string[]): string =>
  divisions
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .sort()
    .join('|');

const hasCachedElections = (state: ElectionState, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(state.electionsByKey, key);

const electionsMatchingDivisions = (
  elections: CivicElection[],
  divisions: string[],
): CivicElection[] => {
  const divisionSet = new Set(
    divisions.map((division) => division.trim().toLowerCase()).filter(Boolean),
  );
  if (divisionSet.size === 0) {
    return [];
  }

  return elections.filter((election) =>
    divisionSet.has((election.ocd_division_id ?? '').trim().toLowerCase()),
  );
};

export const createInitialElectionState = (): ElectionState => ({
  electionsByKey: {},
  errorsByKey: {},
  loadingKeys: {},
  isLoading: false,
  error: null,
});

export const createElectionActions = (
  set: Parameters<ElectionStoreCreator>[0],
  get: Parameters<ElectionStoreCreator>[1],
): ElectionActions => {
  const setState = set as unknown as (recipe: (draft: ElectionState) => void) => void;
  const { setLoading, setError, clearError } = createBaseStoreActions<ElectionState>(setState);

  const setKeyLoading = (key: string, loading: boolean) => {
    setState((state) => {
      if (loading) {
        state.loadingKeys[key] = true;
        state.isLoading = true;
      } else {
        delete state.loadingKeys[key];
        state.isLoading = Object.keys(state.loadingKeys).length > 0;
      }
    });
  };

  const setKeyError = (key: string, message: string | null) => {
    setState((state) => {
      state.errorsByKey[key] = message;
      if (message) {
        state.error = message;
      } else if (state.error && !Object.values(state.errorsByKey).some(Boolean)) {
        state.error = null;
      }
    });
  };

  const fetchElectionsForDivisions = async (divisions: string[]): Promise<CivicElection[]> => {
    const key = buildElectionKey(divisions);

    if (!key) {
      setState((state) => {
        state.electionsByKey[''] = [];
      });
      return [];
    }

    if (hasCachedElections(get(), key)) {
      return get().electionsByKey[key] ?? [];
    }

    const inflight = inFlightElectionFetches.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = (async () => {
      setKeyLoading(key, true);
      clearError();
      setKeyError(key, null);

      let timeoutId: NodeJS.Timeout | null = null;
      const controller = new AbortController();
      try {
        timeoutId = setTimeout(() => controller.abort(), 20_000);
        const params = new URLSearchParams();
        params.append('divisions', divisions.join(','));
        const response = await fetch(`/api/v1/civics/elections?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch elections');
        }

        const payload = (await response.json()) as {
          data?: CivicElection[] | { elections?: CivicElection[] };
          elections?: CivicElection[];
        };

        const elections =
          Array.isArray(payload.data)
            ? payload.data
            : payload.data && 'elections' in payload.data && Array.isArray(payload.data.elections)
              ? payload.data.elections
              : Array.isArray(payload.elections)
                ? payload.elections
                : [];

        setState((state) => {
          state.electionsByKey[key] = elections;
          state.errorsByKey[key] = null;
        });

        return elections;
      } catch (error) {
        const message =
          error instanceof DOMException && error.name === 'AbortError'
            ? 'Election lookup timed out'
            : error instanceof Error
              ? error.message
              : 'Failed to fetch elections';
        setKeyError(key, message);
        setError(message);
        return [];
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setKeyLoading(key, false);
        inFlightElectionFetches.delete(key);
      }
    })();

    inFlightElectionFetches.set(key, promise);
    return promise;
  };

  const indexElectionsForDivisionGroups = (
    divisionGroups: string[][],
    elections: CivicElection[],
  ) => {
    setState((state) => {
      for (const divisions of divisionGroups) {
        const key = buildElectionKey(divisions);
        if (!key || hasCachedElections(state, key)) {
          continue;
        }
        state.electionsByKey[key] = electionsMatchingDivisions(elections, divisions);
        state.errorsByKey[key] = null;
      }
    });
  };

  const clearElections = () => {
    inFlightElectionFetches.clear();
    setState((state) => {
      state.electionsByKey = {};
      state.errorsByKey = {};
      state.loadingKeys = {};
      state.error = null;
      state.isLoading = false;
    });
  };

  return {
    setLoading,
    setError,
    clearError,
    fetchElectionsForDivisions,
    indexElectionsForDivisionGroups,
    clearElections,
  };
};

export const electionStoreCreator: ElectionStoreCreator = (set, get) =>
  Object.assign(createInitialElectionState(), createElectionActions(set, get));

export const useElectionStore = create<ElectionStore>()(
  devtools(immer(electionStoreCreator), { name: 'election-store' }),
);

const EMPTY_ELECTIONS: CivicElection[] = [];

export const electionSelectors = {
  electionsByKey: (state: ElectionStore) => state.electionsByKey,
  isLoading: (state: ElectionStore) => state.isLoading,
  error: (state: ElectionStore) => state.error,
} as const;

export const useElectionsForDivisions = (divisions: string[]): CivicElection[] => {
  const key = buildElectionKey(divisions);
  return useElectionStore((state) =>
    key ? state.electionsByKey[key] ?? EMPTY_ELECTIONS : EMPTY_ELECTIONS,
  );
};

export const useElectionLoadingForDivisions = (divisions: string[]): boolean => {
  const key = buildElectionKey(divisions);
  return useElectionStore((state) => Boolean(key && state.loadingKeys[key]));
};

export const useElectionErrorForDivisions = (divisions: string[]): string | null => {
  const key = buildElectionKey(divisions);
  return useElectionStore((state) => (key ? state.errorsByKey[key] ?? null : null));
};

export const useElectionLoading = () =>
  useElectionStore(electionSelectors.isLoading);

export const useElectionError = () =>
  useElectionStore(electionSelectors.error);

export const useFetchElectionsForDivisions = () =>
  useElectionStore((state) => state.fetchElectionsForDivisions);

export const useIndexElectionsForDivisionGroups = () =>
  useElectionStore((state) => state.indexElectionsForDivisionGroups);

export const useClearElections = () =>
  useElectionStore((state) => state.clearElections);
