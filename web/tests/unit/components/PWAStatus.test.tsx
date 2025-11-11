/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';

import PWAStatus from '@/components/PWAStatus';
import {
  usePWAStore,
  createInitialPWAState,
  type PWAQueuedAction,
} from '@/lib/stores/pwaStore';

const originalNotification = global.Notification;

describe('PWAStatus', () => {
  beforeEach(() => {
    const initial = createInitialPWAState();
    act(() => {
      usePWAStore.setState((state) => {
        Object.assign(state, initial);
      });
    });

    const serviceWorker = {
      controller: {},
      register: jest.fn(),
      getRegistrations: jest.fn(),
      getRegistration: jest.fn(),
    } as unknown as ServiceWorkerContainer;

    Object.assign(navigator, { serviceWorker, onLine: true });

    class MockNotification {
      static permission = 'granted';
      static requestPermission = jest.fn().mockResolvedValue('granted');
    }

    Object.defineProperty(global, 'Notification', {
      value: MockNotification,
      configurable: true,
    });

  });

  afterEach(() => {
    jest.clearAllMocks();

    if (originalNotification) {
      Object.defineProperty(global, 'Notification', {
        value: originalNotification,
        configurable: true,
      });
    }
  });

  it('renders detailed status using selector data', () => {
    render(<PWAStatus showDetails />);

    expect(screen.getByTestId('pwa-status')).toBeInTheDocument();
    expect(screen.getByTestId('installation-status')).toHaveTextContent('Not Available');
    expect(screen.getByTestId('offline-status')).toHaveTextContent('Online');
    expect(screen.getByTestId('notification-status')).toHaveTextContent('Enabled');
  });

  it('reflects offline queue and connection changes triggered via actions', async () => {
    render(<PWAStatus showDetails />);

    const { setOnlineStatus, queueOfflineAction } = usePWAStore.getState();

    act(() => {
      setOnlineStatus(false);
      queueOfflineAction({
        id: 'queued-action',
        type: 'vote',
        createdAt: new Date().toISOString(),
        data: { pollId: '123', choice: 1 },
      } as PWAQueuedAction);
    });

    expect(screen.getByTestId('offline-status')).toHaveTextContent('Offline');
    expect(screen.getByTestId('offline-data-status')).toHaveTextContent('1 vote pending');
  });

  it('invokes sync action when sync button clicked', () => {
    const syncSpy = jest.fn();

    act(() => {
      const store = usePWAStore.getState();
      store.queueOfflineAction({
        id: 'offline-action',
        type: 'test',
        createdAt: new Date().toISOString(),
        data: { foo: 'bar' },
      } as PWAQueuedAction);
      usePWAStore.setState((state) => {
        state.syncData = syncSpy;
      });
    });

    render(<PWAStatus showDetails />);

    fireEvent.click(screen.getByRole('button', { name: /Sync Offline Data/i }));

    expect(syncSpy).toHaveBeenCalledTimes(1);
  });
});
