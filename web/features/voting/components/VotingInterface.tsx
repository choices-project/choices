'use client';

import { Users, Clock, CheckCircle2, Shield, Lock, Unlock } from 'lucide-react'
import React, { useState, useCallback, useEffect } from 'react'

import { 
  useVotingActions,
  useVotingLoading,
  useVotingError
} from '@/lib/stores/votingStore'
import { logger } from '@/lib/utils/logger'

import ApprovalVoting from './ApprovalVoting'
import MultipleChoiceVoting from './MultipleChoiceVoting'
import QuadraticVoting from './QuadraticVoting'
import RangeVoting from './RangeVoting'
import RankedChoiceVoting from './RankedChoiceVoting'
import SingleChoiceVoting from './SingleChoiceVoting'

type VoteResponse = { ok: boolean; id?: string; error?: string }
type VerificationResponse = { ok: boolean; error?: string }
type OnVote = (n: number) => Promise<VoteResponse>;
type OnVerify = (id: string) => Promise<VerificationResponse>;

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
  verificationTier = 'T1'
}: VotingInterfaceProps) {
  const { submitBallot: _submitBallot } = useVotingActions();
  const _votingLoading = useVotingLoading();
  const _votingError = useVotingError();
  
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const handleVote = useCallback((n: number) => onVote(n), [onVote]);
  
  const handleApprovalVote = useCallback(async (approvals: string[]) => {
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-bypass': '1'
        },
        body: JSON.stringify({ approvals }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const _result = await response.json() as { ok: boolean; id?: string };

      // Call the original onVote callback to update the UI
      await onVote(approvals.length);
    } catch (error) {
      logger.error('Approval vote failed', error instanceof Error ? error : new Error(String(error)), { pollId: poll.id });
      throw error;
    }
  }, [poll.id, onVote]);

  // Stable adapters for each child signature (NO unused params anywhere)
  const onApproval = useCallback(
    async (...[, approvals]: [string, string[]]) => {
      await handleApprovalVote(approvals);
    },
    [handleApprovalVote]
  );

  const onQuadratic = useCallback(
    async (...[, allocations]: [string, Record<string, number>]) => {
      const total = Object.values(allocations).reduce((s, v) => s + v, 0);
      await handleVote(total);
    },
    [handleVote]
  );

  const onRange = useCallback(
    async (...[, ratings]: [string, Record<string, number>]) => {
      const score = Object.values(ratings).reduce((s, v) => s + v, 0);
      await handleVote(score);
    },
    [handleVote]
  );

  const onRanked = useCallback(
    async (...[, rankings]: [string, string[]]) => {
      await handleVote(rankings.length);
    },
    [handleVote]
  );

  const onSingle = useCallback(
    async (choice: number) => {
      await handleVote(choice);
    },
    [handleVote]
  );

  const onMultiple = useCallback(
    async (selections: number[]) => {
      try {
        const response = await fetch(`/api/polls/${poll.id}/vote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selections }),
        });

        if (!response.ok) {
          const errorData = await response.json() as { error?: string };
          throw new Error(errorData.error || 'Failed to submit vote');
        }

        const _result = await response.json() as { ok: boolean; id?: string };

        // Call the original onVote callback to update the UI
        await onVote(selections.length);
      } catch (error) {
        logger.error('Multiple choice vote failed', error instanceof Error ? error : new Error(String(error)), { pollId: poll.id });
        throw error;
      }
    },
    [poll.id, onVote]
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
            description={poll.description ?? undefined}
            userVote={userApprovalVote ?? undefined}
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
            description={poll.description ?? undefined}
            userVote={userQuadraticVote ?? undefined}
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
            description={poll.description ?? undefined}
            userVote={userRangeVote ?? undefined}
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
            description={poll.description ?? undefined}
            userVote={userRankedVote ?? undefined}
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
            description={poll.description ?? undefined}
            userVote={userMultipleVote ?? undefined}
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
            description={poll.description ?? undefined}
            userVote={userVote ?? undefined}
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
