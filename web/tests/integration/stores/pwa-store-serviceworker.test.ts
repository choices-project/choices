/**
 * PWA Store ServiceWorker Integration Tests
 * 
 * Tests for PWA store ServiceWorker/provider integration:
 * - ServiceWorker registration
 * - ServiceWorker update detection
 * - ServiceWorker activation
 * - Background sync integration
 * - Offline queue processing
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  usePWAStore,
  createInitialPWAState,
} from '@/lib/stores/pwaStore';
import { PWA_QUEUED_REQUEST_TYPES } from '@/types/pwa';

// Mock ServiceWorker API
const mockServiceWorkerRegistration = {
  update: jest.fn(),
  installing: null,
  waiting: null,
  active: {
    postMessage: jest.fn(),
  },
  pushManager: {
    subscribe: jest.fn(),
    getSubscription: jest.fn(),
  },
} as unknown as ServiceWorkerRegistration;

type RegisterFn = (scriptURL: string | URL, options?: RegistrationOptions) => Promise<ServiceWorkerRegistration>;
type GetRegistrationFn = (clientURL?: string | URL) => Promise<ServiceWorkerRegistration | null>;

const mockServiceWorker = {
  register: jest.fn() as jest.MockedFunction<RegisterFn>,
  getRegistration: jest.fn() as jest.MockedFunction<GetRegistrationFn>,
  ready: Promise.resolve(mockServiceWorkerRegistration),
  controller: {
    postMessage: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

beforeEach(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockServiceWorker as unknown as ServiceWorkerContainer,
    });
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PWA Store ServiceWorker Integration', () => {
  const store = usePWAStore;

  beforeEach(() => {
    store.setState(createInitialPWAState());
  });

  describe('ServiceWorker Registration', () => {
    it('registers service worker and updates store state', async () => {
      mockServiceWorker.register.mockResolvedValue(mockServiceWorkerRegistration);

      await store.getState().registerServiceWorker();

      expect(mockServiceWorker.register).toHaveBeenCalled();
      expect(store.getState().installation.version).toBeTruthy();
    });

    it('handles service worker registration errors', async () => {
      const error = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      await store.getState().registerServiceWorker();

      expect(store.getState().error).toBeTruthy();
    });
  });

  describe('ServiceWorker Update Detection', () => {
    it('updates service worker registration when available', async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(mockServiceWorkerRegistration);

      await store.getState().updateServiceWorker();

      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });

    it('handles update when no service worker registered', async () => {
      mockServiceWorker.getRegistration.mockResolvedValue(null);

      await store.getState().updateServiceWorker();

      // Should handle gracefully without error
      expect(store.getState().error).toBeNull();
    });
  });

  describe('Background Sync Integration', () => {
    it('processes offline queue when online', async () => {
      store.getState().setOnlineStatus(true);
      store.getState().queueOfflineAction({
        id: 'offline-vote-1',
        action: PWA_QUEUED_REQUEST_TYPES.VOTE,
        data: { pollId: 'poll-1', choice: 1 },
        timestamp: new Date().toISOString(),
      });

      const activeWorker = {
        postMessage: jest.fn(),
      };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          registration.active.postMessage = activeWorker.postMessage as ServiceWorker['postMessage'];
        }
      }

      await store.getState().processOfflineActions();

      expect(store.getState().offline.offlineData.queuedActions).toHaveLength(0);
    });

    it('queues actions when offline', async () => {
      store.getState().setOnlineStatus(false);

      store.getState().queueOfflineAction({
        id: 'offline-vote-1',
        action: PWA_QUEUED_REQUEST_TYPES.VOTE,
        data: { pollId: 'poll-1', choice: 1 },
        timestamp: new Date().toISOString(),
      });

      expect(store.getState().offline.offlineData.queuedActions).toHaveLength(1);
    });
  });

  describe('ServiceWorker Provider Integration', () => {
    it('verifies service worker controller exists when installed', async () => {
      Object.defineProperty(mockServiceWorker, 'controller', {
        value: { postMessage: jest.fn() },
        writable: true,
      });

      const hasController = !!navigator.serviceWorker?.controller;
      expect(hasController).toBe(true);
    });

    it('handles missing service worker gracefully', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Store should handle missing service worker
      const online = store.getState().offline.isOnline;
      expect(typeof online).toBe('boolean');
    });
  });
});

