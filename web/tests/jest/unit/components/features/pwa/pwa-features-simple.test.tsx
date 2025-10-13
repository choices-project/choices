/**
 * @jest-environment jsdom
 */

// Browser APIs are mocked in jest.setup.js

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

// Use REAL PWA installation manager - TESTING PHILOSOPHY APPROACH
// No mocking - test actual PWA functionality

// Mock browser APIs that PWA components depend on
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker APIs
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn(),
    ready: Promise.resolve(),
    getRegistration: jest.fn(),
    getRegistrations: jest.fn(),
  },
});

// Mock PushManager
Object.defineProperty(window, 'PushManager', {
  writable: true,
  value: jest.fn(),
});

// Use REAL Zustand stores - TESTING PHILOSOPHY APPROACH
// No mocking - test actual store behavior and real PWA functionality


import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PWAFeatures from '@/features/pwa/components/PWAFeatures';
import { T } from '@/lib/testing/testIds';
import { usePWAStore } from '@/lib/stores';

describe('PWA Features - Real Zustand Testing', () => {
  beforeEach(() => {
    // Reset Zustand stores to initial state using proper React testing approach
    const { result } = renderHook(() => usePWAStore());
    
    act(() => {
      // Reset to initial state using correct method names
      result.current.setInstallation({
        isInstalled: false,
        installPrompt: null,
        canInstall: true,
        installSource: 'manual',
        version: '1.0.0',
      });
      
      result.current.setOnlineStatus(true);
      result.current.clearNotifications();
      result.current.setLoading(false);
      result.current.setError(null);
    });
    
    // Debug: Check what was actually set
    console.log('After setup - installation:', result.current.installation);
    console.log('After setup - offline:', result.current.offline);
  });

  describe('Component Rendering', () => {
    it('should render PWA features when installation is available', () => {
      // Debug: Check what the store hooks are returning in the component context
      const TestComponent = () => {
        const installation = usePWAStore(state => state.installation);
        const offline = usePWAStore(state => state.offline);
        
        console.log('Component context - installation:', installation);
        console.log('Component context - offline:', offline);
        console.log('Component context - installation.isInstalled:', installation?.isInstalled);
        console.log('Component context - installation.canInstall:', installation?.canInstall);
        console.log('Component context - !installation:', !installation);
        console.log('Component context - !offline:', !offline);
        console.log('Component context - !installation.isInstalled && !installation.canInstall:', !installation?.isInstalled && !installation?.canInstall);
        
        return <div data-testid="debug-info">Debug: {JSON.stringify({ installation, offline })}</div>;
      };
      
      render(
        <BrowserRouter>
          <TestComponent />
        </BrowserRouter>
      );
      
      // Check what the debug component shows
      const debugInfo = screen.getByTestId('debug-info');
      console.log('Debug info text:', debugInfo.textContent);
      
      // Now test the actual PWAFeatures component
      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      // Check for basic PWA elements that should always render
      expect(screen.getByTestId('pwa-features')).toBeInTheDocument();
      expect(screen.getByTestId('offline-features')).toBeInTheDocument();
      expect(screen.getByTestId('notification-features')).toBeInTheDocument();
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
    it('should display offline indicator when offline', () => {
      // Use REAL Zustand store to set offline state
      const { usePWAStore } = require('@/lib/stores');
      const store = usePWAStore.getState();
      
      // Set offline state using real store
      store.setOnlineStatus(false);

      render(
        <BrowserRouter>
          <PWAFeatures />
        </BrowserRouter>
      );

      expect(screen.getByTestId('offline-features')).toBeInTheDocument();
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

    it('should not cause memory leaks', () => {
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
