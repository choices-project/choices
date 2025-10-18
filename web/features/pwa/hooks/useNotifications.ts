/**
 * PWA Notifications Hook
 * 
 * Provides PWA notification functionality and status.
 * This hook wraps the PWA store's notification functionality.
 */

import { usePWANotifications as usePWANotificationsStore } from '@/lib/stores';
import type { PWANotification } from '@/lib/stores/pwaStore';

export function useNotifications(): PWANotification[] {
  return usePWANotificationsStore();
}
