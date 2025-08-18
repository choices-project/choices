'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { motion } from 'framer-motion'
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Shield, 
  Zap, 
  Download, 
  RefreshCw,
  Vote,
  Users,
  BarChart3,
  Lock,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { PWAFeaturesShowcase, PWAStatus } from '../../components/PWAComponents'
import { usePWAUtils } from '../../hooks/usePWAUtils'

export default function PWAShowcasePage() {
  const { loading: utilsLoading } = usePWAUtils()
  const [deviceFingerprint, setDeviceFingerprint] = useState<any>(null)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>('default')

  useEffect(() => {
    if (pwaUtils && !utilsLoading) {
      // Get device fingerprint
      pwaUtils.pwaManager.getDeviceFingerprint().then(setDeviceFingerprint)
      
      // Check WebAuthn support
      setWebAuthnSupported('credentials' in navigator)
      
      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission)
      }
    }
  }, [pwaUtils, utilsLoading])

  const handleRequestNotifications = async () => {
    if (!pwaUtils) return
    
    const granted = await pwaUtils.pwaManager.requestNotificationPermission()
    if (granted) {
      setNotificationPermission('granted')
      // Subscribe to push notifications
      await pwaUtils.pwaManager.subscribeToPushNotifications()
    }
  }

  const handleTestWebAuthn = async () => {
    if (!pwaUtils || !webAuthnSupported) {
      alert('WebAuthn is not supported in this browser')
      return
    }

    try {
      const credential = await pwaUtils.pwaWebAuthn.registerUser('test-user')
      if (credential) {
        alert('WebAuthn registration successful!')
      }
    } catch (error) {
      alert('WebAuthn registration failed: ' + error)
    }
  }

  const handleTestOfflineVote = async () => {
    if (!pwaUtils) return
    
    await pwaUtils.pwaManager.storeOfflineVote({
      pollId: 'test-poll-123',
      choice: 1
    })
    alert('Offline vote stored! It will sync when you\'re back online.')
  }

  const handleTestEncryptedStorage = async () => {
    if (!pwaUtils) return
    
    const testData = {
      sensitiveInfo: 'This is encrypted data',
      timestamp: Date.now()
    }
    
    await pwaUtils.privacyStorage.storeEncryptedData('test_key', testData)
    const retrieved = await pwaUtils.privacyStorage.getEncryptedData('test_key')
    
    if (retrieved) {
      alert('Encrypted storage test successful! Data retrieved: ' + JSON.stringify(retrieved))
    } else {
      alert('Encrypted storage test failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PWA Showcase</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Progressive Web App
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of web applications with our privacy-first PWA. 
              Install it on your device and enjoy native app features with enhanced security.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Privacy-First</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Secure</span>
              </div>
              <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Fast</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* PWA Features */}
        <section className="mb-12">
          <PWAFeaturesShowcase />
        </section>

        {/* PWA Status */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PWAStatus />
            
            {/* Device Fingerprint */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Device Information
              </h3>
              {deviceFingerprint ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Platform:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {deviceFingerprint.platform}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Screen:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {deviceFingerprint.screenResolution}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {deviceFingerprint.language}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Timezone:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {deviceFingerprint.timezone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">WebAuthn:</span>
                    <span className={`text-sm font-medium ${
                      deviceFingerprint.webAuthn ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {deviceFingerprint.webAuthn ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading device information...</p>
              )}
            </div>
          </div>
        </section>

        {/* Interactive Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test PWA Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* WebAuthn Test */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">WebAuthn Test</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Test biometric authentication and device-based security.
              </p>
              <button
                onClick={handleTestWebAuthn}
                disabled={!webAuthnSupported}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {webAuthnSupported ? 'Test WebAuthn' : 'Not Supported'}
              </button>
            </motion.div>

            {/* Offline Vote Test */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Vote className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Offline Vote</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Test offline voting functionality. Vote will sync when online.
              </p>
              <button
                onClick={handleTestOfflineVote}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Offline Vote
              </button>
            </motion.div>

            {/* Encrypted Storage Test */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Encrypted Storage</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Test local encrypted data storage for privacy protection.
              </p>
              <button
                onClick={handleTestEncryptedStorage}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Test Encryption
              </button>
            </motion.div>

            {/* Push Notifications */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enable push notifications for poll updates and results.
              </p>
              <button
                onClick={handleRequestNotifications}
                disabled={notificationPermission === 'granted'}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                {notificationPermission === 'granted' ? 'Enabled' : 'Enable Notifications'}
              </button>
            </motion.div>

            {/* Background Sync */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <RefreshCw className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Background Sync</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Data syncs automatically when you're back online.
              </p>
              <div className="text-sm text-gray-500">
                {deviceFingerprint?.backgroundSync ? (
                  <span className="text-green-600">✓ Supported</span>
                ) : (
                  <span className="text-red-600">✗ Not Supported</span>
                )}
              </div>
            </motion.div>

            {/* Install Prompt */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Download className="w-6 h-6 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Install App</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Install Choices on your home screen for the best experience.
              </p>
              <div className="text-sm text-gray-500">
                {deviceFingerprint?.installPrompt ? (
                  <span className="text-green-600">✓ Installable</span>
                ) : (
                  <span className="text-red-600">✗ Not Installable</span>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why PWA?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cross-Platform</h3>
              </div>
              <p className="text-sm text-gray-600">
                Works on iOS, Android, and desktop with a single codebase. No app store required.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <WifiOff className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Offline First</h3>
              </div>
              <p className="text-sm text-gray-600">
                Vote and browse polls without internet connection. Data syncs when online.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Enhanced Security</h3>
              </div>
              <p className="text-sm text-gray-600">
                WebAuthn biometric authentication and encrypted local storage for maximum privacy.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Lightning Fast</h3>
              </div>
              <p className="text-sm text-gray-600">
                Instant loading with service worker caching and optimized performance.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Native Experience</h3>
              </div>
              <p className="text-sm text-gray-600">
                Install on home screen, push notifications, and app-like interface.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Always Updated</h3>
              </div>
              <p className="text-sm text-gray-600">
                Automatic updates with background sync and seamless version management.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
