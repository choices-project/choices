/**
 * Service Worker Bridge
 *
 * Listens for messages from the service worker and updates local state
 * (Zustand) while relaying analytics events to the existing analytics
 * infrastructure.
 */

import { usePWAStore } from '@/lib/stores/pwaStore';
import { isPWAServiceWorkerMessage, PWA_SERVICE_WORKER_MESSAGE_TYPES } from '@/types/pwa';

let bridgeInitialized = false;

export const initializeServiceWorkerBridge = () => {
  if (bridgeInitialized) return;
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    if (!isPWAServiceWorkerMessage(data)) {
      return;
    }

    switch (data.type) {
      case PWA_SERVICE_WORKER_MESSAGE_TYPES.OFFLINE_QUEUE_UPDATED: {
        const size = data.size;
        const updatedAt = data.updatedAt;
        usePWAStore.getState().setOfflineQueueSize(size, updatedAt);

        window.dispatchEvent(
          new CustomEvent('pwa-analytics', {
            detail: {
              eventName: 'offline-queue-updated',
              properties: {
                size,
                updatedAt,
              },
            },
          })
        );
        break;
      }
      case PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_HIT:
      case PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_MISS: {
        window.dispatchEvent(
          new CustomEvent('pwa-analytics', {
            detail: {
              eventName: data.type === PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_HIT ? 'cache-hit' : 'cache-miss',
              properties: data,
            },
          })
        );
        break;
      }
      default:
        break;
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);
  bridgeInitialized = true;
};
