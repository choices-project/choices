'use client';

import { useState, useEffect } from 'react';
import { ShareButtons } from './ShareButtons';
import { TrustTierFilter } from '../trust/TrustTierFilter';
import { PollResults } from '../analytics/PollResults';
import { SophisticatedAnalytics } from '../analytics/SophisticatedAnalytics';

interface Poll {
  id: string;
  question: string;
  created_at: string;
  is_public: boolean;
  is_shareable: boolean;
  poll_options: Array<{
    id: string;
    text: string;
    created_at: string;
  }>;
  results?: Array<any>;
}

interface SharedPollViewerProps {
  pollId: string;
}

export function SharedPollViewer({ pollId }: SharedPollViewerProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPollData();
  }, [pollId]);

  const fetchPollData = async () => {
    try {
      const response = await fetch(`/api/shared/poll/${pollId}`);
      if (!response.ok) {
        throw new Error('Poll not found');
      }
      const data = await response.json();
      setPoll(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll');
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !poll) return;
    
    setIsVoting(true);
    try {
      const response = await fetch('/api/shared/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_id: pollId,
          option_id: selectedOption,
          voter_session: generateSessionId()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Voting failed');
      }

      setHasVoted(true);
      // Refresh results
      fetchPollData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Voting failed');
    } finally {
      setIsVoting(false);
    }
  };

  const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Poll Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{poll.question}</h1>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Created {new Date(poll.created_at).toLocaleDateString()}
          </span>
          <ShareButtons pollId={pollId} pollTitle={poll.question} />
        </div>
      </div>

      {/* Voting Section */}
      {!hasVoted ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Cast Your Vote</h2>
          <div className="space-y-3">
            {poll.poll_options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="poll-option"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">{option.text}</span>
              </label>
            ))}
          </div>
          <button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVoting ? 'Voting...' : 'Vote'}
          </button>
        </div>
      ) : (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h2 className="text-green-800 font-semibold">✓ Vote Submitted!</h2>
            <p className="text-green-600">Thank you for participating in this poll.</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <TrustTierFilter 
            selectedTiers={selectedTiers} 
            onTierChange={setSelectedTiers} 
          />
        </div>
        <PollResults pollId={pollId} trustTiers={selectedTiers} />
      </div>

      {/* Sophisticated Analytics */}
      <div className="mb-6">
        <SophisticatedAnalytics pollId={pollId} trustTiers={selectedTiers} />
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="text-blue-800 font-semibold mb-2">Want to create your own polls?</h3>
        <p className="text-blue-600 mb-3">
          Sign up to create polls, vote on more content, and build your trust level.
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Sign Up Now
        </button>
      </div>
    </div>
  );
}
