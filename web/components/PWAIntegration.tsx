'use client'

import React, { useEffect } from 'react';

import PWAInstaller from '@/features/pwa/components/PWAInstaller';
import { usePWAStore } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/logger';

/**
 * PWA Integration Component
 * 
 * This component handles all PWA functionality including:
 * - Service worker registration (via ServiceWorkerProvider in layout)
 * - Installation prompts
 * - Offline status indicators  
 * - Background sync
 * - Push notifications
 * 
 * Note: Service worker registration now handled by ServiceWorkerProvider in layout.tsx
 */
export default function PWAIntegration() {
  const { installation, offline, preferences } = usePWAStore();
  
  const isSupported = 'serviceWorker' in navigator;
  const isEnabled = preferences.installPrompt;
  const hasOfflineData = offline.offlineData.queuedActions.length > 0;
  const notificationsEnabled = preferences.pushNotifications && Notification.permission === 'granted';

  useEffect(() => {
    // Log PWA status for debugging
    if (isEnabled) {
      logger.info('PWA: Integration initialized', {
        isSupported,
        isEnabled,
        isInstalled: installation.isInstalled,
        canInstall: installation.canInstall,
        isOnline: offline.isOnline,
        hasOfflineData,
        notificationsEnabled
      });
    }
  }, [isEnabled, isSupported, installation.isInstalled, installation.canInstall, offline.isOnline, hasOfflineData, notificationsEnabled]);

  // Don't render anything if PWA is not enabled or supported
  if (!isEnabled || !isSupported) {
    return null;
  }

  return (
    <>
      {/* PWA Installer Component */}
      <PWAInstaller />
      
      {/* 
        Note: The following UI elements are now handled by ServiceWorkerProvider in layout.tsx:
        - Service Worker Update Notification (update banner)
        - Offline Indicator (yellow banner at top)
        - Sync Status (automatically syncs when online)
        
        This prevents duplicate UI and centralizes PWA UI management.
      */}
    </>
  );
}
