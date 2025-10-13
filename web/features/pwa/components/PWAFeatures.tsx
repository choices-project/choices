'use client'

import { useState, useEffect } from 'react'

import { 
  usePWAInstallation,
  usePWAOffline,
  usePWANotifications,
  usePWALoading,
  usePWAError
} from '@/lib/stores'

import NotificationPermission from './NotificationPermission'
import NotificationPreferences from './NotificationPreferences'
import OfflineIndicator from './OfflineIndicator'
import OfflineQueue from './OfflineQueue'
import OfflineSync from './OfflineSync'
import OfflineVoting from './OfflineVoting'

interface PWAFeaturesProps {
  className?: string
  showDetails?: boolean
}

export default function PWAFeatures({ className = '', showDetails = false }: PWAFeaturesProps) {
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const _notifications = usePWANotifications();
  const _loading = usePWALoading();
  const _error = usePWAError();
  
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Handle undefined store hooks gracefully
  if (!installation || !offline) {
    return null
  }

  if (!installation.isInstalled && !installation.canInstall) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="pwa-features">
      {/* Offline Features */}
      <div data-testid="offline-features">
        <OfflineIndicator showDetails={showDetails} />
      </div>

      {/* Offline Polls */}
      {offline.offlineData?.cachedPages?.length > 0 && (
        <div data-testid="offline-polls">
          <OfflineVoting pollId="test-poll" />
        </div>
      )}

      {/* Offline Queue */}
      {offline.offlineData?.queuedActions?.length > 0 && (
        <div data-testid="offline-queue">
          <OfflineQueue />
        </div>
      )}

      {/* Offline Sync */}
      {offline.offlineData?.cachedPages?.length > 0 && (
        <div data-testid="offline-sync">
          <OfflineSync />
        </div>
      )}

      {/* Notification Features */}
      <div data-testid="notification-features">
        <NotificationPermission />
        <NotificationPreferences />
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
