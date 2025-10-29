/**
 * Representative Store - Zustand Implementation
 * 
 * State management for representative data, search, and user interactions
 * Integrates with the representative service and provides reactive state
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// Removed React hooks - they should not be used in Zustand stores

import type {
  Representative,
  RepresentativeSearchQuery,
  RepresentativeSearchResult,
  RepresentativeLocationQuery,
  RepresentativeListResponse,
  UserRepresentative,
  RepresentativeSubscription
} from '@/types/representative';

import { representativeService } from '@/lib/services/representative-service';

// ============================================================================
// STORE STATE INTERFACE
// ============================================================================

interface RepresentativeStore {
  // Core representative data
  representatives: Representative[];
  currentRepresentative: Representative | null;
  
  // Search and discovery
  searchResults: RepresentativeListResponse | null;
  searchQuery: RepresentativeSearchQuery | null;
  locationRepresentatives: Representative[];
  
  // User interactions
  followedRepresentatives: number[];
  userRepresentatives: UserRepresentative[];
  subscriptions: RepresentativeSubscription[];
  
  // UI state
  loading: boolean;
  error: string | null;
  searchLoading: boolean;
  
  // Actions
  searchRepresentatives: (query: RepresentativeSearchQuery) => Promise<void>;
  findByLocation: (query: RepresentativeLocationQuery) => Promise<void>;
  getRepresentativeById: (id: number) => Promise<void>;
  followRepresentative: (representativeId: number) => Promise<void>;
  unfollowRepresentative: (representativeId: number) => Promise<void>;
  getUserRepresentatives: () => Promise<void>;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
  clearError: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

const useRepresentativeStore = create<RepresentativeStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        representatives: [],
        currentRepresentative: null,
        searchResults: null,
        searchQuery: null,
        locationRepresentatives: [],
        followedRepresentatives: [],
        userRepresentatives: [],
        subscriptions: [],
        loading: false,
        error: null,
        searchLoading: false,

        // ====================================================================
        // SEARCH ACTIONS
        // ====================================================================

        searchRepresentatives: async (query: RepresentativeSearchQuery) => {
          console.log('🔍 Store: searchRepresentatives called with query:', query);
          
          set(state => {
            state.searchLoading = true;
            state.error = null;
            state.searchQuery = query;
          });

          try {
            console.log('🔍 Store: Calling representativeService.getRepresentatives with query:', query);
            const results = await representativeService.getRepresentatives(query);
            console.log('📊 Store: Got results from service:', results);
            
            if (results.success) {
              set(state => {
                state.searchResults = results;
                state.searchLoading = false;
              });
              console.log('✅ Store: Updated state with results:', results);
            } else {
              set(state => {
                state.error = results.error || 'Search failed';
                state.searchLoading = false;
              });
              console.log('❌ Store: Search failed:', results.error);
            }
          } catch (error) {
            console.error('❌ Store: Search error:', error);
            set(state => {
              state.error = error instanceof Error ? error.message : 'Search failed';
              state.searchLoading = false;
            });
          }
        },

        findByLocation: async (query: RepresentativeLocationQuery) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });

          try {
            const response = await representativeService.findByLocation(query);
            
            if (response.success && response.data) {
              set(state => {
                state.locationRepresentatives = response.data.representatives;
                state.loading = false;
              });
            } else {
              set(state => {
                state.error = response.error || 'Location search failed';
                state.loading = false;
              });
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Location search failed';
              state.loading = false;
            });
          }
        },

        getRepresentativeById: async (id: number) => {
          set(state => {
            state.loading = true;
            state.error = null;
          });

          try {
            const response = await representativeService.getRepresentativeById(id);
            
            if (response.success && response.data) {
              set(state => {
                state.currentRepresentative = response.data as Representative || null;
                state.loading = false;
              });
            } else {
              set(state => {
                state.error = response.error || 'Representative not found';
                state.loading = false;
              });
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to load representative';
              state.loading = false;
            });
          }
        },

        // ====================================================================
        // USER INTERACTION ACTIONS
        // ====================================================================

        followRepresentative: async (representativeId: number) => {
          // Get current user ID (you'll need to implement this)
          const userId = 'current-user-id'; // TODO: Get from auth store
          
          try {
            const success = await representativeService.followRepresentative(userId, representativeId);
            
            if (success) {
              set(state => {
                if (!state.followedRepresentatives.includes(representativeId)) {
                  state.followedRepresentatives.push(representativeId);
                }
              });
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to follow representative';
            });
          }
        },

        unfollowRepresentative: async (representativeId: number) => {
          const userId = 'current-user-id'; // TODO: Get from auth store
          
          try {
            const success = await representativeService.unfollowRepresentative(userId, representativeId);
            
            if (success) {
              set(state => {
                state.followedRepresentatives = state.followedRepresentatives.filter(
                  id => id !== representativeId
                );
              });
            }
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to unfollow representative';
            });
          }
        },

        getUserRepresentatives: async () => {
          const userId = 'current-user-id'; // TODO: Get from auth store
          
          set(state => {
            state.loading = true;
            state.error = null;
          });

          try {
            const representatives = await representativeService.getUserRepresentatives(userId);
            
            set(state => {
              state.userRepresentatives = representatives.map(rep => ({
                id: `${userId}-${rep.id}`,
                user_id: userId,
                representative_id: rep.id,
                relationship_type: 'following' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              state.loading = false;
            });
          } catch (error) {
            set(state => {
              state.error = error instanceof Error ? error.message : 'Failed to load user representatives';
              state.loading = false;
            });
          }
        },

        // ====================================================================
        // UI ACTIONS
        // ====================================================================

        setLoading: (loading: boolean) => {
          set(state => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set(state => {
            state.error = error;
          });
        },

        clearSearch: () => {
          set(state => {
            state.searchResults = null;
            state.searchQuery = null;
            state.error = null;
          });
        },

        clearError: () => {
          set(state => {
            state.error = null;
          });
        },
      })),
      {
        name: 'representative-store',
        partialize: (state) => ({
          followedRepresentatives: state.followedRepresentatives,
          userRepresentatives: state.userRepresentatives,
          subscriptions: state.subscriptions,
        }),
      }
    ),
    {
      name: 'representative-store',
    }
  )
);

// ============================================================================
// SELECTOR HOOKS (for better performance) - REMOVED TO AVOID CONFLICTS
// ============================================================================

// ============================================================================
// ACTION HOOKS (with proper memoization)
// ============================================================================

// ============================================================================
// ACTION HOOKS (individual hooks to avoid infinite loops)
// ============================================================================

export const useSearchRepresentatives = () => useRepresentativeStore(state => state.searchRepresentatives);
export const useFindByLocation = () => useRepresentativeStore(state => state.findByLocation);
export const useGetRepresentativeById = () => useRepresentativeStore(state => state.getRepresentativeById);
export const useFollowRepresentative = () => useRepresentativeStore(state => state.followRepresentative);
export const useUnfollowRepresentative = () => useRepresentativeStore(state => state.unfollowRepresentative);
export const useGetUserRepresentatives = () => useRepresentativeStore(state => state.getUserRepresentatives);
export const useClearSearch = () => useRepresentativeStore(state => state.clearSearch);
export const useClearError = () => useRepresentativeStore(state => state.clearError);

// Export the store instance for direct access
export const representativeStore = useRepresentativeStore;

// Proper Zustand selectors (no React hooks in store file)
export const useRepresentativeSearchResults = () => useRepresentativeStore((state) => state.searchResults);
export const useRepresentativeLoading = () => useRepresentativeStore((state) => state.searchLoading);
export const useRepresentativeError = () => useRepresentativeStore((state) => state.error);
export const useRepresentatives = () => useRepresentativeStore((state) => state.representatives);
export const useCurrentRepresentative = () => useRepresentativeStore((state) => state.currentRepresentative);
export const useFollowedRepresentatives = () => useRepresentativeStore((state) => state.followedRepresentatives);
