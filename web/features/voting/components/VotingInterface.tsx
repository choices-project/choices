'use client';

import { Users, Clock } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics'
import { useVotingCountdown } from '@/features/voting/hooks/useVotingCountdown'
import { useVotingIsVoting, useVotingRecords } from '@/features/voting/lib/store'

import { BottomSheet } from '@/components/shared/BottomSheet'
import { TrustTierBadge } from '@/components/shared/TrustTierBadge'
import { Button } from '@/components/ui/button'

import { useIsMobile } from '@/lib/hooks/useMediaQuery'
import { useNotificationActions, useNotificationSettings } from '@/lib/stores/notificationStore'

import { useI18n } from '@/hooks/useI18n'

import ApprovalVoting from './ApprovalVoting'
import MultipleChoiceVoting from './MultipleChoiceVoting'
import QuadraticVoting from './QuadraticVoting'
import RangeVoting from './RangeVoting'
import RankedChoiceVoting from './RankedChoiceVoting'
import SingleChoiceVoting from './SingleChoiceVoting'

type VoteResponse = { ok: boolean; id?: string; error?: string }
type VerificationResponse = { ok: boolean; error?: string }

class VoteCancelledError extends Error {
  constructor() {
    super('Vote cancelled')
    this.name = 'VoteCancelledError'
  }
}

export type VoteSubmission =
  | { method: 'single'; choice: number }
  | { method: 'multiple'; selections: number[] }
  | { method: 'approval'; approvals: string[] }
  | { method: 'ranked'; rankings: number[] }
  | { method: 'range'; ratings: Record<string, number> }
  | { method: 'quadratic'; allocations: Record<string, number> };

export type VoteAnalyticsPayload = {
  category?: string
  label?: string
  value?: number
  metadata?: Record<string, unknown>
}

type OnVote = (submission: VoteSubmission) => Promise<VoteResponse>
type OnVerify = (id: string) => Promise<VerificationResponse>

type Poll = {
  id: string;
  title?: string;
  description?: string;
  votingMethod?: string;
  options: Array<{ id: string; text: string; description?: string }>;
  endtime: string;
  totalVotes: number;
}

type VotingInterfaceProps = {
  poll: Poll;
  onVote: OnVote;
  onVerify?: OnVerify;
  isVoting?: boolean;
  hasVoted?: boolean;
  userVote?: number;
  userMultipleVote?: number[];
  userApprovalVote?: string[];
  userQuadraticVote?: Record<string, number>;
  userRangeVote?: Record<string, number>;
  userRankedVote?: string[];
  verificationTier?: string;
  onAnalyticsEvent?: (action: string, payload?: VoteAnalyticsPayload) => void;
}

export default function VotingInterface({
  poll,
  onVote,
  onVerify: _onVerify,
  isVoting = false,
  hasVoted = false,
  userVote,
  userMultipleVote,
  userApprovalVote,
  userQuadraticVote,
  userRangeVote,
  userRankedVote,
  verificationTier = 'T0',
  onAnalyticsEvent,
}: VotingInterfaceProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const storeIsVoting = useVotingIsVoting();
  const votingRecords = useVotingRecords();
  const timeRemaining = useVotingCountdown(poll.endtime);

  const [confirmSheet, setConfirmSheet] = useState<{
    submission: VoteSubmission;
    execute: () => Promise<VoteResponse>;
    resolve: (result: VoteResponse) => void;
    reject: (err: unknown) => void;
  } | null>(null);

  const notificationSettings = useNotificationSettings()
  const { addNotification } = useNotificationActions()
  const recordPollEvent = useRecordPollEvent()

  // Refs for stable action callbacks
  const addNotificationRef = useRef(addNotification)
  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification])
  const recordPollEventRef = useRef(recordPollEvent)
  useEffect(() => { recordPollEventRef.current = recordPollEvent; }, [recordPollEvent])

  const storeHasVoted = useMemo(
    () => votingRecords.some((record) => record.ballotId === poll.id),
    [poll.id, votingRecords]
  )

  const effectiveIsVoting = storeIsVoting || Boolean(isVoting)
  const effectiveHasVoted = storeHasVoted || Boolean(hasVoted)

  const emitAnalytics = useCallback(
    (action: string, payload?: VoteAnalyticsPayload) => {
      const metadata = payload?.metadata ?? {}
      recordPollEventRef.current(action, {
        ...payload,
        label: payload?.label ?? poll.id,
        metadata: {
          ...metadata,
          pollId: metadata.pollId ?? poll.id,
          source: metadata.source ?? 'voting-interface',
        },
      })

      if (onAnalyticsEvent) {
        onAnalyticsEvent(action, payload)
      }
    },
    [onAnalyticsEvent, poll.id]
  )

  const notifySuccess = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'success',
        title: t('polls.voting.notifications.submitted.title') || 'Vote submitted',
        message: message || (t('polls.voting.notifications.submitted.message') || 'Your vote has been recorded.'),
        duration: notificationSettings.duration,
      })
    },
    [notificationSettings.duration, t]
  )

  const notifyError = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'error',
        title: t('polls.voting.notifications.failed.title') || 'Vote failed',
        message: message || (t('polls.voting.notifications.failed.message') || 'Failed to submit vote'),
        duration: notificationSettings.duration,
      })
    },
    [notificationSettings.duration, t]
  )

  const handleVoteResult = useCallback(
    (result: VoteResponse, context: VoteAnalyticsPayload & { method: string }) => {
      if (result.ok) {
        const payload: VoteAnalyticsPayload = {
          metadata: {
            method: context.method,
            ...(context.metadata ?? {}),
          },
        }

        if (typeof context.value === 'number') {
          payload.value = context.value
        }

        emitAnalytics('vote_cast', payload)
      } else {
        emitAnalytics('vote_failed', {
          metadata: {
            method: context.method,
            error: result.error ?? 'Unknown error',
            ...(context.metadata ?? {}),
          },
        })
      }
    },
    [emitAnalytics]
  )

  const getSubmissionSummary = useCallback(
    (submission: VoteSubmission): string => {
      const opts = poll.options;
      switch (submission.method) {
        case 'single': {
          const opt = opts[submission.choice];
          return opt?.text ?? String(submission.choice);
        }
        case 'multiple': {
          const texts = submission.selections
            .map((i) => opts[i]?.text)
            .filter(Boolean) as string[];
          return texts.join(', ') || '—';
        }
        case 'approval': {
          const texts = submission.approvals
            .map((id) => opts.find((o) => o.id === id)?.text)
            .filter(Boolean) as string[];
          return texts.join(', ') || '—';
        }
        case 'ranked': {
          const texts = submission.rankings.map(
            (idx, i) => `${i + 1}. ${opts[idx]?.text ?? '?'}`
          );
          return texts.join(', ') || '—';
        }
        case 'range':
        case 'quadratic':
          return t('polls.voting.confirm.customRatings') || 'Custom ratings';
        default:
          return '—';
      }
    },
    [poll.options, t]
  )

  const maybeConfirm = useCallback(
    (
      submission: VoteSubmission,
      execute: () => Promise<VoteResponse>,
      _context: VoteAnalyticsPayload & { method: string }
    ): Promise<VoteResponse> => {
      if (!isMobile) return execute();
      return new Promise((resolve, reject) => {
        setConfirmSheet({
          submission,
          execute,
          resolve,
          reject,
        });
      });
    },
    [isMobile]
  )

  const handleConfirmVote = useCallback(async () => {
    if (!confirmSheet) return;
    const { execute, resolve } = confirmSheet;
    setConfirmSheet(null);
    try {
      const result = await execute();
      resolve(result);
    } catch (e) {
      confirmSheet.reject(e);
    }
  }, [confirmSheet])

  const handleCancelVote = useCallback(() => {
    if (!confirmSheet) return;
    confirmSheet.reject(new VoteCancelledError());
    setConfirmSheet(null);
  }, [confirmSheet])

  const runVote = useCallback(
    async (
      submission: VoteSubmission,
      context: VoteAnalyticsPayload & { method: string }
    ) => {
      const result = await maybeConfirm(
        submission,
        () => onVote(submission),
        context
      )
      handleVoteResult(result, context)
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess(t('polls.voting.notifications.submitted.message') || 'Your vote has been recorded.')
    },
    [handleVoteResult, maybeConfirm, notifyError, notifySuccess, onVote, t]
  )

  const handleVoteCatch = useCallback((err: unknown) => {
    if (err instanceof VoteCancelledError) return
    notifyError(err instanceof Error ? err.message : 'Failed to submit vote')
    throw err
  }, [notifyError])

  // Stable adapters for each child signature (NO unused params anywhere)
  const onApproval = useCallback(
    async (...[, approvals]: [string, string[]]) => {
      try {
        await runVote(
          { method: 'approval', approvals },
          { method: 'approval', value: approvals.length, metadata: { approvals } }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  const onQuadratic = useCallback(
    async (...[, allocations]: [string, Record<string, number>]) => {
      try {
        await runVote(
          { method: 'quadratic', allocations },
          {
            method: 'quadratic',
            value: Object.values(allocations).reduce((s, v) => s + v, 0),
            metadata: { allocations },
          }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  const onRange = useCallback(
    async (...[, ratings]: [string, Record<string, number>]) => {
      try {
        await runVote(
          { method: 'range', ratings },
          {
            method: 'range',
            value: Object.values(ratings).reduce((s, v) => s + v, 0),
            metadata: { ratings },
          }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  const onRanked = useCallback(
    async (...[, rankings]: [string, number[]]) => {
      try {
        await runVote(
          { method: 'ranked', rankings },
          { method: 'ranked', value: rankings.length, metadata: { rankings } }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  const onSingle = useCallback(
    async (choice: number) => {
      try {
        await runVote(
          { method: 'single', choice },
          { method: 'single', value: 1, metadata: { choice } }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  const onMultiple = useCallback(
    async (selections: number[]) => {
      try {
        await runVote(
          { method: 'multiple', selections },
          {
            method: 'multiple',
            value: selections.length,
            metadata: { selections },
          }
        )
      } catch (e) {
        handleVoteCatch(e)
      }
    },
    [handleVoteCatch, runVote]
  );

  // Normalize voting method to handle variations like 'ranked_choice' -> 'ranked'
  const normalizeVotingMethod = (method: string): string => {
    const normalized = method.toLowerCase();
    switch (normalized) {
      case 'single':
      case 'single_choice':
        return 'single';
      case 'multiple':
      case 'multiple_choice':
        return 'multiple';
      case 'ranked':
      case 'ranked_choice':
        return 'ranked';
      case 'approval':
        return 'approval';
      case 'quadratic':
        return 'quadratic';
      case 'range':
        return 'range';
      default:
        return normalized;
    }
  };

  const renderVotingComponent = () => {
    const votingMethod = normalizeVotingMethod(poll.votingMethod ?? 'single');

    switch (votingMethod) {
      case 'approval':
        return (
          <ApprovalVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onApproval}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userApprovalVote && { userVote: userApprovalVote })}
          />
        );
      case 'quadratic':
        return (
          <QuadraticVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onQuadratic}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userQuadraticVote && { userVote: userQuadraticVote })}
          />
        );
      case 'range':
        return (
          <RangeVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onRange}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userRangeVote && { userVote: userRangeVote })}
          />
        );
      case 'ranked':
        return (
          <RankedChoiceVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onRanked}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userRankedVote && { userVote: userRankedVote })}
          />
        );
      case 'multiple':
        return (
          <MultipleChoiceVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onMultiple}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userMultipleVote && { userVote: userMultipleVote })}
          />
        );
      default:
        return (
          <SingleChoiceVoting
            pollId={poll.id}
            title={poll.title ?? (t('polls.voting.interface.titleFallback') || 'Vote')}
            options={poll.options.map(option => ({
              id: option.id,
              text: option.text,
              option_text: option.text,
              poll_id: poll.id,
              created_at: null,
              updated_at: null,
              order_index: null,
              vote_count: null
            }))}
            onVote={onSingle}
            isVoting={effectiveIsVoting}
            hasVoted={effectiveHasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userVote && { userVote: userVote })}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="voting-form">
      {/* Header with poll info and verification tier - Only show if title/description provided */}
      {poll.title && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {poll.title && <h1 className="text-2xl font-bold text-foreground mb-2">{poll.title}</h1>}
              {poll.description && (
                <p className="text-muted-foreground mb-4">{poll.description}</p>
              )}

              {/* Poll stats */}
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{poll.totalVotes} votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{timeRemaining}</span>
                </div>
              </div>
            </div>

            {/* Trust tier badge */}
            <TrustTierBadge tier={verificationTier} showPasskeyHint size="sm" />
          </div>
        </div>
      )}

      {/* Voting component */}
      {renderVotingComponent()}

      {/* Mobile vote confirmation */}
      <BottomSheet
        open={Boolean(confirmSheet)}
        onClose={handleCancelVote}
        title={t('polls.voting.confirm.title') || 'Confirm your vote'}
      >
        {confirmSheet && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('polls.voting.confirm.summary') || 'You selected:'}
            </p>
            <p className="font-medium text-foreground">
              {getSubmissionSummary(confirmSheet.submission)}
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleCancelVote}>
                {t('polls.voting.confirm.cancel') || 'Cancel'}
              </Button>
              <Button className="flex-1" onClick={handleConfirmVote}>
                {t('polls.voting.confirm.submit') || 'Confirm Vote'}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
