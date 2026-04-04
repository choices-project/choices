/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';

import { useOptimisticMultiVote } from '@/hooks/useOptimisticMultiVote';

const BASE_OPTIONS = [
  { id: 'opt-1', text: 'Option A', votes: 10 },
  { id: 'opt-2', text: 'Option B', votes: 5 },
  { id: 'opt-3', text: 'Option C', votes: 3 },
];

describe('useOptimisticMultiVote', () => {
  it('initializes with provided options and totalVotes', () => {
    const { result } = renderHook(() =>
      useOptimisticMultiVote({
        pollId: 'poll-1',
        options: BASE_OPTIONS,
        totalVotes: 18,
        userVote: null,
      })
    );

    expect(result.current.optimisticData.options).toHaveLength(3);
    expect(result.current.optimisticData.totalVotes).toBe(18);
    expect(result.current.optimisticData.userVote).toBeNull();
    expect(result.current.isVoting).toBe(false);
  });

  it('applies optimistic update when voting (approval)', async () => {
    const submitVote = jest.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useOptimisticMultiVote({
        pollId: 'poll-1',
        options: BASE_OPTIONS,
        totalVotes: 18,
        userVote: null,
        submitVote,
      })
    );

    await act(async () => {
      await result.current.vote(['opt-1', 'opt-2']);
    });

    expect(result.current.optimisticData.userVote).toEqual(['opt-1', 'opt-2']);
    const opt1 = result.current.optimisticData.options.find((o) => o.id === 'opt-1');
    const opt2 = result.current.optimisticData.options.find((o) => o.id === 'opt-2');
    expect(opt1?.votes).toBe(11);
    expect(opt2?.votes).toBe(6);
    expect(result.current.optimisticData.totalVotes).toBe(20);
    expect(submitVote).toHaveBeenCalledWith('poll-1', ['opt-1', 'opt-2']);
  });

  it('rolls back on submit failure', async () => {
    const submitVote = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useOptimisticMultiVote({
        pollId: 'poll-1',
        options: BASE_OPTIONS,
        totalVotes: 18,
        userVote: null,
        submitVote,
      })
    );

    await act(async () => {
      try {
        await result.current.vote(['opt-1']);
      } catch {
        /* expected */
      }
    });

    expect(result.current.optimisticData.userVote).toBeNull();
    const opt1 = result.current.optimisticData.options.find((o) => o.id === 'opt-1');
    expect(opt1?.votes).toBe(10);
    expect(result.current.error).toBe('Network error');
  });

});
