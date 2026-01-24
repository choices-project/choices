'use client';

import { useQuery } from '@tanstack/react-query';

import { get, ApiError } from '@/lib/api';

import type { OptimizedPollResult } from '../lib/poll-service';

export type UsePollResultsOptions = {
  pollId: string;
  userId?: string;
  includePrivate?: boolean;
  pollStatus?: 'active' | 'closed' | 'draft' | 'archived';
  autoRefreshInterval?: number;
  enabled?: boolean;
};

function transformApiData(
  data: Record<string, unknown>,
  pollId: string,
  includePrivate: boolean,
  loadTime: number,
  userId?: string
): OptimizedPollResult {
  if (data?.results && Array.isArray(data.results)) {
    const results = data.results as Array<{
      option_text?: string;
      option_id?: string;
      vote_count?: number;
      percentage?: number;
    }>;
    return {
      id: pollId,
      title: (data.poll_title as string) || 'Poll Results',
      options: results.map((r) => (r.option_text as string) || (r.option_id as string)),
      totalVotes: (data.total_votes as number) || 0,
      results: results.map((r) => ({
        option: (r.option_text as string) || (r.option_id as string),
        optionId: r.option_id as string,
        label: r.option_text as string,
        votes: r.vote_count ?? 0,
        voteCount: r.vote_count ?? 0,
        percentage: r.percentage ?? 0,
        votePercentage: r.percentage ?? 0,
      })),
      metadata: {
        responseTime: loadTime,
        cacheHit: false,
        includePrivate,
        userId,
        votingMethod: (data.voting_method as string) ?? 'single',
      },
      pollStatus: 'active',
      pollTitle: (data.poll_title as string) || 'Poll Results',
      pollType: (data.voting_method as string) || 'single',
      uniqueVoters: (data.total_votes as number) || 0,
      canVote: true,
      hasVoted: false,
    };
  }

  if (data?.option_stats && Array.isArray(data.option_stats)) {
    const stats = data.option_stats as Array<{
      text?: string;
      option_index?: number;
      option_id?: string;
      first_choice_votes?: number;
      first_choice_percentage?: number;
    }>;
    return {
      id: pollId,
      title: (data.poll_title as string) || 'Poll Results',
      options: stats.map((s, i) => (s.text as string) || `Option ${(s.option_index ?? i) + 1}`),
      totalVotes: (data.total_votes as number) || 0,
      results: stats.map((s, i) => ({
        option: (s.text as string) || `Option ${(s.option_index ?? i) + 1}`,
        optionId: (s.option_id as string) ?? String(s.option_index ?? i),
        label: s.text as string,
        votes: s.first_choice_votes ?? 0,
        voteCount: s.first_choice_votes ?? 0,
        percentage: s.first_choice_percentage ?? 0,
        votePercentage: s.first_choice_percentage ?? 0,
      })),
      metadata: {
        responseTime: loadTime,
        cacheHit: false,
        includePrivate,
        userId,
        votingMethod: 'ranked',
        rounds: data.rounds,
        winner: data.winner,
      },
      pollStatus: 'active',
      pollTitle: (data.poll_title as string) || 'Poll Results',
      pollType: 'ranked',
      uniqueVoters: (data.total_votes as number) || 0,
      canVote: true,
      hasVoted: false,
    };
  }

  throw new Error('Invalid poll results format');
}

export function usePollResults({
  pollId,
  userId,
  includePrivate = false,
  pollStatus = 'active',
  autoRefreshInterval,
  enabled = true,
}: UsePollResultsOptions) {
  return useQuery({
    queryKey: ['polls', pollId, 'results', includePrivate, userId],
    queryFn: async (): Promise<{ result: OptimizedPollResult; loadTime: number }> => {
      const start = performance.now();
      const data = await get<Record<string, unknown>>(`/api/polls/${pollId}/results`);
      const loadTime = performance.now() - start;
      const result = transformApiData(data, pollId, includePrivate, loadTime, userId);
      return { result, loadTime };
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isAuthError()) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval:
      pollStatus === 'active' && (autoRefreshInterval ?? 5 * 60 * 1000) > 0
        ? autoRefreshInterval ?? 5 * 60 * 1000
        : false,
    enabled: enabled && !!pollId,
  });
}
