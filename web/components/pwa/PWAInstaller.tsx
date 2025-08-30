'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { offlineOutbox, initializeOfflineOutbox } from '@/lib/pwa/offline-outbox'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAStatus {
  isInstalled: boolean
  isInstallable: boolean
  isOnline: boolean
  hasOfflineVotes: boolean
  offlineVoteCount: number
}

export default function PWAInstaller() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    hasOfflineVotes: false,
    offlineVoteCount: 0
  })
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showOfflineStatus, setShowOfflineStatus] = useState(false)

  useEffect(() => {
    // Initialize offline outbox
    initializeOfflineOutbox()

    // Check if PWA is installed
    const checkInstallation = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true
      setPwaStatus(prev => ({ ...prev, isInstalled }))
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPwaStatus(prev => ({ ...prev, isInstallable: true }))
      setShowInstallPrompt(true)
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setPwaStatus(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
      
      // Show success message
      showNotification('Choices installed successfully! 🎉', 'You can now use Choices offline and get notifications for new polls.')
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setPwaStatus(prev => ({ ...prev, isOnline: true }))
      checkOfflineVotes()
    }

    const handleOffline = () => {
      setPwaStatus(prev => ({ ...prev, isOnline: false }))
    }

    // Listen for offline votes synced event
    const handleOfflineVotesSynced = (event: CustomEvent) => {
      const { syncedCount } = event.detail
      if (syncedCount > 0) {
        showNotification(
          'Offline votes synced! 📤',
          `${syncedCount} vote${syncedCount > 1 ? 's' : ''} have been successfully submitted.`
        )
      }
      checkOfflineVotes()
    }

    // Initialize
    checkInstallation()
    checkOfflineVotes()

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener)
    }
  }, [])

  const checkOfflineVotes = async () => {
    try {
      const stats = await offlineOutbox.getStats()
      setPwaStatus(prev => ({
        ...prev,
        hasOfflineVotes: stats.pending > 0,
        offlineVoteCount: stats.pending
      }))
      setShowOfflineStatus(stats.pending > 0)
    } catch (error) {
      logger.error('Failed to check offline votes:', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        logger.info('User accepted the install prompt')
      } else {
        logger.info('User dismissed the install prompt')
      }
    } catch (error) {
      logger.error('Installation failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleSyncOfflineVotes = async () => {
    try {
      const result = await offlineOutbox.syncVotes()
      if (result.syncedCount > 0) {
        showNotification(
          'Votes synced! 📤',
          `${result.syncedCount} vote${result.syncedCount > 1 ? 's' : ''} submitted successfully.`
        )
      }
      checkOfflineVotes()
    } catch (error) {
      logger.error('Failed to sync offline votes:', error instanceof Error ? error : new Error(String(error)))
      showNotification('Sync failed', 'Please try again when you have a stable connection.')
    }
  }

  const showNotification = (title: string, message: string) => {
    // Create a toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm'
    toast.innerHTML = `
      <div class="font-semibold">${title}</div>
      <div class="text-sm opacity-90">${message}</div>
    `
    document.body.appendChild(toast)
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.remove()
    }, 5000)
  }

  // Don't show anything if PWA is already installed
  if (pwaStatus.isInstalled) {
    return null
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install Choices</h3>
                <p className="text-sm text-gray-600">Get the app for a better experience</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Later
              </button>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Status */}
      {showOfflineStatus && (
        <div className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">
                  {pwaStatus.isOnline ? 'Votes ready to sync' : 'Offline votes stored'}
                </h3>
                <p className="text-sm text-yellow-700">
                  {pwaStatus.offlineVoteCount} vote{pwaStatus.offlineVoteCount > 1 ? 's' : ''} waiting to be submitted
                </p>
              </div>
            </div>
            {pwaStatus.isOnline && (
              <button
                onClick={handleSyncOfflineVotes}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {!pwaStatus.isOnline && (
        <div className="fixed top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-30">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              You're offline. Votes will be stored and synced when you're back online.
            </span>
          </div>
        </div>
      )}
    </>
  )
}
