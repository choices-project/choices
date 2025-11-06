/**
 * Example Component: Polls with React Query
 *
 * Shows best practices for:
 * - Listing polls with filters
 * - Voting with optimistic updates
 * - Automatic cache invalidation
 * - Error handling
 *
 * Created: November 6, 2025
 * Status: ✅ EXAMPLE CODE
 */

'use client';

import { useState } from 'react';

import type { Poll } from '@/lib/api';
import { usePolls, usePoll, useVote } from '@/lib/hooks/useApi';

export default function PollsExample() {
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  // Get polls list with caching
  const {
    data: polls = [],
    isLoading,
    error,
    refetch
  } = usePolls({
    ...(filter === 'active' ? { status: 'active' } : {}),
    limit: 20
  });

  // Get single poll (only when selected)
  const {
    data: selectedPoll
  } = usePoll(selectedPollId || '', {
    enabled: !!selectedPollId, // Only fetch when we have an ID
  });

  // Vote mutation with automatic cache invalidation
  const vote = useVote({
    onSuccess: () => {
      alert('Vote recorded!');
      // Poll data automatically refetched by hook
    },
    onError: (error) => {
      alert(`Error voting: ${error.message}`);
    }
  });

  // Handlers
  const handleVote = async (pollId: string, optionId: string) => {
    await vote.mutateAsync({ pollId, optionId });
  };

  const handleFilterChange = (newFilter: 'active' | 'all') => {
    setFilter(newFilter);
    // React Query automatically refetches with new filter
  };

  // Loading state
  if (isLoading) {
    return <div>Loading polls...</div>;
  }

  // Error state
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Polls Example</h1>

      {/* Filter */}
      <div className="mt-4">
        <button
          onClick={() => handleFilterChange('active')}
          className={`px-4 py-2 ${filter === 'active' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          Active
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`ml-2 px-4 py-2 ${filter === 'all' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          All
        </button>
      </div>

      {/* Polls list */}
      <div className="mt-4 space-y-4">
        {polls.map((poll: Poll) => (
          <div key={poll.id} className="border p-4">
            <h3 className="font-bold">{poll.title}</h3>
            <p>{poll.description}</p>
            <p className="text-sm text-gray-500">Votes: {poll.total_votes}</p>

            {/* Vote buttons */}
            <div className="mt-2 space-x-2">
              {poll.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleVote(poll.id, option.id)}
                  disabled={vote.isPending}
                  className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  {option.text} ({option.percentage}%)
                </button>
              ))}
            </div>

            {/* View details */}
            <button
              onClick={() => setSelectedPollId(poll.id)}
              className="mt-2 text-blue-500"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Selected poll detail */}
      {selectedPoll && (
        <div className="mt-4 border-t pt-4">
          <h2>Poll Details</h2>
          <pre>{JSON.stringify(selectedPoll, null, 2)}</pre>
          <button
            onClick={() => setSelectedPollId(null)}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      {/* Vote loading state */}
      {vote.isPending && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 text-center">
          Submitting vote...
        </div>
      )}
    </div>
  );
}

