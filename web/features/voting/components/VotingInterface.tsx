'use client';

import { Users, Clock, CheckCircle2, Shield, Lock, Unlock } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'


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

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const emitAnalytics = useCallback(
    (action: string, payload?: VoteAnalyticsPayload) => {
      if (!onAnalyticsEvent) return
      onAnalyticsEvent(action, payload)
    },
    [onAnalyticsEvent]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
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
        throw new Error(result.error ?? 'Failed to submit vote')
      }
    },
    [handleVoteResult, onVote]
  );

  // Calculate time remaining with useCallback for optimization
  const updateTimeRemaining = useCallback(() => {
    const now = new Date();
    const end = new Date(poll.endtime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Poll ended');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h ${minutes}m left`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m left`);
    } else {
      setTimeRemaining(`${minutes}m left`);
    }
  }, [poll.endtime]);

  // Use useEffect to call the memoized function
  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  const getVerificationTierColor = (tier: string) => {
    switch (tier) {
      case 'T3':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'T2':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'T1':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'T0':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const renderVotingComponent = () => {
    const votingMethod = (poll.votingMethod ?? 'single').toLowerCase();

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
            isVoting={isVoting}
            hasVoted={hasVoted}
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
            isVoting={isVoting}
            hasVoted={hasVoted}
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
            isVoting={isVoting}
            hasVoted={hasVoted}
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
            isVoting={isVoting}
            hasVoted={hasVoted}
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
            isVoting={isVoting}
            hasVoted={hasVoted}
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
            isVoting={isVoting}
            hasVoted={hasVoted}
            {...(poll.description && { description: poll.description })}
            {...(userVote && { userVote: userVote })}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="voting-form">
      {/* Header with poll info and verification tier */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{poll.title}</h1>
            {poll.description && (
              <p className="text-gray-600 mb-4">{poll.description}</p>
            )}

            {/* Poll stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
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
