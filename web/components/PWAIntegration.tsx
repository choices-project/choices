'use client'

import React, { useEffect } from 'react';

import PWAInstaller from '@/features/pwa/components/PWAInstaller';
import { usePWAInstallation, usePWAOffline, usePWAPreferences } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/utils/logger';

/**
 * @fileoverview PWA Integration Component
 * 
 * Lightweight integration wrapper for PWA installer.
 * Delegates actual UI rendering to PWAInstaller component.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

/**
 * PWA Integration Component
 * 
 * Integration wrapper that:
 * - Renders PWA installer when conditions are met
 * - Checks PWA preferences and support
 * - Logs initialization for debugging
 * 
 * Note: Service worker registration, update notifications, and offline
 * indicators are now handled by ServiceWorkerProvider in layout.tsx
 * to prevent duplicate UI elements.
 * 
 * @returns PWAInstaller component or null if PWA not enabled/supported
 */
export default function PWAIntegration() {
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const preferences = usePWAPreferences();
  
  const isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  const hasNotificationApi = typeof Notification !== 'undefined';
  const isEnabled = preferences.installPrompt;
  const hasOfflineData = offline.offlineData.queuedActions.length > 0;
  const notificationsEnabled = preferences.pushNotifications && hasNotificationApi && Notification.permission === 'granted';

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
