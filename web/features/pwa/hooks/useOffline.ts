/**
 * PWA Offline Hook
 * 
 * Provides PWA offline functionality and status.
 * This hook wraps the PWA store's offline functionality.
 */

import { usePWAOffline as usePWAOfflineStore } from '@/lib/stores/pwaStore';
import type { PWAOffline } from '@/lib/stores/pwaStore';

export function useOffline(): PWAOffline {
  return usePWAOfflineStore();
}
