/**
 * PWA Offline Hook
 * 
 * Provides PWA offline functionality and status.
 * This hook wraps the PWA store's offline functionality.
 */

import { usePWAOffline as usePWAOfflineStore } from '@/lib/stores';

export function useOffline() {
  return usePWAOfflineStore();
}
