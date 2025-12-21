import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import type { PollRow, PollUpdate } from '@/features/polls/types';

import {
  createPollRequest,
  type PollCreatePayload,
  type PollCreateRequestResult,
  type PollUndoVoteRequestResult,
  type PollVoteRequestResult,
  undoVoteRequest,
  voteOnPollRequest,
} from '@/lib/polls/api';
import {
  createDefaultPollFilters,
  createDefaultPollPreferences,
} from '@/lib/polls/defaults';
import { createPollCardView } from '@/lib/polls/transformers';
import type { PollFilters, PollPreferences } from '@/lib/polls/types';
import {
  derivePollAnalytics,
  isValidPollStatus,
  resolveNextStatus,
  validatePollFilters,
  type PollStatusTransition,
} from '@/lib/polls/validation';
import { logger } from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { notificationStoreUtils } from './notificationStore';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';

export type { PollFilters, PollPreferences } from '@/lib/polls/types';
export type { PollCardView } from '@/lib/polls/transformers';

export type PollVoteHistoryEntry = {
  hasVoted: boolean;
  optionId: string | null;
  voteId: string | null;
  lastVotedAt: string | null;
  source: 'server' | 'client';
};

export type PollSearch = {
  query: string;
  results: PollRow[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  suggestions: string[];
  recentSearches: string[];
};

export type PollUIState = {
  selectedPollId: string | null;
  expandedPollIds: string[];
  votingInProgress: string[];
};

export type PollsState = {
  polls: PollRow[];
  uiState: PollUIState;
  filters: PollFilters;
  preferences: PollPreferences;
  search: PollSearch;
  isLoading: boolean;
  isSearching: boolean;
  isVoting: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  voteHistory: Record<string, PollVoteHistoryEntry>;
};

export type PollsActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  setVoting: (voting: boolean) => void;
  setSearching: (searching: boolean) => void;
  resetPollsState: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  setSortBy: (sortBy: PollPreferences['sortBy']) => void;
  setItemsPerPage: (count: number) => void;
  setTrendingOnly: (trending: boolean) => void;

  setPolls: (polls: PollRow[]) => void;
  addPoll: (poll: PollRow) => void;
  updatePoll: (id: string, updates: PollUpdate) => void;
  removePoll: (id: string) => void;

  publishPoll: (id: string) => void;
  closePoll: (id: string) => void;
  archivePoll: (id: string) => void;

  voteOnPoll: (pollId: string, optionId: string, options?: VoteOnPollOptions) => Promise<PollVoteRequestResult>;
  undoVote: (pollId: string, options?: UndoVoteOptions) => Promise<PollUndoVoteRequestResult>;

  setFilters: (filters: Partial<PollFilters>) => void;
  clearFilters: () => void;
  searchPolls: (query: string) => Promise<void>;
  clearSearch: () => Promise<void>;

  selectPoll: (pollId: string | null) => void;
  togglePollExpanded: (pollId: string) => void;
  setView: (view: PollPreferences['defaultView']) => void;

  updatePreferences: (preferences: Partial<PollPreferences>) => void;
  resetPreferences: () => void;

  loadPolls: (options?: LoadPollsOptions) => Promise<void>;
  loadPoll: (id: string) => Promise<void>;
  createPoll: (payload: PollCreatePayload, options?: CreatePollOptions) => Promise<PollCreateRequestResult>;

  getPollById: (id: string) => PollRow | undefined;
  getFilteredPolls: () => PollRow[];
  canUserVote: (pollId: string) => boolean;
  hasUserVoted: (pollId: string) => boolean;
  getActivePollsCount: () => number;
};

export type PollsStore = PollsState & PollsActions;

type PollsStoreCreator = StateCreator<
  PollsStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

export type LoadPollsOptions = {
  status?: string[];
  category?: string[];
  tags?: string[];
  search?: string;
  sortBy?: PollPreferences['sortBy'];
  viewMode?: PollPreferences['defaultView'];
  page?: number;
  trendingOnly?: boolean;
};

export type CreatePollOptions = {
  signal?: AbortSignal;
  request?: (payload: PollCreatePayload, signal?: AbortSignal) => Promise<PollCreateRequestResult>;
};

export type VoteOnPollOptions = {
  signal?: AbortSignal;
  request?: (pollId: string, optionId: string, signal?: AbortSignal) => Promise<PollVoteRequestResult>;
};

export type UndoVoteOptions = {
  signal?: AbortSignal;
  request?: (pollId: string, signal?: AbortSignal) => Promise<PollUndoVoteRequestResult>;
};

const createDefaultFilters = (): PollFilters => createDefaultPollFilters();

const createDefaultPreferences = (): PollPreferences => createDefaultPollPreferences();

const createDefaultSearch = (): PollSearch => ({
  query: '',
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 1,
  suggestions: [],
  recentSearches: [],
});

const createDefaultUIState = (): PollUIState => ({
  selectedPollId: null,
  expandedPollIds: [],
  votingInProgress: [],
});

export const initialPollsState: PollsState = {
  polls: [],
  uiState: createDefaultUIState(),
  filters: createDefaultFilters(),
  preferences: createDefaultPreferences(),
  search: createDefaultSearch(),
  isLoading: false,
  isSearching: false,
  isVoting: false,
  error: null,
  lastFetchedAt: null,
  voteHistory: {},
};

export const createInitialPollsState = (): PollsState => ({
  polls: [],
  uiState: createDefaultUIState(),
  filters: createDefaultFilters(),
  preferences: createDefaultPreferences(),
  search: createDefaultSearch(),
  isLoading: false,
  isSearching: false,
  isVoting: false,
  error: null,
  lastFetchedAt: null,
  voteHistory: {},
});

const transitionPollStatus = (
  poll: PollRow,
  transition: PollStatusTransition,
  extraUpdates?: Partial<PollRow>,
) => {
  const currentStatus = typeof poll.status === 'string' ? poll.status : 'draft';
  const nextStatus = resolveNextStatus(currentStatus, transition);

  if (!nextStatus) {
    logger.warn('Invalid poll status transition attempted', {
      pollId: poll.id,
      currentStatus,
      transition,
    });
    return;
  }

  if (extraUpdates) {
    Object.assign(poll, extraUpdates);
  }

  poll.status = nextStatus;
  if (transition === 'close') {
    poll.closed_at = extraUpdates?.closed_at ?? new Date().toISOString();
  }
  if (transition === 'publish' || transition === 'reopen') {
    poll.closed_at = null;
  }
  poll.updated_at = new Date().toISOString();
};

export const createPollsActions = (
  set: Parameters<PollsStoreCreator>[0],
  get: Parameters<PollsStoreCreator>[1]
): PollsActions => {
  const setState = set as unknown as (recipe: (draft: PollsState) => void) => void;

  const { setLoading, setError, clearError } = createBaseStoreActions<PollsState>(setState);

  const normalizePollStatus = (poll: PollRow) => {
    if (!isValidPollStatus(poll.status ?? '')) {
      poll.status = 'draft';
    }
  };

  const setVoting = (voting: boolean) =>
    setState((state) => {
      state.isVoting = voting;
    });

  const setSearching = (searching: boolean) =>
    setState((state) => {
      state.isSearching = searching;
    });

  const resetPollsState = () =>
    setState((state) => {
      state.polls = [];
      state.uiState = createDefaultUIState();
      state.filters = createDefaultFilters();
      state.preferences = createDefaultPreferences();
      state.search = createDefaultSearch();
      state.isLoading = false;
      state.isSearching = false;
      state.isVoting = false;
      state.error = null;
      state.lastFetchedAt = null;
      state.voteHistory = {};
    });

  const coerceString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

  const readBoolean = (value: unknown): boolean | undefined =>
    typeof value === 'boolean' ? value : undefined;

  type VoteHistorySignal =
    | { kind: 'entry'; entry: PollVoteHistoryEntry }
    | { kind: 'clear' }
    | { kind: 'none' };

  const resolveVoteHistorySignal = (poll: PollRow): VoteHistorySignal => {
    const meta = poll as Record<string, unknown>;
    const optionId =
      coerceString(meta.userVote) ??
      coerceString(meta.user_vote) ??
      coerceString(meta.userVoteOptionId) ??
      coerceString(meta.user_vote_option_id);
    const voteId =
      coerceString(meta.userVoteId) ??
      coerceString(meta.user_vote_id) ??
      coerceString(meta.voteId);
    const lastVotedAt =
      coerceString(meta.userVotedAt) ??
      coerceString(meta.user_voted_at) ??
      coerceString(meta.lastVotedAt) ??
      coerceString(meta.last_voted_at);
    const hasVotedFlag = readBoolean(meta.userHasVoted) ?? readBoolean(meta.user_has_voted);
    const hasVoted = hasVotedFlag ?? Boolean(optionId ?? voteId);

    if (hasVoted) {
      return {
        kind: 'entry',
        entry: {
          hasVoted: true,
          optionId: optionId ?? null,
          voteId: voteId ?? null,
          lastVotedAt: lastVotedAt ?? null,
          source: 'server',
        },
      };
    }

    if (hasVotedFlag === false) {
      return { kind: 'clear' };
    }

    return { kind: 'none' };
  };

  const syncVoteHistoryFromPoll = (state: PollsState, poll: PollRow) => {
    const signal = resolveVoteHistorySignal(poll);
    if (signal.kind === 'entry') {
      state.voteHistory[poll.id] = signal.entry;
      return;
    }
    if (signal.kind === 'clear' && state.voteHistory[poll.id]) {
      delete state.voteHistory[poll.id];
    }
  };

  const recordClientVote = (pollId: string, optionId: string, voteId?: string) =>
    setState((state) => {
      state.voteHistory[pollId] = {
        hasVoted: true,
        optionId,
        voteId: voteId ?? null,
        lastVotedAt: new Date().toISOString(),
        source: 'client',
      };
    });

  const clearClientVote = (pollId: string) =>
    setState((state) => {
      if (state.voteHistory[pollId]) {
        delete state.voteHistory[pollId];
      }
    });

  const notifySuccess = (title: string, message: string) =>
    notificationStoreUtils.createSuccessWithSettings(title, message);

  const notifyError = (title: string, message: string) =>
    notificationStoreUtils.createErrorWithSettings(title, message);

  const setSearchQuery = (query: string) =>
    setState((state) => {
      state.search.query = query;
      if (query.trim().length > 0) {
        const existing = state.search.recentSearches.filter(
          (entry) => entry.toLowerCase() !== query.toLowerCase()
        );
        state.search.recentSearches = [query, ...existing].slice(0, 10);
      }
    });

  const setCurrentPage = (page: number) =>
    setState((state) => {
      const nextPage = Math.max(1, page);
      state.search.currentPage = nextPage;
    });

  const setSortBy = (sortBy: PollPreferences['sortBy']) =>
    setState((state) => {
      state.preferences.sortBy = sortBy;
    });

  const setItemsPerPage = (count: number) =>
    setState((state) => {
      const next = Math.max(1, count);
      state.preferences.itemsPerPage = next;
      if (state.search.totalResults > 0) {
        state.search.totalPages = Math.max(1, Math.ceil(state.search.totalResults / next));
      }
    });

  const setTrendingOnly = (trending: boolean) =>
    setState((state) => {
      state.filters.trendingOnly = trending;
    });

  const setPolls = (polls: PollRow[]) =>
    setState((state) => {
      state.polls = polls.map((poll) => {
        const next = { ...poll };
        normalizePollStatus(next);
        syncVoteHistoryFromPoll(state, next);
        return next;
      });
      state.lastFetchedAt = new Date().toISOString();
    });

  const addPoll = (poll: PollRow) =>
    setState((state) => {
      const next = { ...poll };
      normalizePollStatus(next);
      syncVoteHistoryFromPoll(state, next);
      state.polls.unshift(next);
    });

  const updatePoll = (id: string, updates: PollUpdate) =>
    setState((state) => {
      const target = state.polls.find((poll) => poll.id === id);
      if (target) {
        Object.assign(target, updates);
        normalizePollStatus(target);
        syncVoteHistoryFromPoll(state, target);
      }
    });

  const removePoll = (id: string) =>
    setState((state) => {
      state.polls = state.polls.filter((poll) => poll.id !== id);
      if (state.voteHistory[id]) {
        delete state.voteHistory[id];
      }
    });

  const publishPoll = (id: string) =>
    setState((state) => {
      const target = state.polls.find((poll) => poll.id === id);
      if (target) {
        transitionPollStatus(target, 'publish');
      }
    });

  const closePoll = (id: string) =>
    setState((state) => {
      const target = state.polls.find((poll) => poll.id === id);
      if (target) {
        transitionPollStatus(target, 'close');
      }
    });

  const archivePoll = (id: string) =>
    setState((state) => {
      const target = state.polls.find((poll) => poll.id === id);
      if (target) {
        transitionPollStatus(target, 'archive');
      }
    });

  const voteOnPoll = async (
    pollId: string,
    optionId: string,
    options?: VoteOnPollOptions,
  ): Promise<PollVoteRequestResult> => {
    setVoting(true);
    clearError();

    setState((state) => {
      if (!state.uiState.votingInProgress.includes(pollId)) {
        state.uiState.votingInProgress.push(pollId);
      }
    });

    const request = options?.request ?? voteOnPollRequest;
    const signal = options?.signal;

    try {
      const result = await request(pollId, optionId, signal);

      if (!result.success) {
        if (result.reason !== 'cancelled') {
          setError(result.message);
          logger.error('Failed to vote on poll', {
            pollId,
            optionId,
            status: result.status,
            reason: result.reason,
            details: result.details,
            fieldErrors: result.fieldErrors,
          });
          notifyError('Unable to record vote', result.message);
        }
        return result;
      }

      setState((state) => {
        const poll = state.polls.find((item) => item.id === pollId);
        if (poll) {
          const nextTotal =
            result.data.totalVotes !== undefined
              ? result.data.totalVotes
              : (poll.total_votes ?? 0) + 1;
          poll.total_votes = Math.max(0, nextTotal);
          poll.updated_at = new Date().toISOString();
          syncVoteHistoryFromPoll(state, poll);
        }
      });

      recordClientVote(pollId, optionId, result.data.voteId);

      logger.info('Vote cast successfully', {
        pollId,
        optionId,
        durationMs: result.durationMs,
      });

      notifySuccess('Vote recorded', result.message ?? 'Thanks for sharing your opinion!');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record vote. Please try again.';
      setError(message);
      logger.error('Failed to vote on poll', { pollId, optionId, error });
      notifyError('Unable to record vote', message);
      return {
        success: false,
        status: 0,
        message,
        reason: 'network',
        details: error instanceof Error ? { name: error.name, message: error.message } : error,
      };
    } finally {
      setVoting(false);
      setState((state) => {
        state.uiState.votingInProgress = state.uiState.votingInProgress.filter((id) => id !== pollId);
      });
    }
  };

  const undoVote = async (pollId: string, options?: UndoVoteOptions): Promise<PollUndoVoteRequestResult> => {
    setVoting(true);
    clearError();

    setState((state) => {
      if (!state.uiState.votingInProgress.includes(pollId)) {
        state.uiState.votingInProgress.push(pollId);
      }
    });

    const request = options?.request ?? undoVoteRequest;
    const signal = options?.signal;

    try {
      const result = await request(pollId, signal);

      if (!result.success) {
        if (result.reason !== 'cancelled') {
          setError(result.message);
          logger.error('Failed to undo vote', {
            pollId,
            status: result.status,
            reason: result.reason,
            details: result.details,
            fieldErrors: result.fieldErrors,
          });
          notifyError('Unable to undo vote', result.message);
        }
        return result;
      }

      setState((state) => {
        const poll = state.polls.find((item) => item.id === pollId);
        if (poll) {
          const nextTotal =
            result.data.totalVotes !== undefined ? result.data.totalVotes : Math.max(0, (poll.total_votes ?? 0) - 1);
          poll.total_votes = Math.max(0, nextTotal);
          poll.updated_at = new Date().toISOString();
          syncVoteHistoryFromPoll(state, poll);
        }
      });

      clearClientVote(pollId);

      notifySuccess('Vote undone', result.message ?? 'You can now submit a new response.');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to undo vote. Please try again.';
      setError(message);
      logger.error('Failed to undo vote', { pollId, error });
      notifyError('Unable to undo vote', message);
      return {
        success: false,
        status: 0,
        message,
        reason: 'network',
        details: error instanceof Error ? { name: error.name, message: error.message } : error,
      };
    } finally {
      setVoting(false);
      setState((state) => {
        state.uiState.votingInProgress = state.uiState.votingInProgress.filter((id) => id !== pollId);
      });
    }
  };

  const setFilters = (nextFilters: Partial<PollFilters>) => {
    const currentFilters = get().filters;
    const { filters: normalized, errors, warnings } = validatePollFilters({
      ...currentFilters,
      ...nextFilters,
    });

    setState((state) => {
      state.filters = normalized;
    });

    if (Object.keys(errors).length > 0) {
      logger.warn('Poll filters normalized with corrections', { errors });
    }

    if (warnings.length > 0) {
      logger.info('Poll filters applied with warnings', { warnings });
    }
  };

  const clearFilters = () =>
    setState((state) => {
      state.filters = createDefaultFilters();
    });

  const searchPolls = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setSearching(true);
    await loadPolls({ search: query, page: 1 });
    setState((state) => {
      state.search.results = [...state.polls];
    });
    setSearching(false);
  };

  const clearSearch = async () => {
    setSearchQuery('');
    setCurrentPage(1);
    setState((state) => {
      state.search.results = [];
      state.search.totalResults = 0;
      state.search.totalPages = 1;
    });
    await loadPolls({ search: '', page: 1 });
  };

  const selectPoll = (pollId: string | null) =>
    setState((state) => {
      state.uiState.selectedPollId = pollId;
    });

  const togglePollExpanded = (pollId: string) =>
    setState((state) => {
      const expanded = state.uiState.expandedPollIds;
      if (expanded.includes(pollId)) {
        state.uiState.expandedPollIds = expanded.filter((id) => id !== pollId);
      } else {
        state.uiState.expandedPollIds.push(pollId);
      }
    });

  const setView = (view: PollPreferences['defaultView']) =>
    setState((state) => {
      state.preferences.defaultView = view;
    });

  const updatePreferences = (preferences: Partial<PollPreferences>) =>
    setState((state) => {
      Object.assign(state.preferences, preferences);
    });

  const resetPreferences = () =>
    setState((state) => {
      state.preferences = createDefaultPreferences();
    });

  const loadPolls = async (options?: LoadPollsOptions) => {
    // eslint-disable-next-line no-console
    console.log('[POLLS STORE] loadPolls called', { options });
    setLoading(true);
    clearError();

    try {
      const { filters, preferences, search } = get();
      const { filters: baseFilters } = validatePollFilters(filters);
      const { filters: effectiveFilters, errors: filterErrors } = validatePollFilters({
        ...baseFilters,
        status: options?.status ?? baseFilters.status,
        category: options?.category ?? baseFilters.category,
        tags: options?.tags ?? baseFilters.tags,
        trendingOnly: options?.trendingOnly ?? baseFilters.trendingOnly,
      });

      if (Object.keys(filterErrors).length > 0) {
        logger.warn('Load polls: filters normalized with corrections', { errors: filterErrors });
      }

      const params = new URLSearchParams();

      const status = effectiveFilters.status;
      const categories = effectiveFilters.category;
      const tags = effectiveFilters.tags;
      const searchQuery = options?.search ?? search.query;
      const sortBy = options?.sortBy ?? preferences.sortBy;
      const viewMode = options?.viewMode ?? preferences.defaultView;
      const page = options?.page ?? search.currentPage;
      const trendingOnly = effectiveFilters.trendingOnly;

      if (status.length > 0) {
        params.append('status', status.join(','));
      }
      if (categories.length > 0) {
        params.append('category', categories.join(','));
      }
      if (tags.length > 0) {
        params.append('tags', tags.join(','));
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }
      if (viewMode) {
        params.append('view_mode', viewMode);
      }
      if (page && page > 1) {
        params.append('page', String(page));
      }
      params.append('limit', String(preferences.itemsPerPage));
      if (trendingOnly) {
        params.append('trending', 'true');
      }

      const apiUrl = `/api/polls?${params.toString()}`;
      // Diagnostic logging for production debugging
      // eslint-disable-next-line no-console
      console.log('[POLLS STORE] Fetching polls from API', { url: apiUrl });
      // Add timeout to prevent infinite loading state
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30_000); // 30 second timeout
      let response: Response;
      try {
        response = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Re-throw abort errors as timeout errors with clearer message
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout - polls API took too long to respond');
        }
        // Re-throw other fetch errors (network errors, etc.)
        throw fetchError;
      }

      if (!response.ok) {
        logger.error('Polls API returned error', { status: response.status, statusText: response.statusText });
        throw new Error(`Failed to load polls: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { polls?: PollRow[] };
        metadata?: {
          pagination?: {
            total?: number;
            totalPages?: number;
            page?: number;
          };
        };
      };

      const polls = payload?.data?.polls ?? [];
      const paginationMeta = payload?.metadata?.pagination;

      if (!Array.isArray(polls)) {
        throw new Error('Malformed polls response');
      }

      setPolls(polls);
      setState((state) => {
        const totalResults =
          typeof paginationMeta?.total === 'number'
            ? paginationMeta.total
            : polls.length;
        const totalPages =
          typeof paginationMeta?.totalPages === 'number'
            ? paginationMeta.totalPages
            : Math.max(1, Math.ceil(totalResults / Math.max(1, state.preferences.itemsPerPage)));

        state.search.totalResults = totalResults;
        state.search.totalPages = totalPages;
        state.search.currentPage = paginationMeta?.page ?? page;
        if (options?.search !== undefined) {
          state.search.query = searchQuery;
        }
        if (
          options?.status !== undefined ||
          options?.category !== undefined ||
          options?.tags !== undefined ||
          options?.trendingOnly !== undefined
        ) {
          state.filters = effectiveFilters;
        }
      });

      logger.debug('Polls loaded', {
        status,
        categories,
        tags,
        search: searchQuery,
        sortBy,
        trendingOnly,
        count: polls.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      logger.error('Failed to load polls', { error, options, message });
      // Ensure loading state is cleared even on timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timeout - polls API took too long to respond');
      }
    } finally {
      // Diagnostic logging for production debugging
      // eslint-disable-next-line no-console
      console.log('[POLLS STORE] loadPolls finally block - setting isLoading to false');
      setLoading(false);
    }
  };

  const loadPoll = async (id: string) => {
    setLoading(true);
    clearError();

    try {
      const response = await fetch(`/api/polls/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load poll');
      }

      const payload = (await response.json()) as { success?: boolean; data?: PollRow };
      const poll = payload?.data;

      if (!poll) {
        throw new Error('Malformed poll response');
      }

      setState((state) => {
        const existing = state.polls.findIndex((item) => item.id === id);
        const next = { ...poll };
        normalizePollStatus(next);
        if (existing >= 0) {
          state.polls[existing] = next;
        } else {
          state.polls.unshift(next);
        }
        syncVoteHistoryFromPoll(state, next);
      });

      selectPoll(id);

      logger.info('Poll loaded', { id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      logger.error('Failed to load poll', { error, id });
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (
    payload: PollCreatePayload,
    options?: CreatePollOptions,
  ): Promise<PollCreateRequestResult> => {
    setLoading(true);
    clearError();

    const request = options?.request ?? createPollRequest;
    const signal = options?.signal;

    try {
      const result = await request(payload, signal);

      if (!result.success) {
        if (result.reason !== 'cancelled') {
          setError(result.message);
          logger.error('Failed to create poll', {
            status: result.status,
            reason: result.reason,
            details: result.details,
            fieldErrors: result.fieldErrors,
          });
          notifyError('Unable to create poll', result.message);
        }
        return result;
      }

      clearError();

      if (result.data.id) {
        void loadPoll(result.data.id).catch((error) => {
          logger.warn('Unable to hydrate poll after creation', {
            pollId: result.data.id,
            error: error instanceof Error ? error.message : error,
          });
        });
      }

      notifySuccess('Poll created', result.message ?? 'Your poll is now available to voters.');
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create poll. Please try again.';
      setError(message);
      logger.error('Failed to create poll', { error });
      notifyError('Unable to create poll', message);
      return {
        success: false,
        status: 0,
        message,
        reason: 'network',
        details: error instanceof Error ? { name: error.name, message: error.message } : error,
      };
    } finally {
      setLoading(false);
    }
  };

  const getPollById = (pollId: string) => get().polls.find((poll) => poll.id === pollId);

  const getFilteredPolls = () => {
    const { polls, filters } = get();
    return polls.filter((poll) => {
      if (filters.status.length > 0 && poll.status && !filters.status.includes(poll.status)) {
        return false;
      }

      if (filters.category.length > 0 && poll.category && !filters.category.includes(poll.category)) {
        return false;
      }

      if (filters.tags.length > 0 && poll.tags) {
        const pollTags = Array.isArray(poll.tags) ? poll.tags : [];
        if (!filters.tags.some((tag) => pollTags.includes(tag))) {
          return false;
        }
      }

      if (filters.trendingOnly) {
        const trendingPosition = (poll as PollRow & { trending_position?: number }).trending_position;
        if (!(typeof trendingPosition === 'number' && trendingPosition > 0)) {
          return false;
        }
      }

      return true;
    });
  };

  const canUserVote = (pollId: string) => {
    const poll = getPollById(pollId);
    if (!poll) {
      return false;
    }

    return poll.status === 'active' && !poll.closed_at;
  };

  const hasUserVoted = (pollId: string) => {
    const historyEntry = get().voteHistory[pollId];
    if (historyEntry) {
      return historyEntry.hasVoted;
    }
    const poll = getPollById(pollId);
    if (!poll) {
    return false;
    }
    const signal = resolveVoteHistorySignal(poll);
    return signal.kind === 'entry' ? signal.entry.hasVoted : false;
  };

  const getActivePollsCount = () => get().polls.filter((poll) => poll.status === 'active').length;

  return {
    setLoading,
    setError,
    clearError,
    setVoting,
    setSearching,
    resetPollsState,
    setSearchQuery,
    setCurrentPage,
    setSortBy,
    setItemsPerPage,
    setTrendingOnly,
    setPolls,
    addPoll,
    updatePoll,
    removePoll,
    publishPoll,
    closePoll,
    archivePoll,
    voteOnPoll,
    undoVote,
    setFilters,
    clearFilters,
    searchPolls,
    clearSearch,
    selectPoll,
    togglePollExpanded,
    setView,
    updatePreferences,
    resetPreferences,
    loadPolls,
    loadPoll,
    createPoll,
    getPollById,
    getFilteredPolls,
    canUserVote,
    hasUserVoted,
    getActivePollsCount,
  } satisfies PollsActions;
};

export const pollsStoreCreator: PollsStoreCreator = (set, get) =>
  Object.assign(createInitialPollsState(), createPollsActions(set, get));

export const usePollsStore = create<PollsStore>()(
  devtools(
    persist(
      immer(pollsStoreCreator),
      {
        name: 'polls-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters,
          search: {
            query: state.search.query,
            recentSearches: state.search.recentSearches,
          },
          voteHistory: state.voteHistory,
        }),
      }
    ),
    { name: 'polls-store' }
  )
);

export const usePolls = () => usePollsStore((state) => state.polls);
export const usePollsLoading = () => usePollsStore((state) => state.isLoading);
export const usePollsError = () => usePollsStore((state) => state.error);
export const usePollPreferences = () => usePollsStore((state) => state.preferences);
export const usePollFilters = () => {
  const filters = usePollsStore(useShallow((state) => state.filters));
  return useMemo(() => filters, [filters]);
};
export const usePollLastFetchedAt = () => usePollsStore((state) => state.lastFetchedAt);
export const usePollPagination = () => {
  const { currentPage, totalPages, totalResults, itemsPerPage } = usePollsStore(
    useShallow((state) => ({
      currentPage: state.search.currentPage,
      totalPages: state.search.totalPages,
      totalResults: state.search.totalResults,
      itemsPerPage: state.preferences.itemsPerPage,
    })),
  );
  return useMemo(
    () => ({
      currentPage,
      totalPages,
      totalResults,
      itemsPerPage,
    }),
    [currentPage, totalPages, totalResults, itemsPerPage],
  );
};

export const useFilteredPolls = () => usePollsStore((state) => state.getFilteredPolls());
export const useFilteredPollCards = () => {
  // Use a single selector with useShallow to get all needed data at once
  // This minimizes the number of store subscriptions and ensures atomic updates
  const storeData = usePollsStore(
    useShallow((state) => ({
      polls: state.polls,
      filterStatus: state.filters.status,
      filterCategory: state.filters.category,
      filterTags: state.filters.tags,
      filterTrendingOnly: state.filters.trendingOnly,
    }))
  );

  // Memoize the filtered and transformed result
  // useShallow ensures we only recalculate when the actual data changes
  return useMemo(() => {
    const filtered = storeData.polls.filter((poll) => {
      if (storeData.filterStatus.length > 0 && poll.status && !storeData.filterStatus.includes(poll.status)) {
        return false;
      }
      if (storeData.filterCategory.length > 0 && poll.category && !storeData.filterCategory.includes(poll.category)) {
        return false;
      }
      if (storeData.filterTags.length > 0 && poll.tags) {
        const pollTags = Array.isArray(poll.tags) ? poll.tags : [];
        if (!storeData.filterTags.some((tag) => pollTags.includes(tag))) {
          return false;
        }
      }
      if (storeData.filterTrendingOnly) {
        const trendingPosition = (poll as PollRow & { trending_position?: number }).trending_position;
        if (!(typeof trendingPosition === 'number' && trendingPosition > 0)) {
          return false;
        }
      }
      return true;
    });

    return filtered.map(createPollCardView);
  }, [storeData]);
};
export const useActivePollsCount = () => usePollsStore((state) => state.getActivePollsCount());
export const usePollById = (id: string) => usePollsStore((state) => state.getPollById(id));
export const useSelectedPoll = () => {
  const selectedId = usePollsStore((state) => state.uiState.selectedPollId);
  return usePollsStore((state) => (selectedId ? state.getPollById(selectedId) : null));
};
export const usePollSearch = () => {
  const search = usePollsStore(useShallow((state) => state.search));
  return useMemo(() => search, [search]);
};

const selectPollsActions = (state: PollsStore) => ({
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
  setVoting: state.setVoting,
  setSearching: state.setSearching,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchPolls: state.searchPolls,
  clearSearch: state.clearSearch,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  resetPollsState: state.resetPollsState,
  setSearchQuery: state.setSearchQuery,
  setTrendingOnly: state.setTrendingOnly,
  setCurrentPage: state.setCurrentPage,
  setSortBy: state.setSortBy,
  setItemsPerPage: state.setItemsPerPage,
});

export const usePollsActions = () => usePollsStore(useShallow(selectPollsActions));

export const usePollsStats = () =>
  usePollsStore(
    useShallow((state) => {
      const analytics = derivePollAnalytics(
        state.polls.map((poll) => {
          const meta = poll as Record<string, unknown>;
          const totalVotes =
            typeof poll.total_votes === 'number'
              ? poll.total_votes
              : (typeof meta.totalVotes === 'number' ? (meta.totalVotes as number) : null);
          const trendingPosition =
            typeof meta.trending_position === 'number'
              ? (meta.trending_position as number)
              : (typeof meta.trendingPosition === 'number' ? (meta.trendingPosition as number) : null);

          return {
            status: poll.status,
            total_votes: totalVotes,
            trending_position: trendingPosition,
          };
        }),
      );

      return {
        total: analytics.total,
        active: analytics.active,
        closed: analytics.closed,
        draft: analytics.draft,
        archived: analytics.archived,
        trending: analytics.trending,
        totalVotes: analytics.totalVotes,
        isLoading: state.isLoading,
        error: state.error,
      };
    }),
  );

export const usePollsAnalytics = () =>
  usePollsStore(
    useShallow((state) => {
      const analytics = derivePollAnalytics(
        state.polls.map((poll) => {
          const meta = poll as Record<string, unknown>;
          const totalVotes =
            typeof poll.total_votes === 'number'
              ? poll.total_votes
              : (typeof meta.totalVotes === 'number' ? (meta.totalVotes as number) : null);
          const trendingPosition =
            typeof meta.trending_position === 'number'
              ? (meta.trending_position as number)
              : (typeof meta.trendingPosition === 'number' ? (meta.trendingPosition as number) : null);

          return {
            status: poll.status,
            total_votes: totalVotes,
            trending_position: trendingPosition,
          };
        }),
      );

      const averageVotes = analytics.total > 0 ? analytics.totalVotes / analytics.total : 0;

      return {
        ...analytics,
        averageVotes,
        lastFetchedAt: state.lastFetchedAt,
        isLoading: state.isLoading,
      };
    }),
  );

export const pollsStoreUtils = {
  getTrendingPolls: (limit = 10) => {
    const state = usePollsStore.getState();
    return [...state.polls]
      .filter((poll) => poll.status === 'active')
      .sort((a, b) => (b.total_votes ?? 0) - (a.total_votes ?? 0))
      .slice(0, limit);
  },
  getRecentPolls: (limit = 10) => {
    const state = usePollsStore.getState();
    return [...state.polls]
      .sort((a, b) => {
        const dateA = new Date(a.created_at ?? 0).getTime();
        const dateB = new Date(b.created_at ?? 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  },
  getPollsByCategory: (category: string) => {
    const state = usePollsStore.getState();
    return state.polls.filter((poll) => poll.category === category);
  },
  getAnalytics: () => {
    const state = usePollsStore.getState();
    return derivePollAnalytics(
      state.polls.map((poll) => {
        const meta = poll as Record<string, unknown>;
        const totalVotes =
          typeof poll.total_votes === 'number'
            ? poll.total_votes
            : (typeof meta.totalVotes === 'number' ? (meta.totalVotes as number) : null);
        const trendingPosition =
          typeof meta.trending_position === 'number'
            ? (meta.trending_position as number)
            : (typeof meta.trendingPosition === 'number' ? (meta.trendingPosition as number) : null);

        return {
          status: poll.status,
          total_votes: totalVotes,
          trending_position: trendingPosition,
        };
      }),
    );
  },
};
