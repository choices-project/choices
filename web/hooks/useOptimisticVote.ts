'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { post } from '@/lib/api/client';

export type PollOptionInput = {
  id: string;
  text?: string;
  votes?: number;
  vote_count?: number;
};

export type PollOptionWithCount = {
  id: string;
  text?: string;
  votes: number;
};

export type OptimisticPollData = {
  options: PollOptionWithCount[];
  totalVotes: number;
  userVote: string | null;
};

export type UseOptimisticVoteParams = {
  pollId: string;
  options: PollOptionInput[];
  totalVotes: number;
  userVote: string | null;
  /** Optional custom fetch. Defaults to POST /api/polls/{pollId}/vote with { optionId } */
  submitVote?: (pollId: string, optionId: string) => Promise<{ success: boolean; totalVotes?: number }>;
};

function getVoteCount(opt: PollOptionInput): number {
  if (typeof opt.votes === 'number') return opt.votes;
  if (typeof opt.vote_count === 'number') return opt.vote_count;
  return 0;
}

function toOptionWithCount(opt: PollOptionInput): PollOptionWithCount {
  const base: PollOptionWithCount = { id: opt.id, votes: getVoteCount(opt) };
  if (typeof opt.text === 'string') {
    base.text = opt.text;
  }
  return base;
}

function applyOptimisticUpdate(
  options: PollOptionWithCount[],
  totalVotes: number,
  userVote: string | null,
  newOptionId: string,
): { options: PollOptionWithCount[]; totalVotes: number; userVote: string | null } {
  const prevOptionId = userVote;
  const optionsMap = new Map(options.map((o) => [o.id, { ...o }]));

  if (prevOptionId === newOptionId) {
    return { options, totalVotes, userVote };
  }

  if (prevOptionId) {
    const prev = optionsMap.get(prevOptionId);
    if (prev) {
      prev.votes = Math.max(0, prev.votes - 1);
      optionsMap.set(prevOptionId, prev);
    }
  }

  const next = optionsMap.get(newOptionId);
  if (next) {
    next.votes += 1;
    optionsMap.set(newOptionId, next);
  }

  const nextTotal = prevOptionId ? totalVotes : totalVotes + 1;
  const nextOptions = options.map((o) => optionsMap.get(o.id) ?? o);

  return {
    options: nextOptions,
    totalVotes: nextTotal,
    userVote: newOptionId,
  };
}

export function useOptimisticVote({
  pollId,
  options,
  totalVotes,
  userVote,
  submitVote,
}: UseOptimisticVoteParams): {
  optimisticData: OptimisticPollData;
  vote: (optionId: string) => Promise<void>;
  isVoting: boolean;
  error: string | null;
} {
  const [optimisticOptions, setOptimisticOptions] = useState<PollOptionWithCount[]>(() =>
    options.map(toOptionWithCount),
  );
  const [optimisticTotal, setOptimisticTotal] = useState(totalVotes);
  const [optimisticUserVote, setOptimisticUserVote] = useState<string | null>(userVote);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshotRef = useRef<{
    options: PollOptionWithCount[];
    totalVotes: number;
    userVote: string | null;
  } | null>(null);

  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    if (!isVoting) {
      setOptimisticOptions(options.map(toOptionWithCount));
      setOptimisticTotal(totalVotes);
      setOptimisticUserVote(userVote);
    }
  }, [pollId, options, totalVotes, userVote, isVoting]);

  const vote = useCallback(
    async (optionId: string) => {
      setError(null);
      snapshotRef.current = {
        options: [...optimisticOptions],
        totalVotes: optimisticTotal,
        userVote: optimisticUserVote,
      };

      const { options: nextOptions, totalVotes: nextTotal, userVote: nextUserVote } = applyOptimisticUpdate(
        optimisticOptions,
        optimisticTotal,
        optimisticUserVote,
        optionId,
      );

      setOptimisticOptions(nextOptions);
      setOptimisticTotal(nextTotal);
      setOptimisticUserVote(nextUserVote);
      setIsVoting(true);

      const doSubmit =
        submitVote ??
        (async (pid: string, oid: string) => {
          const data = await post<{ totalVotes?: number }>(
            `/api/polls/${pid}/vote`,
            { optionId: oid }
          );
          return {
            success: true,
            totalVotes: data?.totalVotes,
          };
        });

      try {
        const result = await doSubmit(pollId, optionId);
        if (result.success) {
          if (typeof result.totalVotes === 'number') {
            setOptimisticTotal(result.totalVotes);
          }
          skipNextSyncRef.current = true;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to record vote. Please try again.';
        setError(msg);
        if (snapshotRef.current) {
          setOptimisticOptions(snapshotRef.current.options);
          setOptimisticTotal(snapshotRef.current.totalVotes);
          setOptimisticUserVote(snapshotRef.current.userVote);
          snapshotRef.current = null;
        }
        import('sonner').then(({ toast }) => toast.error(msg));
        throw err;
      } finally {
        setIsVoting(false);
      }
    },
    [pollId, optimisticOptions, optimisticTotal, optimisticUserVote, submitVote],
  );

  return {
    optimisticData: {
      options: optimisticOptions,
      totalVotes: optimisticTotal,
      userVote: optimisticUserVote,
    },
    vote,
    isVoting,
    error,
  };
}
