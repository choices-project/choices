'use client'

import { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Smartphone, 
  Shield, 
  Zap,
  X,
  CheckCircle
} from 'lucide-react'
import type { ComponentType } from 'react'
import { pwaManager } from '../../features/pwa/lib/pwa-utils'
import type { 
  PWAFeatures, 
  PWAStatus, 
  FeatureCardProps, 
  StatusItemProps,
  NavigatorWithServiceWorker 
} from '../../types/pwa'

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if PWA is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      // Trigger install prompt
      const event = new Event('beforeinstallprompt')
      window.dispatchEvent(event)
      
      // Wait a bit for the prompt to show
      setTimeout(() => {
        setIsInstalling(false)
        setShowPrompt(false)
      }, 2000)
    } catch (error) {
      devLog('PWA install failed:', error)
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Install Choices App
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get the full app experience with offline voting and push notifications.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
                >
                  {isInstalling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span className="ml-2">
                    {isInstalling ? 'Installing...' : 'Install'}
                  </span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Offline Indicator Component
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowIndicator(false)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowIndicator(true)
    }

    // Check initial state
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showIndicator) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <div className={`rounded-lg shadow-lg border p-4 ${
          isOffline 
            ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' 
            : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                isOffline 
                  ? 'text-yellow-800 dark:text-yellow-200' 
                  : 'text-green-800 dark:text-green-200'
              }`}>
                {isOffline ? 'You\'re offline' : 'Back online'}
              </p>
              <p className={`text-sm ${
                isOffline 
                  ? 'text-yellow-700 dark:text-yellow-300' 
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {isOffline 
                  ? 'Some features may be limited. Your votes will sync when you\'re back online.'
                  : 'All features are now available.'
                }
              </p>
            </div>
            <button
              onClick={() => setShowIndicator(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// PWA Update Prompt Component
export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true)
      })
    }
  }, [])

  const handleUpdate = () => {
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Update Available
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                A new version of Choices is available with improved features and security.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="ml-2">Update Now</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// PWA Features Showcase Component
export function PWAFeaturesShowcase() {
  const [features, setFeatures] = useState<PWAFeatures>({
    installable: false,
    offline: false,
    pushNotifications: false,
    webAuthn: false,
    backgroundSync: false
  })

  useEffect(() => {
    const checkFeatures = async () => {
      const newFeatures = {
        installable: 'beforeinstallprompt' in window,
        offline: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        webAuthn: 'credentials' in navigator,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in (navigator as NavigatorWithServiceWorker).serviceWorker
      }
      setFeatures(newFeatures)
    }

    checkFeatures()
  }, [])

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        PWA Features
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard
          title="Installable"
          description="Install on your home screen for app-like experience"
          icon={Smartphone as ComponentType<{ className?: string }>}
          available={features.installable}
        />
        <FeatureCard
          title="Offline Support"
          description="Vote and browse polls without internet connection"
          icon={WifiOff as ComponentType<{ className?: string }>}
          available={features.offline}
        />
        <FeatureCard
          title="Push Notifications"
          description="Get notified about new polls and results"
          icon={Zap as ComponentType<{ className?: string }>}
          available={features.pushNotifications}
        />
        <FeatureCard
          title="Secure Authentication"
          description="Biometric and device-based authentication"
          icon={Shield as ComponentType<{ className?: string }>}
          available={features.webAuthn}
        />
        <FeatureCard
          title="Background Sync"
          description="Sync your data automatically when online"
          icon={RefreshCw as ComponentType<{ className?: string }>}
          available={features.backgroundSync}
        />
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  available 
}: FeatureCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${
      available 
        ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-800' 
        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${
          available 
            ? 'bg-green-100 dark:bg-green-900/30' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Icon className={`w-5 h-5 ${
            available 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-gray-400 dark:text-gray-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={`text-sm font-medium ${
              available 
                ? 'text-gray-900 dark:text-white' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {title}
            </h4>
            {available && (
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </div>
          <p className={`text-sm mt-1 ${
            available 
              ? 'text-gray-600 dark:text-gray-300' 
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

// PWA Status Component
export function PWAStatus() {
  const [status, setStatus] = useState<PWAStatus>({
    isStandalone: false,
    isOnline: true,
    hasServiceWorker: false,
    hasPushSupport: false,
    pwaStatus: null
  })

  useEffect(() => {
    const updateStatus = async () => {
      try {
        // Use pwaManager for comprehensive PWA status
        const pwaStatus = await pwaManager.getPWAStatus()
        
        setStatus({
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          isOnline: navigator.onLine,
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushSupport: 'PushManager' in window,
          pwaStatus
        })
      } catch (error) {
        devLog('Error getting PWA status:', error)
        // Fallback to basic status
        setStatus({
          isStandalone: window.matchMedia('(display-mode: standalone)').matches,
          isOnline: navigator.onLine,
          hasServiceWorker: 'serviceWorker' in navigator,
          hasPushSupport: 'PushManager' in window,
          pwaStatus: null
        })
      }
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        App Status
      </h3>
      <div className="space-y-2">
        <StatusItem
          label="App Mode"
          value={status.isStandalone ? 'Installed' : 'Browser'}
          status={status.isStandalone ? 'success' : 'info'}
        />
        <StatusItem
          label="Connection"
          value={status.isOnline ? 'Online' : 'Offline'}
          status={status.isOnline ? 'success' : 'warning'}
        />
        <StatusItem
          label="Service Worker"
          value={status.hasServiceWorker ? 'Active' : 'Not Available'}
          status={status.hasServiceWorker ? 'success' : 'error'}
        />
        <StatusItem
          label="Push Notifications"
          value={status.hasPushSupport ? 'Supported' : 'Not Supported'}
          status={status.hasPushSupport ? 'success' : 'error'}
        />
      </div>
    </div>
  )
}

// Status Item Component
function StatusItem({ 
  label, 
  value, 
  status 
}: StatusItemProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${getStatusColor()}`}>{value}</span>
    </div>
  )
}
