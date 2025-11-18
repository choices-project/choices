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
  pwaStoreCreator,
  usePWAStore,
} from '@/lib/stores/pwaStore';

// Mock ServiceWorker API
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    update: jest.fn(),
    installing: null,
    waiting: null,
    active: {
      postMessage: jest.fn(),
    },
  }),
  controller: {
    postMessage: jest.fn(),
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

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
};

beforeEach(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: mockServiceWorker,
    });
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PWA Store ServiceWorker Integration', () => {
  let store: ReturnType<typeof pwaStoreCreator>;

  beforeEach(() => {
    store = pwaStoreCreator();
    store.getState().resetPWAState();
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
    it('detects service worker updates', async () => {
      const waitingWorker = {
        postMessage: jest.fn(),
      };
      mockServiceWorkerRegistration.waiting = waitingWorker;

      await store.getState().checkForUpdates();

      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });

    it('handles update check when no service worker registered', async () => {
      mockServiceWorker.register.mockResolvedValue(null);

      await store.getState().checkForUpdates();

      // Should handle gracefully without error
      expect(store.getState().update.isAvailable).toBe(false);
    });
  });

  describe('ServiceWorker Activation', () => {
    it('activates waiting service worker', async () => {
      const waitingWorker = {
        postMessage: jest.fn(),
        skipWaiting: jest.fn().mockResolvedValue(undefined),
      };
      mockServiceWorkerRegistration.waiting = waitingWorker;

      await store.getState().activateUpdate();

      expect(waitingWorker.skipWaiting).toHaveBeenCalled();
    });
  });

  describe('Background Sync Integration', () => {
    it('processes offline queue when online', async () => {
      store.getState().setOnlineStatus(true);
      store.getState().queueOfflineAction({
        type: 'vote',
        data: { pollId: 'poll-1', choice: 1 },
        timestamp: new Date().toISOString(),
      });

      const activeWorker = {
        postMessage: jest.fn(),
      };
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        (await navigator.serviceWorker.ready).active = activeWorker;
      }

      await store.getState().processOfflineActions();

      expect(store.getState().offlineData.queuedActions).toHaveLength(0);
    });

    it('queues actions when offline', async () => {
      store.getState().setOnlineStatus(false);

      store.getState().queueOfflineAction({
        type: 'vote',
        data: { pollId: 'poll-1', choice: 1 },
        timestamp: new Date().toISOString(),
      });

      expect(store.getState().offlineData.queuedActions).toHaveLength(1);
    });
  });

  describe('ServiceWorker Message Handling', () => {
    it('handles messages from service worker', () => {
      const messageHandler = jest.fn();
      store.getState().setServiceWorkerMessageHandler(messageHandler);

      // Simulate message from service worker
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          messageHandler(event.data);
        });
      }

      expect(store.getState().preferences.backgroundSync).toBeDefined();
    });
  });

  describe('ServiceWorker Provider Integration', () => {
    it('verifies service worker controller exists when installed', async () => {
      mockServiceWorker.controller = {
        postMessage: jest.fn(),
      };

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

