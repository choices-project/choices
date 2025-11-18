/**
 * @jest-environment jsdom
 */

// Mock Notification API FIRST, before any imports
const createMockNotification = () => {
  return class MockNotification {
    static permission: NotificationPermission = 'default';
    static requestPermission = jest.fn().mockResolvedValue('granted');
  };
};

// Set up global mocks before anything else
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'Notification', {
    writable: true,
    configurable: true,
    value: createMockNotification(),
  });
}

(global as any).Notification = createMockNotification();

// Mock Service Worker APIs - use shared mock object
const mockPushManager = {
  subscribe: jest.fn(),
  getSubscription: jest.fn(),
};

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
};

const mockServiceWorker = {
  ready: Promise.resolve(mockServiceWorkerRegistration),
};

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: mockServiceWorker,
});

Object.defineProperty(window, 'PushManager', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';

import NotificationPreferences from '@/features/pwa/components/NotificationPreferences';
import { useUser } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/lib/stores/pwaStore', () => ({
  usePWAPreferences: jest.fn(() => ({
    pushNotifications: false,
  })),
  usePWAActions: jest.fn(() => ({
    updatePreferences: jest.fn(),
  })),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

// Use the shared mocks defined above
// mockServiceWorkerRegistration and mockPushManager are already defined globally

describe('NotificationPreferences', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockUpdatePreferences = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    (mockUseUser as jest.Mock).mockReturnValue(mockUser);
    
    // Reset Notification mock
    if (window.Notification) {
      (window.Notification as any).permission = 'default';
      (window.Notification as any).requestPermission = jest.fn().mockResolvedValue('granted');
    }
    
    if (global.Notification) {
      (global.Notification as any).permission = 'default';
      (global.Notification as any).requestPermission = jest.fn().mockResolvedValue('granted');
    }
    
    // Reset mocks to default values
    mockPushManager.getSubscription.mockResolvedValue(null);
    mockPushManager.subscribe.mockResolvedValue({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
      toJSON: jest.fn(() => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      })),
    });

    // Mock fetch
    global.fetch = jest.fn();

    // Mock environment variable
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = 'test-vapid-key';
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = 'test-vapid-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders notification preferences component when notifications are supported', () => {
      render(<NotificationPreferences />);
      expect(screen.getByTestId('notification-preferences')).toBeInTheDocument();
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    it('shows unsupported message when notifications are not available', () => {
      // Remove Notification from window
      delete (window as any).Notification;
      
      // Re-render component to trigger check
      const { rerender } = render(<NotificationPreferences />);
      rerender(<NotificationPreferences />);
      
      expect(screen.getByTestId('notification-preferences-unsupported')).toBeInTheDocument();
      
      // Restore Notification for other tests
      Object.defineProperty(window, 'Notification', {
        writable: true,
        configurable: true,
        value: createMockNotification(),
      });
    });

    it('shows login required message when user is not logged in', () => {
      (mockUseUser as jest.Mock).mockReturnValue(null);

      render(<NotificationPreferences />);
      expect(screen.getByTestId('notification-preferences-login-required')).toBeInTheDocument();
    });
  });

  describe('Permission Request Flow', () => {
    it('handles permission request successfully', async () => {
      // Reset Notification mock
      if (window.Notification) {
        (window.Notification as any).permission = 'default';
        (window.Notification as any).requestPermission = jest.fn().mockResolvedValue('granted');
      }

      render(<NotificationPreferences />);

      const requestButton = screen.getByTestId('request-notification-permission');
      expect(requestButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(requestButton);
      });

      await waitFor(() => {
        expect((window.Notification as any).requestPermission).toHaveBeenCalled();
      });

      expect(screen.getByText(/notification permission granted/i)).toBeInTheDocument();
    });

    it('handles permission denial', async () => {
      // Reset Notification mock
      if (window.Notification) {
        (window.Notification as any).permission = 'default';
        (window.Notification as any).requestPermission = jest.fn().mockResolvedValue('denied');
      }

      render(<NotificationPreferences />);

      const requestButton = screen.getByTestId('request-notification-permission');
      
      await act(async () => {
        fireEvent.click(requestButton);
      });

      await waitFor(() => {
        expect((window.Notification as any).requestPermission).toHaveBeenCalled();
      });

      expect(screen.getByText(/notification permission denied/i)).toBeInTheDocument();
    });

    it('displays current permission status', () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      render(<NotificationPreferences />);

      expect(screen.getByText(/granted/i)).toBeInTheDocument();
    });
  });

  describe('Subscription Flow', () => {
    beforeEach(() => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }
    });

    it('subscribes to push notifications successfully', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
        toJSON: jest.fn(() => ({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: {
            p256dh: 'test-p256dh-key',
            auth: 'test-auth-key',
          },
        })),
      };

      mockPushManager.subscribe.mockResolvedValue(mockSubscription);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ subscriptionId: 'sub-123', message: 'Success' }),
      });

      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('subscribe-notifications')).toBeInTheDocument();
      });

      const subscribeButton = screen.getByTestId('subscribe-notifications');

      await act(async () => {
        fireEvent.click(subscribeButton);
      });

      await waitFor(() => {
        expect(mockPushManager.subscribe).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/pwa/notifications/subscribe'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });

    it('handles subscription errors gracefully', async () => {
      mockPushManager.subscribe.mockRejectedValue(
        new Error('Subscription failed')
      );

      render(<NotificationPreferences />);

      const subscribeButton = screen.getByTestId('subscribe-notifications');

      await act(async () => {
        fireEvent.click(subscribeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      });
    });

    it('unsubscribes from push notifications successfully', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        unsubscribe: jest.fn().mockResolvedValue(true),
      };

      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });

      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('unsubscribe-notifications')).toBeInTheDocument();
      });

      const unsubscribeButton = screen.getByTestId('unsubscribe-notifications');

      await act(async () => {
        fireEvent.click(unsubscribeButton);
      });

      await waitFor(() => {
        expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      });
    });
  });

  describe('Preference Management', () => {
    beforeEach(() => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      };
      mockPushManager.getSubscription.mockResolvedValue(mockSubscription);
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Success' }),
      });
    });

    it('toggles notification preferences', async () => {
      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('new-polls-toggle')).toBeInTheDocument();
      });

      const toggle = screen.getByTestId('new-polls-toggle');

      await act(async () => {
        fireEvent.click(toggle);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/pwa/notifications/subscribe'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing VAPID key', async () => {
      // Delete both VAPID key environment variables
      const originalPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      const originalServerKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
      delete process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      delete process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
      
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      render(<NotificationPreferences />);

      const subscribeButton = screen.getByTestId('subscribe-notifications');

      await act(async () => {
        fireEvent.click(subscribeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
      
      // Restore environment variables
      if (originalPublicKey) {
        process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = originalPublicKey;
      }
      if (originalServerKey) {
        process.env.WEB_PUSH_VAPID_PUBLIC_KEY = originalServerKey;
      }
    });

    it('handles service worker unavailability', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      render(<NotificationPreferences />);
      
      // Restore service worker for other tests
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: mockServiceWorker,
      });
    });

    it('handles network errors during subscription', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      mockPushManager.subscribe.mockResolvedValue({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test-key', auth: 'test-auth' },
        toJSON: jest.fn(() => ({ endpoint: 'test', keys: { p256dh: 'test-key', auth: 'test-auth' } })),
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<NotificationPreferences />);

      const subscribeButton = await screen.findByTestId('subscribe-notifications');

      await act(async () => {
        fireEvent.click(subscribeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles invalid VAPID key format', async () => {
      const originalKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = 'invalid-key-format';

      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      mockPushManager.subscribe.mockRejectedValue(new Error('Invalid VAPID key'));

      render(<NotificationPreferences />);

      const subscribeButton = await screen.findByTestId('subscribe-notifications');

      await act(async () => {
        fireEvent.click(subscribeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      }, { timeout: 3000 });

      if (originalKey) {
        process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = originalKey;
      }
    });

    it('handles subscription already exists scenario', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      const existingSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/existing',
        keys: { p256dh: 'existing-key', auth: 'existing-auth' },
        toJSON: jest.fn(() => ({ endpoint: 'existing', keys: { p256dh: 'existing-key', auth: 'existing-auth' } })),
      };

      mockPushManager.getSubscription.mockResolvedValue(existingSubscription);

      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('unsubscribe-notifications')).toBeInTheDocument();
      });
    });

    it('handles preference update errors gracefully', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      const existingSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test-key', auth: 'test-auth' },
        toJSON: jest.fn(() => ({ endpoint: 'test', keys: { p256dh: 'test-key', auth: 'test-auth' } })),
      };

      mockPushManager.getSubscription.mockResolvedValue(existingSubscription);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('new-polls-toggle')).toBeInTheDocument();
      });

      const toggle = screen.getByTestId('new-polls-toggle');
      
      await act(async () => {
        fireEvent.click(toggle);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles unsubscription network errors', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      const existingSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test-key', auth: 'test-auth' },
        unsubscribe: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn(() => ({ endpoint: 'test', keys: { p256dh: 'test-key', auth: 'test-auth' } })),
      };

      mockPushManager.getSubscription.mockResolvedValue(existingSubscription);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<NotificationPreferences />);

      const unsubscribeButton = await screen.findByTestId('unsubscribe-notifications');

      await act(async () => {
        fireEvent.click(unsubscribeButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('notification-error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles service worker registration timeout', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      // Mock service worker ready promise that never resolves
      const timeoutPromise = new Promise(() => undefined);
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: {
          ready: timeoutPromise,
        },
      });

      render(<NotificationPreferences />);

      // Component should handle timeout gracefully
      await waitFor(() => {
        const subscribeButton = screen.queryByTestId('subscribe-notifications');
        // Button should still be rendered but may be disabled
        expect(subscribeButton).toBeInTheDocument();
      }, { timeout: 1000 });

      // Restore service worker
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: mockServiceWorker,
      });
    });

    it('synchronizes subscription state correctly after mount', async () => {
      if (window.Notification) {
        (window.Notification as any).permission = 'granted';
      }

      const subscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: { p256dh: 'test-key', auth: 'test-auth' },
        toJSON: jest.fn(() => ({ endpoint: 'test', keys: { p256dh: 'test-key', auth: 'test-auth' } })),
      };

      mockPushManager.getSubscription.mockResolvedValue(subscription);

      render(<NotificationPreferences />);

      await waitFor(() => {
        expect(screen.getByTestId('unsubscribe-notifications')).toBeInTheDocument();
      });
      
      // Verify subscription check was called
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
    });
  });
});
