/**
 * @jest-environment jsdom
 */
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';

import PWAStatus from '@/components/PWAStatus';
import type {
  PWAInstallation,
  PWAOffline,
  PWAPreferences,
  PWAQueuedAction,
} from '@/lib/stores/pwaStore';

jest.mock('@/lib/stores/pwaStore', () => {
  const actual = jest.requireActual('@/lib/stores/pwaStore');
  const mocked = Object.assign({}, actual) as typeof actual;
  mocked.usePWAInstallation = jest.fn();
  mocked.usePWAOffline = jest.fn();
  mocked.usePWAPreferences = jest.fn();
  mocked.usePWALoading = jest.fn();
  mocked.usePWAError = jest.fn();
  mocked.usePWAActions = jest.fn();
  return mocked;
});

const originalNotification = global.Notification;
const mockedPWAStore = jest.requireMock('@/lib/stores/pwaStore') as {
  usePWAInstallation: jest.Mock;
  usePWAOffline: jest.Mock;
  usePWAPreferences: jest.Mock;
  usePWALoading: jest.Mock;
  usePWAError: jest.Mock;
  usePWAActions: jest.Mock;
};

describe('PWAStatus', () => {
  let installationState: PWAInstallation;
  let offlineState: PWAOffline;
  let preferencesState: PWAPreferences;
  let loadingState: boolean;
  let errorState: string | null;
  let actions: {
    installPWA: jest.Mock;
    syncData: jest.Mock;
    updateServiceWorker: jest.Mock;
    setOnlineStatus: (online: boolean) => void;
    queueOfflineAction: (action: PWAQueuedAction) => void;
  };

  beforeEach(() => {
    installationState = {
      isInstalled: false,
      installPrompt: null,
      canInstall: false,
      installSource: 'manual',
      version: '1.0.0',
    };

    offlineState = {
      isOnline: true,
      isOffline: false,
      lastOnline: new Date().toISOString(),
      offlineData: {
        cachedPages: [],
        cachedResources: [],
        queuedActions: [],
      },
    };

    preferencesState = {
      autoUpdate: true,
      offlineMode: true,
      backgroundSync: true,
      pushNotifications: true,
      installPrompt: true,
      updateChannel: 'stable',
      cacheStrategy: 'balanced',
      dataUsage: {
        maxCacheSize: 100,
        maxOfflineStorage: 50,
        syncFrequency: 15,
      },
      privacy: {
        shareUsageData: false,
        shareCrashReports: true,
        sharePerformanceData: false,
      },
    };

    loadingState = false;
    errorState = null;

    actions = {
      installPWA: jest.fn(),
      syncData: jest.fn(),
      updateServiceWorker: jest.fn(),
      setOnlineStatus: (online: boolean) => {
        offlineState = {
          isOnline: online,
          isOffline: !online,
          lastOnline: online ? new Date().toISOString() : offlineState.lastOnline,
          offlineData: offlineState.offlineData,
        };
      },
      queueOfflineAction: (action: PWAQueuedAction) => {
        const currentOffline = offlineState.offlineData;
        offlineState = {
          isOnline: offlineState.isOnline,
          isOffline: offlineState.isOffline,
          lastOnline: offlineState.lastOnline,
          offlineData: {
            cachedPages: currentOffline.cachedPages,
            cachedResources: currentOffline.cachedResources,
            queuedActions: currentOffline.queuedActions.concat(action),
          },
        };
      },
    };

    mockedPWAStore.usePWAInstallation.mockImplementation(() => installationState);
    mockedPWAStore.usePWAOffline.mockImplementation(() => offlineState);
    mockedPWAStore.usePWAPreferences.mockImplementation(() => preferencesState);
    mockedPWAStore.usePWALoading.mockImplementation(() => loadingState);
    mockedPWAStore.usePWAError.mockImplementation(() => errorState);
    mockedPWAStore.usePWAActions.mockImplementation(() => actions);

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
    const view = render(<PWAStatus showDetails />);

    act(() => {
      actions.setOnlineStatus(false);
      actions.queueOfflineAction({
        id: 'queued-action',
        type: 'vote',
        createdAt: new Date().toISOString(),
        data: { pollId: '123', choice: 1 },
      } as PWAQueuedAction);
    });

    view.rerender(<PWAStatus showDetails />);

    expect(screen.getByTestId('offline-status')).toHaveTextContent('Offline');
    expect(screen.getByTestId('offline-data-status')).toHaveTextContent('1 vote pending');
  });

  it('invokes sync action when sync button clicked', () => {
    const syncSpy = jest.fn();

    actions.syncData = syncSpy;
    mockedPWAStore.usePWAActions.mockReturnValue(actions);

    act(() => {
      actions.queueOfflineAction({
        id: 'offline-action',
        type: 'test',
        createdAt: new Date().toISOString(),
        data: { foo: 'bar' },
      } as PWAQueuedAction);
    });

    const view = render(<PWAStatus showDetails />);

    view.rerender(<PWAStatus showDetails />);

    fireEvent.click(screen.getByRole('button', { name: /Sync Offline Data/i }));

    expect(syncSpy).toHaveBeenCalledTimes(1);
  });
});
