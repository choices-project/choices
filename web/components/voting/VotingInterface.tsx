import React, { useState, useCallback, useEffect } from 'react'
import { Users, Clock, CheckCircle2, Shield, Lock, Unlock } from 'lucide-react'
import ApprovalVoting from './ApprovalVoting'
import QuadraticVoting from './QuadraticVoting'
import RangeVoting from './RangeVoting'
import RankedChoiceVoting from './RankedChoiceVoting'
import SingleChoiceVoting from './SingleChoiceVoting'

type VoteResponse = { ok: boolean; id?: string; error?: string };
type VerificationResponse = { ok: boolean; error?: string };
type OnVote = (n: number) => Promise<VoteResponse>;
type OnVerify = (id: string) => Promise<VerificationResponse>;

interface Poll {
  id: string;
  title: string;
  description?: string;
  votingMethod?: string;
  options: Array<{ id: string; text: string; description?: string }>;
  endtime: string;
  totalVotes: number;
}

interface VotingInterfaceProps {
  poll: Poll;
  onVote: OnVote;
  onVerify?: OnVerify;
  isVoting?: boolean;
  hasVoted?: boolean;
  userVote?: number;
  userApprovalVote?: string[];
  userQuadraticVote?: Record<string, number>;
  userRangeVote?: Record<string, number>;
  userRankedVote?: string[];
  verificationTier?: string;
}

export default function VotingInterface({ 
  poll, 
  onVote, 
  onVerify,
  isVoting = false,
  hasVoted = false,
  userVote,
  userApprovalVote,
  userQuadraticVote,
  userRangeVote,
  userRankedVote,
  verificationTier = 'T1'
}: VotingInterfaceProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const handleVote = useCallback((n: number) => onVote(n), [onVote]);

  // Stable adapters for each child signature (NO unused params anywhere)
  const onApproval = useCallback(
    async (...[, approvals]: [string, string[]]) => {
      await handleVote(approvals.length);
    },
    [handleVote]
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
            description={poll.description}
            options={poll.options}
            onVote={onApproval}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userApprovalVote}
          />
        );
      case 'quadratic':
        return (
          <QuadraticVoting
            pollId={poll.id}
            title={poll.title}
            description={poll.description}
            options={poll.options}
            onVote={onQuadratic}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userQuadraticVote}
          />
        );
      case 'range':
        return (
          <RangeVoting
            pollId={poll.id}
            title={poll.title}
            description={poll.description}
            options={poll.options}
            onVote={onRange}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userRangeVote}
          />
        );
      case 'ranked':
        return (
          <RankedChoiceVoting
            pollId={poll.id}
            title={poll.title}
            description={poll.description}
            options={poll.options}
            onVote={onRanked}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userRankedVote}
          />
        );
      default:
        return (
          <SingleChoiceVoting
            pollId={poll.id}
            title={poll.title}
            description={poll.description}
            options={poll.options}
            onVote={onSingle}
            isVoting={isVoting}
            hasVoted={hasVoted}
            userVote={userVote}
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
