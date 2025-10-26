'use client';

import { useState, useEffect } from 'react';

interface PollResult {
  option_id: string;
  option_text: string;
  vote_count: number;
  avg_trust_tier: number;
  trust_distribution: {
    verified_votes: number;
    established_votes: number;
    new_user_votes: number;
    anonymous_votes: number;
  };
}

interface PollResultsProps {
  pollId: string;
  trustTiers?: number[];
}

export function PollResults({ pollId, trustTiers }: PollResultsProps) {
  const [results, setResults] = useState<PollResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [pollId, trustTiers]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Build URL with multiple tier support
      const params = new URLSearchParams();
      if (trustTiers && trustTiers.length > 0) {
        trustTiers.forEach(tier => params.append('tier', tier.toString()));
      }
      
      const url = `/api/polls/${pollId}/results?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-3">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No votes yet. Be the first to vote!
      </div>
    );
  }

  const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

  return (
    <div className="space-y-3">
      {results.map((result) => {
        const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0;
        
        return (
          <div key={result.option_id} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{result.option_text}</span>
              <span className="text-lg font-bold">{result.vote_count} votes</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-gray-600">
              {percentage.toFixed(1)}% of total votes
            </div>
            
            {/* Trust Distribution */}
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500 mb-2">Trust Distribution:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Verified: {result.trust_distribution.verified_votes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Established: {result.trust_distribution.established_votes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>New: {result.trust_distribution.new_user_votes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span>Anonymous: {result.trust_distribution.anonymous_votes}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
