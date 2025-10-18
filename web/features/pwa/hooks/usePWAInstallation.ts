/**
 * PWA Installation Hook
 * 
 * Provides PWA installation functionality and status.
 * This hook wraps the PWA store's installation functionality.
 */

import { usePWAInstallation as usePWAInstallationStore } from '@/lib/stores';
import type { PWAInstallation } from '@/lib/stores/pwaStore';

export function usePWAInstallation(): PWAInstallation {
  return usePWAInstallationStore();
}
