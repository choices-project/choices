'use client'

import React, { useState, useEffect } from 'react';


type PWAFeaturesIsolatedProps = {
  className?: string
  showDetails?: boolean
}

/**
 * Isolated PWA Features Component
 * 
 * A completely isolated version that doesn't use complex Zustand stores to avoid infinite loops.
 * This component provides PWA feature information for E2E testing without causing React infinite loops.
 */
export default function PWAFeaturesIsolated({ className = '', showDetails: _showDetails = false }: PWAFeaturesIsolatedProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Check if PWA is supported
      setIsSupported('serviceWorker' in navigator && 'PushManager' in window)
      
      // Set initial online status
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

  // Don't render if PWA is not supported
  if (!isSupported) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="pwa-features">
      {/* Offline Features */}
      <div data-testid="offline-features">
        <h3>Offline Features</h3>
        <ul>
          <li>Offline Voting</li>
          <li>Offline Poll Creation</li>
          <li>Offline Data Sync</li>
          <li>Status: {isOnline ? 'Online' : 'Offline'}</li>
        </ul>
      </div>

      {/* Installation Features */}
      <div data-testid="installation-features">
        <h3>PWA Installation</h3>
        <ul>
          <li>Add to Home Screen</li>
          <li>Native App Experience</li>
          <li>Background Sync</li>
        </ul>
      </div>

      {/* Performance Features */}
      <div data-testid="performance-features">
        <h3>Performance Features</h3>
        <ul>
          <li>Fast Loading</li>
          <li>Efficient Caching</li>
          <li>Optimized Resources</li>
        </ul>
      </div>

      {/* Notification Features */}
      <div data-testid="notification-features">
        <h3>Notification Features</h3>
        <ul>
          <li>Push Notifications</li>
          <li>Poll Updates</li>
          <li>System Integration</li>
        </ul>
      </div>
    </div>
  )
}
