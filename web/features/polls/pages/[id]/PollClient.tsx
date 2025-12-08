'use client';

import { AlertCircle, BarChart3, Printer, Share2, Shield, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics';
import { usePollMilestoneNotifications, POLL_MILESTONES, type PollMilestone } from '@/features/polls/hooks/usePollMilestones';
import {
  createBallotFromPoll,
  createVotingRecordFromPollSubmission,
  type PollBallotContext,
} from '@/features/voting/lib/pollAdapters';
import { useVotingActions, useVotingError, useVotingIsVoting } from '@/features/voting/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useNotificationActions } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

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
  results: Array<{
    option_id: string | number;
    option_text?: string;
    vote_count: number;
  }>;
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
  const { user } = useAuth();
  const router = useRouter();
  const { addNotification } = useNotificationActions();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
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

  const pollMetadataFactory = useCallback(
    () => ({
      pollId: poll.id,
      pollTitle: poll.title,
      votingMethod: poll.votingMethod,
      privacyLevel: poll.privacyLevel,
      status: poll.status,
      category: poll.category
    }),
    [poll]
  )

  const recordPollEvent = useRecordPollEvent(pollMetadataFactory)

  const [results, setResults] = useState<PollResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollId = poll.id;

  useEffect(() => {
    const pollPath = `/polls/${poll.id}`;

    setCurrentRoute(pollPath);
    setSidebarActiveSection('polls');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Polls', href: '/polls' },
      { label: poll.title ?? 'Poll Detail', href: pollPath },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [poll.id, poll.title, setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  const pollDetailsForBallot = useMemo(() => {
    const totalVotes =
      typeof poll.totalVotes === 'number'
        ? poll.totalVotes
        : typeof poll.totalvotes === 'number'
        ? poll.totalvotes
        : undefined;

    return {
      id: poll.id,
      title: poll.title,
      description: poll.description ?? null,
      options: [...(poll.options ?? [])],
      votingMethod: poll.votingMethod ?? 'single',
      ...(totalVotes !== undefined ? { totalVotes } : {}),
      endtime: poll.endtime ?? null,
      status: poll.status ?? 'active',
      category: poll.category ?? null,
      createdAt: poll.createdAt ?? null,
    };
  }, [poll]);

  const combinedError = error ?? votingStoreError ?? null;

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

  const fetchPollData = useCallback(async () => {
    try {
      const generalError = t('polls.view.errors.loadResultsFailed');

      setLoading(true);
      setVotingLoading(true);
      setError(null);
      clearVotingError();

      const resultsResponse = await fetch(`/api/polls/${pollId}/results`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!resultsResponse.ok) {
        setResults(null);
        if (resultsResponse.status >= 500) {
          setError(generalError);
          setVotingError(generalError);
        }
        return;
      }

      const payload = await resultsResponse.json();
      if (payload?.success) {
        setResults(payload.data as PollResultsResponse);
        clearVotingError();
      } else {
        setResults(null);
        clearVotingError();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('polls.view.errors.loadDataFailed');
      setResults(null);
      setError(errorMessage);
      setVotingError(errorMessage);
    } finally {
      setLoading(false);
      setVotingLoading(false);
    }
  }, [pollId, clearVotingError, setVotingError, setVotingLoading, t]);

  useEffect(() => {
    void fetchPollData();
  }, [fetchPollData]);

  useEffect(() => {
    const totalVotesContext =
      results?.total_votes ??
      pollDetailsForBallot.totalVotes ??
      (typeof poll.totalvotes === 'number' ? poll.totalvotes : undefined);

    const optionVoteCounts =
      results?.results.reduce<Record<string, number>>((acc, row) => {
        const key = String(row.option_id);
        acc[key] = Number(row.vote_count ?? 0);
        return acc;
      }, {}) ?? undefined;

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
    results?.results.forEach((row) => {
      const key = String(row.option_id);
      map.set(key, row.vote_count ?? 0);
    });
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

  const pollStatus = poll.status ?? 'active';
  const canVote = poll.canVote ?? false;
  const participationCount = typeof poll.participation === 'number' ? poll.participation : 0;
  const privacyLabel = useMemo(() => {
    const labels: Record<string, string> = {
      public: t('polls.create.privacy.public'),
      private: t('polls.create.privacy.private'),
      unlisted: t('polls.create.privacy.unlisted'),
    };
    const key = poll.privacyLevel ?? 'public';
    return labels[key] ?? (poll.privacyLevel ?? 'Public');
  }, [poll.privacyLevel, t]);

  const votingLabel = useMemo(() => {
    const labels: Record<string, string> = {
      single: t('polls.create.votingMethod.single'),
      multiple: t('polls.create.votingMethod.multiple'),
      approval: t('polls.create.votingMethod.approval'),
      ranked: t('polls.create.votingMethod.ranked'),
    };
    const key = poll.votingMethod ?? 'single';
    return labels[key] ?? (poll.votingMethod ?? 'Single choice');
  }, [poll.votingMethod, t]);

  const votingStatusMessage: VotingStatusMessage | null = useMemo(() => {
    if (pollStatus !== 'active') {
      const title = pollStatus === 'closed' ? t('polls.view.status.closed.title') : t('polls.view.status.notOpen.title');
      const description = pollStatus === 'closed'
        ? t('polls.view.status.closed.description')
        : t('polls.view.status.notOpen.description');
      return { title, description };
    }

    if (!user) {
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
  }, [canVote, pollStatus, t, user]);

  const [selectedOption, setSelectedOption] = useState<string | null>(poll.userVote ?? null);
  const [hasVoted, setHasVoted] = useState(Boolean(poll.userVote));

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/polls/${poll.id}` : '';

  const handlePrintSummary = () => {
    if (typeof window === 'undefined') return;
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

  const handleVote = async (option: NormalizedOption) => {
    if (!user || !canVote || pollStatus !== 'active' || storeIsVoting) {
      return;
    }

    setError(null);
    clearVotingError();
    setVoting(true);

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ choice: option.index }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? t('polls.view.errors.voteFailed'));
      }

      const payload = await response.json();
      const resultData = payload?.data ?? {};

      setSelectedOption(option.id);
      setHasVoted(true);
      logger.info('Vote submitted successfully', { pollId: poll.id, optionId: option.id });
      recordPollEvent('vote_cast', {
        label: poll.id,
        value: 1,
        metadata: {
          optionId: option.id,
          optionIndex: option.index,
        },
      });
      addNotification({
        type: 'success',
        title: t('polls.view.notifications.voteRecorded.title'),
        message: t('polls.view.notifications.voteRecorded.message'),
        duration: 3000,
      });
      void fetchPollData();

      const voteId =
        typeof resultData.voteId === 'string'
          ? resultData.voteId
          : `vote-${poll.id}-${Date.now().toString(36)}`;

      addVotingRecord(
        createVotingRecordFromPollSubmission({
          poll: pollDetailsForBallot,
          submission: { method: 'single', choice: option.index },
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
          optionId: option.id,
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
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" aria-busy={loading} data-testid="poll-details">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="poll-title">
            {poll.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {poll.category && <Badge variant="outline">{poll.category}</Badge>}
            <Badge variant="secondary">{privacyLabel}</Badge>
            <Badge variant="secondary">{votingLabel}</Badge>
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
        </div>
      </div>

      {loading && (
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/10 p-4 text-sm text-muted-foreground">
          {t('polls.view.loading')}
        </div>
      )}

      {poll.description && (
        <p className="text-gray-700 leading-relaxed" data-testid="poll-description">
          {poll.description}
        </p>
      )}

      {topOption && totalRecordedVotes > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-200 p-2">
              <Trophy className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-amber-700">{t('polls.view.leadingOption.label')}</p>
              <p className="mt-1 text-lg font-semibold text-amber-900">{topOption.text}</p>
              <p className="text-sm text-amber-800">
                {t('polls.view.leadingOption.votes', { votes: topOption.votes, percentage: getVotePercentage(topOption.votes), total: computedTotalVotes })}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t('polls.view.stats.totalVotes')}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{computedTotalVotes.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t('polls.view.stats.participation')}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{participationCount.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-muted-foreground">{t('polls.view.stats.status')}</p>
          <p className={cn('mt-2 text-2xl font-semibold capitalize', pollStatus === 'closed' ? 'text-red-600' : 'text-emerald-600')}>
            {pollStatus === 'closed' ? t('polls.view.status.closed.label') : pollStatus === 'active' ? t('polls.view.status.active.label') : t('polls.view.status.draft.label')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{t('polls.view.milestones.label')}</p>
          {enabledMilestones.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('polls.view.milestones.empty')}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('polls.view.milestones.tracking', { milestones: enabledMilestones.map((milestone) => milestone.toLocaleString()).join(', ') })}
            </p>
          )}
          {nextMilestone && (
            <p className="mt-3 text-sm text-emerald-700">
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
              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{t('polls.view.milestones.itemLabel', { count: milestone })}</p>
                <p className="text-xs text-muted-foreground">{t('polls.view.milestones.itemDescription', { count: milestone })}</p>
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

      {votingStatusMessage && (
        <Alert variant="default" className="border border-amber-200 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{votingStatusMessage.title}</AlertTitle>
          <AlertDescription>{votingStatusMessage.description}</AlertDescription>
        </Alert>
      )}

      {combinedError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          {combinedError}
        </div>
      )}

      <div className="space-y-4">
        {normalizedOptions.map((option) => (
          <div
            key={option.id}
            className="border rounded-lg bg-white p-4 shadow-sm"
            data-testid={`poll-option-${option.index}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{option.text}</span>
              <span className="text-sm text-gray-500">
                {t('polls.view.options.voteCount', { votes: option.votes, percentage: getVotePercentage(option.votes) })}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getVotePercentage(option.votes)}%` }}
              />
            </div>

            {pollStatus === 'active' && canVote && user && (
              <Button
                type="button"
                variant={selectedOption === option.id ? 'secondary' : 'default'}
                onClick={() => handleVote(option)}
                disabled={storeIsVoting || hasVoted}
                data-testid={`vote-button-${option.index}`}
              >
                {selectedOption === option.id ? t('polls.view.buttons.voted') : storeIsVoting ? t('polls.view.buttons.voting') : t('polls.view.buttons.vote')}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Shield className="h-4 w-4" /> {privacyLabel}
        </span>
        <span>•</span>
        <span>{votingLabel}</span>
        {poll.createdAt && (
          <>
            <span>•</span>
            <span>{t('polls.view.created', { date: new Date(poll.createdAt).toLocaleString() })}</span>
          </>
        )}
      </div>
    </div>
  );
}
