import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { CivicElection } from '@/types/civic';

import { createBaseStoreActions } from './baseStoreActions';
import type { BaseStore } from './types';


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

    try {
      const params = new URLSearchParams();
      params.append('divisions', divisions.join(','));
      const response = await fetch(`/api/v1/civics/elections?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch elections');
      }

      const payload = await response.json() as {
        data?: CivicElection[];
      };

      const elections = payload.data ?? [];

      setState((state) => {
        state.electionsByKey[key] = elections;
      });

      return elections;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch elections');
      return [];
    } finally {
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

export const electionSelectors = {
  electionsByKey: (state: ElectionStore) => state.electionsByKey,
  isLoading: (state: ElectionStore) => state.isLoading,
  error: (state: ElectionStore) => state.error
} as const;

export const useElectionsForDivisions = (divisions: string[]): CivicElection[] => {
  const key = buildKey(divisions);
  return useElectionStore((state) =>
    key ? state.electionsByKey[key] ?? [] : []
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


