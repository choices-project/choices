'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { post } from '@/lib/api/client';

import type { PollOptionInput, PollOptionWithCount } from './useOptimisticVote';

export type OptimisticMultiPollData = {
  options: PollOptionWithCount[];
  totalVotes: number;
  userVote: string[] | null;
};

export type UseOptimisticMultiVoteParams = {
  pollId: string;
  options: PollOptionInput[];
  totalVotes: number;
  userVote: string[] | null;
  /** Submit approval vote. Receives array of option IDs. */
  submitVote?: (pollId: string, optionIds: string[]) => Promise<{ success: boolean; totalVotes?: number }>;
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

function applyOptimisticMultiUpdate(
  options: PollOptionWithCount[],
  totalVotes: number,
  prevOptionIds: string[],
  newOptionIds: string[],
): { options: PollOptionWithCount[]; totalVotes: number; userVote: string[] | null } {
  const optionsMap = new Map(options.map((o) => [o.id, { ...o }]));
  const prevSet = new Set(prevOptionIds);
  const newSet = new Set(newOptionIds);

  for (const id of prevSet) {
    if (!newSet.has(id)) {
      const opt = optionsMap.get(id);
      if (opt) {
        opt.votes = Math.max(0, opt.votes - 1);
        optionsMap.set(id, opt);
      }
    }
  }

  for (const id of newSet) {
    if (!prevSet.has(id)) {
      const opt = optionsMap.get(id);
      if (opt) {
        opt.votes += 1;
        optionsMap.set(id, opt);
      }
    }
  }

  const delta = newOptionIds.length - prevOptionIds.length;
  const nextTotal = totalVotes + delta;
  const nextOptions = options.map((o) => optionsMap.get(o.id) ?? o);

  return {
    options: nextOptions,
    totalVotes: Math.max(0, nextTotal),
    userVote: newOptionIds.length > 0 ? [...newOptionIds] : null,
  };
}

export function useOptimisticMultiVote({
  pollId,
  options,
  totalVotes,
  userVote,
  submitVote,
}: UseOptimisticMultiVoteParams): {
  optimisticData: OptimisticMultiPollData;
  vote: (optionIds: string[]) => Promise<void>;
  isVoting: boolean;
  error: string | null;
} {
  const [optimisticOptions, setOptimisticOptions] = useState<PollOptionWithCount[]>(() =>
    options.map(toOptionWithCount),
  );
  const [optimisticTotal, setOptimisticTotal] = useState(totalVotes);
  const [optimisticUserVote, setOptimisticUserVote] = useState<string[] | null>(userVote);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshotRef = useRef<{
    options: PollOptionWithCount[];
    totalVotes: number;
    userVote: string[] | null;
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
    async (optionIds: string[]) => {
      setError(null);
      snapshotRef.current = {
        options: [...optimisticOptions],
        totalVotes: optimisticTotal,
        userVote: optimisticUserVote ? [...optimisticUserVote] : null,
      };

      const { options: nextOptions, totalVotes: nextTotal, userVote: nextUserVote } =
        applyOptimisticMultiUpdate(
          optimisticOptions,
          optimisticTotal,
          optimisticUserVote ?? [],
          optionIds,
        );

      setOptimisticOptions(nextOptions);
      setOptimisticTotal(nextTotal);
      setOptimisticUserVote(nextUserVote);
      setIsVoting(true);

      const doSubmit =
        submitVote ??
        (async (pid: string, oids: string[]) => {
          const data = await post<{ totalVotes?: number }>(`/api/polls/${pid}/vote`, {
            approvals: oids,
          });
          return {
            success: true,
            totalVotes: data?.totalVotes,
          };
        });

      try {
        const result = await doSubmit(pollId, optionIds);
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
