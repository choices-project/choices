/**
 * Polls Store - Zustand Implementation
 * 
 * Comprehensive poll state management including poll data, voting state,
 * poll interactions, and poll preferences. Consolidates poll-related state management.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';

// Poll data types
interface Poll {
  id: string;
  title: string;
  description: string;
  question: string;
  options: PollOption[];
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  status: 'draft' | 'active' | 'closed' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  settings: {
    allowMultipleVotes: boolean;
    allowAnonymousVotes: boolean;
    showResultsBeforeClose: boolean;
    allowComments: boolean;
    allowSharing: boolean;
    requireAuthentication: boolean;
  };
  voting: {
    totalVotes: number;
    uniqueVoters: number;
    userVote?: string; // Option ID
    userVotedAt?: string;
    canVote: boolean;
    hasVoted: boolean;
  };
  results: {
    optionResults: Array<{
      optionId: string;
      votes: number;
      percentage: number;
    }>;
    demographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      genders: Record<string, number>;
    };
    trends: Array<{
      timestamp: string;
      votes: number;
    }>;
  };
  metadata: {
    image?: string;
    location?: string;
    language: string;
    estimatedTime: number; // minutes
    difficulty: 'easy' | 'medium' | 'hard';
  };
  timestamps: {
    createdAt: string;
    publishedAt?: string;
    closesAt?: string;
    updatedAt: string;
  };
}

interface PollOption {
  id: string;
  text: string;
  description?: string;
  image?: string;
  order: number;
  votes: number;
  percentage: number;
}

interface PollComment {
  id: string;
  pollId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  parentId?: string; // For replies
  likes: number;
  userLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PollFilters {
  status: Array<'draft' | 'active' | 'closed' | 'archived'>;
  category: string[];
  tags: string[];
  author: string[];
  dateRange: {
    start: string;
    end: string;
  };
  votingStatus: 'all' | 'voted' | 'not_voted';
  visibility: Array<'public' | 'private' | 'unlisted'>;
}

interface PollPreferences {
  defaultView: 'list' | 'grid' | 'card';
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'closing_soon';
  itemsPerPage: number;
  showResults: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  notifications: {
    newPolls: boolean;
    pollUpdates: boolean;
    pollCloses: boolean;
    pollResults: boolean;
  };
  privacy: {
    showVoteHistory: boolean;
    showPollParticipation: boolean;
    shareActivity: boolean;
  };
  voting: {
    confirmVotes: boolean;
    showProgress: boolean;
    allowUndo: boolean;
    undoTimeLimit: number; // minutes
  };
}

interface PollSearch {
  query: string;
  results: Poll[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: PollFilters;
  suggestions: string[];
  recentSearches: string[];
}

// Polls store state interface
interface PollsStore {
  // Poll data
  polls: Poll[];
  filteredPolls: Poll[];
  comments: PollComment[];
  search: PollSearch;
  
  // UI state
  selectedPoll: Poll | null;
  currentView: 'list' | 'grid' | 'card';
  selectedCategory: string | null;
  
  // Filters and preferences
  filters: PollFilters;
  preferences: PollPreferences;
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isVoting: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions - Poll management
  setPolls: (polls: Poll[]) => void;
  addPoll: (poll: Poll) => void;
  updatePoll: (id: string, updates: Partial<Poll>) => void;
  removePoll: (id: string) => void;
  publishPoll: (id: string) => void;
  closePoll: (id: string) => void;
  archivePoll: (id: string) => void;
  
  // Actions - Voting
  voteOnPoll: (pollId: string, optionId: string) => Promise<void>;
  undoVote: (pollId: string) => Promise<void>;
  changeVote: (pollId: string, newOptionId: string) => Promise<void>;
  
  // Actions - Comments
  setComments: (comments: PollComment[]) => void;
  addComment: (comment: Omit<PollComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (id: string, updates: Partial<PollComment>) => void;
  removeComment: (id: string) => void;
  likeComment: (id: string) => void;
  unlikeComment: (id: string) => void;
  
  // Actions - Filtering and search
  setFilters: (filters: Partial<PollFilters>) => void;
  clearFilters: () => void;
  searchPolls: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Actions - UI state
  setSelectedPoll: (poll: Poll | null) => void;
  setCurrentView: (view: 'list' | 'grid' | 'card') => void;
  setSelectedCategory: (category: string | null) => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<PollPreferences>) => void;
  resetPreferences: () => void;
  
  // Actions - Data operations
  loadPolls: (category?: string) => Promise<void>;
  loadPoll: (id: string) => Promise<void>;
  loadComments: (pollId: string) => Promise<void>;
  createPoll: (poll: Omit<Poll, 'id' | 'timestamps' | 'voting' | 'results'>) => Promise<void>;
  updatePollSettings: (id: string, settings: Partial<Poll['settings']>) => Promise<void>;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setVoting: (voting: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default poll preferences
const defaultPreferences: PollPreferences = {
  defaultView: 'list',
  sortBy: 'newest',
  itemsPerPage: 20,
  showResults: true,
  autoRefresh: true,
  refreshInterval: 5,
  notifications: {
    newPolls: true,
    pollUpdates: true,
    pollCloses: true,
    pollResults: true,
  },
  privacy: {
    showVoteHistory: false,
    showPollParticipation: true,
    shareActivity: false,
  },
  voting: {
    confirmVotes: true,
    showProgress: true,
    allowUndo: true,
    undoTimeLimit: 5,
  },
};

// Default poll filters
const defaultFilters: PollFilters = {
  status: ['active'],
  category: [],
  tags: [],
  author: [],
  dateRange: {
    start: '',
    end: '',
  },
  votingStatus: 'all',
  visibility: ['public'],
};

// Create polls store with middleware
export const usePollsStore = create<PollsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        polls: [],
        filteredPolls: [],
        comments: [],
        search: {
          query: '',
          results: [],
          totalResults: 0,
          currentPage: 1,
          totalPages: 1,
          filters: defaultFilters,
          suggestions: [],
          recentSearches: [],
        },
        selectedPoll: null,
        currentView: 'list',
        selectedCategory: null,
        filters: defaultFilters,
        preferences: defaultPreferences,
        isLoading: false,
        isSearching: false,
        isVoting: false,
        isUpdating: false,
        error: null,
        
        // Poll management actions
        setPolls: (polls) => set({ polls, filteredPolls: polls }),
        
        addPoll: (poll) => set((state) => ({
          polls: [poll, ...state.polls],
          filteredPolls: [poll, ...state.filteredPolls],
        })),
        
        updatePoll: (id, updates) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id ? withOptional(poll, updates) : poll
          ),
          filteredPolls: state.filteredPolls.map(poll =>
            poll.id === id ? withOptional(poll, updates) : poll
          ),
        })),
        
        removePoll: (id) => set((state) => ({
          polls: state.polls.filter(poll => poll.id !== id),
          filteredPolls: state.filteredPolls.filter(poll => poll.id !== id),
        })),
        
        publishPoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'active' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    publishedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
          filteredPolls: state.filteredPolls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'active' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    publishedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
        })),
        
        closePoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'closed' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    closesAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
          filteredPolls: state.filteredPolls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'closed' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    closesAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
        })),
        
        archivePoll: (id) => set((state) => ({
          polls: state.polls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'archived' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
          filteredPolls: state.filteredPolls.map(poll =>
            poll.id === id 
              ? withOptional(poll, { 
                  status: 'archived' as const,
                  timestamps: withOptional(poll.timestamps, { 
                    updatedAt: new Date().toISOString()
                  })
                })
              : poll
          ),
        })),
        
        // Voting actions
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
            
            // Update local state
            set((state) => ({
              polls: state.polls.map(poll =>
                poll.id === pollId 
                  ? withOptional(poll, {
                      voting: withOptional(poll.voting, {
                        userVote: optionId,
                        userVotedAt: new Date().toISOString(),
                        hasVoted: true,
                        totalVotes: poll.voting.totalVotes + 1,
                      }),
                      results: withOptional(poll.results, {
                        optionResults: poll.results.optionResults.map(result =>
                          result.optionId === optionId
                            ? withOptional(result, { votes: result.votes + 1 })
                            : result
                        ),
                      }),
                    })
                  : poll
              ),
              filteredPolls: state.filteredPolls.map(poll =>
                poll.id === pollId 
                  ? withOptional(poll, {
                      voting: withOptional(poll.voting, {
                        userVote: optionId,
                        userVotedAt: new Date().toISOString(),
                        hasVoted: true,
                        totalVotes: poll.voting.totalVotes + 1,
                      }),
                      results: withOptional(poll.results, {
                        optionResults: poll.results.optionResults.map(result =>
                          result.optionId === optionId
                            ? withOptional(result, { votes: result.votes + 1 })
                            : result
                        ),
                      }),
                    })
                  : poll
              ),
            }));
            
            logger.info('Vote cast successfully', {
              pollId,
              optionId
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to vote on poll:', error instanceof Error ? error : new Error(errorMessage));
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
            
            // Update local state
            set((state) => {
              const poll = state.polls.find(p => p.id === pollId);
              if (!poll?.voting.userVote) return state;
              
              return {
                polls: state.polls.map(p =>
                  p.id === pollId 
                    ? withOptional(p, {
                        voting: withOptional(p.voting, {
                          userVote: undefined,
                          userVotedAt: undefined,
                          hasVoted: false,
                          totalVotes: Math.max(0, p.voting.totalVotes - 1),
                        }),
                        results: withOptional(p.results, {
                          optionResults: p.results.optionResults.map(result =>
                            result.optionId === poll.voting.userVote
                              ? withOptional(result, { votes: Math.max(0, result.votes - 1) })
                              : result
                          ),
                        }),
                      })
                    : p
                ),
                filteredPolls: state.filteredPolls.map(p =>
                  p.id === pollId 
                    ? withOptional(p, {
                        voting: withOptional(p.voting, {
                          userVote: undefined,
                          userVotedAt: undefined,
                          hasVoted: false,
                          totalVotes: Math.max(0, p.voting.totalVotes - 1),
                        }),
                        results: withOptional(p.results, {
                          optionResults: p.results.optionResults.map(result =>
                            result.optionId === poll.voting.userVote
                              ? withOptional(result, { votes: Math.max(0, result.votes - 1) })
                              : result
                          ),
                        }),
                      })
                    : p
                ),
              };
            });
            
            logger.info('Vote undone successfully', { pollId });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to undo vote:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setVoting(false);
          }
        },
        
        changeVote: async (pollId, newOptionId) => {
          const { voteOnPoll, undoVote } = get();
          
          try {
            await undoVote(pollId);
            await voteOnPoll(pollId, newOptionId);
            
            logger.info('Vote changed successfully', {
              pollId,
              newOptionId
            });
          } catch (error) {
            logger.error('Failed to change vote:', error as Error);
            throw error;
          }
        },
        
        // Comment actions
        setComments: (comments) => set({ comments }),
        
        addComment: (comment) => set((state) => ({
          comments: [
            ...state.comments,
            {
              ...comment,
              id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ]
        })),
        
        updateComment: (id, updates) => set((state) => ({
          comments: state.comments.map(comment =>
            comment.id === id 
              ? withOptional(comment, withOptional(updates, { updatedAt: new Date().toISOString() }))
              : comment
          )
        })),
        
        removeComment: (id) => set((state) => ({
          comments: state.comments.filter(comment => comment.id !== id)
        })),
        
        likeComment: (id) => set((state) => ({
          comments: state.comments.map(comment =>
            comment.id === id 
              ? withOptional(comment, { 
                  userLiked: true,
                  likes: comment.likes + 1 
                })
              : comment
          )
        })),
        
        unlikeComment: (id) => set((state) => ({
          comments: state.comments.map(comment =>
            comment.id === id 
              ? withOptional(comment, { 
                  userLiked: false,
                  likes: Math.max(0, comment.likes - 1) 
                })
              : comment
          )
        })),
        
        // Filtering and search actions
        setFilters: (filters) => set((state) => {
          const newFilters = withOptional(state.filters, filters);
          
          // Apply filters to polls
          const filtered = state.polls.filter(poll => {
            if (newFilters.status.length > 0 && !newFilters.status.includes(poll.status)) {
              return false;
            }
            if (newFilters.category.length > 0 && !newFilters.category.includes(poll.category)) {
              return false;
            }
            if (newFilters.tags.length > 0 && !newFilters.tags.some(tag => poll.tags.includes(tag))) {
              return false;
            }
            if (newFilters.author.length > 0 && !newFilters.author.includes(poll.author.id)) {
              return false;
            }
            if (newFilters.votingStatus === 'voted' && !poll.voting.hasVoted) {
              return false;
            }
            if (newFilters.votingStatus === 'not_voted' && poll.voting.hasVoted) {
              return false;
            }
            return true;
          });
          
          return { filters: newFilters, filteredPolls: filtered };
        }),
        
        clearFilters: () => set((state) => ({
          filters: defaultFilters,
          filteredPolls: state.polls,
        })),
        
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
            
            const results = await response.json();
            
            set((state) => ({
              search: withOptional(state.search, {
                query,
                results: results.polls,
                totalResults: results.total,
                currentPage: 1,
                totalPages: Math.ceil(results.total / state.preferences.itemsPerPage),
              })
            }));
            
            logger.info('Polls searched', {
              query,
              results: results.polls.length,
              total: results.total
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to search polls:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSearching(false);
          }
        },
        
        setSearchQuery: (query) => set((state) => ({
          search: { ...state.search, query }
        })),
        
        clearSearch: () => set((state) => ({
          search: withOptional(state.search, {
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
          })
        })),
        
        // UI state actions
        setSelectedPoll: (poll) => set({ selectedPoll: poll }),
        
        setCurrentView: (view) => set({ currentView: view }),
        
        setSelectedCategory: (category) => set({ selectedCategory: category }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: withOptional(state.preferences, preferences)
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Data operations
        loadPolls: async (category) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/polls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load polls');
            }
            
            const polls = await response.json();
            set({ polls, filteredPolls: polls });
            
            logger.info('Polls loaded', {
              category,
              count: polls.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load polls:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadPoll: async (id) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/polls/${id}`);
            
            if (!response.ok) {
              throw new Error('Failed to load poll');
            }
            
            const poll = await response.json();
            set({ selectedPoll: poll });
            
            logger.info('Poll loaded', { id });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load poll:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadComments: async (pollId) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/polls/${pollId}/comments`);
            
            if (!response.ok) {
              throw new Error('Failed to load comments');
            }
            
            const comments = await response.json();
            set({ comments });
            
            logger.info('Comments loaded', {
              pollId,
              count: comments.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load comments:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        createPoll: async (poll) => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            const response = await fetch('/api/polls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(poll),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create poll');
            }
            
            const newPoll = await response.json();
            
            set((state) => ({
              polls: [newPoll, ...state.polls],
              filteredPolls: [newPoll, ...state.filteredPolls],
            }));
            
            logger.info('Poll created successfully', {
              pollId: newPoll.id,
              title: newPoll.title
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to create poll:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
        
        updatePollSettings: async (id, settings) => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            const response = await fetch(`/api/polls/${id}/settings`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update poll settings');
            }
            
            set((state) => ({
              polls: state.polls.map(poll =>
                poll.id === id 
                  ? withOptional(poll, { 
                      settings: withOptional(poll.settings, settings),
                      timestamps: withOptional(poll.timestamps, { 
                        updatedAt: new Date().toISOString()
                      })
                    })
                  : poll
              ),
              filteredPolls: state.filteredPolls.map(poll =>
                poll.id === id 
                  ? withOptional(poll, { 
                      settings: withOptional(poll.settings, settings),
                      timestamps: withOptional(poll.timestamps, { 
                        updatedAt: new Date().toISOString()
                      })
                    })
                  : poll
              ),
            }));
            
            logger.info('Poll settings updated', { id });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to update poll settings:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setUpdating(false);
          }
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setSearching: (searching) => set({ isSearching: searching }),
        setVoting: (voting) => set({ isVoting: voting }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'polls-store',
        partialize: (state) => ({
          polls: state.polls,
          comments: state.comments,
          preferences: state.preferences,
          filters: state.filters,
          currentView: state.currentView,
        }),
      }
    ),
    { name: 'polls-store' }
  )
);

// Store selectors for optimized re-renders
export const usePolls = () => usePollsStore(state => state.polls);
export const useFilteredPolls = () => usePollsStore(state => state.filteredPolls);
export const usePollComments = () => usePollsStore(state => state.comments);
export const usePollSearch = () => usePollsStore(state => state.search);
export const useSelectedPoll = () => usePollsStore(state => state.selectedPoll);
export const usePollPreferences = () => usePollsStore(state => state.preferences);
export const usePollFilters = () => usePollsStore(state => state.filters);
export const usePollsLoading = () => usePollsStore(state => state.isLoading);
export const usePollsError = () => usePollsStore(state => state.error);

// Action selectors
export const usePollsActions = () => usePollsStore(state => ({
  setPolls: state.setPolls,
  addPoll: state.addPoll,
  updatePoll: state.updatePoll,
  removePoll: state.removePoll,
  publishPoll: state.publishPoll,
  closePoll: state.closePoll,
  archivePoll: state.archivePoll,
  voteOnPoll: state.voteOnPoll,
  undoVote: state.undoVote,
  changeVote: state.changeVote,
  setComments: state.setComments,
  addComment: state.addComment,
  updateComment: state.updateComment,
  removeComment: state.removeComment,
  likeComment: state.likeComment,
  unlikeComment: state.unlikeComment,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchPolls: state.searchPolls,
  setSearchQuery: state.setSearchQuery,
  clearSearch: state.clearSearch,
  setSelectedPoll: state.setSelectedPoll,
  setCurrentView: state.setCurrentView,
  setSelectedCategory: state.setSelectedCategory,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  loadPolls: state.loadPolls,
  loadPoll: state.loadPoll,
  loadComments: state.loadComments,
  createPoll: state.createPoll,
  updatePollSettings: state.updatePollSettings,
  setLoading: state.setLoading,
  setSearching: state.setSearching,
  setVoting: state.setVoting,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const usePollsStats = () => usePollsStore(state => ({
  totalPolls: state.polls.length,
  filteredPolls: state.filteredPolls.length,
  activePolls: state.polls.filter(poll => poll.status === 'active').length,
  closedPolls: state.polls.filter(poll => poll.status === 'closed').length,
  userVotedPolls: state.polls.filter(poll => poll.voting.hasVoted).length,
  searchResults: state.search.results.length,
  isLoading: state.isLoading,
  isVoting: state.isVoting,
  error: state.error,
}));

export const useUserVotedPolls = () => usePollsStore(state => 
  state.polls.filter(poll => poll.voting.hasVoted)
);

export const useActivePolls = () => usePollsStore(state => 
  state.polls.filter(poll => poll.status === 'active')
);

export const usePollCommentsByPollId = (pollId: string) => usePollsStore(state => 
  state.comments.filter(comment => comment.pollId === pollId)
);

// Store utilities
export const pollsStoreUtils = {
  /**
   * Get polls summary
   */
  getPollsSummary: () => {
    const state = usePollsStore.getState();
    return {
      totalPolls: state.polls.length,
      filteredPolls: state.filteredPolls.length,
      comments: state.comments.length,
      searchResults: state.search.results.length,
      preferences: state.preferences,
    };
  },
  
  /**
   * Get polls by status
   */
  getPollsByStatus: (status: string) => {
    const state = usePollsStore.getState();
    return state.polls.filter(poll => poll.status === status);
  },
  
  /**
   * Get polls by category
   */
  getPollsByCategory: (category: string) => {
    const state = usePollsStore.getState();
    return state.polls.filter(poll => poll.category === category);
  },
  
  /**
   * Get trending polls
   */
  getTrendingPolls: () => {
    const state = usePollsStore.getState();
    return state.polls
      .filter(poll => poll.status === 'active')
      .sort((a, b) => b.voting.totalVotes - a.voting.totalVotes)
      .slice(0, 10);
  },
  
  /**
   * Get recent polls
   */
  getRecentPolls: (limit: number = 10) => {
    const state = usePollsStore.getState();
    return state.polls
      .sort((a, b) => new Date(b.timestamps.createdAt).getTime() - new Date(a.timestamps.createdAt).getTime())
      .slice(0, limit);
  }
};

// Store subscriptions for external integrations
export const pollsStoreSubscriptions = {
  /**
   * Subscribe to polls changes
   */
  onPollsChange: (callback: (polls: Poll[]) => void) => {
    let prevPolls: Poll[] | null = null;
    return usePollsStore.subscribe(
      (state) => {
        const polls = state.polls;
        if (polls !== prevPolls) {
          callback(polls);
        }
        prevPolls = polls;
        return polls;
      }
    );
  },
  
  /**
   * Subscribe to voting changes
   */
  onVotingChange: (callback: (poll: Poll) => void) => {
    let prevPoll: Poll | null = null;
    return usePollsStore.subscribe(
      (state) => {
        const poll = state.selectedPoll;
        if (poll !== prevPoll && poll?.voting) {
          callback(poll);
        }
        prevPoll = poll;
        return poll;
      }
    );
  },
  
  /**
   * Subscribe to comments changes
   */
  onCommentsChange: (callback: (comments: PollComment[]) => void) => {
    let prevComments: PollComment[] | null = null;
    return usePollsStore.subscribe(
      (state) => {
        const comments = state.comments;
        if (comments !== prevComments) {
          callback(comments);
        }
        prevComments = comments;
        return comments;
      }
    );
  }
};

// Store debugging utilities
export const pollsStoreDebug = {
  /**
   * Log current polls state
   */
  logState: () => {
    const state = usePollsStore.getState();
    console.log('Polls Store State:', {
      totalPolls: state.polls.length,
      filteredPolls: state.filteredPolls.length,
      comments: state.comments.length,
      searchResults: state.search.results.length,
      selectedPoll: state.selectedPoll?.title || 'none',
      currentView: state.currentView,
      isLoading: state.isLoading,
      isVoting: state.isVoting,
      error: state.error
    });
  },
  
  /**
   * Log polls summary
   */
  logSummary: () => {
    const summary = pollsStoreUtils.getPollsSummary();
    console.log('Polls Summary:', summary);
  },
  
  /**
   * Log polls by status
   */
  logPollsByStatus: () => {
    const state = usePollsStore.getState();
    const byStatus = state.polls.reduce((acc, poll) => {
      acc[poll.status] = (acc[poll.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Polls by Status:', byStatus);
  },
  
  /**
   * Reset polls store
   */
  reset: () => {
    usePollsStore.getState().clearFilters();
    usePollsStore.getState().resetPreferences();
    console.log('Polls store reset');
  }
};
