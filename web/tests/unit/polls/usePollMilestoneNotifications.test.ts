/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';

import { POLL_MILESTONES, usePollMilestoneNotifications } from '@/features/polls/hooks/usePollMilestones';
import { useNotificationStore } from '@/lib/stores/notificationStore';

describe('usePollMilestoneNotifications', () => {
  beforeEach(() => {
    window.localStorage.clear();
    const store = useNotificationStore.getState();
    store.clearAll();
    store.updateSettings({
      enableSound: false,
      enableHaptics: false,
      enableAutoDismiss: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enables default milestone preferences', () => {
    const { result } = renderHook(() =>
      usePollMilestoneNotifications({ pollId: 'poll-1', totalVotes: 0 }),
    );

    expect(result.current.preferences).toBeDefined();
    expect(result.current.preferences[10]).toBe(true);
    expect(result.current.enabledMilestones).toEqual(
      POLL_MILESTONES.filter((milestone) => milestone <= 50),
    );
  });

  it('emits notification once when milestone threshold is reached', async () => {
    const notificationState = useNotificationStore.getState();
    const addNotificationSpy = jest.spyOn(notificationState, 'addNotification');

    const { rerender, unmount } = renderHook(
      ({ votes }) => usePollMilestoneNotifications({ pollId: 'poll-42', totalVotes: votes }),
      { initialProps: { votes: 0 } },
    );

    expect(addNotificationSpy).not.toHaveBeenCalled();

    await act(async () => {
      rerender({ votes: 25 });
    });

    expect(addNotificationSpy).toHaveBeenCalledTimes(2);
    expect(addNotificationSpy.mock.calls[0]?.[0]).toMatchObject({
      type: 'success',
      title: expect.stringContaining('10'),
    });
    expect(addNotificationSpy.mock.calls[1]?.[0]).toMatchObject({
      type: 'success',
      title: expect.stringContaining('25'),
    });

    // Subsequent rerenders with same threshold should not duplicate notifications
    await act(async () => {
      rerender({ votes: 30 });
    });

    expect(addNotificationSpy).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('respects disabled milestone preferences', async () => {
    const notificationState = useNotificationStore.getState();
    const addNotificationSpy = jest.spyOn(notificationState, 'addNotification');

    const { result, rerender, unmount } = renderHook(
      ({ votes }) => usePollMilestoneNotifications({ pollId: 'poll-100', totalVotes: votes }),
      { initialProps: { votes: 0 } },
    );

    await act(async () => {
      result.current.updatePreference(10, false);
      result.current.updatePreference(25, false);
    });

    expect(result.current.preferences[10]).toBe(false);
    expect(result.current.preferences[25]).toBe(false);

    addNotificationSpy.mockClear();

    await act(async () => {
      rerender({ votes: 15 });
    });

    expect(addNotificationSpy).not.toHaveBeenCalled();

    unmount();
  });
});
