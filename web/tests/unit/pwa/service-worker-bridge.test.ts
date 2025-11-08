/** @jest-environment jsdom */

import { jest } from '@jest/globals';

describe('service worker bridge', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(window.navigator, 'serviceWorker');
  const listeners = new Map<string, (event: MessageEvent) => void>();

  beforeEach(() => {
    jest.resetModules();
    listeners.clear();

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: (type: string, listener: (event: MessageEvent) => void) => {
          listeners.set(type, listener);
        },
        removeEventListener: jest.fn(),
      },
    });
  });

  afterEach(() => {
    if (originalServiceWorker) {
      Object.defineProperty(window.navigator, 'serviceWorker', originalServiceWorker);
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - restoring default behavior
      delete window.navigator.serviceWorker;
    }
  });

  it('updates offline queue size and dispatches analytics events', async () => {
    const [{ usePWAStore }, { initializeServiceWorkerBridge }] = await Promise.all([
      import('@/lib/stores/pwaStore'),
      import('@/features/pwa/lib/service-worker-bridge'),
    ]);

    usePWAStore.setState({
      offlineQueueSize: 0,
      offlineQueueUpdatedAt: null,
    });

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    initializeServiceWorkerBridge();

    const handler = listeners.get('message');
    expect(handler).toBeDefined();

    handler?.({
      data: {
        type: 'OFFLINE_QUEUE_UPDATED',
        size: 5,
        updatedAt: '2025-11-08T12:00:00.000Z',
      },
    } as MessageEvent);

    const state = usePWAStore.getState();
    expect(state.offlineQueueSize).toBe(5);
    expect(state.offlineQueueUpdatedAt).toBe('2025-11-08T12:00:00.000Z');

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'pwa-analytics',
      detail: expect.objectContaining({
        eventName: 'offline-queue-updated',
        properties: expect.objectContaining({ size: 5 }),
      }),
    }));

    dispatchSpy.mockRestore();
  });

  it('relays cache analytics events', async () => {
    const [{ initializeServiceWorkerBridge }] = await Promise.all([
      import('@/features/pwa/lib/service-worker-bridge'),
    ]);

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    initializeServiceWorkerBridge();

    const handler = listeners.get('message');
    handler?.({ data: { type: 'CACHE_HIT', cacheName: 'choices-pwa-cache' } } as MessageEvent);

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'pwa-analytics',
      detail: expect.objectContaining({
        eventName: 'cache-hit',
        properties: expect.objectContaining({ cacheName: 'choices-pwa-cache' }),
      }),
    }));

    dispatchSpy.mockRestore();
  });
});
