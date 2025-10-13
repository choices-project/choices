/**
 * PWA Notifications Hook
 * 
 * Provides PWA notification functionality and status.
 * This hook wraps the PWA store's notification functionality.
 */

import { usePWANotifications as usePWANotificationsStore } from '@/lib/stores';

export function useNotifications() {
  return usePWANotificationsStore();
}
