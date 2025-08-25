'use client';

import { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  Lock, 
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react'
import SingleChoiceVoting from './voting/SingleChoiceVoting'
import ApprovalVoting from './voting/ApprovalVoting'
import QuadraticVoting from './voting/QuadraticVoting'
import RangeVoting from './voting/RangeVoting'
import RankedChoiceVoting from './voting/RankedChoiceVoting'

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

interface VoteResponse {
  success: boolean
  message?: string
  voteId?: string
  verificationToken?: string
}

interface VerificationResponse {
  success: boolean
  message?: string
  verified?: boolean
}

interface VotingInterfaceProps {
  poll: Poll;
  onVote: (pollId: string, choice: number) => Promise<VoteResponse>;
  onVerify: (voteId: string) => Promise<VerificationResponse>;
  isVoting?: boolean;
  hasVoted?: boolean;
  userVote?: number;
  userApprovalVote?: string[];
  userQuadraticVote?: Record<string, number>;
  userRangeVote?: Record<string, number>;
  userRankedVote?: string[];
  verificationTier?: string;
  showResults?: boolean;
  onVoteComplete?: (voteId: string) => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
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
  verificationTier = 'T1',
  showResults = true,
  onVoteComplete
}) => {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | 'none'>('none');
  const [voteId, setVoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

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

  const handleVote = async (_pollId: string, choice: number) => {
    try {
      const response = await onVote(_pollId, choice);
      
      if (response.success) {
        setVoteId(response.voteId || null);
        setSuccess(true);
        setVerificationStatus('pending');
        
        // Auto-verify if verification token is provided
        if (response.verificationToken && response.voteId) {
          await handleVerification(response.voteId);
        }
        
        if (response.voteId) {
          onVoteComplete?.(response.voteId);
        }
      } else {
        setError(response.message || 'Vote submission failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    }
  };

  const handleVerification = async (voteId: string) => {
    try {
      const response = await onVerify(voteId);
      
      if (response.success) {
        setVerificationStatus(response.verified ? 'verified' : 'failed');
        setVerificationDetails(response);
      } else {
        setVerificationStatus('failed');
        setError(response.message || 'Verification failed');
      }
    } catch (err) {
      setVerificationStatus('failed');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

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
      isVoting: isVoting,
      hasVoted: hasVoted
    };

    switch (poll.votingMethod?.toLowerCase()) {
      case 'approval':
        return (
          <ApprovalVoting
            {...commonProps}
            userVote={userApprovalVote}
            onVote={(_pollId: string, approvals: string[]) => handleVote(_pollId, approvals.length)}
          />
        );
      case 'quadratic':
        return (
          <QuadraticVoting
            {...commonProps}
            userVote={userQuadraticVote}
            onVote={(_pollId: string, allocations: Record<string, number>) => {
              const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
              return handleVote(_pollId, totalAllocation);
            }}
          />
        );
      case 'range':
        return (
          <RangeVoting
            {...commonProps}
            userVote={userRangeVote}
            onVote={(_pollId: string, ratings: Record<string, number>) => {
              const avgRating = Object.values(ratings).reduce((sum, val) => sum + val, 0) / Object.values(ratings).length;
              return handleVote(_pollId, Math.round(avgRating));
            }}
          />
        );
      case 'ranked':
      case 'ranked-choice':
        return (
          <RankedChoiceVoting
            {...commonProps}
            userVote={userRankedVote}
            onVote={(_pollId: string, rankings: string[]) => handleVote(_pollId, rankings.length)}
          />
        );
      case 'single':
      case 'single-choice':
      default:
        return (
          <SingleChoiceVoting
            {...commonProps}
            userVote={userVote}
            onVote={handleVote}
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
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Vote submitted successfully!</span>
          </div>
        </div>
      )}

      {/* Verification Status */}
      {verificationStatus !== 'none' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Shield className="w-4 h-4" />
              <span className="text-sm">
                {verificationStatus === 'pending' && 'Verifying your vote...'}
                {verificationStatus === 'verified' && 'Vote verified successfully!'}
                {verificationStatus === 'failed' && 'Vote verification failed'}
              </span>
            </div>
            <button
              onClick={() => setShowVerificationDetails(!showVerificationDetails)}
              className="text-blue-600 hover:text-blue-700"
            >
              {showVerificationDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {showVerificationDetails && verificationDetails && (
            <div className="mt-2 text-xs text-blue-600">
              <pre>{JSON.stringify(verificationDetails, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

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