/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import {
  useNotifications,
  useNotificationStore,
  notificationStoreUtils
} from '@/lib/stores/notificationStore';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';

const NotificationList = () => {
  const notifications = useNotifications();

  return (
    <div>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <strong>{notification.title}</strong>
            <span>{notification.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ClearButton = () => {
  const clearAll = useNotificationStore((state) => state.clearAll);
  return <button onClick={() => clearAll()}>clear</button>;
};

describe('notification store integration', () => {
  const originalPlay = window.HTMLMediaElement.prototype.play;
  const originalPause = window.HTMLMediaElement.prototype.pause;

  beforeAll(() => {
    Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined)
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: jest.fn()
    });
  });

  afterAll(() => {
    Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: originalPlay
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: originalPause
    });
  });

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    act(() => {
      const state = useNotificationStore.getState();
      state.clearAll();
      state.clearError();
      state.setAdding(false);
      state.setRemoving(false);
      state.updateSettings({ enableAutoDismiss: true, enableStacking: true, maxNotifications: 5 });
    });
  });

  afterEach(() => {
    act(() => {
      const state = useNotificationStore.getState();
      state.clearAll();
      state.clearError();
    });
    try {
      jest.runOnlyPendingTimers();
    } catch {
      // ignore if timers were not mocked
    }
    jest.useRealTimers();
  });

  it('renders notifications and auto-dismisses after duration', async () => {
    render(
      <>
        <ClearButton />
        <NotificationList />
      </>
    );

    act(() => {
      notificationStoreUtils.createSuccess('Toast Title', 'Toast body', 1000);
    });

    expect(screen.getByText('Toast Title')).toBeInTheDocument();
    expect(screen.getByText('Toast body')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.queryByText('Toast Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Toast body')).not.toBeInTheDocument();
  });

  it('respects clearAll action from selectors', () => {
    render(
      <>
        <ClearButton />
        <NotificationList />
      </>
    );

    act(() => {
      notificationStoreUtils.createInfo('Info Title', 'Info body', 0);
    });

    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info body')).toBeInTheDocument();

    act(() => {
      screen.getByText('clear').click();
    });

    expect(screen.queryByText('Info Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Info body')).not.toBeInTheDocument();
  });

  it('deduplicates election notifications and tracks lifecycle analytics', () => {
    const trackEvent = jest.fn();

    act(() => {
      useAnalyticsStore.setState((state) => ({
        ...state,
        trackingEnabled: true,
        preferences: { ...state.preferences, trackingEnabled: true },
        trackEvent
      }));
    });

    const baseNotification = {
      title: 'Upcoming Election',
      message: 'Election in five days',
      countdownLabel: 'Election in 5 days',
      electionId: '2026-ca-primary',
      divisionId: 'ocd-division/country:us/state:ca',
      electionDate: '2026-06-05',
      daysUntil: 5,
      representativeNames: ['Alex Official'],
      source: 'dashboard' as const,
      notificationType: 'info' as const
    };

    act(() => {
      notificationStoreUtils.createElectionNotification(baseNotification);
    });

    let notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.context?.kind).toBe('election');
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'notifications.election.delivered',
        event_data: expect.objectContaining({
          election_id: '2026-ca-primary',
          division_id: 'ocd-division/country:us/state:ca'
        })
      })
    );

    trackEvent.mockClear();

    act(() => {
      notificationStoreUtils.createElectionNotification({
        ...baseNotification,
        message: 'Election in four days',
        countdownLabel: 'Election in 4 days',
        daysUntil: 4
      });
    });

    notifications = useNotificationStore.getState().notifications;
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.message).toBe('Election in four days');
    expect(trackEvent).not.toHaveBeenCalled();

    const notificationId = notifications[0]?.id;
    trackEvent.mockClear();

    act(() => {
      if (notificationId) {
        useNotificationStore.getState().markAsRead(notificationId);
      }
    });

    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'notifications.election.opened',
        event_data: expect.objectContaining({
          election_id: '2026-ca-primary',
          division_id: 'ocd-division/country:us/state:ca'
        })
      })
    );
  });
});

