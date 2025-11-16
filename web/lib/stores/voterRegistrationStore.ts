import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { Database } from '@/types/supabase';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';
import type { BaseStore } from './types';

type VoterRegistrationRow =
  Database['public']['Views']['voter_registration_resources_view']['Row'];

export type VoterRegistrationResource = VoterRegistrationRow;

export type VoterRegistrationState = {
  resourcesByState: Record<string, VoterRegistrationRow | null>;
  isLoading: boolean;
  error: string | null;
};

export type VoterRegistrationActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  fetchRegistrationForState: (stateCode: string) => Promise<VoterRegistrationRow | null>;
  clearResources: () => void;
};

export type VoterRegistrationStore = VoterRegistrationState & VoterRegistrationActions;

export type VoterRegistrationStoreCreator = StateCreator<
  VoterRegistrationStore,
  [['zustand/immer', never]],
  [],
  VoterRegistrationStore
>;

export const createInitialVoterRegistrationState = (): VoterRegistrationState => ({
  resourcesByState: {},
  isLoading: false,
  error: null,
});

const normalizeStateCode = (stateCode: string | null | undefined): string => {
  return stateCode?.trim().toUpperCase() ?? '';
};

export const createVoterRegistrationActions = (
  set: Parameters<VoterRegistrationStoreCreator>[0],
  get: Parameters<VoterRegistrationStoreCreator>[1],
): VoterRegistrationActions => {
  const setState = set as unknown as (recipe: (draft: VoterRegistrationState) => void) => void;
  const { setLoading, setError, clearError } = createBaseStoreActions<VoterRegistrationState>(setState);

  const fetchRegistrationForState = async (stateCode: string): Promise<VoterRegistrationRow | null> => {
    const normalized = normalizeStateCode(stateCode);
    if (!normalized) {
      setError('State code is required to fetch voter registration resources.');
      return null;
    }

    const current = get();
    if (Object.prototype.hasOwnProperty.call(current.resourcesByState, normalized)) {
      return current.resourcesByState[normalized] ?? null;
    }

    setLoading(true);
    clearError();

    try {
      const params = new URLSearchParams({ state: normalized });
      const response = await fetch(`/api/v1/civics/voter-registration?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch voter registration resources');
      }

      const payload = (await response.json()) as {
        data?: VoterRegistrationRow | null;
      };

      const resource = payload.data ?? null;

      setState((draft) => {
        draft.resourcesByState[normalized] = resource;
      });

      return resource;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch voter registration resources';
      setError(message);
      setState((draft) => {
        draft.resourcesByState[normalized] = null;
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResources = () => {
    setState((draft) => {
      draft.resourcesByState = {};
      draft.error = null;
    });
  };

  return {
    setLoading,
    setError,
    clearError,
    fetchRegistrationForState,
    clearResources,
  };
};

export const voterRegistrationStoreCreator: VoterRegistrationStoreCreator = (set, get) =>
  Object.assign(createInitialVoterRegistrationState(), createVoterRegistrationActions(set, get));

export const useVoterRegistrationStore = create<VoterRegistrationStore>()(
  devtools(
    persist(
      immer(voterRegistrationStoreCreator),
      {
        name: 'voter-registration-store',
        storage: createSafeStorage(),
        partialize: () => ({}),
      },
    ),
    { name: 'voter-registration-store' },
  ),
);

export const useVoterRegistration = (stateCode: string): VoterRegistrationRow | null => {
  const key = normalizeStateCode(stateCode);
  return useVoterRegistrationStore((state) =>
    key ? state.resourcesByState[key] ?? null : null,
  );
};

export const useVoterRegistrationLoading = () =>
  useVoterRegistrationStore((state) => state.isLoading);

export const useVoterRegistrationError = () =>
  useVoterRegistrationStore((state) => state.error);

export const useFetchVoterRegistrationForState = () =>
  useVoterRegistrationStore((state) => state.fetchRegistrationForState);

