'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';

import { getErrorMessageWithFallback, ERROR_MESSAGES, type ErrorMessageConfig } from '@/lib/constants/error-messages';

type PollResult = {
  option_id: string;
  option_text: string;
  vote_count: number;
  percentage?: number;
  avg_trust_tier?: number;
  trust_distribution?: {
    verified_votes: number;
    established_votes: number;
    new_user_votes: number;
    anonymous_votes: number;
  };
}

type PollResultsProps = {
  pollId: string;
  trustTiers?: number[];
}

export function PollResults({ pollId, trustTiers }: PollResultsProps) {
  const [results, setResults] = useState<PollResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!pollId) {
      setError('Poll ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build URL with multiple tier support
      const params = new URLSearchParams();
      if (trustTiers && trustTiers.length > 0) {
        trustTiers.forEach(tier => params.append('tier', tier.toString()));
      }

      const url = `/api/polls/${pollId}/results?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        // Use standardized error message keys
        if (response.status === 404) {
          throw new Error('POLL_NOT_FOUND');
        }
        if (response.status >= 500) {
          throw new Error('SERVER_ERROR');
        }
        throw new Error('NETWORK_ERROR');
      }

      const result = await response.json();
      // API returns { success: true, data: { poll_id, voting_method, results: [...] } } structure
      // OR for ranked: { success: true, data: { poll_id, voting_method, rounds, option_stats, ... } }
      const data = result?.success && result?.data ? result.data : result;

      // Handle different response structures
      if (data?.results && Array.isArray(data.results)) {
        setResults(data.results);
      } else if (data?.option_stats && Array.isArray(data.option_stats)) {
        // Convert ranked results format to standard format
        const convertedResults = data.option_stats.map((stat: any) => ({
          option_id: stat.option_id || stat.option_index?.toString(),
          option_text: stat.text || `Option ${stat.option_index + 1}`,
          vote_count: stat.first_choice_votes || 0,
          percentage: stat.first_choice_percentage || 0,
        }));
        setResults(convertedResults);
      } else {
        setResults([]);
      }
    } catch (err) {
      const errorKey = err instanceof Error ? err.message : 'NETWORK_ERROR';
      // Use standardized error messages
      const fallback: ErrorMessageConfig = ERROR_MESSAGES.NETWORK_ERROR ?? {
        title: 'Error',
        message: 'An error occurred',
        details: '',
        tip: '',
        severity: 'error',
      };
      const errorConfig = getErrorMessageWithFallback(errorKey, fallback);
      setError(errorConfig.message);
      console.error('Poll results fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pollId, trustTiers]);

  useEffect(() => {
    void fetchResults();
  }, [fetchResults]);

  const handleRetry = useCallback(() => {
    void fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
        <span className="sr-only">Loading poll results...</span>
      </div>
    );
  }

  if (error) {
    // Determine error type from error message
    const errorKey = error.includes('not found') || error.includes('Poll not found')
      ? 'POLL_NOT_FOUND'
      : error.includes('timeout') || error.includes('Timeout')
      ? 'TIMEOUT_ERROR'
      : 'NETWORK_ERROR';

    const fallback: ErrorMessageConfig = ERROR_MESSAGES.NETWORK_ERROR ?? {
      title: 'Error',
      message: 'An error occurred',
      details: '',
      tip: '',
      severity: 'error',
    };
    const errorConfig = getErrorMessageWithFallback(errorKey, fallback);
    const config = errorConfig ?? {
      title: 'Error',
      message: 'An error occurred',
      details: 'We encountered an issue while loading poll results.',
      tip: 'Check your connection and try again.',
      severity: 'error' as const,
    };

    return (
      <EnhancedErrorDisplay
        title={config.title}
        message={config.message}
        details={config.details ?? "We encountered an issue while loading poll results. This might be a temporary network problem."}
        tip={config.tip ?? "Check your internet connection and try again. If the problem persists, the poll may not exist or may have been removed."}
        canRetry={true}
        onRetry={handleRetry}
        {...(config.severity !== undefined ? { severity: config.severity } : {})}
      />
    );
  }

  if (!results.length) {
    return (
      <EnhancedEmptyState
        icon={
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        title="No votes yet"
        description="This poll hasn't received any votes yet. Be the first to vote!"
        tip="Share this poll with others to get more participation."
      />
    );
  }

  const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

  return (
    <div className="space-y-3" role="region" aria-label="Poll results">
      {results.map((result) => {
        const percentage = result.percentage ?? (totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0);
        const hasTrustDistribution = result.trust_distribution &&
          (result.trust_distribution.verified_votes > 0 ||
           result.trust_distribution.established_votes > 0 ||
           result.trust_distribution.new_user_votes > 0 ||
           result.trust_distribution.anonymous_votes > 0);

        return (
          <div
            key={result.option_id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
            role="article"
            aria-label={`${result.option_text}: ${result.vote_count} votes, ${percentage.toFixed(1)}%`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{result.option_text}</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{result.vote_count} {result.vote_count === 1 ? 'vote' : 'votes'}</span>
            </div>

            {/* Progress Bar */}
            <div
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${result.option_text} has ${percentage.toFixed(1)}% of votes`}
            >
              <div
                className="bg-blue-500 dark:bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {percentage.toFixed(1)}% of total votes
            </div>

            {/* Trust Distribution - Only show if data exists */}
            {hasTrustDistribution && result.trust_distribution && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Trust Distribution:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {result.trust_distribution.verified_votes > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
                      <span className="text-gray-700 dark:text-gray-300">Verified: {result.trust_distribution.verified_votes}</span>
                    </div>
                  )}
                  {result.trust_distribution.established_votes > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true" />
                      <span className="text-gray-700 dark:text-gray-300">Established: {result.trust_distribution.established_votes}</span>
                    </div>
                  )}
                  {result.trust_distribution.new_user_votes > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full" aria-hidden="true" />
                      <span className="text-gray-700 dark:text-gray-300">New: {result.trust_distribution.new_user_votes}</span>
                    </div>
                  )}
                  {result.trust_distribution.anonymous_votes > 0 && (
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full" aria-hidden="true" />
                      <span className="text-gray-700 dark:text-gray-300">Anonymous: {result.trust_distribution.anonymous_votes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Total Votes Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Total: <span className="font-bold text-gray-900 dark:text-gray-100">{totalVotes}</span> {totalVotes === 1 ? 'vote' : 'votes'}
        </p>
      </div>
    </div>
  );
}


export default PollResults;
