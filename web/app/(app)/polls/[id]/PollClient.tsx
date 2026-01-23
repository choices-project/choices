'use client';

import { ArrowLeft, Share2, AlertCircle, Trash2, Lock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { PollShare } from '@/features/polls';
import PostCloseBanner from '@/features/polls/components/PostCloseBanner';
import AdvancedAnalytics from '@/features/polls/components/AdvancedAnalytics';
import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics';
import {
  createBallotFromPoll,
  createVotingRecordFromPollSubmission,
} from '@/features/voting/lib/pollAdapters';
import type { PollBallotContext } from '@/features/voting/lib/pollAdapters';
import { useVotingActions, useVotingError, useVotingIsVoting } from '@/features/voting/lib/store';

import { AccessibleResultsChart } from '@/components/accessible/AccessibleResultsChart';
import ModeSwitch from '@/components/shared/ModeSwitch';
import type { ResultsMode } from '@/components/shared/ModeSwitch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { getErrorMessageWithFallback, ERROR_MESSAGES } from '@/lib/constants/error-messages';
import { useNotificationActions, useNotificationSettings } from '@/lib/stores/notificationStore';
import { useUserStore } from '@/lib/stores/userStore';
import logger from '@/lib/utils/logger';


import VotingInterface, {
  type VoteSubmission,
} from '../../../../features/voting/components/VotingInterface';


type VoteResponse = { ok: boolean; id?: string; error?: string }

type PollOption = {
  id: string;
  text: string;
  order?: number;
  votes?: number;
};

type Poll = {
  id: string;
  title: string;
  description: string;
  options: string[] | PollOption[]; // Support both formats for backward compatibility
  votingMethod: string;
  totalvotes: number;
  endtime?: string;
  status: string;
  category: string;
  privacyLevel: string;
  createdAt: string;
  createdBy?: string | null;
  baselineAt?: string;
  lockedAt?: string;
  allowPostClose?: boolean;
}

type RankedRound = {
  round: number;
  votes: Record<string, number>;
  percentages: Record<string, number>;
  eliminated?: string;
};

type RankedResultsState = {
  votingMethod: 'ranked';
  totalVotes: number;
  rounds: RankedRound[];
  optionStats: Array<{
    optionId: string;
    optionIndex: number;
    text?: string;
    firstChoiceVotes: number;
    firstChoicePercentage: number;
    bordaScore: number;
  }>;
  winner: string | null;
};

type StandardResultsState = {
  votingMethod: 'single' | 'multiple' | 'approval';
  totalVotes: number;
  optionTotals: Array<{
    optionId: string;
    optionText?: string;
    voteCount: number;
    percentage: number;
  }>;
  trustTierFilter: number | null;
};

type PollResultsState = RankedResultsState | StandardResultsState;

type PollClientProps = {
  poll: Poll;
}

export default function PollClient({ poll }: PollClientProps) {
  const router = useRouter();
  const params = useParams();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  // Check if user is poll creator - normalize IDs to strings for comparison
  // CRITICAL: Convert both to strings to handle UUID comparison edge cases
  const userId = user?.id ? String(user.id) : null;
  const pollCreatedBy = poll.createdBy ? String(poll.createdBy) : null;
  const isPollCreator = isAuthenticated && userId && pollCreatedBy && userId === pollCreatedBy;

  // Debug logging for close button visibility - ALWAYS log to console for debugging
  useEffect(() => {
    const shouldShow = isPollCreator && poll.status === 'active';

    // Always log to console (not just in dev) to help debug production issues
    console.log('[Close Button Debug]', {
      shouldShow,
      isPollCreator,
      isPollActive: poll.status === 'active',
      isAuthenticated,
      userId: user?.id,
      userIdString: userId,
      pollCreatedBy: poll.createdBy,
      pollCreatedByString: pollCreatedBy,
      idsMatch: userId === pollCreatedBy,
      idsMatchStrict: user?.id === poll.createdBy,
      userExists: !!user,
      pollCreatedByExists: !!poll.createdBy,
      pollStatus: poll.status,
      userType: typeof user?.id,
      createdByType: typeof poll.createdBy,
    });

    logger.debug('Poll creator and close button check', {
      userId: user?.id,
      userIdString: userId,
      pollCreatedBy: poll.createdBy,
      pollCreatedByString: pollCreatedBy,
      pollStatus: poll.status,
      isPollActive: poll.status === 'active',
      isAuthenticated,
      isPollCreator,
      shouldShowCloseButton: shouldShow,
      userExists: !!user,
      pollCreatedByExists: !!poll.createdBy,
      idsMatch: userId === pollCreatedBy,
      idsMatchStrict: user?.id === poll.createdBy,
      userType: typeof user?.id,
      createdByType: typeof poll.createdBy,
    });
  }, [isPollCreator, isAuthenticated, userId, pollCreatedBy, poll.status, user?.id, poll.createdBy]);

  // Track if component is mounted to prevent hydration mismatches from date formatting
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // useParams() is safe here because this component is dynamically imported with ssr: false
  // With ssr: false, the component never renders on the server, so useParams() is safe
  const pollId = (params?.id as string) || poll?.id || '';

  const {
    setBallots,
    setSelectedBallot,
    setCurrentBallot,
    setLoading: setVotingLoading,
    setVoting,
    setError: setVotingError,
    clearError: clearVotingError,
    addVotingRecord,
    cancelVote,
  } = useVotingActions();
  const votingStoreError = useVotingError();
  const storeIsVoting = useVotingIsVoting();

  // Use refs for router and store actions to prevent infinite re-renders
  const routerRef = useRef(router);
  React.useEffect(() => { routerRef.current = router; }, [router]);

  const setBallotsRef = useRef(setBallots);
  const setSelectedBallotRef = useRef(setSelectedBallot);
  const setCurrentBallotRef = useRef(setCurrentBallot);
  const setVotingLoadingRef = useRef(setVotingLoading);
  const setVotingRef = useRef(setVoting);
  const setVotingErrorRef = useRef(setVotingError);
  const clearVotingErrorRef = useRef(clearVotingError);
  const addVotingRecordRef = useRef(addVotingRecord);
  const cancelVoteRef = useRef(cancelVote);

  React.useEffect(() => { setBallotsRef.current = setBallots; }, [setBallots]);
  React.useEffect(() => { setSelectedBallotRef.current = setSelectedBallot; }, [setSelectedBallot]);
  React.useEffect(() => { setCurrentBallotRef.current = setCurrentBallot; }, [setCurrentBallot]);
  React.useEffect(() => { setVotingLoadingRef.current = setVotingLoading; }, [setVotingLoading]);
  React.useEffect(() => { setVotingRef.current = setVoting; }, [setVoting]);
  React.useEffect(() => { setVotingErrorRef.current = setVotingError; }, [setVotingError]);
  React.useEffect(() => { clearVotingErrorRef.current = clearVotingError; }, [clearVotingError]);
  React.useEffect(() => { addVotingRecordRef.current = addVotingRecord; }, [addVotingRecord]);
  React.useEffect(() => { cancelVoteRef.current = cancelVote; }, [cancelVote]);

  const pollMetadataFactory = useCallback(
    () => ({
      pollId: poll.id,
      pollTitle: poll.title,
      votingMethod: poll.votingMethod,
      privacyLevel: poll.privacyLevel,
      status: poll.status,
      category: poll.category,
    }),
    [poll],
  );

  const recordPollEvent = useRecordPollEvent(pollMetadataFactory);
  const recordPollEventRef = useRef(recordPollEvent);
  React.useEffect(() => { recordPollEventRef.current = recordPollEvent; }, [recordPollEvent]);

  const [results, setResults] = useState<PollResultsState | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  // CRITICAL UX FIX: Show voting interface immediately - no need for extra click
  // Users should see poll options right away, not hidden behind a button
  // Removed showVotingInterface state - voting interface always shows when poll is active
  const [resultsMode, setResultsMode] = useState<ResultsMode>('live');
  const [copied, setCopied] = useState(false);
  const [lastVoteId, setLastVoteId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const notificationSettings = useNotificationSettings();
  const { addNotification } = useNotificationActions();
  const addNotificationRef = useRef(addNotification);
  React.useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);

  // Normalize options to handle both string[] and PollOption[] formats
  const normalizedOptions = useMemo(() => {
    if (!poll.options || !Array.isArray(poll.options)) {
      return [];
    }
    return poll.options.map((option, index) => {
      if (typeof option === 'string') {
        return { id: index.toString(), text: option, order: index };
      }
      // It's a PollOption object
      return {
        id: option.id || index.toString(),
        text: option.text || `Option ${index + 1}`,
        order: option.order ?? index,
        votes: option.votes ?? 0,
      };
    });
  }, [poll.options]);

  const getOptionLabel = useCallback(
    (optionIndex: number, explicitLabel?: string | null) => {
      if (typeof explicitLabel === 'string' && explicitLabel.trim().length > 0) {
        return explicitLabel.trim();
      }

      if (Number.isFinite(optionIndex) && optionIndex >= 0 && normalizedOptions[optionIndex]) {
        return normalizedOptions[optionIndex].text;
      }

      return explicitLabel && explicitLabel.trim().length > 0 ? explicitLabel.trim() : 'Unknown option';
    },
    [normalizedOptions],
  );

  const pollDetailsForBallot = useMemo(
    () => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: normalizedOptions.map(opt => opt.text), // Convert to string array for ballot
      votingMethod: poll.votingMethod,
      totalVotes: poll.totalvotes,
      endtime: poll.endtime ?? null, // Convert undefined to null for exactOptionalPropertyTypes
      status: poll.status,
      category: poll.category,
      createdAt: poll.createdAt,
    }),
    [poll, normalizedOptions]
  );

  const combinedError = error ?? votingStoreError ?? null;

  const notifyUndoSuccess = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'success',
        title: 'Vote undone',
        message,
        duration: notificationSettings.duration,
      });
    },
    [notificationSettings.duration],
  );

  const notifyUndoError = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'error',
        title: 'Unable to undo vote',
        message,
        duration: notificationSettings.duration,
      });
    },
    [notificationSettings.duration],
  );

  // Client-side vote status check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/polls/${poll.id}/vote`, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (!cancelled) setHasVoted(res.status === 200);
      } catch {
        // Swallow — treat as not voted
      }
    })();
    return () => { cancelled = true; };
  }, [poll.id]);

  const fetchPollData = useCallback(async () => {
    let timeoutWarningId: NodeJS.Timeout | null = null;
    try {
      setLoading(true);
      setLoadingTimeout(false);
      setVotingLoadingRef.current(true);
      setError(null);
      clearVotingErrorRef.current();

      // Set timeout warning after 10 seconds
      timeoutWarningId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10_000);

      // Fetch results data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let resultsResponse: Response;
      try {
        resultsResponse = await fetch(`/api/polls/${pollId}/results`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (timeoutWarningId) clearTimeout(timeoutWarningId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutConfig = getErrorMessageWithFallback('TIMEOUT_ERROR', ERROR_MESSAGES.TIMEOUT_ERROR);
          setError(timeoutConfig.message);
          setVotingErrorRef.current(timeoutConfig.message);
          setResults(null);
          setLoading(false);
          setLoadingTimeout(false);
          setVotingLoadingRef.current(false);
          return;
        }
        const networkConfig = getErrorMessageWithFallback('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR);
        setError(networkConfig.message);
        setVotingErrorRef.current(networkConfig.message);
        setResults(null);
        setLoading(false);
        setLoadingTimeout(false);
        setVotingLoadingRef.current(false);
        return;
      }

      if (!resultsResponse.ok) {
        if (timeoutWarningId) clearTimeout(timeoutWarningId);
        setResults(null);
        let errorConfig;
        if (resultsResponse.status === 404) {
          errorConfig = getErrorMessageWithFallback('POLL_NOT_FOUND', ERROR_MESSAGES.POLL_NOT_FOUND);
        } else if (resultsResponse.status >= 500) {
          errorConfig = getErrorMessageWithFallback('SERVER_ERROR', ERROR_MESSAGES.SERVER_ERROR);
        } else {
          errorConfig = getErrorMessageWithFallback('NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR);
        }
        setError(errorConfig.message);
        setVotingErrorRef.current(errorConfig.message);
        setLoading(false);
        setLoadingTimeout(false);
        setVotingLoadingRef.current(false);
        return;
      }

      let payload: any;
      try {
        payload = await resultsResponse.json();
      } catch (jsonError) {
        if (timeoutWarningId) clearTimeout(timeoutWarningId);
        const parseConfig = getErrorMessageWithFallback('SERVER_ERROR', ERROR_MESSAGES.SERVER_ERROR);
        logger.error('Failed to parse poll results JSON', jsonError);
        setError(parseConfig.message);
        setVotingErrorRef.current(parseConfig.message);
        setResults(null);
        setLoading(false);
        setLoadingTimeout(false);
        setVotingLoadingRef.current(false);
        return;
      }

      if (!payload?.success || !payload.data) {
        setResults(null);
        clearVotingErrorRef.current();
        // If we have a data structure but no success flag, log it for debugging
        if (payload && !payload.success) {
          logger.warn('Poll results API returned unsuccessful response', { pollId, payload });
        }
        return;
      }

      const data = payload.data as Record<string, unknown>;
      const votingMethod = (data.voting_method as string | undefined)?.toLowerCase();

      if (votingMethod === 'ranked') {
        const optionStatsRaw = Array.isArray(data.option_stats) ? (data.option_stats as Array<Record<string, unknown>>) : [];
        const roundsRaw = Array.isArray(data.rounds) ? (data.rounds as Array<Record<string, unknown>>) : [];

        const optionStats = optionStatsRaw.map((stat) => {
          const base: RankedResultsState['optionStats'][number] = {
            optionId: String(stat.option_id ?? ''),
            optionIndex: Number(stat.option_index ?? 0),
            firstChoiceVotes: Number(stat.first_choice_votes ?? 0),
            firstChoicePercentage: Number(stat.first_choice_percentage ?? 0),
            bordaScore: Number(stat.borda_score ?? 0),
          };
          if (typeof stat.text === 'string') {
            base.text = stat.text;
          }
          return base;
        });

        const rounds: RankedRound[] = roundsRaw.map((round) => {
          const base: RankedRound = {
            round: Number(round.round ?? 0),
            votes: (round.votes as Record<string, number>) ?? {},
            percentages: (round.percentages as Record<string, number>) ?? {},
          };
          if (typeof round.eliminated === 'string') {
            base.eliminated = round.eliminated;
          }
          return base;
        });

        setResults({
          votingMethod: 'ranked',
          totalVotes: Number(data.total_votes ?? 0),
          rounds,
          optionStats,
          winner: typeof data.winner === 'string' ? data.winner : null,
        });
        return;
      }

      const optionTotalsRaw = Array.isArray(data.results) ? (data.results as Array<Record<string, unknown>>) : [];
      const totalVotes = Number(data.total_votes ?? 0);

      const optionTotals = optionTotalsRaw.map((row) => {
        const voteCount = Number(row.vote_count ?? 0);
        const optionId = String(row.option_id ?? '');
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        const base: StandardResultsState['optionTotals'][number] = {
          optionId,
          voteCount,
          percentage,
        };
        if (typeof row.option_text === 'string') {
          base.optionText = row.option_text;
        }
        return base;
      });

      setResults({
        votingMethod: (votingMethod as 'single' | 'multiple' | 'approval') ?? 'single',
        totalVotes,
        optionTotals,
        trustTierFilter: (data.trust_tier_filter as number | null) ?? null,
      });
      clearVotingErrorRef.current();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load poll data';
      setResults(null);
      setError(errorMessage);
      setVotingErrorRef.current(errorMessage);
    } finally {
      if (timeoutWarningId) clearTimeout(timeoutWarningId);
      setLoading(false);
      setLoadingTimeout(false);
      setVotingLoadingRef.current(false);
    }
  }, [pollId]);

  useEffect(() => {
    if (pollId) {
      fetchPollData();
    }
  }, [pollId, fetchPollData]);

  useEffect(() => {
    const optionVoteCounts: Record<string, number> = {};
    let totalVotesContext: number | undefined =
      typeof pollDetailsForBallot.totalVotes === 'number'
        ? pollDetailsForBallot.totalVotes
        : undefined;

    if (results) {
      totalVotesContext = results.totalVotes;
      if (results.votingMethod === 'ranked') {
        for (const stat of results.optionStats) {
          optionVoteCounts[String(stat.optionId)] = stat.firstChoiceVotes;
        }
      } else {
        for (const total of results.optionTotals) {
          optionVoteCounts[String(total.optionId)] = total.voteCount;
        }
      }
    }

    const hasCounts = Object.keys(optionVoteCounts).length > 0;
    const ballotContext: PollBallotContext = {
      ...(typeof totalVotesContext === 'number' ? { totalVotes: totalVotesContext } : {}),
      ...(hasCounts ? { optionVoteCounts } : {}),
    };

    const ballot = createBallotFromPoll(pollDetailsForBallot, ballotContext);

    setBallotsRef.current([ballot]);
    setSelectedBallotRef.current(ballot);
    setCurrentBallotRef.current(ballot);
  }, [
    pollDetailsForBallot,
    results,
  ]);

  const handleUndoLastVote = useCallback(async () => {
    if (!lastVoteId) {
      return;
    }
    setIsUndoing(true);
    setVotingRef.current(true);
    setError(null);
    clearVotingErrorRef.current();

    try {
      await cancelVoteRef.current(lastVoteId);
      notifyUndoSuccess('You can vote again.');
      recordPollEventRef.current('vote_undo', {
        metadata: {
          context: 'poll_detail',
          voteId: lastVoteId,
        },
      });
      setHasVoted(false);
      setLastVoteId(null);
      await fetchPollData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to undo vote';
      setError(message);
      setVotingErrorRef.current(message);
      notifyUndoError(message);
      recordPollEventRef.current('vote_undo_failed', {
        metadata: {
          context: 'poll_detail',
          voteId: lastVoteId,
          error: message,
        },
      });
    } finally {
      setVotingRef.current(false);
      setIsUndoing(false);
    }
  }, [
    fetchPollData,
    lastVoteId,
    notifyUndoError,
    notifyUndoSuccess,
  ]);

  const hasRecordedViewRef = useRef(false);

  useEffect(() => {
    if (!hasRecordedViewRef.current) {
      recordPollEventRef.current('view_poll', {
        metadata: {
          context: 'poll_detail',
        },
      });
      hasRecordedViewRef.current = true;
    }

  }, []);

  const handleVote = useCallback(async (submission: VoteSubmission): Promise<VoteResponse> => {
    const method = submission.method ?? (poll.votingMethod?.toLowerCase() as VoteSubmission['method']);

    let payload: Record<string, unknown> | null = null;

    switch (method) {
      case 'single': {
        const choice = 'choice' in submission ? submission.choice : undefined;
        if (typeof choice !== 'number') {
          return {
            ok: false,
            error: 'Single-choice submissions require a numeric choice.',
          };
        }
        payload = { choice };
        break;
      }
      case 'multiple': {
        const selections = 'selections' in submission ? submission.selections : undefined;
        if (!Array.isArray(selections)) {
          return {
            ok: false,
            error: 'Multiple-choice submissions require an array of selections.',
          };
        }
        payload = { selections };
        break;
      }
      case 'approval': {
        const approvals = 'approvals' in submission ? submission.approvals : undefined;
        if (!Array.isArray(approvals)) {
          return {
            ok: false,
            error: 'Approval submissions require an array of approvals.',
          };
        }
        payload = { approvals };
        break;
      }
      case 'ranked': {
        const rankings = 'rankings' in submission ? submission.rankings : undefined;
        if (!Array.isArray(rankings)) {
          return {
            ok: false,
            error: 'Ranked-choice submissions require an array of rankings.',
          };
        }
        payload = { rankings };
        break;
      }
      case 'quadratic':
      case 'range':
        return {
          ok: false,
          error: 'This voting method is not yet supported.',
        };
      default:
        return {
          ok: false,
          error: 'Unknown voting method.',
        };
    }

    if (payload === null) {
      return {
        ok: false,
        error: 'Unable to build vote payload.',
      };
    }

    setVotingRef.current(true);
    setError(null);
    clearVotingErrorRef.current();

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? 'Failed to submit vote');
      }

      const result = await response.json();

      setHasVoted(true);

      // Log vote submission for debugging
      console.log('[Vote] Vote submitted successfully', { pollId: poll.id, votingMethod: poll.votingMethod });

      // The vote endpoint now waits for vote count update before returning,
      // so we can reload immediately. Small delay to ensure UI updates.
      await new Promise(resolve => setTimeout(resolve, 300));

      // Refresh poll data to update vote counts immediately
      await fetchPollData();

      // Force a full page reload with cache-busting to ensure poll prop is updated from server
      // Vote count update is now complete on server side, so reload can happen quickly
      // Use cache: 'no-store' equivalent by adding timestamp to force fresh fetch
      console.log('[Vote] Reloading page to show updated vote count...');
      setTimeout(() => {
        // Force a hard reload to bypass Next.js cache
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
      }, 200);

      const voteId: string =
        (typeof result.voteId === 'string' && result.voteId) ||
        (Array.isArray(result.voteIds) ? result.voteIds.find((value: unknown): value is string => typeof value === 'string') : undefined) ||
        'vote-recorded';

      addVotingRecordRef.current(
        createVotingRecordFromPollSubmission({
          poll: pollDetailsForBallot,
          submission,
          voteId,
        })
      );
      setLastVoteId(voteId);

      return {
        ok: true,
        id: voteId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      setVotingErrorRef.current(errorMessage);
      setLastVoteId(null);
      return {
        ok: false,
        error: errorMessage,
      };
    } finally {
      setVotingRef.current(false);
    }

  }, [
    fetchPollData,
    poll.id,
    poll.votingMethod,
    pollDetailsForBallot,
  ]);

  const handleShare = async () => {
    // Use SSR-safe browser API access
    const { safeWindow, safeNavigator } = await import('@/lib/utils/ssr-safe');
    const origin = safeWindow(w => w.location?.origin, '');
    const url = `${origin}/polls/${pollId}`;
    try {
      const clipboard = safeNavigator(n => n.clipboard);
      if (clipboard?.writeText) {
        await clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        recordPollEventRef.current('detail_copy_link', {
          category: 'poll_share',
          metadata: {
            pollUrl: url,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to copy URL:', err);
      recordPollEventRef.current('detail_share_failed', {
        category: 'poll_share',
        metadata: {
          pollUrl: url,
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  };

  // Removed handleStartVoting - voting interface now shows immediately for better UX

  const formatVotingMethod = (method: string) => {
    switch (method) {
      case 'single':
        return 'Single Choice';
      case 'approval':
        return 'Approval Voting';
      case 'ranked':
        return 'Ranked Choice';
      case 'range':
        return 'Range Voting';
      case 'quadratic':
        return 'Quadratic Voting';
      default:
        return method;
    }
  };

  const handleBack = useCallback(() => {
    routerRef.current.push('/polls');
  }, []);

  const handleClosePoll = useCallback(async () => {
    if (!isPollCreator || !pollId || poll.status !== 'active') return;

    setIsClosing(true);
    try {
      const response = await fetch(`/api/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to close poll' }));
        throw new Error(error.error || error.message || 'Failed to close poll');
      }

      const result = await response.json();
      logger.info('Poll closed successfully', { pollId, result });

      // Refresh the page to show updated status using router.refresh() for better Next.js integration
      router.refresh();
      window.location.reload();

      // Show success notification
      addNotificationRef.current({
        type: 'success',
        title: 'Poll closed',
        message: 'Your poll has been closed successfully. Advanced analytics are now available.',
        duration: notificationSettings.duration,
      });
    } catch (error) {
      logger.error('Failed to close poll', { pollId, error });
      const errorMessage = error instanceof Error ? error.message : 'Failed to close poll';
      addNotificationRef.current({
        type: 'error',
        title: 'Failed to close poll',
        message: errorMessage,
        duration: notificationSettings.duration,
      });
    } finally {
      setIsClosing(false);
      setShowCloseConfirm(false);
    }
  }, [isPollCreator, pollId, poll.status]);

  const handleDeletePoll = useCallback(async () => {
    if (!isPollCreator || !pollId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `Failed to delete poll: ${response.status}`);
      }

      addNotificationRef.current({
        type: 'success',
        title: 'Poll deleted',
        message: 'Your poll has been deleted successfully.',
        duration: 4000,
      });

      // Redirect to polls page
      routerRef.current.push('/polls');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete poll';
      addNotificationRef.current({
        type: 'error',
        title: 'Delete failed',
        message: errorMessage,
        duration: 6000,
      });
      logger.error('Failed to delete poll:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [isPollCreator, pollId]);

  const formatDate = (dateString: string) => {
    // Guard with isMounted to prevent hydration mismatches from locale differences
    if (!isMounted) {
      return dateString; // Return raw string during SSR
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const VOTING_LABELS: Record<string, string> = {
    single: 'Single Choice',
    multiple: 'Multiple Choice',
    approval: 'Approval Voting',
    ranked: 'Ranked Choice',
    range: 'Range Voting',
    quadratic: 'Quadratic Voting',
  };

  const handleResultsModeChange = useCallback((mode: ResultsMode) => {
    setResultsMode(mode);
    recordPollEventRef.current('detail_results_mode_changed', {
      label: mode,
      metadata: {
        context: 'poll_detail',
        mode,
      },
    });
  }, []);


  const isPollActive = poll.status === 'active';
  const isPollClosed = poll.status === 'closed';
  const isPollLocked = poll.status === 'locked';

  const rankedChartData = useMemo(() => {
    if (!results || results.votingMethod !== 'ranked') {
      return null;
    }

    return results.optionStats
      .map((stat) => {
        const label = getOptionLabel(stat.optionIndex, stat.text);
        const isWinner =
          results.winner != null &&
          (String(results.winner) === String(stat.optionId) ||
            Number.parseInt(String(results.winner), 10) === stat.optionIndex);

        return {
          id: stat.optionId || String(stat.optionIndex),
          name: label,
          votes: stat.firstChoiceVotes,
          percentage: stat.firstChoicePercentage,
          isWinner,
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [getOptionLabel, results]);

  const standardChartData = useMemo(() => {
    if (!results || results.votingMethod === 'ranked') {
      return null;
    }

    const maxVotes = results.optionTotals.reduce(
      (max, option) => Math.max(max, option.voteCount),
      0,
    );

    return results.optionTotals
      .map((option, index) => {
        const label = getOptionLabel(index, option.optionText);
        return {
          id: option.optionId || String(index),
          name: label,
          votes: option.voteCount,
          percentage: option.percentage,
          isWinner: option.voteCount === maxVotes && maxVotes > 0,
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [getOptionLabel, results]);

  useEffect(() => {
    if (!results) {
      return;
    }

    const leadingName =
      results.votingMethod === 'ranked'
        ? rankedChartData?.[0]?.name
        : standardChartData?.[0]?.name;

    if (typeof leadingName === 'string') {
      ScreenReaderSupport.announce(
        `Poll results updated. ${leadingName} currently leads with ${results.totalVotes} total votes counted.`,
        'polite',
      );
    } else {
      ScreenReaderSupport.announce(
        `Poll results updated. ${results.totalVotes} total votes recorded.`,
        'polite',
      );
    }
  }, [rankedChartData, results, standardChartData]);

  // Component is dynamically imported with ssr: false, so no ClientOnly wrapper needed
  // ClientOnly wrapper was causing hydration mismatches
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8" data-testid="poll-details">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Polls</span>
          </Button>
        </div>

        {/* Poll Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <CardTitle className="text-3xl font-bold" data-testid="poll-title">
                  {poll.title}
                </CardTitle>
                {poll.description && (
                  <CardDescription className="text-base" data-testid="poll-description">
                    {poll.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={isPollActive ? "default" : isPollClosed ? "secondary" : "destructive"}
                  className="text-sm"
                >
                  {isPollActive ? 'Active' : isPollClosed ? 'Closed' : isPollLocked ? 'Locked' : 'Unknown'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </Button>
                {/* Close Poll button - show if user is creator and poll is active */}
                {(() => {
                  const canClose = isPollCreator && isPollActive;
                  // Always log in production to help debug
                  if (!canClose && poll.status === 'active') {
                    console.log('[Close Button] Not showing because:', {
                      isPollCreator,
                      isPollActive,
                      isAuthenticated,
                      userId: user?.id,
                      userIdString: userId,
                      pollCreatedBy: poll.createdBy,
                      pollCreatedByString: pollCreatedBy,
                      pollStatus: poll.status,
                      idsMatch: userId === pollCreatedBy,
                    });
                  }
                  return canClose ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCloseConfirm(true)}
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      disabled={isClosing}
                    >
                      <Lock className="w-4 h-4" />
                      <span>Close Poll</span>
                    </Button>
                  ) : null;
                })()}
                {isPollCreator && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Poll Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {results?.totalVotes ?? poll.totalvotes ?? 0}
                </div>
                <div className="text-sm font-medium text-foreground mt-1">TOTAL VOTES</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-2xl font-bold text-foreground">
                  {poll.totalvotes > 0 ? Math.round((poll.totalvotes / (poll.totalvotes + 10)) * 100) : 0}%
                </div>
                <div className="text-sm font-medium text-foreground mt-1">PARTICIPATION</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg border">
                <div className="text-lg font-semibold text-foreground">
                  {isPollActive ? 'Active' : isPollClosed ? 'Closed' : isPollLocked ? 'Locked' : 'Unknown'}
                </div>
                <div className="text-sm font-medium text-foreground mt-1">STATUS</div>
              </div>
            </div>

            {/* Poll Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="text-xs font-medium">
                {poll.privacyLevel}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium" data-testid="voting-method">
                {formatVotingMethod(poll.votingMethod)}
              </Badge>
              {poll.endtime && (
                <span className="text-xs font-medium text-foreground">Ends {formatDate(poll.endtime)}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <div className="mb-8">
          <PollShare pollId={poll.id} poll={{ title: poll.title, description: poll.description }} />
        </div>

        {/* Error Display */}
        {combinedError && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{combinedError}</AlertDescription>
          </Alert>
        )}

        {hasVoted && lastVoteId && (
          <Card className="mt-6 mb-8 border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-blue-900 text-lg">
                Vote recorded
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndoLastVote}
                disabled={isUndoing || storeIsVoting}
                data-testid="undo-vote-button"
              >
                {isUndoing ? 'Undoing…' : 'Undo vote'}
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              You can undo your vote and submit a new response if needed.
            </CardContent>
          </Card>
        )}

        {/* Poll Options Display - Always show so users know what the poll is about */}
        {normalizedOptions && normalizedOptions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle data-testid="poll-options-title">Poll Options</CardTitle>
              <CardDescription>
                {isPollActive && !hasVoted
                  ? 'Select your preferred option below to cast your vote'
                  : hasVoted
                    ? 'You have already voted on this poll'
                    : 'This poll is no longer accepting votes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3" data-testid="poll-options-list">
                {normalizedOptions.map((option, index) => (
                  <div
                    key={option.id || index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{option.text}</p>
                        {option.votes !== undefined && option.votes > 0 && (
                          <p className="text-sm text-gray-500 mt-1">{option.votes} vote{option.votes !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voting Interface - Only show for active polls where user hasn't voted */}
        {isPollActive && !hasVoted && normalizedOptions && normalizedOptions.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle data-testid="voting-section-title">Cast Your Vote</CardTitle>
              <CardDescription>Select your preferred option below</CardDescription>
            </CardHeader>
            <CardContent className="pt-6" data-testid="voting-form">
              <VotingInterface
                poll={{
                  id: poll.id,
                  title: poll.title,
                  description: poll.description,
                  options: normalizedOptions.map((option) => ({
                    id: option.id,
                    text: option.text
                  })),
                  votingMethod: poll.votingMethod,
                  totalVotes: poll.totalvotes,
                  endtime: poll.endtime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Default to 1 year from now if no endtime
                }}
                onVote={handleVote}
                isVoting={storeIsVoting}
                hasVoted={hasVoted}
                onAnalyticsEvent={recordPollEvent}
              />
            </CardContent>
          </Card>
        )}

        {/* Error if poll has no options */}
        {(!normalizedOptions || normalizedOptions.length === 0) && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This poll has no voting options configured. Please contact the poll creator.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="text-center py-8" role="status" aria-live="polite" aria-busy="true">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading poll results...'}
                  </p>
                  {loadingTimeout && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      The server may be experiencing high load. Please wait...
                    </p>
                  )}
                </div>
                <span className="sr-only">Loading poll results, please wait</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Results</CardTitle>
                <ModeSwitch
                  mode={resultsMode}
                  onModeChange={handleResultsModeChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">
                      {results.totalVotes}
                    </div>
                    <div className="text-sm font-medium text-foreground mt-1">Total Votes</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-semibold text-foreground">
                      {VOTING_LABELS[poll.votingMethod] ?? poll.votingMethod}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Voting Method</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-2xl font-bold text-foreground">
                      {results.votingMethod === 'ranked'
                        ? results.optionStats.length
                        : results.optionTotals.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Options</div>
                  </div>
                </div>

                {results.votingMethod === 'ranked' && rankedChartData?.length && (
                  <div className="space-y-8">
                    <AccessibleResultsChart
                      data={rankedChartData}
                      title="First-choice support"
                      aria-label="Ranked choice poll first-choice results"
                      showPercentages
                      showVoteCounts
                    />

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Instant runoff rounds</h4>
                      {results.rounds.map((round) => (
                        <div key={round.round} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="font-semibold text-foreground">Round {round.round}</span>
                            {round.eliminated !== undefined && (
                              <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center space-x-1">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Eliminated: {getOptionLabel(Number(round.eliminated))}</span>
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {Object.entries(round.votes).map(([optionKey, voteCount]) => {
                              const percentage = round.percentages[optionKey] ?? 0;
                              const label = getOptionLabel(Number(optionKey));
                              return (
                                <div key={`${round.round}-${optionKey}`} className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900/50">
                                  <span className="font-medium text-foreground text-sm">{label}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {voteCount} vote{voteCount === 1 ? '' : 's'} ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {results.winner && (
                      <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span className="font-semibold text-purple-800 dark:text-purple-300">Winner:</span>
                          <span className="text-purple-700 dark:text-purple-200">
                            {rankedChartData?.find(
                              (item) => String(item.id) === String(results.winner),
                            )?.name ?? getOptionLabel(Number(results.winner))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {results.votingMethod === 'ranked' && !rankedChartData?.length && (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No first-choice votes recorded yet.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Be the first to vote on this ranked choice poll!</p>
                  </div>
                )}

                {results.votingMethod !== 'ranked' && standardChartData?.length && (
                  <AccessibleResultsChart
                    data={standardChartData}
                    title="Vote distribution"
                    aria-label="Poll results showing vote distribution across options"
                    showPercentages
                    showVoteCounts
                  />
                )}

                {results.votingMethod !== 'ranked' && !standardChartData?.length && (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No votes recorded yet.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Be the first to vote on this poll!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post-Close Banner */}
        {isPollClosed && poll.allowPostClose && (
          <PostCloseBanner pollStatus={poll.status as 'closed' | 'locked' | 'post-close'} />
        )}

        {/* Advanced Analytics (only for closed polls) */}
        {isPollClosed && (
          <AdvancedAnalytics
            pollId={pollId}
            pollStatus={poll.status as 'active' | 'closed' | 'draft' | 'archived'}
            className="mt-6"
          />
        )}

        {/* Close Poll Confirmation Dialog */}
        <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <AlertDialogContent aria-describedby="close-poll-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Close Poll</AlertDialogTitle>
              <AlertDialogDescription id="close-poll-description">
                Are you sure you want to close &ldquo;{poll.title}&rdquo;? Once closed, users will no longer be able to vote, but you&apos;ll be able to view advanced analytics. You can still delete the poll later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isClosing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClosePoll}
                disabled={isClosing}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {isClosing ? 'Closing...' : 'Close Poll'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent aria-describedby="delete-poll-description">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Poll</AlertDialogTitle>
              <AlertDialogDescription id="delete-poll-description">
                Are you sure you want to delete &ldquo;{poll.title}&rdquo;? This action cannot be undone and will permanently remove the poll and all associated votes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePoll}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Poll'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
