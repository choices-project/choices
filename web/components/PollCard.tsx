'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Vote, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  Calendar,
  BarChart3,
  ArrowRight,
  Eye
} from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  options: string[];
  totalvotes: number;
  participation: number;
  sponsors: string[];
  createdat: string;
  endtime: string;
  results?: PollResults;
}

interface PollResults {
  [key: number]: number;
  total: number;
}

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, choice: number) => Promise<void>;
  onViewDetails?: (pollId: string) => void;
  isVoted?: boolean;
  userVote?: number;
  showVoteButton?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  onVote,
  onViewDetails,
  isVoted = false,
  userVote,
  showVoteButton = true,
  variant = 'default'
}) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedChoice || !onVote) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      await onVote(poll.id, selectedChoice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'draft':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      case 'draft':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const end = new Date(poll.endtime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Less than 1h left';
  };

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200
      ${isFeatured ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      ${isCompact ? 'p-4' : 'p-6'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border
              ${getStatusColor(poll.status)}
            `}>
              {getStatusIcon(poll.status)}
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
            {poll.status === 'active' && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeRemaining()}
              </span>
            )}
          </div>
          
          <h3 className={`
            font-semibold text-gray-900 mb-2 line-clamp-2
            ${isCompact ? 'text-base' : 'text-lg'}
            ${isFeatured ? 'text-xl' : ''}
          `}>
            {poll.title}
          </h3>
          
          {!isCompact && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {poll.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{poll.totalvotes.toLocaleString()} votes</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span>{poll.participation}% participation</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          <span>Ends {formatDate(poll.endtime)}</span>
        </div>
      </div>

      {/* Sponsors */}
      {poll.sponsors.length > 0 && !isCompact && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Sponsored by:</p>
          <div className="flex flex-wrap gap-1">
            {poll.sponsors.map((sponsor: any, index: any) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {sponsor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Voting Options (if active and not voted) */}
      {poll.status === 'active' && showVoteButton && !isVoted && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Select your choice:</p>
          <div className="space-y-2">
            {poll.options.map((option: any, index: any) => (
              <button
                key={index}
                onClick={() => setSelectedChoice(index)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-colors duration-200
                  ${selectedChoice === index
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{option}</span>
                  {selectedChoice === index && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
          
          <button
            onClick={handleVote}
            disabled={selectedChoice === null || isVoting}
            className={`
              w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200
              ${selectedChoice !== null && !isVoting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isVoting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Voting...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Vote className="w-4 h-4" />
                Vote Now
              </div>
            )}
          </button>
        </div>
      )}

      {/* Results (if voted or closed) */}
      {(isVoted || poll.status === 'closed') && poll.results && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Results:</p>
          <div className="space-y-2">
            {poll.options.map((option: any, index: any) => {
              const votes = poll.results![index] || 0;
              const percentage = poll.results!.total > 0 
                ? Math.round((votes / poll.results!.total) * 100) 
                : 0;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={userVote === index ? 'font-medium text-blue-600' : ''}>
                        {option}
                      </span>
                      <span className="text-gray-500">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          userVote === index ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
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

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BarChart3 className="w-4 h-4" />
          <span>{poll.options.length} options</span>
        </div>
        
        <div className="flex items-center gap-2">
          {onViewDetails ? (
            <button
              onClick={() => onViewDetails(poll.id)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          ) : (
            <Link
              href={`/polls/${poll.id}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCard;
