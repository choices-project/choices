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


import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PWAFeatures from '@/features/pwa/components/PWAFeatures';

// Mock the PWA store hooks directly
jest.mock('@/lib/stores', () => ({
  usePWAInstallation: jest.fn(() => ({
    isInstalled: false,
    canInstall: true,
    installPrompt: null,
    installSource: 'manual',
    version: '1.0.0',
  })),
  usePWAOffline: jest.fn(() => ({
    isOnline: true,
    isOffline: false,
    lastOnline: new Date().toISOString(),
    offlineData: {
      cachedPages: [],
      cachedResources: [],
      queuedActions: []
    },
  })),
  usePWANotifications: jest.fn(() => []),
  usePWALoading: jest.fn(() => false),
  usePWAError: jest.fn(() => null),
  usePWAActions: jest.fn(() => ({
    setInstallation: jest.fn(),
    setInstallPrompt: jest.fn(),
    setCanInstall: jest.fn(),
    installPWA: jest.fn(),
    uninstallPWA: jest.fn(),
    setOnlineStatus: jest.fn(),
    setOfflineData: jest.fn(),
    addCachedPage: jest.fn(),
    removeCachedPage: jest.fn(),
    addCachedResource: jest.fn(),
    removeCachedResource: jest.fn(),
    queueOfflineAction: jest.fn(),
    processOfflineActions: jest.fn(),
    setUpdateAvailable: jest.fn(),
    downloadUpdate: jest.fn(),
    installUpdate: jest.fn(),
    skipUpdate: jest.fn(),
    setAutoUpdate: jest.fn(),
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    markNotificationRead: jest.fn(),
    clearNotifications: jest.fn(),
    setPerformance: jest.fn(),
    updatePerformanceMetrics: jest.fn(),
    updatePreferences: jest.fn(),
    resetPreferences: jest.fn(),
    registerServiceWorker: jest.fn(),
    unregisterServiceWorker: jest.fn(),
    updateServiceWorker: jest.fn(),
    syncData: jest.fn(),
    clearCache: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    setLoading: jest.fn(),
    setInstalling: jest.fn(),
    setUpdating: jest.fn(),
    setSyncing: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
  })),
}));

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

describe('PWA Features - Simple Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render PWA features when installation is available', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Debug: Check what's actually rendered
      console.log('Rendered HTML:', document.body.innerHTML);
      
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
        installPrompt: null,
        installSource: 'manual',
        version: '1.0.0',
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
        isOffline: true,
        lastOnline: new Date().toISOString(),
        offlineData: {
          cachedPages: ['poll-1', 'poll-2'],
          cachedResources: [],
          queuedActions: [],
        },
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
      const { usePWAOffline } = require('@/lib/stores');
      usePWAOffline.mockReturnValue({
        isOnline: false,
        isOffline: true,
        lastOnline: new Date().toISOString(),
        offlineData: {
          cachedPages: [],
          cachedResources: [],
          queuedActions: ['action-1', 'action-2'],
        },
      });

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('offline-queue-container')).toBeInTheDocument();
    });
  });

  describe('Notification Features', () => {
    it('should display notification features', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('notification-features')).toBeInTheDocument();
    });

    it('should show different notification types for different user roles', () => {
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('regular-user-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('admin-user-notifications')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100); // 100ms budget
    });
  });
});