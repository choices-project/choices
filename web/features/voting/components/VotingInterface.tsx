'use client';

import { Users, Clock, CheckCircle2, Shield, Lock, Unlock } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics'
import { useVotingCountdown } from '@/features/voting/hooks/useVotingCountdown'
import { useVotingIsVoting, useVotingRecords } from '@/features/voting/lib/store'

import { useNotificationActions, useNotificationSettings } from '@/lib/stores/notificationStore'

import ApprovalVoting from './ApprovalVoting'
import MultipleChoiceVoting from './MultipleChoiceVoting'
import QuadraticVoting from './QuadraticVoting'
import RangeVoting from './RangeVoting'
import RankedChoiceVoting from './RankedChoiceVoting'
import SingleChoiceVoting from './SingleChoiceVoting'

type VoteResponse = { ok: boolean; id?: string; error?: string }
type VerificationResponse = { ok: boolean; error?: string }

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
  title: string;
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
  verificationTier = 'T1',
  onAnalyticsEvent,
}: VotingInterfaceProps) {
  const storeIsVoting = useVotingIsVoting()
  const votingRecords = useVotingRecords()
  const timeRemaining = useVotingCountdown(poll.endtime)

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
        title: 'Vote submitted',
        message,
        duration: notificationSettings.duration,
      })
    },
    [notificationSettings.duration]
  )

  const notifyError = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'error',
        title: 'Vote failed',
        message,
        duration: notificationSettings.duration,
      })
    },
    [notificationSettings.duration]
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

  // Stable adapters for each child signature (NO unused params anywhere)
  const onApproval = useCallback(
    async (...[, approvals]: [string, string[]]) => {
      const result = await onVote({ method: 'approval', approvals })
      handleVoteResult(result, {
        method: 'approval',
        value: approvals.length,
        metadata: { approvals }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  const onQuadratic = useCallback(
    async (...[, allocations]: [string, Record<string, number>]) => {
      const result = await onVote({ method: 'quadratic', allocations })
      handleVoteResult(result, {
        method: 'quadratic',
        value: Object.values(allocations).reduce((s, v) => s + v, 0),
        metadata: { allocations }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  const onRange = useCallback(
    async (...[, ratings]: [string, Record<string, number>]) => {
      const result = await onVote({ method: 'range', ratings })
      handleVoteResult(result, {
        method: 'range',
        value: Object.values(ratings).reduce((s, v) => s + v, 0),
        metadata: { ratings }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  const onRanked = useCallback(
    async (...[, rankings]: [string, number[]]) => {
      const result = await onVote({ method: 'ranked', rankings })
      handleVoteResult(result, {
        method: 'ranked',
        value: rankings.length,
        metadata: { rankings }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  const onSingle = useCallback(
    async (choice: number) => {
      const result = await onVote({ method: 'single', choice })
      handleVoteResult(result, {
        method: 'single',
        value: 1,
        metadata: { choice }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  const onMultiple = useCallback(
    async (selections: number[]) => {
      const result = await onVote({ method: 'multiple', selections })
      handleVoteResult(result, {
        method: 'multiple',
        value: selections.length,
        metadata: { selections }
      })
      if (!result.ok) {
        notifyError(result.error ?? 'Failed to submit vote')
        throw new Error(result.error ?? 'Failed to submit vote')
      }
      notifySuccess('Your vote has been recorded.')
    },
    [handleVoteResult, notifyError, notifySuccess, onVote]
  );

  // Calculate time remaining with useCallback for optimization
  const getVerificationTierColor = (tier: string) => {
    switch (tier) {
      case 'T3':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'T2':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'T1':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'T0':
        return 'text-muted-foreground bg-muted border-border';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getVerificationTierIcon = (tier: string) => {
    switch (tier) {
      case 'T3':
        return <Shield className="w-4 h-4" />;
      case 'T2':
        return <Lock className="w-4 h-4" />;
      case 'T1':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'T0':
        return <Unlock className="w-4 h-4" />;
      default:
        return <Unlock className="w-4 h-4" />;
    }
  };

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
            title={poll.title}
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
            title={poll.title}
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
            title={poll.title}
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
            title={poll.title}
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
            title={poll.title}
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
            title={poll.title}
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
      {/* Header with poll info and verification tier */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{poll.title}</h1>
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

          {/* Verification tier badge */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getVerificationTierColor(verificationTier)}`}>
            {getVerificationTierIcon(verificationTier)}
            <span>Tier {verificationTier.slice(1)}</span>
          </div>
        </div>
      </div>

      {/* Voting component */}
      {renderVotingComponent()}
    </div>
  );
}
