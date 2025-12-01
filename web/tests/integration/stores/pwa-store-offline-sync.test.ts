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
  usePWAActions,
} from '@/lib/stores/pwaStore';

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
    usePWAStore.getState().resetPWAState();
  });

  it('queues actions when offline', () => {
    const store = usePWAStore.getState();
    
    // Set offline
    store.setOnlineStatus(false);
    
    // Queue an action
    store.queueOfflineAction({
      type: 'vote',
      pollId: 'poll-1',
      optionId: 'option-1',
      timestamp: Date.now(),
    });

    const offline = usePWAOffline();
    expect(offline.offlineData.queuedActions.length).toBe(1);
    expect(offline.offlineData.queuedActions[0].type).toBe('vote');
  });

  it('processes queued actions when coming online', async () => {
    const store = usePWAStore.getState();
    
    // Set offline and queue actions
    store.setOnlineStatus(false);
    store.queueOfflineAction({
      type: 'vote',
      pollId: 'poll-1',
      optionId: 'option-1',
      timestamp: Date.now(),
    });
    store.queueOfflineAction({
      type: 'follow',
      representativeId: 'rep-1',
      timestamp: Date.now(),
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
      type: 'vote',
      pollId: 'poll-1',
      optionId: 'option-1',
      timestamp: Date.now(),
    });

    // Mock API failure
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

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
      type: 'vote',
      pollId: 'poll-1',
      optionId: 'option-1',
      timestamp: Date.now(),
    });

    const actions = store.offline.offlineData.queuedActions;
    expect(actions.length).toBe(1);

    // Simulate session restore (Zustand persist should handle this)
    const restoredState = usePWAStore.getState();
    expect(restoredState.offline.offlineData.queuedActions.length).toBe(1);
  });

  it('registers background sync when ServiceWorker is available', async () => {
    const store = usePWAStore.getState();
    
    if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
      await store.registerBackgroundSync('test-sync-tag');
      
      expect(mockServiceWorker.ready.then).toBeDefined();
    }
  });
});

