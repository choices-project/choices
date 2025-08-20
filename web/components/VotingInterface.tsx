'use client';

import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  options: string[];
  total_votes: number;
  participation: number;
  sponsors: string[];
  created_at: string;
  end_time: string;
  results?: PollResults;
}

interface PollResults {
  [key: number]: number;
  total: number;
}

interface VoteResponse {
  success: boolean;
  voteId: string;
  message: string;
  verificationToken?: string;
}

interface VerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  merkleProof?: string[];
}

interface VotingInterfaceProps {
  poll: Poll;
  onVote: (pollId: string, choice: number) => Promise<VoteResponse>;
  onVerify: (voteId: string) => Promise<VerificationResponse>;
  isVoting?: boolean;
  hasVoted?: boolean;
  userVote?: number;
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
  verificationTier = 'T1',
  showResults = true,
  onVoteComplete
}) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(userVote || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed' | 'none'>('none');
  const [voteId, setVoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(poll.end_time);
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
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [poll.end_time]);

  const handleVote = async () => {
    if (!selectedChoice || poll.status !== 'active') return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await onVote(poll.id, selectedChoice);
      
      if (response.success) {
        setVoteId(response.voteId);
        setSuccess(true);
        setVerificationStatus('pending');
        
        // Auto-verify if verification token is provided
        if (response.verificationToken) {
          await handleVerification(response.voteId);
        }
        
        onVoteComplete?.(response.voteId);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (voteIdToVerify: string) => {
    setVerificationStatus('pending');
    setError(null);
    
    try {
      const response = await onVerify(voteIdToVerify);
      
      if (response.success) {
        setVerificationStatus(response.verified ? 'verified' : 'failed');
        setVerificationDetails({
          verified: response.verified,
          message: response.message,
          merkleProof: response.merkleProof
        });
      } else {
        setVerificationStatus('failed');
        setError(response.message);
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
            <span>{poll.total_votes.toLocaleString()} total votes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>

      {/* Voting Section */}
      {canVote && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select your choice:</h3>
          
          <div className="space-y-3 mb-6">
            {poll.options.map((option: any, index: any) => (
              <button
                key={index}
                onClick={() => setSelectedChoice(index)}
                disabled={isSubmitting}
                className={`
                  w-full text-left p-4 rounded-lg border transition-all duration-200
                  ${selectedChoice === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {selectedChoice === index && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleVote}
            disabled={selectedChoice === null || isSubmitting}
            className={`
              w-full px-6 py-3 rounded-lg font-medium transition-colors duration-200
              ${selectedChoice !== null && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting Vote...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Vote className="w-4 h-4" />
                Submit Vote
              </div>
            )}
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Vote submitted successfully!</span>
          </div>
          <p className="text-green-600 text-sm">
            Your vote has been recorded. {verificationStatus === 'pending' && 'Verifying your vote...'}
          </p>
        </div>
      )}

      {/* Verification Status */}
      {verificationStatus !== 'none' && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Vote Verification</h3>
          
          <div className={`
            p-4 rounded-lg border
            ${verificationStatus === 'verified' 
              ? 'bg-green-50 border-green-200' 
              : verificationStatus === 'failed'
              ? 'bg-red-50 border-red-200'
              : 'bg-yellow-50 border-yellow-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {verificationStatus === 'verified' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {verificationStatus === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                {verificationStatus === 'pending' && <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />}
                
                <span className={`
                  font-medium
                  ${verificationStatus === 'verified' ? 'text-green-700' : ''}
                  ${verificationStatus === 'failed' ? 'text-red-700' : ''}
                  ${verificationStatus === 'pending' ? 'text-yellow-700' : ''}
                `}>
                  {verificationStatus === 'verified' && 'Vote Verified'}
                  {verificationStatus === 'failed' && 'Verification Failed'}
                  {verificationStatus === 'pending' && 'Verifying Vote...'}
                </span>
              </div>
              
              {verificationDetails && (
                <button
                  onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showVerificationDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Details
                </button>
              )}
            </div>
            
            {verificationDetails && showVerificationDetails && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{verificationDetails.message}</p>
                {verificationDetails.merkleProof && (
                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">Merkle Proof:</p>
                    <div className="bg-gray-100 p-2 rounded font-mono">
                      {verificationDetails.merkleProof.map((proof: string, index: number) => (
                        <div key={index} className="break-all">{proof}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {verificationStatus === 'pending' && voteId && (
            <button
              onClick={() => handleVerification(voteId)}
              className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check Verification Status
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {showResults && poll.results && (hasVoted || poll.status === 'closed') && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Results</h3>
          
          <div className="space-y-4">
            {poll.options.map((option: any, index: any) => {
              const votes = poll.results![index] || 0;
              const percentage = poll.results!.total > 0 
                ? Math.round((votes / poll.results!.total) * 100) 
                : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={userVote === index ? 'font-medium text-blue-600' : ''}>
                      {option}
                    </span>
                    <span className="text-gray-500">{votes} votes ({percentage}%)</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        userVote === index ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Total votes: {poll.results.total.toLocaleString()}
          </div>
        </div>
      )}

      {/* Poll Status */}
      {!isPollActive && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">
              {poll.status === 'closed' ? 'This poll has ended' : 'This poll is not active'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;
