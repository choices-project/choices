/**
 * Representative Store - Zustand Implementation
 *
 * Centralised state management for representative discovery, detail caching,
 * and user follow interactions.
 *
 * Created: October 28, 2025
 * Status: 🟡 MODERNISING
 */

import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { representativeService } from '@/lib/services/representative-service';
import logger from '@/lib/utils/logger';
import type {
  Representative,
  RepresentativeLocationQuery,
  RepresentativeSearchQuery,
  RepresentativeListResponse,
  RepresentativeSubscription,
  UserRepresentative
} from '@/types/representative';
import { REPRESENTATIVE_CONSTANTS } from '@/types/representative';

import { getRepresentativeDivisionIds } from '@/features/civics/utils/divisions';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';
import type { BaseStore } from './types';

const DETAIL_CACHE_TTL = REPRESENTATIVE_CONSTANTS.CACHE_DURATION;

const extractDivisionIds = (representative: Representative): string[] => {
  return (
    representative.ocdDivisionIds ??
    representative.division_ids ??
    getRepresentativeDivisionIds(representative)
  );
};

export type RepresentativeFollowRecord = {
  id: string;
  user_id?: string;
  notify_on_votes: boolean;
  notify_on_committee_activity: boolean;
  notify_on_public_statements: boolean;
  notify_on_events: boolean;
  notes?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
};

export type UserRepresentativeEntry = {
  follow: RepresentativeFollowRecord;
  representative: Representative;
};

export type RepresentativeState = {
  representatives: Representative[];
  currentRepresentativeId: number | null;
  currentRepresentative: Representative | null;

  searchResults: RepresentativeListResponse | null;
  searchQuery: RepresentativeSearchQuery | null;
  lastSearchAt: number | null;

  locationRepresentatives: Representative[];
  representativeDivisions: Record<number, string[]>;
  userDivisionIds: string[];

  followedRepresentatives: number[];
  userRepresentatives: UserRepresentative[];
  userRepresentativeEntries: UserRepresentativeEntry[];
  userRepresentativesTotal: number;
  userRepresentativesHasMore: boolean;
  subscriptions: RepresentativeSubscription[];

  detailCache: Record<number, Representative>;
  detailCacheTimestamps: Record<number, number>;

  isLoading: boolean;
  searchLoading: boolean;
  detailLoading: boolean;
  followMutationLoading: boolean;
  error: string | null;
};

export type RepresentativeActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  setSearchLoading: (loading: boolean) => void;
  setDetailLoading: (loading: boolean) => void;
  setFollowMutationLoading: (loading: boolean) => void;
  setUserDivisionIds: (divisions: string[]) => void;

  searchRepresentatives: (query: RepresentativeSearchQuery) => Promise<RepresentativeListResponse | null>;
  findByLocation: (query: RepresentativeLocationQuery) => Promise<RepresentativeListResponse | null>;
  getRepresentativeById: (
    id: number,
    options?: { forceRefresh?: boolean }
  ) => Promise<Representative | null>;

  followRepresentative: (representativeId: number) => Promise<boolean>;
  unfollowRepresentative: (representativeId: number) => Promise<boolean>;
  getUserRepresentatives: () => Promise<UserRepresentativeEntry[]>;
  checkFollowStatus: (representativeId: number) => Promise<boolean>;

  invalidateRepresentativeDetail: (representativeId: number) => void;
  invalidateAllRepresentativeDetails: () => void;
  resetRepresentativeState: () => void;
  clearSearch: () => void;
  // Fast-track claim via official email
  claimAsOfficialViaEmail: () => Promise<boolean>;
};

export type RepresentativeStore = RepresentativeState & RepresentativeActions;

type RepresentativeStoreCreator = StateCreator<
  RepresentativeStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

export const createInitialRepresentativeState = (): RepresentativeState => ({
  representatives: [],
  currentRepresentativeId: null,
  currentRepresentative: null,

  searchResults: null,
  searchQuery: null,
  lastSearchAt: null,

  locationRepresentatives: [],
  representativeDivisions: {},
  userDivisionIds: [],

  followedRepresentatives: [],
  userRepresentatives: [],
  userRepresentativeEntries: [],
  userRepresentativesTotal: 0,
  userRepresentativesHasMore: false,
  subscriptions: [],

  detailCache: {},
  detailCacheTimestamps: {},

  isLoading: false,
  searchLoading: false,
  detailLoading: false,
  followMutationLoading: false,
  error: null
});

const isCacheValid = (timestamp?: number | null) => {
  if (!timestamp) return false;
  return Date.now() - timestamp < DETAIL_CACHE_TTL;
};

export const createRepresentativeActions = (
  set: Parameters<RepresentativeStoreCreator>[0],
  get: Parameters<RepresentativeStoreCreator>[1]
): RepresentativeActions => {
  const setState = set as unknown as (recipe: (draft: RepresentativeState) => void) => void;
  const { setLoading, setError, clearError } = createBaseStoreActions<RepresentativeState>(setState);

  const setSearchLoading = (loading: boolean) =>
    setState((state) => {
      state.searchLoading = loading;
    });

  const setDetailLoading = (loading: boolean) =>
    setState((state) => {
      state.detailLoading = loading;
    });

  const setFollowMutationLoading = (loading: boolean) =>
    setState((state) => {
      state.followMutationLoading = loading;
    });

  const updateDetailCache = (representative: Representative | null) => {
    if (!representative) return;

    setState((state) => {
      state.detailCache[representative.id] = representative;
      state.detailCacheTimestamps[representative.id] = Date.now();
      state.currentRepresentative = representative;
      state.currentRepresentativeId = representative.id;
    });
  };

  return {
    setLoading,
    setError,
    clearError,
    setSearchLoading,
    setDetailLoading,
    setFollowMutationLoading,

    searchRepresentatives: async (query) => {
      logger.info('RepresentativeStore.searchRepresentatives', query);
      setSearchLoading(true);
      setLoading(true);
      clearError();

      try {
        const result = await representativeService.getRepresentatives(query);

        if (result.success && result.data) {
          setState((state) => {
            state.searchResults = result;
            state.representatives = result.data.representatives;
            state.searchQuery = query;
            state.lastSearchAt = Date.now();
            result.data.representatives.forEach((representative) => {
              const divisions = getRepresentativeDivisionIds(representative);
              state.representativeDivisions[representative.id] = divisions;
              representative.ocdDivisionIds = divisions;
              representative.division_ids = divisions;
            });
          });
          return result;
        }

        const errorMessage = result.error ?? 'Failed to fetch representatives';
        setError(errorMessage);
        return null;
      } catch (error) {
        logger.error('RepresentativeStore.searchRepresentatives error', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch representatives');
        return null;
      } finally {
        setSearchLoading(false);
        setLoading(false);
      }
    },

    findByLocation: async (query) => {
      logger.info('RepresentativeStore.findByLocation', query);
      setLoading(true);
      clearError();

      try {
        const result = await representativeService.findByLocation(query);

        if (result.success && result.data) {
          const divisionSet = new Set<string>();

          setState((state) => {
            state.locationRepresentatives = result.data.representatives;
            result.data.representatives.forEach((representative) => {
              const divisions = getRepresentativeDivisionIds(representative);
              representative.ocdDivisionIds = divisions;
              representative.division_ids = divisions;
              state.representativeDivisions[representative.id] = divisions;
              divisions.forEach((division) => divisionSet.add(division));
            });
            if (divisionSet.size > 0) {
              state.userDivisionIds = Array.from(divisionSet);
            }
          });
          return result;
        }

        const errorMessage = result.error ?? 'Failed to find representatives by location';
        setError(errorMessage);
        return null;
      } catch (error) {
        logger.error('RepresentativeStore.findByLocation error', error);
        setError(error instanceof Error ? error.message : 'Failed to find representatives by location');
        return null;
      } finally {
        setLoading(false);
      }
    },

    getRepresentativeById: async (id, options) => {
      const { forceRefresh = false } = options ?? {};
      const state = get();

      if (!forceRefresh && isCacheValid(state.detailCacheTimestamps[id])) {
        const cached = state.detailCache[id] ?? null;
        if (cached) {
          setState((draft) => {
            draft.currentRepresentativeId = cached.id;
            draft.currentRepresentative = cached;
          });
          return cached;
        }
      }

      setDetailLoading(true);
      setLoading(true);
      clearError();

      try {
        const response = await representativeService.getRepresentativeById(id);

        if (response.success && response.data) {
          const representative = response.data as Representative;
          updateDetailCache(representative);
          setState((state) => {
            const divisions = getRepresentativeDivisionIds(representative) ?? [];
            representative.ocdDivisionIds = divisions;
            representative.division_ids = divisions;
            state.representativeDivisions[representative.id] = Array.isArray(divisions) ? divisions : [];
          });
          return representative;
        }

        const message = response.error ?? 'Representative not found';
        setError(message);
        return null;
      } catch (error) {
        logger.error('RepresentativeStore.getRepresentativeById error', error);
        setError(error instanceof Error ? error.message : 'Failed to load representative');
        return null;
      } finally {
        setDetailLoading(false);
        setLoading(false);
      }
    },

    followRepresentative: async (representativeId) => {
      setFollowMutationLoading(true);
      clearError();

      try {
        const response = await fetch(`/api/representatives/${representativeId}/follow`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to follow representative');
        }

        setState((state) => {
          if (!state.followedRepresentatives.includes(representativeId)) {
            state.followedRepresentatives.push(representativeId);
          }
        });

        return true;
      } catch (error) {
        logger.error('RepresentativeStore.followRepresentative error', error);
        setError(error instanceof Error ? error.message : 'Failed to follow representative');
        return false;
      } finally {
        setFollowMutationLoading(false);
      }
    },

    unfollowRepresentative: async (representativeId) => {
      setFollowMutationLoading(true);
      clearError();

      try {
        const response = await fetch(`/api/representatives/${representativeId}/follow`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to unfollow representative');
        }

        setState((state) => {
          state.followedRepresentatives = state.followedRepresentatives.filter(
            (idValue) => idValue !== representativeId
          );
        });

        return true;
      } catch (error) {
        logger.error('RepresentativeStore.unfollowRepresentative error', error);
        setError(error instanceof Error ? error.message : 'Failed to unfollow representative');
        return false;
      } finally {
        setFollowMutationLoading(false);
      }
    },

    getUserRepresentatives: async () => {
      setLoading(true);
      clearError();

      try {
        const response = await fetch('/api/representatives/my');

        if (!response.ok) {
          if (response.status === 401) {
            setState((state) => {
              state.userRepresentativeEntries = [];
              state.userRepresentatives = [];
              state.followedRepresentatives = [];
              state.userRepresentativesTotal = 0;
              state.userRepresentativesHasMore = false;
              state.error = 'Please sign in to view your followed representatives';
            });
            return [];
          }
          throw new Error('Failed to fetch user representatives');
        }

        const data = await response.json() as {
          success: boolean;
          data?: {
            representatives?: Array<{
              follow: RepresentativeFollowRecord;
              representative: Representative;
            }>;
            total?: number;
            hasMore?: boolean;
          };
        };

        if (!data.success || !data.data?.representatives) {
          setState((state) => {
            state.userRepresentatives = [];
            state.userRepresentativeEntries = [];
            state.followedRepresentatives = [];
            state.userRepresentativesTotal = 0;
            state.userRepresentativesHasMore = false;
          });
          return [];
        }

        const entries = data.data.representatives.map<UserRepresentativeEntry>((item) => ({
          follow: item.follow,
          representative: item.representative
        }));

        const normalised = entries.map<UserRepresentative>((entry) => ({
          id: entry.follow.id,
          user_id: entry.follow.user_id ?? '',
          representative_id: entry.representative.id,
          relationship_type: 'following',
          created_at: entry.follow.created_at,
          updated_at: entry.follow.updated_at
        }));

        setState((state) => {
          state.userRepresentativeEntries = entries;
          state.userRepresentatives = normalised;
          state.followedRepresentatives = normalised.map((item) => item.representative_id);
          state.userRepresentativesTotal = data.data?.total ?? normalised.length;
          state.userRepresentativesHasMore = data.data?.hasMore ?? false;
        });

        return entries;
      } catch (error) {
        logger.error('RepresentativeStore.getUserRepresentatives error', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch user representatives');
        setState((state) => {
          state.userRepresentativeEntries = [];
          state.userRepresentatives = [];
          state.followedRepresentatives = [];
          state.userRepresentativesTotal = 0;
          state.userRepresentativesHasMore = false;
        });
        return [];
      } finally {
        setLoading(false);
      }
    },

    checkFollowStatus: async (representativeId) => {
      try {
        const response = await fetch(`/api/representatives/${representativeId}/follow`);

        if (!response.ok) {
          return false;
        }

        const data = await response.json() as { following?: boolean };
        return Boolean(data.following);
      } catch (error) {
        logger.error('RepresentativeStore.checkFollowStatus error', error);
        return false;
      }
    },

    invalidateRepresentativeDetail: (representativeId) => {
      setState((state) => {
        delete state.detailCache[representativeId];
        delete state.detailCacheTimestamps[representativeId];

        if (state.currentRepresentativeId === representativeId) {
          state.currentRepresentativeId = null;
          state.currentRepresentative = null;
        }
      });
    },

    invalidateAllRepresentativeDetails: () => {
      setState((state) => {
        state.detailCache = {};
        state.detailCacheTimestamps = {};
        state.currentRepresentativeId = null;
        state.currentRepresentative = null;
      });
    },

    resetRepresentativeState: () => {
      setState(() => createInitialRepresentativeState());
    },

    clearSearch: () => {
      setState((state) => {
        state.searchResults = null;
        state.searchQuery = null;
        state.representatives = [];
        state.lastSearchAt = null;
        state.userDivisionIds = [];
      });
      clearError();
    },

    setUserDivisionIds: (divisions: string[]) => {
      setState((state) => {
        state.userDivisionIds = divisions;
      });
    },

    claimAsOfficialViaEmail: async () => {
      setLoading(true);
      clearError();
      try {
        const response = await fetch('/api/candidates/verify/official-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false || data?.data?.ok !== true) {
          setError(data?.error ?? 'Verification failed');
          return false;
        }
        return true;
      } catch (error) {
        logger.error('RepresentativeStore.claimAsOfficialViaEmail error', error);
        setError(error instanceof Error ? error.message : 'Verification failed');
        return false;
      } finally {
        setLoading(false);
      }
    }
  };
};

export const representativeStoreCreator: RepresentativeStoreCreator = (set, get) =>
  Object.assign(createInitialRepresentativeState(), createRepresentativeActions(set, get));

export const useRepresentativeStore = create<RepresentativeStore>()(
  devtools(
    persist(
      immer(representativeStoreCreator),
      {
        name: 'representative-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          followedRepresentatives: state.followedRepresentatives,
          userRepresentatives: state.userRepresentatives,
          subscriptions: state.subscriptions
        })
      }
    ),
    { name: 'representative-store' }
  )
);

export const representativeStore = useRepresentativeStore;

export const representativeSelectors = {
  representatives: (state: RepresentativeStore) => state.representatives,
  searchResults: (state: RepresentativeStore) => state.searchResults,
  searchQuery: (state: RepresentativeStore) => state.searchQuery,
  locationRepresentatives: (state: RepresentativeStore) => state.locationRepresentatives,
  userRepresentativeEntries: (state: RepresentativeStore) => state.userRepresentativeEntries,
  userRepresentativesTotal: (state: RepresentativeStore) => state.userRepresentativesTotal,
  userRepresentativesHasMore: (state: RepresentativeStore) => state.userRepresentativesHasMore,
  representativeDivisions: (state: RepresentativeStore) => state.representativeDivisions,
  userDivisionIds: (state: RepresentativeStore) => state.userDivisionIds,

  isLoading: (state: RepresentativeStore) => state.isLoading,
  searchLoading: (state: RepresentativeStore) => state.searchLoading,
  detailLoading: (state: RepresentativeStore) => state.detailLoading,
  followMutationLoading: (state: RepresentativeStore) => state.followMutationLoading,
  error: (state: RepresentativeStore) => state.error,

  currentRepresentative: (state: RepresentativeStore) => state.currentRepresentative,
  currentRepresentativeId: (state: RepresentativeStore) => state.currentRepresentativeId,
  followedRepresentatives: (state: RepresentativeStore) => state.followedRepresentatives,
  isRepresentativeFollowed:
    (representativeId: number) =>
      (state: RepresentativeStore) => state.followedRepresentatives.includes(representativeId),

  representativeFromCache:
    (representativeId: number) =>
      (state: RepresentativeStore) => state.detailCache[representativeId] ?? null
} as const;

// Action hooks
export const useSearchRepresentatives = () =>
  useRepresentativeStore((state) => state.searchRepresentatives);
export const useFindByLocation = () => useRepresentativeStore((state) => state.findByLocation);
export const useGetRepresentativeById = () =>
  useRepresentativeStore((state) => state.getRepresentativeById);
export const useFollowRepresentative = () =>
  useRepresentativeStore((state) => state.followRepresentative);
export const useUnfollowRepresentative = () =>
  useRepresentativeStore((state) => state.unfollowRepresentative);
export const useGetUserRepresentatives = () =>
  useRepresentativeStore((state) => state.getUserRepresentatives);
export const useClearSearch = () => useRepresentativeStore((state) => state.clearSearch);
export const useClearError = () => useRepresentativeStore((state) => state.clearError);
export const useInvalidateRepresentativeDetail = () =>
  useRepresentativeStore((state) => state.invalidateRepresentativeDetail);
export const useResetRepresentativeState = () =>
  useRepresentativeStore((state) => state.resetRepresentativeState);

// Selector hooks
export const useRepresentativeSearchResults = () =>
  useRepresentativeStore(representativeSelectors.searchResults);
export const useRepresentativeLoading = () =>
  useRepresentativeStore(representativeSelectors.searchLoading);
export const useRepresentativeError = () =>
  useRepresentativeStore(representativeSelectors.error);
export const useRepresentatives = () =>
  useRepresentativeStore(representativeSelectors.representatives);
export const useCurrentRepresentative = () =>
  useRepresentativeStore(representativeSelectors.currentRepresentative);
export const useFollowedRepresentatives = () =>
  useRepresentativeStore(representativeSelectors.followedRepresentatives);
export const useLocationRepresentatives = () =>
  useRepresentativeStore(representativeSelectors.locationRepresentatives);
export const useRepresentativeGlobalLoading = () =>
  useRepresentativeStore(representativeSelectors.isLoading);
export const useRepresentativeDetailLoading = () =>
  useRepresentativeStore(representativeSelectors.detailLoading);
export const useRepresentativeFollowLoading = () =>
  useRepresentativeStore(representativeSelectors.followMutationLoading);
export const useUserRepresentativeEntries = () =>
  useRepresentativeStore(representativeSelectors.userRepresentativeEntries);
export const useUserRepresentativeMeta = () =>
  useRepresentativeStore((state) => ({
    total: representativeSelectors.userRepresentativesTotal(state),
    hasMore: representativeSelectors.userRepresentativesHasMore(state)
  }));
export const useRepresentativeById = (representativeId: number | null) =>
  useRepresentativeStore((state) => {
    if (representativeId == null) {
      return null;
    }

    if (state.currentRepresentativeId === representativeId) {
      return state.currentRepresentative;
    }

    return state.detailCache[representativeId] ?? null;
  });
export const useRepresentativeFilters = () =>
  useRepresentativeStore((state) => ({
    query: state.searchQuery,
    lastSearchAt: state.lastSearchAt
  }));
export const useRepresentativeDivisions = (representativeId: number | null) =>
  useRepresentativeStore((state) => {
    if (representativeId == null) {
      return [];
    }
    return state.representativeDivisions[representativeId] ?? [];
  });
export const useUserDivisionIds = () =>
  useRepresentativeStore(representativeSelectors.userDivisionIds);
export const useSetUserDivisionIds = () =>
  useRepresentativeStore((state) => state.setUserDivisionIds);
