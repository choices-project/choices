/**
 * @jest-environment jsdom
 */

// Mock window.matchMedia before any imports
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true,
});

// Mock browser APIs
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    ready: Promise.resolve(),
  },
  writable: true,
});

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  BellOff: () => <div data-testid="bell-off-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock Zustand PWA store hooks - CORRECT APPROACH
jest.mock('@/lib/stores', () => ({
  usePWAInstallation: jest.fn(() => ({
    isInstalled: false,
    canInstall: true,
    install: jest.fn(),
    checkInstallationStatus: jest.fn(),
  })),
  usePWAOffline: jest.fn(() => ({
    isOnline: true,
    offlineData: {
      cachedPages: [],
      cachedResources: [],
      queuedActions: []
    },
    syncOfflineData: jest.fn(),
    clearOfflineData: jest.fn(),
  })),
  usePWANotifications: jest.fn(() => ({
    permission: 'default',
    requestPermission: jest.fn(),
    showNotification: jest.fn(),
  })),
  usePWALoading: jest.fn(() => false),
  usePWAError: jest.fn(() => null),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PWAFeatures from '@/features/pwa/components/PWAFeatures';
import { T } from '@/lib/testing/testIds';
import { usePWAInstallation, usePWAOffline } from '@/lib/stores';

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  },
  writable: true,
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});


// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  } as Response)
);

describe('PWA Features - Comprehensive Testing', () => {
  // Enable fake timers to fix timer-related issues
  jest.useFakeTimers()
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    // Clear all timers before each test
    jest.clearAllTimers();
  });

  afterEach(() => {
    // Clean up timers after each test
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Component Rendering', () => {
    it('should render PWA features when installation is available', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Check for basic PWA elements
      expect(screen.getByTestId('pwa-features')).toBeInTheDocument();
      expect(screen.getByTestId('offline-features')).toBeInTheDocument();
    });

    it('should not render when PWA is already installed and no features available', () => {
      // Mock already installed state
      const { usePWAInstallation } = require('@/lib/stores');
      usePWAInstallation.mockReturnValue({
        isInstalled: true,
        canInstall: false,
        install: jest.fn(),
        isInstalling: false,
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // When PWA is installed and no features available, component returns null
      expect(screen.queryByTestId('pwa-features')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(
        <BrowserRouter>
          <PWAFeatures className="custom-class" />
        </BrowserRouter>
      );

      const container = screen.getByTestId('pwa-features');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Offline Features', () => {
    it('should display offline indicator', () => {
      // Mock offline state
      const { usePWAOffline } = require('@/lib/stores');
      usePWAOffline.mockReturnValue({
        isOnline: false,
        offlineData: {},
        syncOfflineData: jest.fn(),
        clearOfflineData: jest.fn(),
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('offline-features')).toBeInTheDocument();
    });

    it('should show offline polls when cached pages exist', () => {
      // Mock offline data with cached pages
      const { usePWAOffline } = require('@/lib/stores');
      usePWAOffline.mockReturnValue({
        isOnline: false,
        offlineData: {
          cachedPages: ['poll-1', 'poll-2'],
          queuedActions: [],
        },
        syncOfflineData: jest.fn(),
        clearOfflineData: jest.fn(),
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('offline-polls')).toBeInTheDocument();
    });

    it('should show offline queue when queued actions exist', () => {
      // Mock offline data with queued actions
      jest.doMock('@/features/pwa/hooks/useOffline', () => ({
        useOffline: () => ({
          isOnline: false,
          offlineData: {
            cachedPages: [],
            queuedActions: ['action-1', 'action-2'],
          },
          syncOfflineData: jest.fn(),
          clearOfflineData: jest.fn(),
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.offlineQueue)).toBeInTheDocument();
    });

    it('should show offline sync when cached pages exist', () => {
      // Mock offline data with cached pages
      jest.doMock('@/features/pwa/hooks/useOffline', () => ({
        useOffline: () => ({
          isOnline: false,
          offlineData: {
            cachedPages: ['poll-1'],
            queuedActions: [],
          },
          syncOfflineData: jest.fn(),
          clearOfflineData: jest.fn(),
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.offlineSync)).toBeInTheDocument();
    });
  });

  describe('Notification Features', () => {
    it('should display notification permission component', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.notificationPermission)).toBeInTheDocument();
    });

    it('should display notification preferences', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.notificationPreferences)).toBeInTheDocument();
    });

    it('should show different notification types for different user roles', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Regular user notifications
      expect(screen.getByTestId(T.pwa.regularUserNotifications)).toBeInTheDocument();
      expect(screen.getByTestId(T.pwa.regularUserNotifications)).toHaveTextContent('Regular User Notifications');
      
      // Admin user notifications
      expect(screen.getByTestId(T.pwa.adminUserNotifications)).toBeInTheDocument();
      expect(screen.getByTestId(T.pwa.adminUserNotifications)).toHaveTextContent('Admin User Notifications');
      
      // Mobile notifications
      expect(screen.getByTestId(T.pwa.mobileNotifications)).toBeInTheDocument();
      expect(screen.getByTestId(T.pwa.mobileNotifications)).toHaveTextContent('Mobile Notifications');
    });
  });

  describe('PWA Installation', () => {
    it('should handle PWA installation', async () => {
      const user = userEvent.setup();
      const mockInstall = jest.fn().mockResolvedValue(undefined);
      
      // Mock installation hook
      (usePWAInstallation as jest.Mock).mockReturnValue({
        isInstalled: false,
        canInstall: true,
        install: mockInstall,
        isInstalling: false,
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const installButton = screen.getByTestId(T.pwa.installButton);
      await user.click(installButton);
      
      // Wait for async operation
      await waitFor(() => {
        expect(mockInstall).toHaveBeenCalled();
      });
    }, 5000);

    it('should show installation progress', () => {
      // Mock installing state
      jest.doMock('@/features/pwa/hooks/usePWAInstallation', () => ({
        usePWAInstallation: () => ({
          isInstalled: false,
          canInstall: true,
          install: jest.fn(),
          isInstalling: true,
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.installingIndicator)).toBeInTheDocument();
      expect(screen.getByTestId(T.pwa.installingIndicator)).toHaveTextContent('Installing...');
    });

    it('should show installed state when PWA is installed', () => {
      // Mock installed state
      jest.doMock('@/features/pwa/hooks/usePWAInstallation', () => ({
        usePWAInstallation: () => ({
          isInstalled: true,
          canInstall: false,
          install: jest.fn(),
          isInstalling: false,
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId(T.pwa.installedIndicator)).toBeInTheDocument();
      expect(screen.getByTestId(T.pwa.installedIndicator)).toHaveTextContent('PWA Installed');
    });
  });

  describe('Offline Data Management', () => {
    it('should sync offline data when online', async () => {
      const user = userEvent.setup();
      const mockSyncOfflineData = jest.fn().mockResolvedValue(undefined);
      
      // Mock offline hook with sync function
      (usePWAOffline as jest.Mock).mockReturnValue({
        isOnline: true,
        offlineData: {
          cachedPages: ['poll-1'],
          queuedActions: ['action-1'],
        },
        syncOfflineData: mockSyncOfflineData,
        clearOfflineData: jest.fn(),
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const syncButton = screen.getByTestId(T.pwa.syncButton);
      await user.click(syncButton);
      
      // Wait for async operation
      await waitFor(() => {
        expect(mockSyncOfflineData).toHaveBeenCalled();
      });
    }, 5000);

    it('should clear offline data', async () => {
      const user = userEvent.setup();
      const mockClearOfflineData = jest.fn().mockResolvedValue(undefined);
      
      // Mock offline hook with clear function
      (usePWAOffline as jest.Mock).mockReturnValue({
        isOnline: false,
        offlineData: {
          cachedPages: ['poll-1'],
          queuedActions: ['action-1'],
        },
        syncOfflineData: jest.fn(),
        clearOfflineData: mockClearOfflineData,
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const clearButton = screen.getByTestId(T.pwa.clearButton);
      await user.click(clearButton);
      
      // Wait for async operation
      await waitFor(() => {
        expect(mockClearOfflineData).toHaveBeenCalled();
      });
    }, 5000);
  });

  describe('Notification Management', () => {
    it('should request notification permission', async () => {
      const user = userEvent.setup();
      const mockRequestPermission = jest.fn().mockResolvedValue('granted');
      
      // Mock notifications hook
      jest.doMock('@/features/pwa/hooks/useNotifications', () => ({
        useNotifications: () => ({
          permission: 'default',
          requestPermission: mockRequestPermission,
          showNotification: jest.fn(),
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const requestButton = screen.getByTestId(T.pwa.requestPermissionButton);
      await user.click(requestButton);
      
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should show notification when permission is granted', async () => {
      const user = userEvent.setup();
      const mockShowNotification = jest.fn();
      
      // Mock notifications hook
      jest.doMock('@/features/pwa/hooks/useNotifications', () => ({
        useNotifications: () => ({
          permission: 'granted',
          requestPermission: jest.fn(),
          showNotification: mockShowNotification,
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const testButton = screen.getByTestId(T.pwa.testNotificationButton);
      await user.click(testButton);
      
      expect(mockShowNotification).toHaveBeenCalledWith({
        title: 'Test Notification',
        body: 'This is a test notification',
        icon: '/icon-192x192.png',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle installation errors', async () => {
      const user = userEvent.setup();
      const mockInstall = jest.fn().mockRejectedValue(new Error('Installation failed'));
      
      // Mock installation hook with error
      jest.doMock('@/features/pwa/hooks/usePWAInstallation', () => ({
        usePWAInstallation: () => ({
          isInstalled: false,
          canInstall: true,
          install: mockInstall,
          isInstalling: false,
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const installButton = screen.getByTestId(T.pwa.installButton);
      await user.click(installButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId(T.pwa.installError)).toBeInTheDocument();
        expect(screen.getByTestId(T.pwa.installError)).toHaveTextContent('Installation failed');
      });
    });

    it('should handle sync errors', async () => {
      const user = userEvent.setup();
      const mockSyncOfflineData = jest.fn().mockRejectedValue(new Error('Sync failed'));
      
      // Mock offline hook with error
      jest.doMock('@/features/pwa/hooks/useOffline', () => ({
        useOffline: () => ({
          isOnline: true,
          offlineData: {
            cachedPages: ['poll-1'],
            queuedActions: ['action-1'],
          },
          syncOfflineData: mockSyncOfflineData,
          clearOfflineData: jest.fn(),
        }),
      }));

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      const syncButton = screen.getByTestId(T.pwa.syncButton);
      await user.click(syncButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId(T.pwa.syncError)).toBeInTheDocument();
        expect(screen.getByTestId(T.pwa.syncError)).toHaveTextContent('Sync failed');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Tab through elements
      const firstElement = screen.getByTestId(T.pwa.firstFocusable);
      firstElement.focus();
      expect(document.activeElement).toBe(firstElement);
      
      // Tab to next element
      fireEvent.keyDown(firstElement, { key: 'Tab' });
      const secondElement = screen.getByTestId(T.pwa.secondFocusable);
      expect(document.activeElement).toBe(secondElement);
    });

    it('should have proper ARIA labels', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Check for ARIA labels
      expect(screen.getByTestId(T.pwa.installButton)).toHaveAttribute('aria-label', 'Install PWA');
      expect(screen.getByTestId(T.pwa.syncButton)).toHaveAttribute('aria-label', 'Sync offline data');
    });

    it('should announce state changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Trigger state change
      const installButton = screen.getByTestId(T.pwa.installButton);
      await user.click(installButton);
      
      // Should announce state change
      await waitFor(() => {
        expect(screen.getByTestId(T.pwa.stateAnnouncement)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not cause memory leaks', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Unmount component
      unmount();
      
      // Should not leave any event listeners or timers
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});











