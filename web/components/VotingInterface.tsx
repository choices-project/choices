'use client';

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Shield, 
  Lock, 
  Unlock
} from 'lucide-react'
import SingleChoiceVoting from '@/features/voting/components/SingleChoiceVoting'
import ApprovalVoting from '@/features/voting/components/ApprovalVoting'
import QuadraticVoting from '@/features/voting/components/QuadraticVoting'
import RangeVoting from '@/features/voting/components/RangeVoting'
import RankedChoiceVoting from '@/features/voting/components/RankedChoiceVoting'
import type { VoteResponse } from '@/lib/vote/types'
import { withOptional } from '@/lib/util/objects'

interface Poll {
  id: string
  title: string
  description: string
  options: string[]
  votingMethod: string
  totalvotes: number
  endtime: string
  status: string
}

// --- types you already have ---
interface VotingInterfaceProps {
  poll: Poll;
  onVote: (choice: number) => Promise<VoteResponse>;
  isVoting?: boolean;
  hasVoted?: boolean;
  userVote?: number;
  userApprovalVote?: string[];
  userQuadraticVote?: Record<string, number>;
  userRangeVote?: Record<string, number>;
  userRankedVote?: string[];
  verificationTier?: string;
  showResults?: boolean;
}

// Optional projection helpers (encode your business rules here)
const projectAllocationsToChoice = (allocations: Record<string, number>) =>
  Object.values(allocations).reduce((s, v) => s + v, 0);

const projectRatingsToChoice = (ratings: Record<string, number>) =>
  Object.values(ratings).reduce((s, v) => s + v, 0);

// Simple example; swap with your domain's projection (e.g., Borda, etc.)
const projectRankingsToChoice = (rankings: string[]) => rankings.length;

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  poll,
  onVote,
  isVoting = false,
  hasVoted = false,
  userVote,
  userApprovalVote,
  userQuadraticVote,
  userRangeVote,
  userRankedVote,
  verificationTier = 'T1',
  showResults = true
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Stable upstream handlers
  const handleVote = React.useCallback(
    (choice: number) => onVote(choice),
    [onVote]
  );

  // —— Stable adapters for each child signature (NO unused params anywhere)
  // Note: we use REST-TUPLE + ELISION to avoid naming unused pollId.
  const onApproval = React.useCallback(
    async (...[, approvals]: [string, string[]]) => {
      await handleVote(approvals.length);
    },
    [handleVote]
  );

  const onQuadratic = React.useCallback(
    async (...[, allocations]: [string, Record<string, number>]) => {
      await handleVote(projectAllocationsToChoice(allocations));
    },
    [handleVote]
  );

  const onRange = React.useCallback(
    async (...[, ratings]: [string, Record<string, number>]) => {
      await handleVote(projectRatingsToChoice(ratings));
    },
    [handleVote]
  );

  const onRanked = React.useCallback(
    async (...[, rankings]: [string, string[]]) => {
      await handleVote(projectRankingsToChoice(rankings));
    },
    [handleVote]
  );

  // Single-choice already matches parent signature
  const onSingle = React.useCallback(
    async (choice: number) => {
      await handleVote(choice);
    },
    [handleVote]
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

  const isPollActive = poll.status === 'active';
  const canVote = isPollActive && !hasVoted && !isVoting;

  // Convert poll options to the format expected by voting components
  const pollOptions = poll.options.map((option, index) => ({
    id: index.toString(),
    text: option
  }));

  // Render the appropriate voting component based on voting method
  const renderVotingComponent = () => {
    const commonProps = {
      pollId: poll.id,
      title: poll.title,
      description: poll.description,
      options: pollOptions,
      isVoting,
      hasVoted
    };

    switch (poll.votingMethod?.toLowerCase()) {
      case 'approval': {
        return (
          <ApprovalVoting
            {...commonProps}
            userVote={userApprovalVote || []}
            onVote={onApproval}
          />
        );
      }
      case 'quadratic': {
        return (
          <QuadraticVoting
            {...commonProps}
            {...withOptional({}, { userVote: userQuadraticVote })}
            onVote={onQuadratic}
          />
        );
      }
      case 'range': {
        return (
          <RangeVoting
            {...commonProps}
            {...withOptional({}, { userVote: userRangeVote })}
            onVote={onRange}
          />
        );
      }
      case 'ranked':
      case 'ranked-choice': {
        return (
          <RankedChoiceVoting
            {...commonProps}
            {...withOptional({}, { userVote: userRankedVote })}
            onVote={onRanked}
          />
        );
      }
      case 'single':
      case 'single-choice':
      default:
        return (
          <SingleChoiceVoting
            {...commonProps}
            {...withOptional({}, { userVote: userVote })}
            onVote={onSingle}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{poll.title}</h2>
          <div className="flex items-center gap-2">
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
              ${getVerificationTierColor(verificationTier)}
            `}>
              {getVerificationTierIcon(verificationTier)}
              Tier {verificationTier}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 mb-3">{poll.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{poll.totalvotes.toLocaleString()} total votes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {canVote && renderVotingComponent()}

      {/* Error Display */}
      {/* The original code had a success state, but the new_code removed it.
          Assuming the intent was to remove the success state and its display. */}

      {/* Verification Status */}
      {/* The original code had a success state, but the new_code removed it.
          Assuming the intent was to remove the success state and its display. */}

      {/* Results Section */}
      {showResults && (hasVoted || !canVote) && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Results</h3>
          <div className="space-y-3">
            {poll.options.map((option: any, index: any) => {
              const votes = Math.floor(Math.random() * 100); // Placeholder - should come from API
              const percentage = poll.totalvotes > 0 ? Math.round((votes / poll.totalvotes) * 100) : 0;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{option}</span>
                      <span className="text-sm text-gray-600">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;