import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


import { createBaseStoreActions } from './baseStoreActions';

import type { BaseStore } from './types';
import type { CivicElection } from '@/types/civic';
import type { StateCreator } from 'zustand';


type ElectionState = {
  electionsByKey: Record<string, CivicElection[]>;
  isLoading: boolean;
  error: string | null;
};

type ElectionActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  fetchElectionsForDivisions: (divisions: string[]) => Promise<CivicElection[]>;
  clearElections: () => void;
};

export type ElectionStore = ElectionState & ElectionActions;

type ElectionStoreCreator = StateCreator<
  ElectionStore,
  [['zustand/devtools', never], ['zustand/immer', never]]
>;

export const createInitialElectionState = (): ElectionState => ({
  electionsByKey: {},
  isLoading: false,
  error: null
});

const buildKey = (divisions: string[]): string =>
  divisions
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)
    .sort()
    .join('|');

export const createElectionActions = (
  set: Parameters<ElectionStoreCreator>[0],
  _get: Parameters<ElectionStoreCreator>[1]
): ElectionActions => {
  const setState = set as unknown as (recipe: (draft: ElectionState) => void) => void;
  const { setLoading, setError, clearError } = createBaseStoreActions<ElectionState>(setState);

  const fetchElectionsForDivisions = async (divisions: string[]): Promise<CivicElection[]> => {
    const key = buildKey(divisions);

    if (!key) {
      setState((state) => {
        state.electionsByKey = { ...state.electionsByKey, '': [] };
      });
      return [];
    }

    setLoading(true);
    clearError();

    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();
    try {
      timeoutId = setTimeout(() => controller.abort(), 10_000);
      const params = new URLSearchParams();
      params.append('divisions', divisions.join(','));
      const response = await fetch(`/api/v1/civics/elections?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch elections');
      }

      const payload = await response.json() as {
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
      });

      return elections;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setError('Election lookup timed out');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to fetch elections');
      }
      return [];
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  const clearElections = () => {
    setState((state) => {
      state.electionsByKey = {};
      state.error = null;
    });
  };

  return {
    setLoading,
    setError,
    clearError,
    fetchElectionsForDivisions,
    clearElections
  };
};

export const electionStoreCreator: ElectionStoreCreator = (set, get) =>
  Object.assign(createInitialElectionState(), createElectionActions(set, get));

export const useElectionStore = create<ElectionStore>()(
  devtools(immer(electionStoreCreator), { name: 'election-store' })
);

const EMPTY_ELECTIONS: CivicElection[] = [];

export const electionSelectors = {
  electionsByKey: (state: ElectionStore) => state.electionsByKey,
  isLoading: (state: ElectionStore) => state.isLoading,
  error: (state: ElectionStore) => state.error
} as const;

export const useElectionsForDivisions = (divisions: string[]): CivicElection[] => {
  const key = buildKey(divisions);
  return useElectionStore((state) =>
    key ? state.electionsByKey[key] ?? EMPTY_ELECTIONS : EMPTY_ELECTIONS
  );
};

export const useElectionLoading = () =>
  useElectionStore(electionSelectors.isLoading);

export const useElectionError = () =>
  useElectionStore(electionSelectors.error);

export const useFetchElectionsForDivisions = () =>
  useElectionStore((state) => state.fetchElectionsForDivisions);

export const useClearElections = () =>
  useElectionStore((state) => state.clearElections);


