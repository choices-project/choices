'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Eye, 
  EyeOff, 
  Download, 
  Fingerprint,
  Zap,
  RefreshCw,
  Lock
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { pwaManager, pwaWebAuthn, privacyStorage } from '../lib/pwa-utils'

interface UserProfile {
  stableId: string
  pseudonym?: string
  trustTier: 'T0' | 'T1' | 'T2' | 'T3'
  verificationScore: number
  profileVisibility: 'anonymous' | 'pseudonymous' | 'public'
  dataSharingLevel: 'minimal' | 'demographic' | 'full'
  demographics?: {
    ageRange?: string
    educationLevel?: string
    incomeBracket?: string
    regionCode?: string
  }
  createdAt: string
  lastActivity: string
}

interface PWAUserProfileProps {
  user?: UserProfile
  onUpdate?: (_profile: Partial<UserProfile>) => void
}

export function PWAUserProfile({ user, onUpdate: _onUpdate }: PWAUserProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null)
  const [pwaFeatures, setPwaFeatures] = useState({
    installable: false,
    offline: false,
    pushNotifications: false,
    webAuthn: false,
    backgroundSync: false,
    encryptedStorage: false
  })
  const [notificationPermission, setNotificationPermission] = useState<string>('default')
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Get device fingerprint
    pwaManager.getDeviceFingerprint().then(setDeviceFingerprint)
    
    // Check PWA features
    const features = {
      installable: 'beforeinstallprompt' in window,
      offline: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      webAuthn: 'credentials' in navigator,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as ServiceWorkerContainer & { sync?: unknown }),
      encryptedStorage: 'crypto' in window && 'subtle' in (window as Window & { crypto: Crypto }).crypto
    }
    setPwaFeatures(features)
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
    
    // Check online status
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRequestNotifications = async () => {
    const granted = await pwaManager.requestNotificationPermission()
    if (granted) {
      setNotificationPermission('granted')
      await pwaManager.subscribeToPushNotifications()
    }
  }

  const handleTestWebAuthn = async () => {
    if (!pwaFeatures.webAuthn) {
      alert('WebAuthn is not supported in this browser')
      return
    }

    try {
      const credential = await pwaWebAuthn.registerUser(user?.pseudonym ?? 'user')
      if (credential) {
        alert('WebAuthn registration successful!')
      }
    } catch (error) {
      alert(`WebAuthn registration failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleClearEncryptedData = () => {
    if (confirm('Are you sure you want to clear all encrypted data? This cannot be undone.')) {
      privacyStorage.clearAllEncryptedData()
      alert('All encrypted data has been cleared.')
    }
  }

  const handleExportData = () => {
    try {
      const exportData = {
        profile: user,
        deviceInfo: deviceFingerprint,
        pwaFeatures,
        timestamp: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `choices-profile-${user?.stableId}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Failed to export data: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const getTrustTierInfo = (tier: string) => {
    const tiers = {
      T0: { name: 'Anonymous', color: 'text-gray-600', bg: 'bg-gray-100' },
      T1: { name: 'Verified Human', color: 'text-blue-600', bg: 'bg-blue-100' },
      T2: { name: 'Trusted Participant', color: 'text-green-600', bg: 'bg-green-100' },
      T3: { name: 'Validator', color: 'text-purple-600', bg: 'bg-purple-100' }
    }
    return tiers[tier as keyof typeof tiers] || tiers.T0
  }

  const getVisibilityInfo = (visibility: string) => {
    const visibilities = {
      anonymous: { name: 'Anonymous', icon: EyeOff, color: 'text-gray-600' },
      pseudonymous: { name: 'Pseudonymous', icon: Eye, color: 'text-blue-600' },
      public: { name: 'Public', icon: User, color: 'text-green-600' }
    }
    return visibilities[visibility as keyof typeof visibilities] || visibilities.anonymous
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Found</h3>
          <p className="text-gray-600">Please create a profile to get started.</p>
        </div>
      </div>
    )
  }

  const tierInfo = getTrustTierInfo(user.trustTier)
  const visibilityInfo = getVisibilityInfo(user.profileVisibility)

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.pseudonym ?? `User ${user.stableId.slice(0, 8)}`}
              </h2>
              <p className="text-sm text-gray-600">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Trust Tier & Verification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${tierInfo.bg}`}>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className={`w-5 h-5 ${tierInfo.color}`} />
              <span className={`font-medium ${tierInfo.color}`}>{tierInfo.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${user.verificationScore}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{user.verificationScore}%</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <visibilityInfo.icon className={`w-5 h-5 ${visibilityInfo.color}`} />
              <span className={`font-medium ${visibilityInfo.color}`}>{visibilityInfo.name}</span>
            </div>
            <p className="text-sm text-gray-600">
              {user.dataSharingLevel === 'minimal' && 'Minimal data sharing'}
              {user.dataSharingLevel === 'demographic' && 'Demographic data shared'}
              {user.dataSharingLevel === 'full' && 'Full data sharing'}
            </p>
          </div>
        </div>

        {/* PWA Status */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">PWA Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${pwaFeatures.webAuthn ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                WebAuthn {pwaFeatures.webAuthn ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${pwaFeatures.encryptedStorage ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                Encryption {pwaFeatures.encryptedStorage ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics (if shared) */}
      {user.demographics && user.dataSharingLevel !== 'minimal' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {user.demographics.ageRange && (
              <div>
                <label className="text-sm font-medium text-gray-700">Age Range</label>
                <p className="text-sm text-gray-900">{user.demographics.ageRange}</p>
              </div>
            )}
            {user.demographics.educationLevel && (
              <div>
                <label className="text-sm font-medium text-gray-700">Education</label>
                <p className="text-sm text-gray-900">{user.demographics.educationLevel}</p>
              </div>
            )}
            {user.demographics.incomeBracket && (
              <div>
                <label className="text-sm font-medium text-gray-700">Income</label>
                <p className="text-sm text-gray-900">{user.demographics.incomeBracket}</p>
              </div>
            )}
            {user.demographics.regionCode && (
              <div>
                <label className="text-sm font-medium text-gray-700">Region</label>
                <p className="text-sm text-gray-900">{user.demographics.regionCode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PWA Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">PWA Features</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* WebAuthn */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Fingerprint className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Biometric Auth</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Secure device-based authentication
            </p>
            <button
              onClick={handleTestWebAuthn}
              disabled={!pwaFeatures.webAuthn}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              {pwaFeatures.webAuthn ? 'Test WebAuthn' : 'Not Supported'}
            </button>
          </motion.div>

          {/* Push Notifications */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Zap className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-gray-900">Notifications</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Get poll updates and results
            </p>
            <button
              onClick={handleRequestNotifications}
              disabled={notificationPermission === 'granted'}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
            </button>
          </motion.div>

          {/* Encrypted Storage */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Lock className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Encrypted Storage</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Local encrypted data protection
            </p>
            <button
              onClick={handleClearEncryptedData}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              Clear Data
            </button>
          </motion.div>
        </div>

        {/* Advanced Features */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h4 className="font-medium text-gray-900 mb-4">Advanced Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <RefreshCw className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-medium text-gray-900">Background Sync</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Automatically sync data when online
                  </p>
                  <div className="text-sm text-gray-500">
                    {pwaFeatures.backgroundSync ? (
                      <span className="text-green-600">✓ Supported</span>
                    ) : (
                      <span className="text-red-600">✗ Not Supported</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Download className="w-5 h-5 text-teal-600" />
                    <h5 className="font-medium text-gray-900">Data Export</h5>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Export your profile data
                  </p>
                  <button
                    onClick={handleExportData}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    Export Data
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Device Information */}
      {deviceFingerprint && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Platform</label>
              <p className="text-sm text-gray-900">{deviceFingerprint.platform}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Screen</label>
              <p className="text-sm text-gray-900">{deviceFingerprint.screenResolution}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Language</label>
              <p className="text-sm text-gray-900">{deviceFingerprint.language}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Timezone</label>
              <p className="text-sm text-gray-900">{deviceFingerprint.timezone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">WebAuthn</label>
              <p className={`text-sm ${deviceFingerprint.webAuthn ? 'text-green-600' : 'text-red-600'}`}>
                {deviceFingerprint.webAuthn ? 'Supported' : 'Not Supported'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">PWA Mode</label>
              <p className={`text-sm ${deviceFingerprint.standalone ? 'text-green-600' : 'text-blue-600'}`}>
                {deviceFingerprint.standalone ? 'Installed' : 'Browser'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
