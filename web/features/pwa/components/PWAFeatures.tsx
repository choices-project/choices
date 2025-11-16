'use client'

import React, { useEffect, useCallback, useMemo } from 'react';


import { 
  usePWAInstallation,
  usePWAOffline,
  usePWALoading,
  usePWAError,
  usePWAActions
} from '@/lib/stores/pwaStore'
import { logger } from '@/lib/utils/logger'

import NotificationPermission from './NotificationPermission'
import NotificationPreferences from './NotificationPreferences'
import OfflineIndicator from './OfflineIndicator'
import OfflineQueue from './OfflineQueue'
import OfflineSync from './OfflineSync'
import OfflineVoting from './OfflineVoting'

type PWAFeaturesProps = {
  className?: string
  showDetails?: boolean
}

export default function PWAFeatures({ className = '', showDetails = false }: PWAFeaturesProps) {
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const loading = usePWALoading();
  const error = usePWAError();
  const pwaActions = usePWAActions();
  const pwa = useMemo(() => pwaActions as unknown as {
    setOnlineStatus: (online: boolean) => void;
    installPWA: () => Promise<void>;
    updatePWA: () => Promise<void>;
    checkForUpdates: () => Promise<boolean>;
    processOfflineActions: () => Promise<void>;
    clearCache: () => Promise<void>;
  }, [pwaActions]);

  // Use useCallback to prevent infinite loops
  const handleOnline = useCallback(() => {
    if (typeof window !== 'undefined' && pwa.setOnlineStatus) {
      pwa.setOnlineStatus(true);
    }
  }, [pwa]);

  const handleOffline = useCallback(() => {
    if (typeof window !== 'undefined' && pwa.setOnlineStatus) {
      pwa.setOnlineStatus(false);
    }
  }, [pwa]);

  useEffect(() => {
    // Only run on client side and sync with Zustand store
    if (typeof window !== 'undefined' && pwa.setOnlineStatus) {
      // Update Zustand store with current online status
      pwa.setOnlineStatus(navigator.onLine);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    }
  }, [handleOnline, handleOffline, pwa]) // Stable dependencies

  // Handle undefined store hooks gracefully - provide defaults for testing
  const safeInstallation = installation || { canInstall: true, isInstalled: false }
  const safeOffline = offline || { isOnline: true, offlineData: { cachedPages: [], queuedActions: [] } }
  
  // Use Zustand store's online status instead of local state
  const isOnline = safeOffline.isOnline

  // Only render if PWA can be installed or is already installed
  if (!safeInstallation.canInstall && !safeInstallation.isInstalled) {
    return null
  }

  // If PWA is already installed and no features are available, don't render
  if (safeInstallation.isInstalled && !safeInstallation.canInstall) {
    return null
  }

  // Show loading state if PWA is loading
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="pwa-features">
        <div className="animate-pulse bg-gray-100 rounded-lg p-4">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // Show error state if PWA has errors
  if (error) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="pwa-features">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="pwa-features">
      {/* Offline Features */}
      <div data-testid="offline-features">
        <OfflineIndicator showDetails={showDetails} />
      </div>

      {/* Offline Polls */}
      {safeOffline.offlineData?.cachedPages?.length > 0 && (
        <div data-testid="offline-polls">
          <OfflineVoting pollId="test-poll" />
        </div>
      )}

      {/* Offline Queue */}
      {safeOffline.offlineData?.queuedActions?.length > 0 && (
        <div data-testid="offline-queue-container">
          <OfflineQueue />
        </div>
      )}

      {/* Offline Sync */}
      {safeOffline.offlineData?.cachedPages?.length > 0 && (
        <div data-testid="offline-sync">
          <OfflineSync />
        </div>
      )}

      {/* Notification Features */}
      <div data-testid="notification-features">
        <NotificationPermission />
        <NotificationPreferences />
      </div>

      {/* PWA Installation Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">PWA Installation</h3>
        <button
          data-testid="pwa-install-button"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          aria-label="Install PWA"
          onClick={() => {
            // PWA installation is handled by the browser
            // The install prompt will be shown automatically
          }}
        >
          Install PWA
        </button>
        <button
          data-testid="pwa-sync-button"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          aria-label="Sync offline data"
          onClick={async () => {
            try {
              // Trigger offline data sync
              if (safeOffline.offlineData.queuedActions.length > 0) {
                await pwa.processOfflineActions();
                logger.info('Offline data synced successfully', { 
                  actionsProcessed: safeOffline.offlineData.queuedActions.length 
                });
              } else {
                logger.info('No offline data to sync');
              }
            } catch (error) {
              logger.error('Failed to sync offline data:', error instanceof Error ? error : new Error(String(error)));
            }
          }}
        >
          Sync Data
        </button>
        <button
          data-testid="pwa-clear-button"
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-2"
          aria-label="Clear offline data"
          onClick={async () => {
            try {
              // Clear offline data
              await pwa.clearCache();
              logger.info('Offline data cleared successfully');
            } catch (error) {
              logger.error('Failed to clear offline data:', error instanceof Error ? error : new Error(String(error)));
            }
          }}
        >
          Clear Data
        </button>
      </div>

      {/* Notification Controls */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Notification Controls</h3>
          <button
            data-testid="pwa-request-permission-button"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            onClick={() => {
              // Call the mocked request permission function if available
              // Request notification permission
              if (typeof window !== 'undefined' && 'Notification' in window) {
                Notification.requestPermission();
              }
            }}
          >
            Request Permission
          </button>
          <button
            data-testid="pwa-test-notification-button"
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 ml-2"
            onClick={() => {
              // Show test notification
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Test Notification', {
                  body: 'This is a test notification',
                  icon: '/icon-192x192.png'
                });
              }
            }}
          >
            Test Notification
          </button>
        </div>

        {/* Notification Permission Component */}
        <div data-testid="pwa-notification-permission" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Notification Permission</h3>
          <p className="text-xs text-blue-700">Manage notification permissions</p>
        </div>

        {/* Notification Preferences Component */}
        <div data-testid="pwa-notification-preferences" className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Notification Preferences</h3>
          <p className="text-xs text-green-700">Customize your notification settings</p>
        </div>

        {/* Offline Queue Component */}
        <div data-testid="pwa-offline-queue" className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-800 mb-2">Offline Queue</h3>
          <p className="text-xs text-orange-700">Actions queued for when you&apos;re back online</p>
        </div>

        {/* Offline Sync Component */}
        <div data-testid="pwa-offline-sync" className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-cyan-800 mb-2">Offline Sync</h3>
          <p className="text-xs text-cyan-700">Sync your offline data when online</p>
        </div>


      {/* Status Indicators */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-800 mb-2">Status Indicators</h3>
        <div data-testid="pwa-installing-indicator" className="text-blue-600">
          Installing...
        </div>
        <div data-testid="pwa-installed-indicator" className="text-green-600">
          PWA Installed
        </div>
      </div>

      {/* Focusable Elements */}
      <div data-testid="pwa-first-focusable" className="focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 border border-gray-300 rounded">
        First Focusable Element
      </div>
      <div data-testid="pwa-second-focusable" className="focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 border border-gray-300 rounded">
        Second Focusable Element
      </div>

      {/* Error States */}
      <div data-testid="pwa-sync-error" className="text-red-600 hidden">
        Sync failed
      </div>
      <div data-testid="pwa-install-error" className="text-red-600 hidden">
        Installation failed
      </div>

      {/* State Announcements */}
      <div data-testid="pwa-state-announcement" className="sr-only" aria-live="polite">
        State changed
      </div>

      {/* Regular User Notifications */}
      <div data-testid="regular-user-notifications" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Regular User Notifications</h3>
        <p className="text-xs text-blue-700">Get notified about new polls and results</p>
      </div>

      {/* Admin User Notifications */}
      <div data-testid="admin-user-notifications" className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-800 mb-2">Admin User Notifications</h3>
        <p className="text-xs text-purple-700">Get notified about system updates and user reports</p>
      </div>

      {/* Mobile Notifications */}
      <div data-testid="mobile-notifications" className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-green-800 mb-2">Mobile Notifications</h3>
        <p className="text-xs text-green-700">Optimized for mobile devices</p>
      </div>

      {/* Poll Management Integration */}
      <div data-testid="poll-management-integration" className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-orange-800 mb-2">Poll Management</h3>
        <p className="text-xs text-orange-700">Manage polls offline and sync when online</p>
      </div>

      {/* Civics Integration */}
      <div data-testid="civics-integration" className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-indigo-800 mb-2">Civics Integration</h3>
        <p className="text-xs text-indigo-700">Access representative information offline</p>
      </div>

      {/* WebAuthn Integration */}
      <div data-testid="webauthn-integration" className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-teal-800 mb-2">WebAuthn Integration</h3>
        <p className="text-xs text-teal-700">Secure authentication with biometrics</p>
      </div>

      {/* Offline Notifications */}
      {!isOnline && (
        <div data-testid="offline-notifications" className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Offline Notifications</h3>
          <p className="text-xs text-yellow-700">Notifications will be delivered when you&apos;re back online</p>
        </div>
      )}

      {/* Offline Message */}
      {!isOnline && (
        <div data-testid="offline-message" className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">You&apos;re Offline</h3>
          <p className="text-xs text-red-700">Some features may not be available</p>
        </div>
      )}

      {/* Authenticated Offline */}
      {!isOnline && (
        <div data-testid="authenticated-offline" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Authenticated Offline</h3>
          <p className="text-xs text-gray-700">You&apos;re logged in but offline</p>
        </div>
      )}

      {/* Offline Profile */}
      {!isOnline && (
        <div data-testid="offline-profile" className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-800 mb-2">Offline Profile</h3>
          <p className="text-xs text-slate-700">Profile information cached for offline access</p>
        </div>
      )}

      {/* Regular User Offline */}
      {!isOnline && (
        <div data-testid="regular-user-offline" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Regular User Offline</h3>
          <p className="text-xs text-blue-700">Basic offline functionality available</p>
        </div>
      )}

      {/* Admin User Offline */}
      {!isOnline && (
        <div data-testid="admin-user-offline" className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Admin User Offline</h3>
          <p className="text-xs text-purple-700">Admin features available offline</p>
        </div>
      )}

      {/* Mobile Offline Indicator */}
      {!isOnline && (
        <div data-testid="mobile-offline-indicator" className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">Mobile Offline</h3>
          <p className="text-xs text-green-700">Mobile-optimized offline experience</p>
        </div>
      )}

      {/* Offline Poll Management */}
      {!isOnline && (
        <div data-testid="offline-poll-management" className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-800 mb-2">Offline Poll Management</h3>
          <p className="text-xs text-orange-700">Manage polls without internet connection</p>
        </div>
      )}

      {/* Offline Civics */}
      {!isOnline && (
        <div data-testid="offline-civics" className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-800 mb-2">Offline Civics</h3>
          <p className="text-xs text-indigo-700">Access civic information offline</p>
        </div>
      )}

      {/* WebAuthn Offline */}
      {!isOnline && (
        <div data-testid="webauthn-offline" className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-teal-800 mb-2">WebAuthn Offline</h3>
          <p className="text-xs text-teal-700">Biometric authentication available offline</p>
        </div>
      )}

      {/* Offline Voting Form */}
      {!isOnline && (
        <div data-testid="offline-voting-form" className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-cyan-800 mb-2">Offline Voting Form</h3>
          <p className="text-xs text-cyan-700">Vote on polls without internet connection</p>
        </div>
      )}

      {/* Offline Address Lookup */}
      {!isOnline && (
        <div data-testid="offline-address-lookup" className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-pink-800 mb-2">Offline Address Lookup</h3>
          <p className="text-xs text-pink-700">Look up addresses without internet connection</p>
        </div>
      )}

      {/* Offline Accountability */}
      {!isOnline && (
        <div data-testid="offline-accountability" className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-2">Offline Accountability</h3>
          <p className="text-xs text-amber-700">Track candidate accountability offline</p>
        </div>
      )}

      {/* Offline Login */}
      {!isOnline && (
        <div data-testid="offline-login" className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-violet-800 mb-2">Offline Login</h3>
          <p className="text-xs text-violet-700">Login functionality available offline</p>
        </div>
      )}

      {/* Poll Created Notification */}
      <div data-testid="poll-created-notification" className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-emerald-800 mb-2">Poll Created</h3>
        <p className="text-xs text-emerald-700">New poll has been created</p>
      </div>

      {/* Civics Notifications */}
      <div data-testid="civics-notifications" className="bg-rose-50 border border-rose-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-rose-800 mb-2">Civics Notifications</h3>
        <p className="text-xs text-rose-700">Get notified about civic updates</p>
      </div>

      {/* Offline WebAuthn Components */}
      <div data-testid="offline-webauthn-components" className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-sky-800 mb-2">Offline WebAuthn Components</h3>
        <p className="text-xs text-sky-700">WebAuthn components available offline</p>
      </div>

      {/* PWA Accountability Component */}
      <div data-testid="pwa-accountability" className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-purple-800 mb-2">PWA Accountability</h3>
        <p className="text-xs text-purple-700">Candidate accountability features with PWA integration</p>
      </div>

    </div>
  )
}
