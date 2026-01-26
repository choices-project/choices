'use client';

import { AlertCircle, BarChart3, Lock, Printer, Share2, Shield, Trash2, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ReportModal from '@/features/moderation/components/ReportModal';
import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics';
import { usePollMilestoneNotifications, POLL_MILESTONES, type PollMilestone } from '@/features/polls/hooks/usePollMilestones';
import VotingInterface, { type VoteSubmission } from '@/features/voting/components/VotingInterface';
import {
  createBallotFromPoll,
  createVotingRecordFromPollSubmission,
  type PollBallotContext,
} from '@/features/voting/lib/pollAdapters';
import { useVotingActions, useVotingError, useVotingIsVoting } from '@/features/voting/lib/store';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { useNotificationActions } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

type VotingStatusMessage = {
  title: string;
  description: string;
};

type RawOption =
  | string
  | {
      id?: string;
      text?: string;
      votes?: number;
      voteCount?: number;
    };

type PollResultsResponse = {
  poll_id: string;
  total_votes: number;
  trust_tier_filter: number | null;
  voting_method?: string;
  results?: Array<{
    option_id: string | number;
    option_text?: string;
    vote_count: number;
  }>;
  option_stats?: Array<{
    option_id: string | number;
    option_index?: number;
    text?: string;
    first_choice_votes: number;
    first_choice_percentage?: number;
    borda_score?: number;
  }>;
  integrity?: {
    mode: 'all' | 'verified';
    threshold: number;
    raw_total_votes: number;
    excluded_votes: number;
    scored_votes: number;
    unscored_votes: number;
  };
};

type PollClientProps = {
  poll: {
    id: string;
    title: string;
    description?: string | null;
    options?: RawOption[];
    status?: 'active' | 'closed' | 'draft';
    totalvotes?: number;
    totalVotes?: number;
    participation?: number;
    privacyLevel?: string;
    category?: string;
    votingMethod?: string;
    createdAt?: string;
    endtime?: string;
    userVote?: string;
    canVote?: boolean;
    createdBy?: string | null;
  };
};

type NormalizedOption = {
  id: string;
  index: number;
  text: string;
  votes: number;
};

export default function PollClient({ poll }: PollClientProps) {
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = useProfileStore((s) => s.isAdmin?.() ?? false);
  const { addNotification } = useNotificationActions();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Track if component is mounted to prevent hydration mismatches from date formatting
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const PRIVACY_LABELS: Record<string, string> = useMemo(() => ({
    public: t('polls.view.privacy.public'),
    private: t('polls.view.privacy.private'),
    unlisted: t('polls.view.privacy.unlisted'),
  }), [t]);

  const VOTING_LABELS: Record<string, string> = useMemo(() => ({
    single: t('polls.view.votingMethod.single'),
    multiple: t('polls.view.votingMethod.multiple'),
    approval: t('polls.view.votingMethod.approval'),
    ranked: t('polls.view.votingMethod.ranked'),
    quadratic: t('polls.view.votingMethod.quadratic'),
  }), [t]);
  const {
    setBallots,
    setSelectedBallot,
    setCurrentBallot,
    setLoading: setVotingLoading,
    setVoting,
    setError: setVotingError,
    clearError: clearVotingError,
    addVotingRecord,
  } = useVotingActions();
  const votingStoreError = useVotingError();
  const storeIsVoting = useVotingIsVoting();

  // Extract specific poll fields for metadata to avoid unnecessary re-renders
  const pollId = poll.id;
  const pollTitle = poll.title;
  const votingMethod = poll.votingMethod;
  const privacyLevel = poll.privacyLevel;
  const pollStatusForMetadata = poll.status;
  const pollCategoryForMetadata = poll.category;

  const pollMetadataFactory = useCallback(
    () => ({
      pollId,
      pollTitle,
      votingMethod,
      privacyLevel,
      status: pollStatusForMetadata,
      category: pollCategoryForMetadata
    }),
    [pollId, pollTitle, votingMethod, privacyLevel, pollStatusForMetadata, pollCategoryForMetadata]
  )

  const recordPollEvent = useRecordPollEvent(pollMetadataFactory)

  const [results, setResults] = useState<PollResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoteAttempted, setHasVoteAttempted] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [localPollStatus, setLocalPollStatus] = useState(poll.status ?? 'active');

  const isPollCreator = Boolean(user?.id && poll.createdBy && String(user.id) === String(poll.createdBy));
  const pollStatus = localPollStatus ?? poll.status ?? 'active';
  const canClosePoll = (isPollCreator || isAdmin) && pollStatus === 'active';
  const canVote = poll.canVote ?? (pollStatus === 'active');

  // Debug logging for close/delete button visibility and voting status
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('PollClient: Button visibility and voting status', {
        pollId: poll.id,
        userId: user?.id,
        pollCreatedBy: poll.createdBy,
        isPollCreator,
        isAdmin,
        pollStatus,
        canClosePoll,
        canVote,
        hasUser: !!user,
        authLoading,
        hasCloseButton: canClosePoll,
        hasDeleteButton: isPollCreator,
      });
    }
  }, [poll.id, user?.id, poll.createdBy, isPollCreator, isAdmin, pollStatus, canClosePoll, canVote, user, authLoading]);

  // Use refs for stable app store actions to prevent infinite re-renders
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setVotingLoadingRef = useRef(setVotingLoading);
  useEffect(() => { setVotingLoadingRef.current = setVotingLoading; }, [setVotingLoading]);
  const setVotingErrorRef = useRef(setVotingError);
  useEffect(() => { setVotingErrorRef.current = setVotingError; }, [setVotingError]);
  const clearVotingErrorRef = useRef(clearVotingError);
  useEffect(() => { clearVotingErrorRef.current = clearVotingError; }, [clearVotingError]);

  // Use ref for stable translation function
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  useEffect(() => {
    const pollPath = `/polls/${pollId}`;

    setCurrentRouteRef.current(pollPath);
    setSidebarActiveSectionRef.current('polls');
    setBreadcrumbsRef.current([
      { label: tRef.current('polls.view.breadcrumbs.home'), href: '/' },
      { label: tRef.current('polls.view.breadcrumbs.dashboard'), href: '/dashboard' },
      { label: tRef.current('polls.view.breadcrumbs.polls'), href: '/polls' },
      { label: pollTitle ?? tRef.current('polls.view.breadcrumbs.pollDetail'), href: pollPath },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, [pollId, pollTitle]);

  // Extract specific poll fields for memoization stability
  const pollTotalVotesForBallot = typeof poll.totalVotes === 'number' ? poll.totalVotes : (typeof poll.totalvotes === 'number' ? poll.totalvotes : undefined);
  const pollDescriptionForBallot = poll.description ?? null;
  const pollOptionsForBallot = React.useMemo(() => poll.options ?? [], [poll.options]);
  const pollVotingMethodForBallot = poll.votingMethod ?? 'single';
  const pollEndtimeForBallot = poll.endtime ?? null;
  const pollStatusForBallot = poll.status ?? 'active';
  const pollCategoryForBallot = poll.category ?? null;
  const pollCreatedAtForBallot = poll.createdAt ?? null;

  const pollDetailsForBallot = useMemo(() => {
    return {
      id: pollId,
      title: pollTitle,
      description: pollDescriptionForBallot,
      options: [...pollOptionsForBallot],
      votingMethod: pollVotingMethodForBallot,
      ...(pollTotalVotesForBallot !== undefined ? { totalVotes: pollTotalVotesForBallot } : {}),
      endtime: pollEndtimeForBallot,
      status: pollStatusForBallot,
      category: pollCategoryForBallot,
      createdAt: pollCreatedAtForBallot,
    };
  }, [pollId, pollTitle, pollDescriptionForBallot, pollOptionsForBallot, pollVotingMethodForBallot, pollTotalVotesForBallot, pollEndtimeForBallot, pollStatusForBallot, pollCategoryForBallot, pollCreatedAtForBallot]);

  const combinedError = error ?? (hasVoteAttempted ? votingStoreError : null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/vote`, {
          method: 'HEAD',
          cache: 'no-store',
          credentials: 'include',
        });
        if (!cancelled) {
          setHasVoted(res.status === 200);
        }
      } catch {
        if (!cancelled) {
          setHasVoted(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pollId]);

  const fetchPollData = useCallback(async (showLoading = true) => {
    try {
      const generalError = tRef.current('polls.view.errors.loadResultsFailed');

      if (showLoading) {
        setLoading(true);
        setVotingLoadingRef.current(true);
      }
      setError(null);
      clearVotingErrorRef.current();

      const resultsResponse = await fetch(`/api/polls/${pollId}/results?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!resultsResponse.ok) {
        setResults(null);
        if (resultsResponse.status >= 500) {
          setError(generalError);
          setVotingErrorRef.current(generalError);
        }
        return;
      }

      const payload = await resultsResponse.json();
      if (payload?.success) {
        setResults(payload.data as PollResultsResponse);
        clearVotingErrorRef.current();
      } else {
        setResults(null);
        clearVotingErrorRef.current();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tRef.current('polls.view.errors.loadDataFailed');
      setResults(null);
      setError(errorMessage);
      setVotingErrorRef.current(errorMessage);
    } finally {
      if (showLoading) {
        setLoading(false);
        setVotingLoadingRef.current(false);
      }
    }
  }, [pollId]);

  useEffect(() => {
    void fetchPollData();
  }, [fetchPollData]);

  // Smart polling: only refresh when needed and adapt to activity
  useEffect(() => {
    if (pollStatus !== 'active') {
      return; // Don't poll for closed or draft polls
    }

    let pollInterval: NodeJS.Timeout | null = null;
    let pollIntervalMs = 30000; // Start with 30 seconds

    const startPolling = () => {
      // Only poll if tab is visible (don't waste resources on background tabs)
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      pollInterval = setInterval(() => {
        // Check if tab is still visible
        if (typeof document !== 'undefined' && document.hidden) {
          return;
        }

        void (async () => {
          await fetchPollData(false); // false = don't show loading state
          // Vote count changes are detected in a separate effect that watches results
        })();
      }, pollIntervalMs);
    };

    // Start with initial polling
    startPolling();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      } else {
        // Tab visible - resume polling
        if (!pollInterval) {
          pollIntervalMs = 10000; // Start fresh with 10s interval
          startPolling();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [pollStatus, fetchPollData, results]);

  useEffect(() => {
    const totalVotesContext =
      results?.total_votes ??
      pollDetailsForBallot.totalVotes ??
      (typeof poll.totalvotes === 'number' ? poll.totalvotes : undefined);

    // Handle both regular polls (results) and ranked polls (option_stats)
    const optionVoteCounts =
      results?.results?.reduce<Record<string, number>>((acc, row) => {
        const key = String(row.option_id);
        acc[key] = Number(row.vote_count ?? 0);
        return acc;
      }, {}) ??
      results?.option_stats?.reduce<Record<string, number>>((acc, row) => {
        const key = String(row.option_id);
        acc[key] = Number(row.first_choice_votes ?? 0);
        return acc;
      }, {}) ??
      undefined;

    const ballotContext: PollBallotContext = {
      ...(typeof totalVotesContext === 'number' ? { totalVotes: totalVotesContext } : {}),
      ...(optionVoteCounts && Object.keys(optionVoteCounts).length > 0
        ? { optionVoteCounts }
        : {}),
    };

    const ballot = createBallotFromPoll(pollDetailsForBallot, ballotContext);

    setBallots([ballot]);
    setSelectedBallot(ballot);
    setCurrentBallot(ballot);
  }, [
    poll.totalvotes,
    pollDetailsForBallot,
    results,
    setBallots,
    setCurrentBallot,
    setSelectedBallot,
  ]);

  const optionVoteLookup = useMemo(() => {
    const map = new Map<string, number>();
    // Handle regular polls (results array)
    if (results?.results) {
      results.results.forEach((row) => {
        const key = String(row.option_id);
        map.set(key, row.vote_count ?? 0);
      });
    }
    // Handle ranked polls (option_stats array)
    if (results?.option_stats) {
      results.option_stats.forEach((row) => {
        const key = String(row.option_id);
        map.set(key, row.first_choice_votes ?? 0);
      });
    }
    return map;
  }, [results]);

  const pollOptions = useMemo(() => poll.options ?? [], [poll.options]);
  const normalizedOptions: NormalizedOption[] = useMemo(() => {
    return pollOptions.map((option, index) => {
      const id = typeof option === 'string' ? String(index) : option.id ?? String(index);
      const text = typeof option === 'string' ? option : option.text ?? t('polls.view.options.fallback', { number: index + 1 });
      const baseVotes = typeof option === 'string' ? 0 : option.votes ?? option.voteCount ?? 0;
      const votes = optionVoteLookup.get(id) ?? optionVoteLookup.get(String(index)) ?? baseVotes;

      return {
        id,
        index,
        text,
        votes,
      };
    });
  }, [optionVoteLookup, pollOptions, t]);

  const initialVoteTotal = useMemo(
    () =>
      pollOptions.reduce((sum, option) => {
        if (typeof option === 'string') {
          return sum;
        }
        const voteValue = option.votes ?? option.voteCount ?? 0;
        return sum + voteValue;
      }, 0),
    [pollOptions],
  );

  const computedTotalVotes = useMemo(() => {
    if (results?.total_votes !== undefined) {
      return results.total_votes;
    }
    if (typeof poll.totalVotes === 'number') {
      return poll.totalVotes;
    }
    if (typeof poll.totalvotes === 'number') {
      return poll.totalvotes;
    }
    return initialVoteTotal;
  }, [poll.totalVotes, poll.totalvotes, results, initialVoteTotal]);

  const integrityInfo = results?.integrity;

  const totalRecordedVotes = useMemo(
    () => normalizedOptions.reduce((sum, option) => sum + option.votes, 0),
    [normalizedOptions],
  );

  const topOption = useMemo(() => {
    if (normalizedOptions.length === 0) return null;
    return normalizedOptions.reduce((currentTop, option) => {
      if (!currentTop || option.votes > currentTop.votes) {
        return option;
      }
      return currentTop;
    }, normalizedOptions[0]);
  }, [normalizedOptions]);

  // pollStatus and canVote are already defined above
  const participationCount = typeof poll.participation === 'number' ? poll.participation : 0;
  const privacyLabel = PRIVACY_LABELS[poll.privacyLevel ?? 'public'] ?? (poll.privacyLevel ?? 'Public');
  const votingLabel = VOTING_LABELS[poll.votingMethod ?? 'single'] ?? (poll.votingMethod ?? 'Single choice');

  const votingStatusMessage: VotingStatusMessage | null = useMemo(() => {
    if (pollStatus !== 'active') {
      const title = pollStatus === 'closed' ? t('polls.view.status.closed.title') : t('polls.view.status.notOpen.title');
      const description = pollStatus === 'closed'
        ? t('polls.view.status.closed.description')
        : t('polls.view.status.notOpen.description');
      return { title, description };
    }

    // Only show sign in required if auth has finished loading and user is still null
    if (!authLoading && !user) {
      return {
        title: t('polls.view.status.signInRequired.title'),
        description: t('polls.view.status.signInRequired.description'),
      };
    }

    if (!canVote) {
      return {
        title: t('polls.view.status.votingRestricted.title'),
        description: t('polls.view.status.votingRestricted.description'),
      };
    }

    return null;
  }, [authLoading, canVote, pollStatus, t, user]);

  const [hasVoted, setHasVoted] = useState(Boolean(poll.userVote));

  // Guard window access to prevent hydration mismatch
  const shareUrl = isMounted && typeof window !== 'undefined' ? `${window.location.origin}/polls/${poll.id}` : '';

  const handlePrintSummary = () => {
    if (!isMounted || typeof window === 'undefined') return;
    recordPollEvent('detail_print_summary', {
      label: poll.id,
      value: totalRecordedVotes,
      metadata: {
        totalVotes: totalRecordedVotes,
        options: normalizedOptions.length,
      },
    });
    window.print();
  };

  const {
    enabledMilestones,
    reachedMilestones,
    nextMilestone,
    preferences: milestonePreferences,
    updatePreference: updateMilestonePreference,
  } = usePollMilestoneNotifications({
    pollId: poll.id,
    totalVotes: computedTotalVotes,
    onMilestoneReached: (milestone) => {
      recordPollEvent('milestone_reached', {
        label: poll.id,
        value: milestone,
        metadata: {
          milestone,
          totalVotes: computedTotalVotes,
        },
      });
    },
  });

  const handleMilestoneToggle = useCallback(
    (milestone: PollMilestone, enabled: boolean) => {
      updateMilestonePreference(milestone, enabled);
      recordPollEvent('milestone_pref_updated', {
        label: poll.id,
        value: enabled ? 1 : 0,
        metadata: {
          pollId: poll.id,
          milestone,
          enabled,
          context: 'poll_detail',
        },
      });
    },
    [poll.id, recordPollEvent, updateMilestonePreference],
  );

  const handleVote = useCallback(async (submission: VoteSubmission): Promise<{ ok: boolean; id?: string; error?: string }> => {
    if (!user || !canVote || pollStatus !== 'active' || storeIsVoting) {
      return { ok: false, error: 'Cannot vote at this time' };
    }

    setHasVoteAttempted(true);
    setError(null);
    clearVotingError();
    setVoting(true);

    try {
      // Build request body based on voting method
      let requestBody: Record<string, unknown>;

      if (submission.method === 'single') {
        requestBody = { choice: submission.choice };
      } else if (submission.method === 'multiple') {
        requestBody = { selections: submission.selections };
      } else if (submission.method === 'approval') {
        requestBody = { approvals: submission.approvals };
      } else if (submission.method === 'ranked') {
        requestBody = { rankings: submission.rankings };
      } else if (submission.method === 'range') {
        requestBody = { ratings: submission.ratings };
      } else if (submission.method === 'quadratic') {
        requestBody = { allocations: submission.allocations };
      } else {
        throw new Error('Invalid voting method');
      }

      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        // Extract detailed error message from validation errors if available
        let errorMessage = errorData?.error ?? t('polls.view.errors.voteFailed');
        if (errorData?.details && typeof errorData.details === 'object') {
          const fieldErrors = Object.values(errorData.details).filter(Boolean);
          if (fieldErrors.length > 0) {
            errorMessage = Array.isArray(fieldErrors) ? fieldErrors[0] : String(fieldErrors[0]);
          }
        }
        logger.error('Vote submission failed', {
          pollId: poll.id,
          status: response.status,
          error: errorMessage,
          errorData,
          requestBody
        });
        throw new Error(errorMessage);
      }

      const payload = await response.json();
      const resultData = payload?.data ?? {};

      setHasVoted(true);
      logger.info('Vote submitted successfully', { pollId: poll.id, method: submission.method });
      recordPollEvent('vote_cast', {
        label: poll.id,
        value: 1,
        metadata: {
          method: submission.method,
        },
      });
      addNotification({
        type: 'success',
        title: t('polls.view.notifications.voteRecorded.title'),
        message: t('polls.view.notifications.voteRecorded.message'),
        duration: 3000,
      });
      await fetchPollData(true); // true = show loading state after vote
      router.refresh();

      const voteId =
        typeof resultData.voteId === 'string'
          ? resultData.voteId
          : `vote-${poll.id}-${isMounted ? Date.now().toString(36) : 'pending'}`;

      addVotingRecord(
        createVotingRecordFromPollSubmission({
          poll: pollDetailsForBallot,
          submission,
          voteId,
        })
      );

      return {
        ok: true,
        id: voteId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('polls.view.errors.voteFailed');
      setError(errorMessage);
      setVotingError(errorMessage);
      addNotification({
        type: 'error',
        title: t('polls.view.notifications.voteFailed.title'),
        message: errorMessage,
        duration: 4000,
      });
      recordPollEvent('vote_failed', {
        label: poll.id,
        metadata: {
          method: submission.method,
          error: errorMessage,
        },
      });
      logger.error('Vote submission failed', { pollId: poll.id, error: errorMessage });
      return {
        ok: false,
        error: errorMessage,
      };
    } finally {
      setVoting(false);
    }
  }, [user, canVote, pollStatus, storeIsVoting, poll.id, pollDetailsForBallot, t, addNotification, recordPollEvent, fetchPollData, addVotingRecord, isMounted, setVoting, setError, setHasVoted, setHasVoteAttempted, clearVotingError, setVotingError, router]);

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      addNotification({
        type: 'success',
        title: t('polls.view.notifications.linkCopied.title'),
        message: t('polls.view.notifications.linkCopied.message'),
        duration: 3000,
      });
      recordPollEvent('detail_copy_link', {
        label: poll.id,
        value: 1,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('polls.view.notifications.copyFailed.title'),
        message: error instanceof Error ? error.message : t('polls.view.notifications.copyFailed.message'),
        duration: 4000,
      });
    }
  };

  const handleOpenAnalytics = () => {
    recordPollEvent('detail_view_analytics', {
      label: poll.id,
      value: 1,
    });
    router.push(`/polls/analytics?pollId=${poll.id}`);
  };

  const getVotePercentage = (votes: number) => {
    if (computedTotalVotes === 0) return 0;
    return Math.round((votes / computedTotalVotes) * 100);
  };

  const handleDeletePoll = useCallback(async () => {
    if (!isPollCreator || !poll.id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/polls/${poll.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `Failed to delete poll: ${response.status}`);
      }

      addNotification({
        type: 'success',
        title: 'Poll deleted',
        message: 'Your poll has been deleted successfully.',
        duration: 4000,
      });

      recordPollEvent('poll_deleted', {
        label: poll.id,
        value: 1,
      });

      // Redirect to polls page
      router.push('/polls');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete poll';
      addNotification({
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
  }, [isPollCreator, poll.id, addNotification, recordPollEvent, router]);

  const handleClosePoll = useCallback(async () => {
    if (!canClosePoll || !poll.id || pollStatus !== 'active') return;
    setIsClosing(true);
    try {
      const response = await fetch(`/api/polls/${poll.id}/close`, { method: 'POST', credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error ?? `Failed to close poll (${response.status})`);
      }
      // Update local state immediately
      setLocalPollStatus('closed');
      setShowCloseConfirm(false);
      addNotification({
        type: 'success',
        title: 'Poll closed',
        message: 'This poll is now closed. You can view advanced analytics.',
        duration: 4000,
      });
      recordPollEvent('poll_closed', { label: poll.id, value: 1 });
      // Refresh to get latest data from server
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to close poll';
      addNotification({ type: 'error', title: 'Close failed', message: msg, duration: 6000 });
      logger.error('Failed to close poll', { pollId: poll.id, error: msg });
    } finally {
      setIsClosing(false);
    }
  }, [canClosePoll, poll.id, pollStatus, addNotification, recordPollEvent, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" aria-busy={loading} data-testid="poll-details">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="poll-title">
            {poll.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {poll.category && <Badge variant="outline" className="font-medium">{poll.category}</Badge>}
            <Badge variant="secondary" className="font-medium">{privacyLabel}</Badge>
            <Badge variant="secondary" className="font-medium">{votingLabel}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleCopyShareLink}>
            <Share2 className="mr-2 h-4 w-4" /> {t('polls.view.buttons.share')}
          </Button>
          <Button type="button" variant="secondary" onClick={handleOpenAnalytics}>
            <BarChart3 className="mr-2 h-4 w-4" /> {t('polls.view.buttons.analytics')}
          </Button>
          <Button type="button" variant="ghost" onClick={handlePrintSummary}>
            <Printer className="mr-2 h-4 w-4" /> {t('polls.view.buttons.printSummary')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setIsReportOpen(true)}>
            <AlertCircle className="mr-2 h-4 w-4" /> Report
          </Button>
          {canClosePoll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCloseConfirm(true)}
              className="gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
              disabled={isClosing}
              aria-label="Close poll"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              Close Poll
            </Button>
          )}
          {isPollCreator && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-4 text-sm font-medium text-foreground">
          {t('polls.view.loading')}
        </div>
      )}

      {poll.description && (
        <p className="text-foreground font-medium leading-relaxed mb-6" data-testid="poll-description">
          {poll.description}
        </p>
      )}

      {/* Quick Stats - Compact summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase font-semibold text-foreground/80">{t('polls.view.stats.totalVotes')}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {isMounted ? computedTotalVotes.toLocaleString() : computedTotalVotes.toString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase font-semibold text-foreground/80">{t('polls.view.stats.participation')}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {isMounted ? participationCount.toLocaleString() : participationCount.toString()}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-xs uppercase font-semibold text-foreground/80">{t('polls.view.stats.status')}</p>
          <p className={cn('mt-2 text-2xl font-semibold capitalize', pollStatus === 'closed' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
            {pollStatus === 'closed' ? t('polls.view.status.closed.label') : pollStatus === 'active' ? t('polls.view.status.active.label') : t('polls.view.status.draft.label')}
          </p>
        </div>
      </div>

      {/* Leading Option - Only show if there are votes */}
      {topOption && totalRecordedVotes > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 shadow-sm mb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-500/20 p-2">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-amber-700 dark:text-amber-400">{t('polls.view.leadingOption.label')}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{topOption.text}</p>
              <p className="text-sm text-foreground/80">
                {t('polls.view.leadingOption.votes', { votes: topOption.votes, percentage: getVotePercentage(topOption.votes), total: computedTotalVotes })}
              </p>
            </div>
          </div>
        </div>
      )}

      {votingStatusMessage && (
        <Alert variant="default" className="border border-amber-500/20 bg-amber-500/10 text-foreground mb-6">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-foreground">{votingStatusMessage.title}</AlertTitle>
          <AlertDescription className="text-foreground/90">{votingStatusMessage.description}</AlertDescription>
        </Alert>
      )}

      {combinedError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6" role="alert">
          {combinedError}
        </div>
      )}

      {/* Voting Interface - PRIORITY: Show first for active polls where user can vote */}
      {pollStatus === 'active' && canVote && user && !hasVoted && normalizedOptions.length > 0 && (
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle data-testid="voting-section-title">Cast Your Vote</CardTitle>
            <CardDescription>Select your preferred option(s) below</CardDescription>
          </CardHeader>
          <CardContent className="pt-6" data-testid="voting-form">
            <VotingInterface
              poll={{
                id: poll.id,
                // Don't duplicate title/description - they're already shown above
                options: normalizedOptions.map((option) => ({
                  id: option.id,
                  text: option.text,
                })),
                votingMethod: poll.votingMethod ?? 'single',
                totalVotes: computedTotalVotes,
                endtime: poll.endtime ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              }}
              onVote={handleVote}
              isVoting={storeIsVoting}
              hasVoted={hasVoted}
              onAnalyticsEvent={(action, payload) => {
                recordPollEvent(action, payload ?? {});
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Poll Options Display - Show after voting interface */}
      {normalizedOptions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle data-testid="poll-options-title">Poll Options</CardTitle>
            <CardDescription>
              {pollStatus === 'active' && canVote && !hasVoted && user
                ? 'View the options below'
                : hasVoted
                  ? 'You have already voted on this poll'
                  : pollStatus !== 'active'
                    ? 'This poll is closed'
                    : !user
                      ? 'Sign in to vote'
                      : !canVote
                        ? 'Voting is restricted for this poll'
                        : 'This poll is no longer accepting votes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="poll-options-list">
              {normalizedOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="p-4 border-2 border-border rounded-lg bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground break-words">{option.text}</p>
                      {option.votes !== undefined && option.votes > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.votes} vote{option.votes !== 1 ? 's' : ''} ({getVotePercentage(option.votes)}%)
                        </p>
                      )}
                    </div>
                  </div>
                  {option.votes > 0 && (
                    <div className="mt-3 w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getVotePercentage(option.votes)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {/* Secondary Information - Moved to bottom */}

      {/* Milestones - Collapsible and less prominent (collapsed by default) */}
      <details className="rounded-lg border border-border/40 bg-muted/20 mb-4" open={false}>
        <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <span>{t('polls.view.milestones.label')}</span>
            {enabledMilestones.length > 0 && (
              <span className="text-xs text-foreground/70 font-normal">
                {t('polls.view.milestones.tracking', { milestones: enabledMilestones.map((milestone) => isMounted ? milestone.toLocaleString() : milestone.toString()).join(', ') })}
              </span>
            )}
          </div>
        </summary>
        <div className="border-t border-border/40 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {enabledMilestones.length === 0 ? (
                <p className="text-sm font-medium text-foreground/80">
                  {t('polls.view.milestones.empty')}
                </p>
              ) : (
                <p className="text-sm font-medium text-foreground/80">
                  {t('polls.view.milestones.tracking', { milestones: enabledMilestones.map((milestone) => isMounted ? milestone.toLocaleString() : milestone.toString()).join(', ') })}
                </p>
              )}
              {nextMilestone && (
                <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('polls.view.milestones.nextUp', { count: nextMilestone })}
                </p>
              )}
              {reachedMilestones.length > 0 && (
                <div className="mt-3 text-sm">
                  <p className="font-semibold text-foreground">{t('polls.view.milestones.achieved')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {reachedMilestones.map((milestone) => (
                      <Badge key={`reached-${milestone}`} variant="secondary">
                        {t('polls.view.milestones.votesBadge', { count: milestone })}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {POLL_MILESTONES.map((milestone) => (
                <div
                  key={`milestone-pref-${milestone}`}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-background/50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('polls.view.milestones.itemLabel', { count: milestone })}</p>
                    <p className="text-xs font-medium text-foreground/70">{t('polls.view.milestones.itemDescription', { count: milestone })}</p>
                  </div>
                  <Switch
                    checked={Boolean(milestonePreferences[milestone])}
                    onCheckedChange={(checked: boolean) => handleMilestoneToggle(milestone, checked)}
                    aria-label={t('polls.view.milestones.toggleAria', { count: milestone })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Integrity Check - Moved to bottom (incomplete feature) */}
      {integrityInfo && (
        <details className="rounded-lg border border-border/40 bg-muted/20" open={false}>
          <summary className="cursor-pointer p-3 text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors">
            Integrity Check Applied
          </summary>
          <div className="border-t border-border/40 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase text-foreground">Integrity check applied</p>
                <p className="text-sm text-foreground/80">
                  {integrityInfo.excluded_votes > 0
                    ? `${integrityInfo.excluded_votes} votes excluded from displayed results.`
                    : 'No votes excluded from displayed results.'}
                </p>
                <p className="text-xs text-foreground/70 mt-1">
                  Raw total: {isMounted ? integrityInfo.raw_total_votes.toLocaleString() : integrityInfo.raw_total_votes}
                  {' '}• Scored: {integrityInfo.scored_votes} • Unscored: {integrityInfo.unscored_votes}
                </p>
              </div>
            </div>
          </div>
        </details>
      )}

      <Separator />

      <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-foreground/80">
        <span className="inline-flex items-center gap-1">
          <Shield className="h-4 w-4" /> {privacyLabel}
        </span>
        <span>•</span>
        <span>{votingLabel}</span>
        {poll.createdAt && (
          <>
            <span>•</span>
            <span>
              {t('polls.view.created', {
                date: isMounted
                  ? new Date(poll.createdAt).toLocaleString()
                  : new Date(poll.createdAt).toISOString().split('T')[0] // Stable format during SSR
              })}
            </span>
          </>
        )}
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="poll"
        targetId={pollId}
        targetLabel={pollTitle}
      />

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
              className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
              {isClosing ? 'Closing...' : 'Close Poll'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
