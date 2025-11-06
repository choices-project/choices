 'use client';

import React, { useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/utils/logger';

/**
 * Poll Client Component
 * 
 * Client-side component for displaying individual polls.
 * Handles voting, results display, and user interactions.
 */


type PollClientProps = {
  poll: {
    id: string;
    title: string;
    description: string;
    options: Array<{
      id: string;
      text: string;
      votes: number;
    }>;
    status: 'active' | 'closed' | 'draft';
    totalVotes: number;
    userVote?: string;
    canVote: boolean;
  };
}

export default function PollClient({ poll }: PollClientProps) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string | null>(poll.userVote ?? null);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (optionId: string) => {
    if (!user || !poll.canVote || poll.status !== 'active') {
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to vote');
      }

      setSelectedOption(optionId);
      logger.info('Vote submitted successfully', { pollId: poll.id, optionId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMessage);
      logger.error('Vote submission failed', { pollId: poll.id, error: errorMessage });
    } finally {
      setIsVoting(false);
    }
  };

  const getVotePercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{poll.title}</h1>
        <p className="text-gray-600 mb-6">{poll.description}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {poll.options.map((option) => (
            <div key={option.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{option.text}</span>
                <span className="text-sm text-gray-500">
                  {option.votes} votes ({getVotePercentage(option.votes)}%)
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getVotePercentage(option.votes)}%` }}
                />
              </div>

              {poll.status === 'active' && poll.canVote && user && (
                <button
                  onClick={() => handleVote(option.id)}
                  disabled={isVoting || selectedOption === option.id}
                  className={`mt-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedOption === option.id
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                  }`}
                >
                  {selectedOption === option.id ? 'Voted' : isVoting ? 'Voting...' : 'Vote'}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Total votes: {poll.totalVotes}</span>
            <span className="capitalize">Status: {poll.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
