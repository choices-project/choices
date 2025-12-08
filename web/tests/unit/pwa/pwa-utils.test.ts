/** @jest-environment jsdom */

import { jest } from '@jest/globals';

import { queueAction, QueuedActionTypes } from '@/features/pwa/lib/background-sync';
import { PWAManager } from '@/features/pwa/lib/pwa-utils';
import { isPWAServiceWorkerMessage, PWA_SERVICE_WORKER_MESSAGE_TYPES } from '@/types/pwa';

const mockSetOfflineQueueSize = jest.fn();

jest.mock('@/lib/stores/pwaStore', () => ({
  getPWAActions: () => ({
    setOfflineQueueSize: mockSetOfflineQueueSize,
  }),
}));

describe('PWA client utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    mockSetOfflineQueueSize.mockClear();
  });

  describe('PWAManager.storeOfflineVote', () => {
    it('persists vote records with metadata and timestamp', async () => {
      const manager = new PWAManager();

      await manager.storeOfflineVote({
        pollId: 'poll-123',
        choice: 1,
        metadata: { source: 'unit-test' },
      });

      const stored = JSON.parse(localStorage.getItem('offline_votes') ?? '[]');

      expect(stored).toHaveLength(1);
      expect(stored[0].pollId).toBe('poll-123');
      expect(stored[0].choice).toBe(1);
      expect(stored[0].metadata).toEqual({ source: 'unit-test' });
      expect(typeof stored[0].timestamp).toBe('number');
    });
  });

  describe('queueAction', () => {
    // The registration spy is intentionally a no-op; we only assert invocation
    const registerSpy = jest.fn(async (_tag: string) => undefined);
    let originalServiceWorkerRegistration: unknown;

    beforeEach(() => {
      registerSpy.mockClear();
      originalServiceWorkerRegistration = (globalThis as unknown as { ServiceWorkerRegistration?: unknown }).ServiceWorkerRegistration;

      const MockServiceWorkerRegistration: any = function MockServiceWorkerRegistration() {
        // Intentionally empty constructor for test double
      };
      MockServiceWorkerRegistration.prototype.sync = {};

      Object.defineProperty(globalThis, 'ServiceWorkerRegistration', {
        configurable: true,
        writable: true,
        value: MockServiceWorkerRegistration,
      });

      Object.defineProperty(window.navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({
            sync: {
              register: registerSpy,
            },
          }),
        },
      });
    });

    afterEach(() => {
      delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;

      if (originalServiceWorkerRegistration === undefined) {
        delete (globalThis as { ServiceWorkerRegistration?: unknown }).ServiceWorkerRegistration;
      } else {
        Object.defineProperty(globalThis, 'ServiceWorkerRegistration', {
          configurable: true,
          writable: true,
          value: originalServiceWorkerRegistration,
        });
      }
    });

    it('queues typed actions and registers background sync', async () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

      const actionId = await queueAction(QueuedActionTypes.VOTE, '/api/polls/123/vote', 'POST', {
        ballotId: 'ballot-1',
      });

      expect(actionId).toMatch(/^action_/);
      expect(registerSpy).toHaveBeenCalledWith('sync-votes');

      const stored = JSON.parse(localStorage.getItem('pwa-offline-queue') ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        type: QueuedActionTypes.VOTE,
        endpoint: '/api/polls/123/vote',
        method: 'POST',
        payload: { ballotId: 'ballot-1' },
      });
      expect(typeof stored[0].timestamp).toBe('number');

      expect(mockSetOfflineQueueSize).toHaveBeenCalledWith(1, expect.any(String));

      const analyticsEvent = dispatchSpy.mock.calls
        .map((call) => call[0])
        .find((event): event is CustomEvent =>
          event instanceof CustomEvent && event.type === 'pwa-analytics'
        );

      expect(analyticsEvent).toBeInstanceOf(CustomEvent);
      expect(analyticsEvent?.detail).toMatchObject({
        eventName: 'offline-queue-updated',
        properties: expect.objectContaining({ size: 1 }),
      });

      dispatchSpy.mockRestore();
    });
  });

  describe('isPWAServiceWorkerMessage', () => {
    it('accepts valid offline queue update messages', () => {
      const message = {
        type: PWA_SERVICE_WORKER_MESSAGE_TYPES.OFFLINE_QUEUE_UPDATED,
        size: 5,
        updatedAt: new Date().toISOString(),
      };

      expect(isPWAServiceWorkerMessage(message)).toBe(true);
    });

    it('accepts valid cache analytics messages', () => {
      const message = {
        type: PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_HIT,
        cache: 'choices-pwa-v1.0.0-static',
        url: 'https://choices.dev/',
        strategy: 'cache-first',
      };

      expect(isPWAServiceWorkerMessage(message)).toBe(true);
    });

    it('rejects malformed messages', () => {
      expect(isPWAServiceWorkerMessage({})).toBe(false);
      expect(
        isPWAServiceWorkerMessage({
          type: PWA_SERVICE_WORKER_MESSAGE_TYPES.OFFLINE_QUEUE_UPDATED,
          updatedAt: 'missing-size',
        })
      ).toBe(false);
      expect(
        isPWAServiceWorkerMessage({
          type: PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_HIT,
          cache: 123,
        })
      ).toBe(false);
    });
  });
});


