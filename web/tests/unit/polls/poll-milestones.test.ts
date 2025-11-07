/** @jest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react';

import { POLL_MILESTONES, usePollMilestoneNotifications } from '@/features/polls/hooks/usePollMilestones';

const STORAGE_KEY = 'choices.poll.milestones';

const serialize = (value: unknown) => JSON.stringify(value, null, 2);

describe('usePollMilestoneNotifications', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns default preferences while pollId is null', () => {
    const { result } = renderHook(() => usePollMilestoneNotifications({ pollId: null, totalVotes: 0 }));

    expect(result.current.isReady).toBe(false);
    expect(result.current.preferences).toEqual(
      POLL_MILESTONES.reduce<Record<number, boolean>>((acc, milestone) => {
        acc[milestone] = milestone <= 50;
        return acc;
      }, {}),
    );
  });

  it('hydrates preferences from localStorage when a pollId is provided', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      serialize({
        'poll-123': {
          preferences: { 10: false, 25: true },
          acknowledged: [10],
          updatedAt: new Date().toISOString(),
        },
      }),
    );

    const { result, rerender } = renderHook((props) => usePollMilestoneNotifications(props), {
      initialProps: { pollId: null as string | null, totalVotes: 0 },
    });

    expect(result.current.isReady).toBe(false);

    await act(async () => {
      rerender({ pollId: 'poll-123', totalVotes: 0 });
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.preferences[10]).toBe(false);
    expect(result.current.preferences[25]).toBe(true);
    expect(result.current.enabledMilestones).toContain(25);
    expect(result.current.enabledMilestones).not.toContain(10);
  });

  it('persists preference updates back to localStorage', async () => {
    const { result, rerender } = renderHook((props) => usePollMilestoneNotifications(props), {
      initialProps: { pollId: null as string | null, totalVotes: 0 },
    });

    await act(async () => {
      rerender({ pollId: 'poll-xyz', totalVotes: 0 });
    });

    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.updatePreference(10, false);
    });

    expect(result.current.preferences[10]).toBe(false);

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(stored['poll-xyz'].preferences['10']).toBe(false);
  });
});

