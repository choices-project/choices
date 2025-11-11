/**
 * Voting Store - Zustand Implementation (v5)
 *
 * Modernized voting store using vanilla store APIs for superior type safety,
 * selector ergonomics, and explicit state management.
 *
 * Feature scope: Voting (excludes admin / analytics / profile per audit request).
 */

import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { produce } from 'immer';

import { logger } from '@/lib/utils/logger';

import { createSafeStorage } from './storage';
import { createBaseStoreActions } from './baseStoreActions';

// -----------------------------------------------------------------------------
// Domain Types
// -----------------------------------------------------------------------------

export type BallotCandidate = {
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
  voteCount?: number;
};

export type BallotMeasure = {
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
  voteCount?: number;
};

export type BallotContest = {
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
  totalVotes?: number;
};

export type Ballot = {
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
};

export type ElectionResults = {
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
};

export type Election = {
  id: string;
  name: string;
  date: string;
  type: 'primary' | 'general' | 'special' | 'runoff' | 'recall';
  status: 'upcoming' | 'active' | 'closed' | 'results_available';
  description: string;
  ballots: string[];
  results?: ElectionResults;
  metadata: {
    jurisdiction: string;
    district: string;
    turnout: number;
    totalVoters: number;
  };
};

export type VotingRecord = {
  id: string;
  ballotId: string;
  contestId: string;
  selections: string[];
  votedAt: string;
  method: 'in_person' | 'mail' | 'early' | 'absentee' | 'digital';
  location?: string;
  verified: boolean;
  receipt?: string;
};

export type VotingPreferences = {
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
    electionDay: number;
    registrationDeadline: number;
    ballotDeadline: number;
  };
};

export type VotingSearchFilters = {
  type?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  jurisdiction?: string[];
};

export type VotingSearch = {
  query: string;
  results: Array<Ballot | Election>;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: VotingSearchFilters;
  suggestions: string[];
  recentSearches: string[];
};

// -----------------------------------------------------------------------------
// Store State Slices
// -----------------------------------------------------------------------------

export type VotingEntitiesState = {
  ballots: Ballot[];
  elections: Election[];
  votingRecords: VotingRecord[];
  search: VotingSearch;
};

export type VotingSelectionState = {
  selectedBallot: Ballot | null;
  selectedElection: Election | null;
  currentBallot: Ballot | null;
  preferences: VotingPreferences;
};

export type VotingStatusState = {
  isLoading: boolean;
  isSearching: boolean;
  isVoting: boolean;
  isUpdating: boolean;
  error: string | null;
};

type TimerHandle = ReturnType<typeof setInterval>;

export type VotingSlice = VotingEntitiesState &
  VotingSelectionState &
  VotingStatusState & {
    timerHandles: Record<string, TimerHandle>;
  };

export type VotingActions = {
  // Ballots
  setBallots: (ballots: Ballot[]) => void;
  addBallot: (ballot: Ballot) => void;
  updateBallot: (id: string, updates: Partial<Ballot>) => void;
  removeBallot: (id: string) => void;
  setSelectedBallot: (ballot: Ballot | null) => void;
  setCurrentBallot: (ballot: Ballot | null) => void;

  // Elections
  setElections: (elections: Election[]) => void;
  addElection: (election: Election) => void;
  updateElection: (id: string, updates: Partial<Election>) => void;
  removeElection: (id: string) => void;
  setSelectedElection: (election: Election | null) => void;

  // Voting records
  setVotingRecords: (records: VotingRecord[]) => void;
  addVotingRecord: (record: VotingRecord) => void;
  updateVotingRecord: (id: string, updates: Partial<VotingRecord>) => void;
  removeVotingRecord: (id: string) => void;

  // Voting actions
  castVote: (ballotId: string, contestId: string, selections: string[]) => Promise<void>;
  updateVote: (recordId: string, selections: string[]) => Promise<void>;
  cancelVote: (recordId: string) => Promise<void>;

  // Search and filtering
  searchVoting: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setFilters: (filters: Partial<VotingSearchFilters>) => void;
  clearFilters: () => void;

  // Preferences
  updatePreferences: (preferences: Partial<VotingPreferences>) => void;
  resetPreferences: () => void;

  // Data operations
  loadBallots: (electionId?: string) => Promise<void>;
  loadElections: () => Promise<void>;
  loadVotingRecords: () => Promise<void>;
  loadBallot: (id: string) => Promise<void>;
  loadElection: (id: string) => Promise<void>;
  submitBallot: (ballotId: string, votes: Record<string, string[]>) => Promise<void>;
  clearUserVotingSession: () => void;
  reset: () => void;
  registerTimer: (handle: TimerHandle) => string;
  clearTimer: (id: string) => void;
  clearAllTimers: () => void;

  // Loading/Error flags
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setVoting: (voting: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
};

export type VotingState = VotingSlice & VotingActions;

// -----------------------------------------------------------------------------
// Helpers & Defaults
// -----------------------------------------------------------------------------

const DEFAULT_PREFERENCES: Readonly<VotingPreferences> = {
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
} as const;

const DEFAULT_FILTERS: Readonly<VotingSearchFilters> = {
  type: [],
  status: [],
  dateRange: {
    start: '',
    end: '',
  },
  jurisdiction: [],
} as const;

const clonePreferences = (): VotingPreferences => ({
  notifications: { ...DEFAULT_PREFERENCES.notifications },
  voting: { ...DEFAULT_PREFERENCES.voting },
  privacy: { ...DEFAULT_PREFERENCES.privacy },
  reminders: { ...DEFAULT_PREFERENCES.reminders },
});

const cloneFilters = (): VotingSearchFilters => ({
  type: [...(DEFAULT_FILTERS.type ?? [])],
  status: [...(DEFAULT_FILTERS.status ?? [])],
  dateRange: { ...(DEFAULT_FILTERS.dateRange ?? { start: '', end: '' }) },
  jurisdiction: [...(DEFAULT_FILTERS.jurisdiction ?? [])],
});

const createInitialSearch = (): VotingSearch => ({
  query: '',
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 1,
  filters: cloneFilters(),
  suggestions: [],
  recentSearches: [],
});

const createInitialSlice = (): VotingSlice => ({
  ballots: [],
  elections: [],
  votingRecords: [],
  search: createInitialSearch(),
  selectedBallot: null,
  selectedElection: null,
  currentBallot: null,
  preferences: clonePreferences(),
  isLoading: false,
  isSearching: false,
  isVoting: false,
  isUpdating: false,
  error: null,
  timerHandles: {},
});

const mergeBallot = (ballot: Ballot, updates: Partial<Ballot>): Ballot => ({
  ...ballot,
  ...updates,
});

const mergeElection = (election: Election, updates: Partial<Election>): Election => ({
  ...election,
  ...updates,
});

const mergeVotingRecord = (record: VotingRecord, updates: Partial<VotingRecord>): VotingRecord => ({
  ...record,
  ...updates,
});

const mergeVotingPreferences = (
  preferences: VotingPreferences,
  updates: Partial<VotingPreferences>
): VotingPreferences => ({
  notifications: {
    ...preferences.notifications,
    ...(updates.notifications ?? {}),
  },
  voting: {
    ...preferences.voting,
    ...(updates.voting ?? {}),
  },
  privacy: {
    ...preferences.privacy,
    ...(updates.privacy ?? {}),
  },
  reminders: {
    ...preferences.reminders,
    ...(updates.reminders ?? {}),
  },
});

const mergeSearchFilters = (
  filters: VotingSearchFilters,
  updates: Partial<VotingSearchFilters>
): VotingSearchFilters => ({
  type: updates.type ?? [...(filters.type ?? [])],
  status: updates.status ?? [...(filters.status ?? [])],
  dateRange: updates.dateRange
    ? {
        start: updates.dateRange.start ?? filters.dateRange?.start ?? '',
        end: updates.dateRange.end ?? filters.dateRange?.end ?? '',
      }
    : { ...(filters.dateRange ?? { start: '', end: '' }) },
  jurisdiction: updates.jurisdiction ?? [...(filters.jurisdiction ?? [])],
});

const mergeSearch = (search: VotingSearch, updates: Partial<VotingSearch>): VotingSearch => ({
  ...search,
  ...updates,
  filters: updates.filters ? mergeSearchFilters(search.filters, updates.filters) : search.filters,
});

const prependItem = <T>(items: T[], item: T): T[] => [item, ...items];

// -----------------------------------------------------------------------------
// Store Factory
// -----------------------------------------------------------------------------

type VotingStoreSetter = StoreApi<VotingState>['setState'];
type VotingStoreGetter = StoreApi<VotingState>['getState'];

export const createInitialVotingSlice = (overrides?: Partial<VotingSlice>): VotingSlice => ({
  ...createInitialSlice(),
  ...(overrides ?? {}),
});

export const createVotingActions = (
  set: VotingStoreSetter,
  get: VotingStoreGetter,
  initialSlice?: Partial<VotingSlice>
): VotingActions => {
  const applyImmer = (recipe: (draft: VotingState) => void) =>
    set((state) => produce(state, recipe));
  const baseActions = createBaseStoreActions<VotingState>(applyImmer);

  return {
    ...baseActions,

  // ---------------------------------------------------------------------------
  // Ballot management
  // ---------------------------------------------------------------------------
  setBallots: (ballots) => set({ ballots }),

  addBallot: (ballot) =>
    set((state) => ({
      ballots: prependItem(state.ballots, ballot),
    })),

  updateBallot: (id, updates) =>
    set((state) => ({
      ballots: state.ballots.map((ballot) => (ballot.id === id ? mergeBallot(ballot, updates) : ballot)),
    })),

  removeBallot: (id) =>
    set((state) => ({
      ballots: state.ballots.filter((ballot) => ballot.id !== id),
    })),

  setSelectedBallot: (ballot) => set({ selectedBallot: ballot }),

  setCurrentBallot: (ballot) => set({ currentBallot: ballot }),

  // ---------------------------------------------------------------------------
  // Election management
  // ---------------------------------------------------------------------------
  setElections: (elections) => set({ elections }),

  addElection: (election) =>
    set((state) => ({
      elections: prependItem(state.elections, election),
    })),

  updateElection: (id, updates) =>
    set((state) => ({
      elections: state.elections.map((election) =>
        election.id === id ? mergeElection(election, updates) : election
      ),
    })),

  removeElection: (id) =>
    set((state) => ({
      elections: state.elections.filter((election) => election.id !== id),
    })),

  setSelectedElection: (election) => set({ selectedElection: election }),

  // ---------------------------------------------------------------------------
  // Voting records
  // ---------------------------------------------------------------------------
  setVotingRecords: (records) => set({ votingRecords: records }),

  addVotingRecord: (record) =>
    set((state) => ({
      votingRecords: prependItem(state.votingRecords, record),
    })),

  updateVotingRecord: (id, updates) =>
    set((state) => ({
      votingRecords: state.votingRecords.map((record) =>
        record.id === id ? mergeVotingRecord(record, updates) : record
      ),
    })),

  removeVotingRecord: (id) =>
    set((state) => ({
      votingRecords: state.votingRecords.filter((record) => record.id !== id),
    })),

  // ---------------------------------------------------------------------------
  // Voting actions
  // ---------------------------------------------------------------------------
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

      const votingRecord = (await response.json()) as VotingRecord;

      set((state) => ({
        votingRecords: prependItem(state.votingRecords, votingRecord),
      }));

      logger.info('Vote cast successfully', {
        ballotId,
        contestId,
        selections,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to cast vote:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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
        votingRecords: state.votingRecords.map((record) =>
          record.id === recordId ? mergeVotingRecord(record, { selections }) : record
        ),
      }));

      logger.info('Vote updated successfully', {
        recordId,
        selections,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to update vote:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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
        votingRecords: state.votingRecords.filter((record) => record.id !== recordId),
      }));

      logger.info('Vote cancelled successfully', { recordId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to cancel vote:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setVoting(false);
    }
  },

  // ---------------------------------------------------------------------------
  // Search & filters
  // ---------------------------------------------------------------------------
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

      const results = (await response.json()) as {
        items: Array<Ballot | Election>;
        total: number;
      };

      set((state) => ({
        search: mergeSearch(state.search, {
          query,
          results: results.items,
          totalResults: results.total,
          currentPage: 1,
          totalPages: Math.ceil(results.total / 20) || 1,
        }),
      }));

      logger.info('Voting data searched', {
        query,
        results: results.items.length,
        total: results.total,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to search voting data:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setSearching(false);
    }
  },

  setSearchQuery: (query) =>
    set((state) => ({
      search: mergeSearch(state.search, { query }),
    })),

  clearSearch: () =>
    set(() => ({
      search: createInitialSearch(),
    })),

  setFilters: (filters) =>
    set((state) => ({
      search: mergeSearch(state.search, {
        filters: mergeSearchFilters(state.search.filters, filters),
      }),
    })),

  clearFilters: () =>
    set((state) => ({
      search: mergeSearch(state.search, {
        filters: cloneFilters(),
      }),
    })),

  // ---------------------------------------------------------------------------
  // Preferences
  // ---------------------------------------------------------------------------
  updatePreferences: (preferences) =>
    set((state) => ({
      preferences: mergeVotingPreferences(state.preferences, preferences),
    })),

  resetPreferences: () =>
    set({
      preferences: clonePreferences(),
    }),

  registerTimer: (handle) => {
    const id = `timer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    set((state) => ({
      timerHandles: {
        ...state.timerHandles,
        [id]: handle,
      },
    }));
    return id;
  },

  clearTimer: (id) => {
    const handle = get().timerHandles[id];
    if (handle) {
      clearInterval(handle);
      set((state) => {
        const nextHandles = { ...state.timerHandles };
        delete nextHandles[id];
        return { timerHandles: nextHandles };
      });
    }
  },

  clearAllTimers: () => {
    const handles = Object.values(get().timerHandles);
    handles.forEach((handle) => clearInterval(handle));
    set({ timerHandles: {} });
  },

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
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

      const ballots = (await response.json()) as Ballot[];
      set({ ballots });

      logger.info('Ballots loaded', {
        electionId,
        count: ballots.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load ballots:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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

      const elections = (await response.json()) as Election[];
      set({ elections });

      logger.info('Elections loaded', {
        count: elections.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load elections:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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

      const records = (await response.json()) as VotingRecord[];
      set({ votingRecords: records });

      logger.info('Voting records loaded', {
        count: records.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load voting records:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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

      const ballot = (await response.json()) as Ballot;
      set({ selectedBallot: ballot });

      logger.info('Ballot loaded', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load ballot:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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

      const election = (await response.json()) as Election;
      set({ selectedElection: election });

      logger.info('Election loaded', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load election:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
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

      const votingRecord = (await response.json()) as VotingRecord;

      set((state) => ({
        votingRecords: prependItem(state.votingRecords, votingRecord),
      }));

      logger.info('Ballot submitted successfully', {
        ballotId,
        votes: Object.keys(votes).length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to submit ballot:', error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setVoting(false);
    }
  },

  clearUserVotingSession: () =>
    set((state) => ({
      ballots: [],
      selectedBallot: null,
      currentBallot: null,
      search: mergeSearch(state.search, {
        filters: cloneFilters(),
      }),
    })),

  reset: () => {
    get().clearAllTimers();
    get().resetPreferences();
    set({
      ...createInitialVotingSlice(initialSlice),
      preferences: clonePreferences(),
    });
    logger.info('Voting store reset');
  },

  // ---------------------------------------------------------------------------
  // Loading/error flags
  // ---------------------------------------------------------------------------
  setSearching: (searching) => set({ isSearching: searching }),
  setVoting: (voting) => set({ isVoting: voting }),
  setUpdating: (updating) => set({ isUpdating: updating }),
  };
};

export const createVotingStoreState = (
  set: VotingStoreSetter,
  get: VotingStoreGetter,
  initialSlice?: Partial<VotingSlice>
): VotingState => ({
  ...createInitialVotingSlice(initialSlice),
  ...createVotingActions(set, get, initialSlice),
});

export const createVotingStore = (initialState?: Partial<VotingSlice>) =>
  createStore<VotingState>()(
    devtools(
      persist(
        (set, get) => createVotingStoreState(set, get, initialState),
        {
          name: 'voting-store',
          storage: createSafeStorage(),
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

export const votingStore = createVotingStore();
export type VotingStoreApi = typeof votingStore;

export const useVotingStore = <T>(selector: (state: VotingState) => T): T =>
  useStore(votingStore, selector);

export const getVotingState = () => votingStore.getState();

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

export const votingStoreSelectors = {
  ballots: (state: VotingState) => state.ballots,
  elections: (state: VotingState) => state.elections,
  votingRecords: (state: VotingState) => state.votingRecords,
  search: (state: VotingState) => state.search,
  selectedBallot: (state: VotingState) => state.selectedBallot,
  selectedElection: (state: VotingState) => state.selectedElection,
  currentBallot: (state: VotingState) => state.currentBallot,
  preferences: (state: VotingState) => state.preferences,
  isLoading: (state: VotingState) => state.isLoading,
  error: (state: VotingState) => state.error,
  isVoting: (state: VotingState) => state.isVoting,
  isSearching: (state: VotingState) => state.isSearching,
  isUpdating: (state: VotingState) => state.isUpdating,
} as const;

export const useBallots = () => useVotingStore(votingStoreSelectors.ballots);
export const useElections = () => useVotingStore(votingStoreSelectors.elections);
export const useVotingRecords = () => useVotingStore(votingStoreSelectors.votingRecords);
export const useVotingSearch = () => useVotingStore(votingStoreSelectors.search);
export const useSelectedBallot = () => useVotingStore(votingStoreSelectors.selectedBallot);
export const useSelectedElection = () => useVotingStore(votingStoreSelectors.selectedElection);
export const useCurrentBallot = () => useVotingStore(votingStoreSelectors.currentBallot);
export const useVotingPreferences = () => useVotingStore(votingStoreSelectors.preferences);
export const useVotingLoading = () => useVotingStore(votingStoreSelectors.isLoading);
export const useVotingError = () => useVotingStore(votingStoreSelectors.error);
export const useVotingIsVoting = () => useVotingStore(votingStoreSelectors.isVoting);
export const useVotingIsSearching = () => useVotingStore(votingStoreSelectors.isSearching);
export const useVotingIsUpdating = () => useVotingStore(votingStoreSelectors.isUpdating);

export const useVotingActions = () =>
  useStoreWithEqualityFn(
    votingStore,
    (state) => ({
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
      clearUserVotingSession: state.clearUserVotingSession,
      registerTimer: state.registerTimer,
      clearTimer: state.clearTimer,
      clearAllTimers: state.clearAllTimers,
      reset: state.reset,
    }),
    shallow
  );

export const useVotingStats = () =>
  useVotingStore((state) => ({
    totalBallots: state.ballots.length,
    totalElections: state.elections.length,
    totalVotingRecords: state.votingRecords.length,
    upcomingElections: state.elections.filter((election) => election.status === 'upcoming').length,
    activeElections: state.elections.filter((election) => election.status === 'active').length,
    searchResults: state.search.results.length,
    isLoading: state.isLoading,
    isVoting: state.isVoting,
    error: state.error,
  }));

export const useUpcomingElections = () =>
  useVotingStore((state) => state.elections.filter((election) => election.status === 'upcoming'));

export const useActiveElections = () =>
  useVotingStore((state) => state.elections.filter((election) => election.status === 'active'));

export const useUserVotingHistory = () =>
  useVotingStore((state) =>
    [...state.votingRecords].sort(
      (a, b) => new Date(b.votedAt).getTime() - new Date(a.votedAt).getTime()
    )
  );

// -----------------------------------------------------------------------------
// Store Utilities
// -----------------------------------------------------------------------------

export const votingStoreUtils = {
  getVotingSummary: () => {
    const state = votingStore.getState();
    return {
      totalBallots: state.ballots.length,
      totalElections: state.elections.length,
      totalVotingRecords: state.votingRecords.length,
      searchResults: state.search.results.length,
      preferences: state.preferences,
    };
  },

  getElectionsByType: (type: string) => {
    const state = votingStore.getState();
    return state.elections.filter((election) => election.type === type);
  },

  getBallotsByElection: (electionId: string) => {
    const state = votingStore.getState();
    return state.ballots.filter((ballot) => ballot.electionId === electionId);
  },

  getVotingRecordsByElection: (electionId: string) => {
    const state = votingStore.getState();
    return state.votingRecords.filter(
      (record) =>
        state.ballots.find((ballot) => ballot.id === record.ballotId)?.electionId === electionId
    );
  },

  getUpcomingElections: () => {
    const state = votingStore.getState();
    const now = new Date();
    return state.elections
      .filter((election) => new Date(election.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
};

// -----------------------------------------------------------------------------
// Subscriptions
// -----------------------------------------------------------------------------

export const votingStoreSubscriptions = {
  onBallotsChange: (callback: (ballots: Ballot[]) => void) =>
    votingStore.subscribe((state, prevState) => {
      if (state.ballots !== prevState.ballots) {
        callback(state.ballots);
      }
    }),

  onElectionsChange: (callback: (elections: Election[]) => void) =>
    votingStore.subscribe((state, prevState) => {
      if (state.elections !== prevState.elections) {
        callback(state.elections);
      }
    }),

  onVotingRecordsChange: (callback: (records: VotingRecord[]) => void) =>
    votingStore.subscribe((state, prevState) => {
      if (state.votingRecords !== prevState.votingRecords) {
        callback(state.votingRecords);
      }
    }),
};

// -----------------------------------------------------------------------------
// Debug Utilities
// -----------------------------------------------------------------------------

export const votingStoreDebug = {
  logState: () => {
    const state = votingStore.getState();
    logger.debug('Voting Store State', {
      totalBallots: state.ballots.length,
      totalElections: state.elections.length,
      totalVotingRecords: state.votingRecords.length,
      searchResults: state.search.results.length,
      selectedBallot: state.selectedBallot?.title ?? 'none',
      selectedElection: state.selectedElection?.name ?? 'none',
      isLoading: state.isLoading,
      isVoting: state.isVoting,
      error: state.error,
    });
  },

  logSummary: () => {
    const summary = votingStoreUtils.getVotingSummary();
    logger.debug('Voting Summary', summary);
  },

  logElectionsByType: () => {
    const state = votingStore.getState();
    const byType = state.elections.reduce((acc, election) => {
      acc[election.type] = (acc[election.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    logger.debug('Elections by Type', byType);
  },

  reset: () => {
    votingStore.getState().reset();
  },
};


