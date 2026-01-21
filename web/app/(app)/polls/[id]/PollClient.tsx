'use client';

import { ArrowLeft, Share2, AlertCircle, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { PollShare } from '@/features/polls';
import PostCloseBanner from '@/features/polls/components/PostCloseBanner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
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
  const isPollCreator = user?.id && poll.createdBy && user.id === poll.createdBy;

  // Track if component is mounted to prevent hydration mismatches from date formatting
  const [isMounted, setIsMounted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    try {
      setLoading(true);
      setVotingLoadingRef.current(true);
      setError(null);
      clearVotingErrorRef.current();

      const generalError = 'Failed to load poll results. Please try again later.';

      // Fetch results data
      const resultsResponse = await fetch(`/api/polls/${pollId}/results`);
      if (!resultsResponse.ok) {
        setResults(null);
        if (resultsResponse.status >= 500) {
          setError(generalError);
          setVotingErrorRef.current(generalError);
        }
        return;
      }

      const payload = await resultsResponse.json();
      if (!payload?.success || !payload.data) {
        setResults(null);
        clearVotingErrorRef.current();
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
      setLoading(false);
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
      void fetchPollData();

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

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            {/* Poll Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {poll.privacyLevel}
              </Badge>
              <Badge variant="outline" className="text-xs" data-testid="voting-method">
                {formatVotingMethod(poll.votingMethod)}
              </Badge>
              {poll.endtime && (
                <span className="text-xs">Ends {formatDate(poll.endtime)}</span>
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
            <CardContent className="text-center py-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                <span className="text-gray-600">Loading results...</span>
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
                    <div className="text-sm text-muted-foreground mt-1">Total Votes</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg border">
                    <div className="text-lg font-semibold text-foreground">
                      {VOTING_LABELS[poll.votingMethod] ?? poll.votingMethod}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Voting Method</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {results.votingMethod === 'ranked'
                        ? results.optionStats.length
                        : results.optionTotals.length}
                    </div>
                    <div className="text-sm text-gray-600">Options</div>
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
                      <h4 className="text-sm font-semibold text-gray-700">Instant runoff rounds</h4>
                      {results.rounds.map((round) => (
                        <div key={round.round} className="rounded-lg border bg-gray-50 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-medium text-gray-800">Round {round.round}</span>
                            {round.eliminated !== undefined && (
                              <span className="text-xs text-red-600">
                                Eliminated: {getOptionLabel(Number(round.eliminated))}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            {Object.entries(round.votes).map(([optionKey, voteCount]) => {
                              const percentage = round.percentages[optionKey] ?? 0;
                              const label = getOptionLabel(Number(optionKey));
                              return (
                                <div key={`${round.round}-${optionKey}`} className="flex justify-between">
                                  <span className="font-medium text-gray-700">{label}</span>
                                  <span>
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
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
                        Winner:{' '}
                        {rankedChartData?.find(
                          (item) => String(item.id) === String(results.winner),
                        )?.name ?? getOptionLabel(Number(results.winner))}
                      </div>
                    )}
                  </div>
                )}

                {results.votingMethod === 'ranked' && !rankedChartData?.length && (
                  <p className="text-sm text-gray-600">No first-choice votes recorded yet.</p>
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
                  <p className="text-sm text-gray-600">No votes recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post-Close Banner */}
        {isPollClosed && poll.allowPostClose && (
          <PostCloseBanner pollStatus={poll.status as 'closed' | 'locked' | 'post-close'} />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Poll</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{poll.title}"? This action cannot be undone and will permanently remove the poll and all associated votes.
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
