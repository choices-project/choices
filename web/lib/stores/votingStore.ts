/**
 * Voting Store - Zustand Implementation
 * 
 * Comprehensive voting state management including voting records,
 * ballot information, voting preferences, and election data.
 * Consolidates voting state management and voting history.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';

// Voting data types
export interface Ballot {
  id: string;
  electionId: string;
  title: string;
  description: string;
  type: 'primary' | 'general' | 'special' | 'runoff' | 'recall';
  date: string;
  deadline: string;
  status: 'upcoming' | 'active' | 'closed' | 'cancelled';
  contests: BallotContest[];
  metadata: {
    jurisdiction: string;
    district: string;
    pollingPlace?: string;
    earlyVoting?: {
      start: string;
      end: string;
      locations: string[];
    };
    mailVoting?: {
      available: boolean;
      deadline: string;
      instructions: string;
    };
  };
}

interface BallotContest {
  id: string;
  title: string;
  description: string;
  type: 'candidate' | 'measure' | 'proposition' | 'referendum';
  district?: string;
  candidates?: BallotCandidate[];
  measures?: BallotMeasure[];
  instructions: string;
  maxSelections: number;
  minSelections: number;
}

interface BallotCandidate {
  id: string;
  name: string;
  party?: string;
  incumbent: boolean;
  photo?: string;
  bio?: string;
  website?: string;
  endorsements: string[];
  positions: Array<{
    issue: string;
    stance: string;
    details: string;
  }>;
}

interface BallotMeasure {
  id: string;
  title: string;
  description: string;
  summary: string;
  fullText: string;
  fiscalImpact?: string;
  arguments: {
    for: string[];
    against: string[];
  };
  endorsements: {
    for: string[];
    against: string[];
  };
}


export interface Election {
  id: string;
  name: string;
  date: string;
  type: 'primary' | 'general' | 'special' | 'runoff' | 'recall';
  status: 'upcoming' | 'active' | 'closed' | 'results_available';
  description: string;
  ballots: string[]; // Ballot IDs
  results?: ElectionResults;
  metadata: {
    jurisdiction: string;
    district: string;
    turnout: number;
    totalVoters: number;
  };
}

export interface VotingRecord {
  id: string;
  ballotId: string;
  contestId: string;
  selections: string[]; // Candidate or measure IDs
  votedAt: string;
  method: 'in_person' | 'mail' | 'early' | 'absentee';
  location?: string;
  verified: boolean;
  receipt?: string;
}

interface ElectionResults {
  contests: Array<{
    contestId: string;
    results: Array<{
      candidateId?: string;
      measureId?: string;
      votes: number;
      percentage: number;
      winner: boolean;
    }>;
    totalVotes: number;
    turnout: number;
  }>;
  summary: {
    totalVotes: number;
    turnout: number;
    winners: string[];
  };
}

interface VotingPreferences {
  notifications: {
    electionReminders: boolean;
    ballotDeadlines: boolean;
    earlyVoting: boolean;
    results: boolean;
  };
  voting: {
    preferredMethod: 'in_person' | 'mail' | 'early';
    pollingPlace?: string;
    earlyVotingLocation?: string;
    mailVotingAddress?: string;
  };
  privacy: {
    shareVotingHistory: boolean;
    sharePoliticalAffiliation: boolean;
    shareEndorsements: boolean;
  };
  reminders: {
    electionDay: number; // days before
    registrationDeadline: number; // days before
    ballotDeadline: number; // days before
  };
}

interface VotingSearch {
  query: string;
  results: Array<Ballot | Election>;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: {
    type?: string[];
    status?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    jurisdiction?: string[];
  };
  suggestions: string[];
  recentSearches: string[];
}

// Voting store state interface
interface VotingStore {
  // Voting data
  ballots: Ballot[];
  elections: Election[];
  votingRecords: VotingRecord[];
  search: VotingSearch;
  
  // UI state
  selectedBallot: Ballot | null;
  selectedElection: Election | null;
  currentBallot: Ballot | null;
  
  // Preferences
  preferences: VotingPreferences;
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isVoting: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions - Ballot management
  setBallots: (ballots: Ballot[]) => void;
  addBallot: (ballot: Ballot) => void;
  updateBallot: (id: string, updates: Partial<Ballot>) => void;
  removeBallot: (id: string) => void;
  setSelectedBallot: (ballot: Ballot | null) => void;
  setCurrentBallot: (ballot: Ballot | null) => void;
  
  // Actions - Election management
  setElections: (elections: Election[]) => void;
  addElection: (election: Election) => void;
  updateElection: (id: string, updates: Partial<Election>) => void;
  removeElection: (id: string) => void;
  setSelectedElection: (election: Election | null) => void;
  
  // Actions - Voting records
  setVotingRecords: (records: VotingRecord[]) => void;
  addVotingRecord: (record: VotingRecord) => void;
  updateVotingRecord: (id: string, updates: Partial<VotingRecord>) => void;
  removeVotingRecord: (id: string) => void;
  
  // Actions - Voting
  castVote: (ballotId: string, contestId: string, selections: string[]) => Promise<void>;
  updateVote: (recordId: string, selections: string[]) => Promise<void>;
  cancelVote: (recordId: string) => Promise<void>;
  
  // Actions - Search and filtering
  searchVoting: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setFilters: (filters: Partial<VotingSearch['filters']>) => void;
  clearFilters: () => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<VotingPreferences>) => void;
  resetPreferences: () => void;
  
  // Actions - Data operations
  loadBallots: (electionId?: string) => Promise<void>;
  loadElections: () => Promise<void>;
  loadVotingRecords: () => Promise<void>;
  loadBallot: (id: string) => Promise<void>;
  loadElection: (id: string) => Promise<void>;
  submitBallot: (ballotId: string, votes: Record<string, string[]>) => Promise<void>;
  clearUserVotingSession: () => void;
  reset: () => void;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setVoting: (voting: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default voting preferences
const defaultPreferences: VotingPreferences = {
  notifications: {
    electionReminders: true,
    ballotDeadlines: true,
    earlyVoting: true,
    results: true,
  },
  voting: {
    preferredMethod: 'in_person',
  },
  privacy: {
    shareVotingHistory: false,
    sharePoliticalAffiliation: false,
    shareEndorsements: false,
  },
  reminders: {
    electionDay: 7,
    registrationDeadline: 14,
    ballotDeadline: 3,
  },
};

// Default search filters
const defaultFilters: VotingSearch['filters'] = {
  type: [],
  status: [],
  dateRange: {
    start: '',
    end: '',
  },
  jurisdiction: [],
};

// Create voting store with middleware
export const useVotingStore = create<VotingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ballots: [],
        elections: [],
        votingRecords: [],
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
        selectedBallot: null,
        selectedElection: null,
        currentBallot: null,
        preferences: defaultPreferences,
        isLoading: false,
        isSearching: false,
        isVoting: false,
        isUpdating: false,
        error: null,
        
        // Ballot management actions
        setBallots: (ballots) => set({ ballots }),
        
        addBallot: (ballot) => set((state) => ({
          ballots: [ballot, ...state.ballots]
        })),
        
        updateBallot: (id, updates) => set((state) => ({
          ballots: state.ballots.map(ballot =>
            ballot.id === id ? { ...ballot, ...updates } : ballot
          )
        })),
        
        removeBallot: (id) => set((state) => ({
          ballots: state.ballots.filter(ballot => ballot.id !== id)
        })),
        
        setSelectedBallot: (ballot) => set({ selectedBallot: ballot }),
        
        setCurrentBallot: (ballot) => set({ currentBallot: ballot }),
        
        // Election management actions
        setElections: (elections) => set({ elections }),
        
        addElection: (election) => set((state) => ({
          elections: [election, ...state.elections]
        })),
        
        updateElection: (id, updates) => set((state) => ({
          elections: state.elections.map(election =>
            election.id === id ? { ...election, ...updates } : election
          )
        })),
        
        removeElection: (id) => set((state) => ({
          elections: state.elections.filter(election => election.id !== id)
        })),
        
        setSelectedElection: (election) => set({ selectedElection: election }),
        
        // Voting records actions
        setVotingRecords: (records) => set({ votingRecords: records }),
        
        addVotingRecord: (record) => set((state) => ({
          votingRecords: [record, ...state.votingRecords]
        })),
        
        updateVotingRecord: (id, updates) => set((state) => ({
          votingRecords: state.votingRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        })),
        
        removeVotingRecord: (id) => set((state) => ({
          votingRecords: state.votingRecords.filter(record => record.id !== id)
        })),
        
        // Voting actions
        castVote: async (ballotId, contestId, selections) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch('/api/voting/vote', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ballotId, contestId, selections }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to cast vote');
            }
            
            const votingRecord = await response.json();
            
            set((state) => ({
              votingRecords: [votingRecord, ...state.votingRecords]
            }));
            
            logger.info('Vote cast successfully', {
              ballotId,
              contestId,
              selections
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to cast vote:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setVoting(false);
          }
        },
        
        updateVote: async (recordId, selections) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch(`/api/voting/records/${recordId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ selections }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to update vote');
            }
            
            set((state) => ({
              votingRecords: state.votingRecords.map(record =>
                record.id === recordId 
                  ? { ...record, selections }
                  : record
              )
            }));
            
            logger.info('Vote updated successfully', {
              recordId,
              selections
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to update vote:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setVoting(false);
          }
        },
        
        cancelVote: async (recordId) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch(`/api/voting/records/${recordId}`, {
              method: 'DELETE',
            });
            
            if (!response.ok) {
              throw new Error('Failed to cancel vote');
            }
            
            set((state) => ({
              votingRecords: state.votingRecords.filter(record => record.id !== recordId)
            }));
            
            logger.info('Vote cancelled successfully', { recordId });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to cancel vote:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setVoting(false);
          }
        },
        
        // Search and filtering actions
        searchVoting: async (query) => {
          const { setSearching, setError } = get();
          
          try {
            setSearching(true);
            setError(null);
            
            const response = await fetch('/api/voting/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to search voting data');
            }
            
            const results = await response.json() as {
              items: Array<Ballot | Election>;
              total: number;
            };
            
            set((state) => ({
              search: {
                ...state.search,
                query,
                results: results.items,
                totalResults: results.total,
                currentPage: 1,
                totalPages: Math.ceil(results.total / 20),
              },
            }));
            
            logger.info('Voting data searched', {
              query,
              results: results.items.length,
              total: results.total
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to search voting data:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSearching(false);
          }
        },
        
        setSearchQuery: (query) => set((state) => ({
          search: { ...state.search, query }
        })),
        
        clearSearch: () => set((state) => ({
          search: {
            ...state.search,
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
          }
        })),
        
        setFilters: (filters) => set((state) => ({
          search: {
            ...state.search,
            filters: { ...state.search.filters, ...filters }
          }
        })),
        
        clearFilters: () => set((state) => ({
          search: {
            ...state.search,
            filters: defaultFilters
          }
        })),
        
        clearUserVotingSession: () => set((state) => ({
          ballots: [],
          selectedBallot: null,
          currentBallot: null,
          search: {
            ...state.search,
            filters: defaultFilters
          }
        })),
        
        reset: () => {
          useVotingStore.getState().clearFilters();
          useVotingStore.getState().resetPreferences();
          useVotingStore.setState({
            ballots: [],
            selectedBallot: null,
            currentBallot: null,
            votingRecords: [],
            selectedElection: null,
            elections: []
          });
          logger.info('Voting store reset');
        },
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // Data operations
        loadBallots: async (electionId) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/voting/ballots', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ electionId }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load ballots');
            }
            
            const ballots = await response.json() as Ballot[];
            set({ ballots });
            
            logger.info('Ballots loaded', {
              electionId,
              count: ballots.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load ballots:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadElections: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/voting/elections');
            
            if (!response.ok) {
              throw new Error('Failed to load elections');
            }
            
            const elections = await response.json() as Election[];
            set({ elections });
            
            logger.info('Elections loaded', {
              count: elections.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load elections:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadVotingRecords: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/voting/records');
            
            if (!response.ok) {
              throw new Error('Failed to load voting records');
            }
            
            const records = await response.json() as VotingRecord[];
            set({ votingRecords: records });
            
            logger.info('Voting records loaded', {
              count: records.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load voting records:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadBallot: async (id) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/voting/ballots/${id}`);
            
            if (!response.ok) {
              throw new Error('Failed to load ballot');
            }
            
            const ballot = await response.json();
            set({ selectedBallot: ballot });
            
            logger.info('Ballot loaded', { id });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load ballot:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        loadElection: async (id) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/voting/elections/${id}`);
            
            if (!response.ok) {
              throw new Error('Failed to load election');
            }
            
            const election = await response.json() as Election;
            set({ selectedElection: election });
            
            logger.info('Election loaded', { id });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load election:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setLoading(false);
          }
        },
        
        submitBallot: async (ballotId, votes) => {
          const { setVoting, setError } = get();
          
          try {
            setVoting(true);
            setError(null);
            
            const response = await fetch('/api/voting/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ballotId, votes }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to submit ballot');
            }
            
            const votingRecord = await response.json() as VotingRecord;
            
            set((state) => ({
              votingRecords: [votingRecord, ...state.votingRecords]
            }));
            
            logger.info('Ballot submitted successfully', {
              ballotId,
              votes: Object.keys(votes).length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to submit ballot:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setVoting(false);
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
        name: 'voting-store',
        partialize: (state) => ({
          ballots: state.ballots,
          elections: state.elections,
          votingRecords: state.votingRecords,
          preferences: state.preferences,
        }),
      }
    ),
    { name: 'voting-store' }
  )
);

// Store selectors for optimized re-renders
export const useBallots = () => useVotingStore(state => state.ballots);
export const useElections = () => useVotingStore(state => state.elections);
export const useVotingRecords = () => useVotingStore(state => state.votingRecords);
export const useVotingSearch = () => useVotingStore(state => state.search);
export const useSelectedBallot = () => useVotingStore(state => state.selectedBallot);
export const useSelectedElection = () => useVotingStore(state => state.selectedElection);
export const useCurrentBallot = () => useVotingStore(state => state.currentBallot);
export const useVotingPreferences = () => useVotingStore(state => state.preferences);
export const useVotingLoading = () => useVotingStore(state => state.isLoading);
export const useVotingError = () => useVotingStore(state => state.error);

// Action selectors
export const useVotingActions = () => useVotingStore(state => ({
  setBallots: state.setBallots,
  addBallot: state.addBallot,
  updateBallot: state.updateBallot,
  removeBallot: state.removeBallot,
  setSelectedBallot: state.setSelectedBallot,
  setCurrentBallot: state.setCurrentBallot,
  setElections: state.setElections,
  addElection: state.addElection,
  updateElection: state.updateElection,
  removeElection: state.removeElection,
  setSelectedElection: state.setSelectedElection,
  setVotingRecords: state.setVotingRecords,
  addVotingRecord: state.addVotingRecord,
  updateVotingRecord: state.updateVotingRecord,
  removeVotingRecord: state.removeVotingRecord,
  castVote: state.castVote,
  updateVote: state.updateVote,
  cancelVote: state.cancelVote,
  searchVoting: state.searchVoting,
  setSearchQuery: state.setSearchQuery,
  clearSearch: state.clearSearch,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  loadBallots: state.loadBallots,
  loadElections: state.loadElections,
  loadVotingRecords: state.loadVotingRecords,
  loadBallot: state.loadBallot,
  loadElection: state.loadElection,
  submitBallot: state.submitBallot,
  setLoading: state.setLoading,
  setSearching: state.setSearching,
  setVoting: state.setVoting,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const useVotingStats = () => useVotingStore(state => ({
  totalBallots: state.ballots.length,
  totalElections: state.elections.length,
  totalVotingRecords: state.votingRecords.length,
  upcomingElections: state.elections.filter(election => election.status === 'upcoming').length,
  activeElections: state.elections.filter(election => election.status === 'active').length,
  searchResults: state.search.results.length,
  isLoading: state.isLoading,
  isVoting: state.isVoting,
  error: state.error,
}));

export const useUpcomingElections = () => useVotingStore(state => 
  state.elections.filter(election => election.status === 'upcoming')
);

export const useActiveElections = () => useVotingStore(state => 
  state.elections.filter(election => election.status === 'active')
);

export const useUserVotingHistory = () => useVotingStore(state => 
  state.votingRecords.sort((a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime())
);

// Store utilities
export const votingStoreUtils = {
  /**
   * Get voting summary
   */
  getVotingSummary: () => {
    const state = useVotingStore.getState();
    return {
      totalBallots: state.ballots.length,
      totalElections: state.elections.length,
      totalVotingRecords: state.votingRecords.length,
      searchResults: state.search.results.length,
      preferences: state.preferences,
    };
  },
  
  /**
   * Get elections by type
   */
  getElectionsByType: (type: string) => {
    const state = useVotingStore.getState();
    return state.elections.filter(election => election.type === type);
  },
  
  /**
   * Get ballots by election
   */
  getBallotsByElection: (electionId: string) => {
    const state = useVotingStore.getState();
    return state.ballots.filter(ballot => ballot.electionId === electionId);
  },
  
  /**
   * Get voting records by election
   */
  getVotingRecordsByElection: (electionId: string) => {
    const state = useVotingStore.getState();
    return state.votingRecords.filter(record => 
      state.ballots.find(ballot => ballot.id === record.ballotId)?.electionId === electionId
    );
  },
  
  /**
   * Get upcoming elections
   */
  getUpcomingElections: () => {
    const state = useVotingStore.getState();
    const now = new Date();
    return state.elections
      .filter(election => new Date(election.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
};

// Store subscriptions for external integrations
export const votingStoreSubscriptions = {
  /**
   * Subscribe to ballots changes
   */
  onBallotsChange: (callback: (ballots: Ballot[]) => void) => {
    return useVotingStore.subscribe(
      (state) => {
        callback(state.ballots);
      }
    );
  },
  
  /**
   * Subscribe to elections changes
   */
  onElectionsChange: (callback: (elections: Election[]) => void) => {
    return useVotingStore.subscribe(
      (state) => {
        callback(state.elections);
      }
    );
  },
  
  /**
   * Subscribe to voting records changes
   */
  onVotingRecordsChange: (callback: (records: VotingRecord[]) => void) => {
    return useVotingStore.subscribe(
      (state) => {
        callback(state.votingRecords);
      }
    );
  }
};

// Store debugging utilities
export const votingStoreDebug = {
  /**
   * Log current voting state
   */
  logState: () => {
    const state = useVotingStore.getState();
    logger.debug('Voting Store State', {
      totalBallots: state.ballots.length,
      totalElections: state.elections.length,
      totalVotingRecords: state.votingRecords.length,
      searchResults: state.search.results.length,
      selectedBallot: state.selectedBallot?.title || 'none',
      selectedElection: state.selectedElection?.name || 'none',
      isLoading: state.isLoading,
      isVoting: state.isVoting,
      error: state.error
    });
  },
  
  /**
   * Log voting summary
   */
  logSummary: () => {
    const summary = votingStoreUtils.getVotingSummary();
    logger.debug('Voting Summary', summary);
  },
  
  /**
   * Log elections by type
   */
  logElectionsByType: () => {
    const state = useVotingStore.getState();
    const byType = state.elections.reduce((acc, election) => {
      acc[election.type] = (acc[election.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    logger.debug('Elections by Type', byType);
  },
  
  /**
   * Reset voting store
   */
  reset: () => {
    useVotingStore.getState().clearFilters();
    useVotingStore.getState().resetPreferences();
    useVotingStore.setState({
      ballots: [],
      selectedBallot: null,
      currentBallot: null,
      votingRecords: [],
      selectedElection: null,
      elections: []
    });
    logger.info('Voting store reset');
  }
};
