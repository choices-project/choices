'use client'

import { useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { logger } from '@/lib/logger';
import PWAInstaller from '@/features/pwa/components/PWAInstaller';

/**
 * PWA Integration Component
 * 
 * This component handles all PWA functionality including:
 * - Service worker registration
 * - Installation prompts
 * - Offline status indicators
 * - Background sync
 * - Push notifications
 */
export default function PWAIntegration() {
  const pwa = usePWA();

  useEffect(() => {
    // Log PWA status for debugging
    if (pwa.isEnabled) {
      logger.info('PWA: Integration initialized', {
        isSupported: pwa.isSupported,
        isEnabled: pwa.isEnabled,
        isInstalled: pwa.installation.isInstalled,
        isInstallable: pwa.installation.isInstallable,
        isOnline: pwa.isOnline,
        hasOfflineData: pwa.hasOfflineData,
        notificationsEnabled: pwa.notificationsEnabled
      });
    }
  }, [pwa]);

  // Don't render anything if PWA is not enabled or supported
  if (!pwa.isEnabled || !pwa.isSupported) {
    return null;
  }

  return (
    <>
      {/* PWA Installer Component */}
      <PWAInstaller />
      
      {/* Service Worker Update Notification */}
      {pwa.serviceWorker.isWaiting && (
        <div className="fixed top-4 left-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Update Available</h3>
                <p className="text-sm text-blue-700">A new version of Choices is available</p>
              </div>
            </div>
            <button
              onClick={() => pwa.skipWaiting()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!pwa.isOnline && (
        <div className="fixed bottom-4 left-4 bg-orange-100 border border-orange-200 rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
            <span className="text-sm font-medium text-orange-800">
              You&apos;re offline
            </span>
          </div>
        </div>
      )}

      {/* Sync Status Indicator */}
      {pwa.hasOfflineData && pwa.isOnline && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              Syncing data...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
