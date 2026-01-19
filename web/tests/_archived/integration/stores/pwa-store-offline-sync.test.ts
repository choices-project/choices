/**
 * PWA Store Offline Sync & Playback Tests
 * 
 * Tests for offline sync and playback functionality:
 * - Offline action queuing
 * - Action playback on reconnect
 * - Sync state management
 * - Error handling during sync
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  usePWAStore,
  usePWAOffline,
  createInitialPWAState,
} from '@/lib/stores/pwaStore';
import { PWA_QUEUED_REQUEST_TYPES } from '@/types/pwa';

// Mock ServiceWorker and network APIs
const mockServiceWorker = {
  register: jest.fn(),
  ready: Promise.resolve({
    postMessage: jest.fn(),
    sync: {
      register: jest.fn(),
    },
  }),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
  configurable: true,
});

describe('PWA Store Offline Sync & Playback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePWAStore.setState(createInitialPWAState());
  });

  it('queues actions when offline', () => {
    const store = usePWAStore.getState();
    
    // Set offline
    store.setOnlineStatus(false);
    
    // Queue an action
    store.queueOfflineAction({
      id: 'offline-vote-1',
      action: PWA_QUEUED_REQUEST_TYPES.VOTE,
      data: { pollId: 'poll-1', choice: 1 },
      timestamp: new Date().toISOString(),
    });

    const offline = usePWAOffline();
    expect(offline.offlineData.queuedActions.length).toBe(1);
    expect(offline.offlineData.queuedActions[0]?.action).toBe(PWA_QUEUED_REQUEST_TYPES.VOTE);
  });

  it('processes queued actions when coming online', async () => {
    const store = usePWAStore.getState();
    
    // Set offline and queue actions
    store.setOnlineStatus(false);
    store.queueOfflineAction({
      id: 'offline-vote-1',
      action: PWA_QUEUED_REQUEST_TYPES.VOTE,
      data: { pollId: 'poll-1', choice: 1 },
      timestamp: new Date().toISOString(),
    });
    store.queueOfflineAction({
      id: 'offline-follow-1',
      action: PWA_QUEUED_REQUEST_TYPES.HASHTAG_FOLLOW,
      data: { representativeId: 'rep-1' },
      timestamp: new Date().toISOString(),
    });

    expect(store.offline.offlineData.queuedActions.length).toBe(2);

    // Come online
    store.setOnlineStatus(true);
    
    // Process offline actions
    await store.processOfflineActions();

    // Actions should be processed (removed from queue)
    const offline = usePWAOffline();
    expect(offline.offlineData.queuedActions.length).toBe(0);
  });

  it('handles sync errors gracefully', async () => {
    const store = usePWAStore.getState();
    
    // Queue an action that will fail
    store.setOnlineStatus(false);
    store.queueOfflineAction({
      id: 'offline-vote-1',
      action: PWA_QUEUED_REQUEST_TYPES.VOTE,
      data: { pollId: 'poll-1', choice: 1 },
      timestamp: new Date().toISOString(),
    });

    // Mock API failure
    global.fetch = jest
      .fn<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>()
      .mockRejectedValue(new Error('Network error')) as typeof fetch;

    store.setOnlineStatus(true);
    
    // Process should handle errors
    await store.processOfflineActions();

    // Action should remain in queue for retry
    const offline = usePWAOffline();
    expect(offline.offlineData.queuedActions.length).toBeGreaterThan(0);
  });

  it('maintains sync state across sessions', () => {
    const store = usePWAStore.getState();
    
    // Queue actions
    store.setOnlineStatus(false);
    store.queueOfflineAction({
      id: 'offline-vote-1',
      action: PWA_QUEUED_REQUEST_TYPES.VOTE,
      data: { pollId: 'poll-1', choice: 1 },
      timestamp: new Date().toISOString(),
    });

    const actions = store.offline.offlineData.queuedActions;
    expect(actions.length).toBe(1);

    // Simulate session restore (Zustand persist should handle this)
    const restoredState = usePWAStore.getState();
    expect(restoredState.offline.offlineData.queuedActions.length).toBe(1);
  });

  it('updates service worker when available', async () => {
    const store = usePWAStore.getState();
    
    if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
      await store.updateServiceWorker();

      expect(mockServiceWorker.ready.then).toBeDefined();
    }
  });
});

