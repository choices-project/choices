'use client';

import { ArrowLeft, Share2, CheckCircle, AlertCircle } from 'lucide-react';
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

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useNotificationActions, useNotificationSettings } from '@/lib/stores/notificationStore';
import logger from '@/lib/utils/logger';

import VotingInterface, {
  type VoteSubmission,
} from '../../../../features/voting/components/VotingInterface';


type VoteResponse = { ok: boolean; id?: string; error?: string }

type Poll = {
  id: string;
  title: string;
  description: string;
  options: string[];
  votingMethod: string;
  totalvotes: number;
  endtime: string;
  status: string;
  category: string;
  privacyLevel: string;
  createdAt: string;
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
  
  // Track if component is mounted to prevent hydration mismatches from date formatting
  const [isMounted, setIsMounted] = useState(false);
  
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
  const [showVotingInterface, setShowVotingInterface] = useState(false);
  const [resultsMode, setResultsMode] = useState<ResultsMode>('live');
  const [copied, setCopied] = useState(false);
  const [lastVoteId, setLastVoteId] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const notificationSettings = useNotificationSettings();
  const { addNotification } = useNotificationActions();
  const addNotificationRef = useRef(addNotification);
  React.useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);

  const getOptionLabel = useCallback(
    (optionIndex: number, explicitLabel?: string | null) => {
      if (typeof explicitLabel === 'string' && explicitLabel.trim().length > 0) {
        return explicitLabel.trim();
      }

      if (Number.isFinite(optionIndex) && optionIndex >= 0) {
        const fallback = poll.options[optionIndex];
        if (typeof fallback === 'string' && fallback.trim().length > 0) {
          return fallback;
        }
        return `Option ${optionIndex + 1}`;
      }

      return explicitLabel && explicitLabel.trim().length > 0 ? explicitLabel.trim() : 'Unknown option';
    },
    [poll.options],
  );

  const pollDetailsForBallot = useMemo(
    () => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: [...poll.options],
      votingMethod: poll.votingMethod,
      totalVotes: poll.totalvotes,
      endtime: poll.endtime,
      status: poll.status,
      category: poll.category,
      createdAt: poll.createdAt,
    }),
    [poll]
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
      setShowVotingInterface(true);
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

  const handleStartVoting = useCallback(() => {
    setShowVotingInterface(true);
    recordPollEventRef.current('detail_start_voting', {
      metadata: {
        context: 'poll_detail',
      },
    });
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8" data-testid="poll-details">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Polls</span>
          </Button>
        </div>

        {/* Poll Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="poll-title">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-gray-600 text-lg" data-testid="poll-description">{poll.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
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
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </Button>
            </div>
          </div>

          {/* Poll Metadata */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {poll.privacyLevel}
            </span>
            <span>•</span>
            <span data-testid="voting-method">{formatVotingMethod(poll.votingMethod)}</span>
            <span>•</span>
            <span>Ends {formatDate(poll.endtime)}</span>
          </div>
        </div>

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

        {/* Voting Interface */}
        {isPollActive && !hasVoted && (
          <Card className="mb-8">
            {!showVotingInterface ? (
              <>
                <CardHeader>
                  <CardTitle data-testid="voting-section-title">Ready to Vote?</CardTitle>
                  <CardDescription>Click the button below to start voting</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    onClick={handleStartVoting}
                    size="lg"
                    className="px-8 py-3"
                    data-testid="start-voting-button"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Start Voting
                  </Button>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                  <CardDescription>Select your preferred option below</CardDescription>
                </CardHeader>
                <CardContent data-testid="voting-form">
                  <VotingInterface
                    poll={{
                      id: poll.id,
                      title: poll.title,
                      description: poll.description,
                      options: poll.options.map((option: string, index: number) => ({
                        id: index.toString(),
                        text: option
                      })),
                      votingMethod: poll.votingMethod,
                      totalVotes: poll.totalvotes,
                      endtime: poll.endtime
                    }}
                    onVote={handleVote}
                    isVoting={storeIsVoting}
                    hasVoted={hasVoted}
                    onAnalyticsEvent={recordPollEvent}
                  />
                </CardContent>
              </>
            )}
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results</CardTitle>
                <ModeSwitch
                  mode={resultsMode}
                  onModeChange={handleResultsModeChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {results.totalVotes}
                    </div>
                    <div className="text-sm text-gray-600">Total Votes</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {VOTING_LABELS[poll.votingMethod] ?? poll.votingMethod}
                    </div>
                    <div className="text-sm text-gray-600">Voting Method</div>
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
      </div>
      </div>
  );
}
