/**
 * @fileoverview Background Sync Client Library
 *
 * Manages offline action queueing and background synchronization.
 * Actions performed offline are queued and synced when connectivity is restored.
 *
 * @author Choices Platform Team
 */

import { PWA_QUEUED_REQUEST_TYPES } from '@/types/pwa';

import { getPWAActions } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/utils/logger';

import { BACKGROUND_SYNC_CONFIG, OFFLINE_QUEUE_CONFIG } from './sw-config';

import type { PWAHttpMethod, PWAQueuedRequest, PWAQueuedRequestType } from '@/types/pwa';


const QUEUE_DB_NAME = 'choices-pwa-offline-queue';
const QUEUE_DB_VERSION = 1;
const QUEUE_DB_STORE = 'actions';

type SyncManager = {
  register(tag: string): Promise<void>;
  getTags?: () => Promise<string[]>;
};

export const QueuedActionTypes = PWA_QUEUED_REQUEST_TYPES;
export type QueuedActionType = PWAQueuedRequestType;

export type HttpMethod = PWAHttpMethod;

export type QueuedAction<TPayload extends Record<string, unknown> = Record<string, unknown>> = PWAQueuedRequest<TPayload>;

/**
 * Sync result
 */
export type SyncResult = {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ actionId: string; error: string }>;
}

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: SyncManager;
  periodicSync?: {
    register(tag: string, options: { minInterval: number }): Promise<void>;
  };
};

const isQueuedAction = (value: unknown): value is QueuedAction => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.type === 'string' &&
    typeof record.endpoint === 'string' &&
    typeof record.method === 'string' &&
    typeof record.timestamp === 'number' &&
    typeof record.attempts === 'number' &&
    typeof record.maxAttempts === 'number'
  );
};

/**
 * Check if Background Sync API is supported
 *
 * @returns {boolean} True if supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator &&
         'sync' in ServiceWorkerRegistration.prototype;
}

/**
 * Check if Periodic Background Sync is supported
 *
 * @returns {boolean} True if supported
 */
export function isPeriodicBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator &&
         'periodicSync' in ServiceWorkerRegistration.prototype;
}

/**
 * Queue an offline action for later synchronization
 *
 * @param {QueuedActionType} type - Type of action
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param payload - Action payload
 * @returns {Promise<string>} Action ID
 *
 * @example
 * ```typescript
 * // User votes while offline
 * const actionId = await queueAction(
 *   QueuedActionTypes.VOTE,
 *   '/api/polls/123/vote',
 *   'POST',
 *   { optionIds: ['opt_1'] }
 * );
 * ```
 */
export async function queueAction<TPayload extends Record<string, unknown> = Record<string, unknown>>(
  type: QueuedActionType,
  endpoint: string,
  method: HttpMethod,
  payload?: TPayload
): Promise<string> {
  const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (typeof window === 'undefined') {
    logger.warn('PWA: queueAction called outside browser environment; skipping persistence', {
      actionId,
      type,
    });
    return actionId;
  }

  const action: QueuedAction<TPayload> = {
    id: actionId,
    type,
    payload: payload ?? null,
    endpoint,
    method,
    timestamp: Date.now(),
    attempts: 0,
    maxAttempts: BACKGROUND_SYNC_CONFIG.retry.maxAttempts,
  };

  try {
    // Get current queue
    const queue = await getActionQueue();

    // Check queue size limit
    if (queue.length >= OFFLINE_QUEUE_CONFIG.maxQueueSize) {
      logger.warn('PWA: Offline queue full, removing oldest action');
      queue.shift();
    }

    // Add to queue
    queue.push(action);

    // Store queue
    await saveActionQueue(queue);
    notifyQueueSize(queue.length);

    logger.info(`PWA: Queued ${type} action ${actionId} for sync`);

    // Register for background sync
    await registerBackgroundSync(type);

    return actionId;
  } catch (error) {
    logger.error('PWA: Failed to queue action', { error });
    throw error;
  }
}

/**
 * Register background sync with service worker
 *
 * @param {QueuedActionType} type - Action type to sync
 * @returns {Promise<void>}
 */
export async function registerBackgroundSync(type: QueuedActionType): Promise<void> {
  if (!isBackgroundSyncSupported()) {
    logger.warn('Background sync not supported, will sync manually when online');
    return;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableRegistration;

    // Get sync tag for this action type
    const tag = getSyncTag(type);

    // Register sync
    if (registration.sync) {
      await registration.sync.register(tag);
      logger.info(`PWA: Registered background sync for ${type}`);
    } else {
      logger.warn('PWA: Sync manager not available on registration');
    }

  } catch (error) {
    logger.error('PWA: Failed to register background sync', { error });
  }
}

/**
 * Register periodic background sync for data updates
 *
 * @param {string} tag - Sync tag
 * @param {number} minInterval - Minimum interval in milliseconds
 * @returns {Promise<void>}
 */
export async function registerPeriodicSync(tag: string, minInterval: number): Promise<void> {
  if (!isPeriodicBackgroundSyncSupported()) {
    logger.warn('Periodic background sync not supported');
    return;
  }

  try {
    const registration = (await navigator.serviceWorker.ready) as SyncCapableRegistration;

    if (registration.periodicSync) {
      await registration.periodicSync.register(tag, {
        minInterval,
      });

      logger.info(`PWA: Registered periodic sync ${tag} with interval ${minInterval}ms`);
    } else {
      logger.warn('PWA: Periodic sync manager not available on registration');
    }
  } catch (error) {
    logger.error('PWA: Failed to register periodic sync', { error });
  }
}

/**
 * Manually trigger sync of offline queue
 * Call this when connection is restored
 *
 * @returns {Promise<SyncResult>} Sync result
 *
 * @example
 * ```typescript
 * window.addEventListener('online', async () => {
 *   const result = await syncOfflineQueue();
 *   logger.info(`Synced ${result.succeeded} actions`);
 * });
 * ```
 */
export async function syncOfflineQueue(): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    const queue = await getActionQueue();

    if (queue.length === 0) {
      logger.info('PWA: No queued actions to sync');
      result.success = true;
      return result;
    }

    logger.info(`PWA: Syncing ${queue.length} queued actions`);

    const updatedQueue: QueuedAction[] = [];

    for (const action of queue) {
      result.processed++;

      // Check if action is too old
      if (Date.now() - action.timestamp > OFFLINE_QUEUE_CONFIG.maxAge) {
        logger.warn(`PWA: Action ${action.id} expired, discarding`);
        result.failed++;
        result.errors.push({ actionId: action.id, error: 'Action expired' });
        continue;
      }

      // Attempt to sync action
      const syncSuccess = await syncAction(action);

      if (syncSuccess) {
        result.succeeded++;
        logger.info(`PWA: Successfully synced action ${action.id}`);
      } else {
        action.attempts++;

        if (action.attempts < action.maxAttempts) {
          // Keep in queue for retry
          updatedQueue.push(action);
          logger.warn(`PWA: Action ${action.id} failed, will retry (attempt ${action.attempts}/${action.maxAttempts})`);
        } else {
          // Max attempts reached, discard
          result.failed++;
          result.errors.push({
            actionId: action.id,
            error: action.lastError || 'Max retry attempts reached'
          });
          logger.error(`PWA: Action ${action.id} failed permanently after ${action.attempts} attempts`);
        }
      }
    }

    // Save updated queue
    await saveActionQueue(updatedQueue);
    notifyQueueSize(updatedQueue.length);

    result.success = true;

    logger.info(`PWA: Sync complete: ${result.succeeded} succeeded, ${result.failed} failed, ${updatedQueue.length} remaining`);

    return result;
  } catch (error) {
    logger.error('PWA: Failed to sync offline queue', { error });
    return result;
  }
}

/**
 * Sync individual action to backend
 *
 * @param {QueuedAction} action - Action to sync
 * @returns {Promise<boolean>} True if synced successfully
 */
async function syncAction(action: QueuedAction): Promise<boolean> {
  try {
    const fetchOptions: RequestInit = {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Action': 'true',  // Header to identify offline actions
        'X-Action-Timestamp': action.timestamp.toString(),
      }
    };
    if (action.payload) {
      fetchOptions.body = JSON.stringify(action.payload);
    }
    const response = await fetch(action.endpoint, fetchOptions);

    if (!response.ok) {
      action.lastError = `HTTP ${response.status}: ${response.statusText}`;
      return false;
    }

    return true;
  } catch (error) {
    action.lastError = error instanceof Error ? error.message : 'Network error';
    logger.error(`PWA: Failed to sync action ${action.id}`, { error });
    return false;
  }
}

/**
 * Get current offline action queue
 *
 * @returns {Promise<QueuedAction[]>} Array of queued actions
 */
export async function getActionQueue(): Promise<QueuedAction[]> {
  const [idbQueue, localQueue] = await Promise.all([
    readQueueFromIDB(),
    Promise.resolve(readQueueFromLocalStorage()),
  ]);

  const merged = new Map<string, QueuedAction>();
  for (const action of [...idbQueue, ...localQueue]) {
    if (isQueuedAction(action)) {
      merged.set(action.id, action);
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Save offline action queue
 *
 * @param {QueuedAction[]} queue - Queue to save
 * @returns {Promise<void>}
 */
async function saveActionQueue(queue: QueuedAction[]): Promise<void> {
  await writeQueueToIDB(queue);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(OFFLINE_QUEUE_CONFIG.storageKey, JSON.stringify(queue));
    } catch (error) {
      logger.error('PWA: Failed to save action queue to localStorage', { error });
    }
  }
}

/**
 * Get sync tag for action type
 *
 * @param {QueuedActionType} type - Action type
 * @returns {string} Sync tag
 */
function getSyncTag(type: QueuedActionType): string {
  switch (type) {
    case QueuedActionTypes.VOTE:
      return BACKGROUND_SYNC_CONFIG.tags.votes;
    case QueuedActionTypes.CIVIC_ACTION:
      return BACKGROUND_SYNC_CONFIG.tags.civicActions;
    case QueuedActionTypes.CONTACT:
      return BACKGROUND_SYNC_CONFIG.tags.contacts;
    case QueuedActionTypes.PROFILE_UPDATE:
      return BACKGROUND_SYNC_CONFIG.tags.profile;
    default:
      return 'sync-default';
  }
}

/**
 * Clear all queued actions
 * Useful for testing or after successful manual sync
 *
 * @returns {Promise<number>} Number of actions cleared
 */
export async function clearActionQueue(): Promise<number> {
  const queue = await getActionQueue();
  const count = queue.length;

  await saveActionQueue([]);
  notifyQueueSize(0);

  logger.info(`PWA: Cleared ${count} queued actions`);

  return count;
}

/**
 * Get queue statistics
 *
 * @returns {Promise<object>} Queue stats
 */
export async function getQueueStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
}> {
  const queue = await getActionQueue();

  const stats = {
    total: queue.length,
    byType: {} as Record<string, number>,
    oldestTimestamp: null as number | null,
    newestTimestamp: null as number | null,
  };

  if (queue.length === 0) return stats;

  // Count by type
  queue.forEach(action => {
    stats.byType[action.type] = (stats.byType[action.type] || 0) + 1;
  });

  // Find oldest and newest
  const timestamps = queue.map(a => a.timestamp);
  stats.oldestTimestamp = Math.min(...timestamps);
  stats.newestTimestamp = Math.max(...timestamps);

  return stats;
}

function readQueueFromLocalStorage(): QueuedAction[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(OFFLINE_QUEUE_CONFIG.storageKey);
    if (!stored) return [];

    const queue = JSON.parse(stored);
    if (!Array.isArray(queue)) {
      return [];
    }

    return queue.filter(isQueuedAction);
  } catch (error) {
    logger.error('PWA: Failed to read action queue from localStorage', { error });
    return [];
  }
}

async function openQueueDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(QUEUE_DB_NAME, QUEUE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_DB_STORE)) {
        db.createObjectStore(QUEUE_DB_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readQueueFromIDB(): Promise<QueuedAction[]> {
  const db = await openQueueDB();
  if (!db) {
    return [];
  }

  return new Promise((resolve) => {
    const transaction = db.transaction(QUEUE_DB_STORE, 'readonly');
    const store = transaction.objectStore(QUEUE_DB_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const raw = Array.isArray(request.result) ? request.result : [];
      resolve(raw.filter(isQueuedAction));
    };

    request.onerror = () => resolve([]);

    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {
      db.close();
      resolve([]);
    };
  });
}

async function writeQueueToIDB(queue: QueuedAction[]): Promise<void> {
  const db = await openQueueDB();
  if (!db) {
    return;
  }

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(QUEUE_DB_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_DB_STORE);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      for (const action of queue) {
        store.put(action);
      }
    };

    clearRequest.onerror = () => {
      logger.error('PWA: Failed to clear IDB queue before write');
    };

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onabort = () => {
      logger.error('PWA: Transaction aborted while writing queue to IDB');
      db.close();
      resolve();
    };
  });
}

const notifyQueueSize = (size: number) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pwa-analytics', {
        detail: {
          eventName: 'offline-queue-updated',
          properties: {
            size,
            updatedAt: new Date().toISOString(),
          },
        },
      })
    );
  }

  try {
    getPWAActions().setOfflineQueueSize(size, new Date().toISOString());
  } catch {
    // Store may not be initialized in certain environments (e.g., tests)
  }
};

