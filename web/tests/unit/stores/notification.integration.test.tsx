/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import {
  useNotifications,
  useNotificationStore,
  notificationStoreUtils
} from '@/lib/stores/notificationStore';

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
});

