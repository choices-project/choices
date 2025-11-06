/**
 * @fileoverview Polls Store - Perfect Architecture
 * 
 * Industry best-practice poll state management using database types directly.
 * 
 * **Architecture**:
 * - Database types flow through entire app (zero transformation)
 * - Computed fields via selectors (no duplication)
 * - Separates DB state from UI state
 * - Type-safe from database to UI
 * 
 * **Pattern**:
 * Database → PollRow → Store → Components → UI
 * 
 * @author Choices Platform Team
 * @created 2025-11-05
 * @version 3.0.0 - Perfect Architecture
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  PollRow, 
  PollInsert, 
  PollUpdate,
  PollOptionRow 
} from '@/features/polls/types';

import { logger } from '@/lib/utils/logger';

// ============================================================================
// STORE STATE TYPES
// ============================================================================

/**
 * Poll filters for UI
 */
type PollFilters = {
  status: string[];
  category: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  votingStatus: 'all' | 'voted' | 'not_voted';
}

/**
 * Poll preferences for UI
 */
type PollPreferences = {
  defaultView: 'list' | 'grid' | 'card';
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'closing_soon';
  itemsPerPage: number;
  showResults: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

/**
 * Search state for polls
 */
type PollSearch = {
  query: string;
  results: PollRow[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  suggestions: string[];
  recentSearches: string[];
}

/**
 * UI state separate from database state
 * This is temporary UI state that doesn't persist to DB
 */
type PollUIState = {
  selectedPollId: string | null;
  expandedPollIds: Set<string>;
  votingInProgress: Set<string>;
}

/**
 * Polls Store State
 * 
 * **Design Philosophy**:
 * - `polls`: Array of PollRow - pure database data
 * - `pollOptions`: Map of poll options by poll ID
 * - `uiState`: Temporary UI state (selection, expansion, etc.)
 * - `filters`, `preferences`: UI configuration
 * - Computed fields via selectors, not stored in state
 */
type PollsStore = {
  // ========== DATABASE STATE ==========
  // Pure database data - matches schema exactly
  polls: PollRow[];
  pollOptions: Map<string, PollOptionRow[]>;
  
  // ========== UI STATE ==========
  uiState: PollUIState;
  filters: PollFilters;
  preferences: PollPreferences;
  search: PollSearch;
  
  // ========== LOADING STATES ==========
  isLoading: boolean;
  isSearching: boolean;
  isVoting: boolean;
  error: string | null;
  
  setVoting: (voting: boolean) => void;
  setSearching: (searching: boolean) => void;
  
  // ========== POLL CRUD ACTIONS ==========
  setPolls: (polls: PollRow[]) => void;
  addPoll: (poll: PollRow) => void;
  updatePoll: (id: string, updates: PollUpdate) => void;
  removePoll: (id: string) => void;
  
  // ========== POLL STATUS ACTIONS ==========
  publishPoll: (id: string) => void;
  closePoll: (id: string) => void;
  archivePoll: (id: string) => void;
  
  // ========== VOTING ACTIONS ==========
  voteOnPoll: (pollId: string, optionId: string) => Promise<void>;
  undoVote: (pollId: string) => Promise<void>;
  
  // ========== FILTERING & SEARCH ==========
  setFilters: (filters: Partial<PollFilters>) => void;
  clearFilters: () => void;
  searchPolls: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // ========== UI STATE ACTIONS ==========
  selectPoll: (pollId: string | null) => void;
  togglePollExpanded: (pollId: string) => void;
  setView: (view: 'list' | 'grid' | 'card') => void;
  
  // ========== PREFERENCES ==========
  updatePreferences: (preferences: Partial<PollPreferences>) => void;
  resetPreferences: () => void;
  
  // ========== DATA LOADING ==========
  loadPolls: (category?: string) => Promise<void>;
  loadPoll: (id: string) => Promise<void>;
  createPoll: (data: PollInsert) => Promise<void>;
  
  // ========== LOADING STATES ==========
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // ========== SELECTORS (Computed fields) ==========
  // These return computed data, not stored data
  getPollById: (id: string) => PollRow | undefined;
  getFilteredPolls: () => PollRow[];
  canUserVote: (pollId: string) => boolean;
  hasUserVoted: (pollId: string) => boolean;
  getActivePollsCount: () => number;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const defaultPreferences: PollPreferences = {
  defaultView: 'list',
  sortBy: 'newest',
  itemsPerPage: 20,
  showResults: true,
  autoRefresh: true,
  refreshInterval: 5,
};

const defaultFilters: PollFilters = {
  status: ['active'],
  category: [],
  tags: [],
  dateRange: {
    start: '',
    end: '',
  },
  votingStatus: 'all',
};

const defaultUIState: PollUIState = {
  selectedPollId: null,
  expandedPollIds: new Set(),
  votingInProgress: new Set(),
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePollsStore = create<PollsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        polls: [],
        pollOptions: new Map(),
        uiState: defaultUIState,
        filters: defaultFilters,
        preferences: defaultPreferences,
        search: {
          query: '',
          results: [],
          totalResults: 0,
          currentPage: 1,
          totalPages: 1,
          suggestions: [],
          recentSearches: [],
        },
        isLoading: false,
        isSearching: false,
        isVoting: false,
        error: null,
        
        // ========== POLL CRUD ACTIONS ==========
        
        setPolls: (polls) => set({ polls }),
        
        addPoll: (poll) => set((state) => ({
          polls: [poll, ...state.polls],
        })),
        
        updatePoll: (id, updates) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id ? { ...poll, ...updates } : poll
          ),
        })),
        
        removePoll: (id) => set((state) => ({
          polls: state.polls.filter(poll => poll.id !== id),
        })),
        
        // ========== POLL STATUS ACTIONS ==========
        
        publishPoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? { 
                  ...poll,
                  status: 'active',
                  updated_at: new Date().toISOString()
                }
              : poll
          ),
        })),
        
        closePoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? { 
                  ...poll,
                  status: 'closed',
                  closed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              : poll
          ),
        })),
        
        archivePoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? { 
                  ...poll,
                  status: 'archived',
                  updated_at: new Date().toISOString()
                }
              : poll
          ),
        })),
        
        // ========== VOTING ACTIONS ==========
        
        voteOnPoll: async (pollId, optionId) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch('/api/polls/vote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pollId, optionId }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to vote on poll');
            }
            
            // Update poll - increment total_votes
            set((state) => ({
              polls: state.polls.map(poll =>
                poll.id === pollId 
                  ? {
                      ...poll,
                      total_votes: (poll.total_votes || 0) + 1,
                      updated_at: new Date().toISOString()
                    }
                  : poll
              ),
              uiState: {
                ...state.uiState,
                votingInProgress: new Set(
                  [...state.uiState.votingInProgress].filter(id => id !== pollId)
                ),
              },
            }));
            
            logger.info('Vote cast successfully', { pollId, optionId });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to vote on poll:', error);
          } finally {
            setVoting(false);
          }
        },
        
        undoVote: async (pollId) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch('/api/polls/undo-vote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pollId }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to undo vote');
            }
            
            // Update poll - decrement total_votes
            set((state) => ({
              polls: state.polls.map(poll =>
                poll.id === pollId 
                  ? {
                      ...poll,
                      total_votes: Math.max(0, (poll.total_votes || 0) - 1),
                      updated_at: new Date().toISOString()
                    }
                  : poll
              ),
            }));
            
            logger.info('Vote undone successfully', { pollId });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to undo vote:', error);
          } finally {
            setVoting(false);
          }
        },
        
        // ========== FILTERING & SEARCH ==========
        
        setFilters: (filters) => set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
        
        clearFilters: () => set({ filters: defaultFilters }),
        
        searchPolls: async (query) => {
          const { setSearching, setError } = get();
          
          try {
            setSearching(true);
            setError(null);
            
            const response = await fetch('/api/polls/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to search polls');
            }
            
            const { polls, total } = await response.json();
            
            set((state) => ({
              search: {
                ...state.search,
                query,
                results: polls,
                totalResults: total,
                currentPage: 1,
                totalPages: Math.ceil(total / state.preferences.itemsPerPage),
              },
            }));
            
            logger.info('Polls searched', { query, results: polls.length, total });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to search polls:', error);
          } finally {
            setSearching(false);
          }
        },
        
        clearSearch: () => set((state) => ({
          search: {
            ...state.search,
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
          },
        })),
        
        // ========== UI STATE ACTIONS ==========
        
        selectPoll: (pollId) => set((state) => ({
          uiState: { ...state.uiState, selectedPollId: pollId },
        })),
        
        togglePollExpanded: (pollId) => set((state) => {
          const expanded = new Set(state.uiState.expandedPollIds);
          if (expanded.has(pollId)) {
            expanded.delete(pollId);
          } else {
            expanded.add(pollId);
          }
          return {
            uiState: { ...state.uiState, expandedPollIds: expanded },
          };
        }),
        
        setView: (view) => set((state) => ({
          preferences: { ...state.preferences, defaultView: view },
        })),
        
        // ========== PREFERENCES ==========
        
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // ========== DATA LOADING ==========
        
        loadPolls: async (category) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const url = category 
              ? `/api/polls?category=${encodeURIComponent(category)}`
              : '/api/polls';
            
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error('Failed to load polls');
            }
            
            const polls = await response.json();
            set({ polls });
            
            logger.info('Polls loaded', { category, count: polls.length });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load polls:', error);
          } finally {
            setLoading(false);
          }
        },
        
        loadPoll: async (id) => {
          const { setLoading, setError, selectPoll } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/polls/${id}`);
            
            if (!response.ok) {
              throw new Error('Failed to load poll');
            }
            
            const poll = await response.json();
            
            // Add or update poll in list
            set((state) => ({
              polls: state.polls.some(p => p.id === id)
                ? state.polls.map(p => p.id === id ? poll : p)
                : [poll, ...state.polls],
            }));
            
            selectPoll(id);
            
            logger.info('Poll loaded', { id });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load poll:', error);
          } finally {
            setLoading(false);
          }
        },
        
        createPoll: async (data) => {
          const { setLoading, setError, addPoll } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/polls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create poll');
            }
            
            const poll = await response.json();
            addPoll(poll);
            
            logger.info('Poll created successfully', { pollId: poll.id, title: poll.title });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to create poll:', error);
          } finally {
            setLoading(false);
          }
        },
        
        // ========== LOADING STATES ==========
        
        setLoading: (loading) => set({ isLoading: loading }),
        setVoting: (voting) => set({ isVoting: voting }),
        setSearching: (searching) => set({ isSearching: searching }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // ========== SELECTORS (Computed fields) ==========
        
        getPollById: (id) => {
          const state = get();
          return state.polls.find(poll => poll.id === id);
        },
        
        getFilteredPolls: () => {
          const state = get();
          return state.polls.filter(poll => {
            // Apply filters
            if (state.filters.status.length > 0 && poll.status && !state.filters.status.includes(poll.status)) {
              return false;
            }
            if (state.filters.category.length > 0 && poll.category && !state.filters.category.includes(poll.category)) {
              return false;
            }
            if (state.filters.tags.length > 0 && poll.tags) {
              const pollTags = Array.isArray(poll.tags) ? poll.tags : [];
              if (!state.filters.tags.some(tag => pollTags.includes(tag))) {
                return false;
              }
            }
            return true;
          });
        },
        
        canUserVote: (pollId) => {
          const state = get();
          const poll = state.polls.find(p => p.id === pollId);
          if (!poll) return false;
          
          // Check if poll is active and not closed
          return poll.status === 'active' && !poll.closed_at;
        },
        
        hasUserVoted: (pollId) => {
          const state = get();
          // This would need to check against user's votes from database
          // For now, return false - actual implementation would query votes table
          return false;
        },
        
        getActivePollsCount: () => {
          const state = get();
          return state.polls.filter(poll => poll.status === 'active').length;
        },
      }),
      {
        name: 'polls-store',
        partialize: (state) => ({
          polls: state.polls,
          preferences: state.preferences,
          filters: state.filters,
        }),
      }
    ),
    { name: 'polls-store' }
  )
);

// ============================================================================
// OPTIMIZED SELECTORS FOR COMPONENTS
// ============================================================================

// Simple selectors
export const usePolls = () => usePollsStore(state => state.polls);
export const usePollsLoading = () => usePollsStore(state => state.isLoading);
export const usePollsError = () => usePollsStore(state => state.error);
export const usePollPreferences = () => usePollsStore(state => state.preferences);
export const usePollFilters = () => usePollsStore(state => state.filters);

// Computed selectors
export const useFilteredPolls = () => usePollsStore(state => state.getFilteredPolls());
export const useActivePollsCount = () => usePollsStore(state => state.getActivePollsCount());
export const usePollById = (id: string) => usePollsStore(state => state.getPollById(id));
export const useSelectedPoll = () => {
  const selectedId = usePollsStore(state => state.uiState.selectedPollId);
  return usePollsStore(state => selectedId ? state.getPollById(selectedId) : null);
};

// Action selectors
export const usePollsActions = () => usePollsStore(state => ({
  loadPolls: state.loadPolls,
  loadPoll: state.loadPoll,
  createPoll: state.createPoll,
  updatePoll: state.updatePoll,
  removePoll: state.removePoll,
  publishPoll: state.publishPoll,
  closePoll: state.closePoll,
  archivePoll: state.archivePoll,
  voteOnPoll: state.voteOnPoll,
  undoVote: state.undoVote,
  selectPoll: state.selectPoll,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchPolls: state.searchPolls,
  clearSearch: state.clearSearch,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
}));

// Stats selector
export const usePollsStats = () => usePollsStore(state => ({
  total: state.polls.length,
  active: state.polls.filter(p => p.status === 'active').length,
  closed: state.polls.filter(p => p.status === 'closed').length,
  draft: state.polls.filter(p => p.status === 'draft').length,
  isLoading: state.isLoading,
  error: state.error,
}));

// ============================================================================
// STORE UTILITIES
// ============================================================================

export const pollsStoreUtils = {
  /**
   * Get trending polls (most votes, active)
   */
  getTrendingPolls: (limit = 10) => {
    const state = usePollsStore.getState();
    return state.polls
      .filter(poll => poll.status === 'active')
      .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
      .slice(0, limit);
  },
  
  /**
   * Get recent polls
   */
  getRecentPolls: (limit = 10) => {
    const state = usePollsStore.getState();
    return state.polls
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  },
  
  /**
   * Get polls by category
   */
  getPollsByCategory: (category: string) => {
    const state = usePollsStore.getState();
    return state.polls.filter(poll => poll.category === category);
  },
};
