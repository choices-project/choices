'use client'

import React, { useState, useEffect } from 'react';

import { initializeOfflineOutbox } from '@/features/pwa/lib/offline-outbox'
import { usePWAStore } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/utils/logger';

export default function PWAInstaller() {
  const { installation, offline, preferences, installPWA, syncData } = usePWAStore();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showOfflineStatus, setShowOfflineStatus] = useState(false)
  
  const hasOfflineData = offline.offlineData.queuedActions.length > 0
  const offlineVotes = offline.offlineData.queuedActions.length
  const isOnline = offline.isOnline
  const isSupported = 'serviceWorker' in navigator
  const isEnabled = preferences.installPrompt

  useEffect(() => {
    // Initialize offline outbox
    initializeOfflineOutbox()

    // Show install prompt when PWA becomes installable
    if (installation.canInstall && !installation.isInstalled) {
      setShowInstallPrompt(true)
    }

    // Show offline status when there are offline votes
    if (hasOfflineData) {
      setShowOfflineStatus(true)
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
    }

    window.addEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('offlineVotesSynced', handleOfflineVotesSynced as EventListener)
    }
  }, [installation.canInstall, installation.isInstalled, hasOfflineData])

  const handleInstallClick = async () => {
    try {
      await installPWA()
      
      if (installation.isInstalled) {
        logger.info('User accepted the install prompt')
        showNotification('Choices installed successfully! 🎉', 'You can now use Choices offline and get notifications for new polls.')
      }
    } catch (error) {
      logger.error('Installation failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setShowInstallPrompt(false)
    }
  }

  const handleSyncOfflineVotes = async () => {
    try {
      await syncData()
      showNotification('Votes synced! 📤', 'Your offline votes have been submitted successfully.')
    } catch (error) {
      logger.error('Failed to sync offline votes:', error instanceof Error ? error : new Error(String(error)))
      showNotification('Sync failed', 'Please try again when you have a stable connection.')
    }
  }

  const showNotification = (title: string, message: string) => {
    // Create a toast notification
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm'
    
    // Create title element
    const titleEl = document.createElement('div')
    titleEl.className = 'font-semibold'
    titleEl.textContent = title
    
    // Create message element
    const messageEl = document.createElement('div')
    messageEl.className = 'text-sm opacity-90'
    messageEl.textContent = message
    
    // Append elements to toast
    toast.appendChild(titleEl)
    toast.appendChild(messageEl)
    
    document.body.appendChild(toast)
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.remove()
    }, 5000)
  }

  // Don't show anything if PWA is already installed or not supported
  if (installation.isInstalled || !isSupported || !isEnabled) {
    return null
  }

  return (
    <>
          {/* Install Prompt */}
          {showInstallPrompt && (
            <div className="fixed bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50" data-testid="pwa-install-prompt">
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
                    data-testid="pwa-install-button"
                  >
                    Install
                  </button>
                </div>
              </div>
              {/* Installation Benefits */}
              <div className="mt-4 pt-4 border-t border-gray-200" data-testid="pwa-install-benefits">
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Access Choices directly from your home screen</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Faster loading and better performance</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Works offline - vote even without internet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Get notifications for new polls and results</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Native app-like experience</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offline Status */}
          {showOfflineStatus && (
            <div className="fixed bottom-4 left-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-40" data-testid="offline-votes-indicator">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800">
                      {isOnline ? 'Votes ready to sync' : 'Offline votes stored'}
                    </h3>
                    <p className="text-sm text-yellow-700">
                      {offlineVotes} vote{offlineVotes > 1 ? 's' : ''} waiting to be submitted
                    </p>
                  </div>
                </div>
                {isOnline && (
                  <button
                    onClick={handleSyncOfflineVotes}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    data-testid="sync-offline-data-button"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Connection Status */}
          {!isOnline && (
            <div className="fixed top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-30" data-testid="offline-indicator">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  You&apos;re offline. Votes will be stored and synced when you&apos;re back online.
                </span>
              </div>
            </div>
          )}
    </>
  )
}
