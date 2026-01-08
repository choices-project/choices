/**
 * @fileoverview Offline Indicator Component
 * 
 * Displays connection status and offline data information.
 * Shows banner when offline with count of pending actions.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

'use client'

import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react'
import React, { useEffect, useMemo, useRef } from 'react';

import { useIsOnline } from '@/lib/stores/deviceStore';
import { usePWAOffline, usePWAActions } from '@/lib/stores/pwaStore'

type OfflineIndicatorProps = {
  /** Whether to show detailed status information */
  showDetails?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Offline Indicator Component
 * 
 * Shows user when they're offline and how many actions are queued.
 * Two modes: banner (default) or detailed view.
 * 
 * @param props - Component props
 * @returns Offline indicator UI or null if online and not showing details
 */
export default function OfflineIndicator({ showDetails = false, className = '' }: OfflineIndicatorProps) {
  // Use deviceStore for network status (modernized pattern)
  const isOnline = useIsOnline();
  
  // Use PWA store for offline data management
  // H41: Memoize offline data access to prevent getSnapshot infinite loop
  // Accessing nested properties (offline.offlineData.queuedActions.length) can cause
  // Zustand's getSnapshot to be called repeatedly if the object reference changes
  const offline = usePWAOffline();
  const { setOnlineStatus } = usePWAActions();

  // H41: Use ref for setOnlineStatus to prevent infinite loop
  // usePWAActions() returns a new object on each call, making setOnlineStatus unstable
  // Using a ref ensures we always call the latest function without causing re-renders
  const setOnlineStatusRef = useRef(setOnlineStatus);
  useEffect(() => {
    setOnlineStatusRef.current = setOnlineStatus;
  }, [setOnlineStatus]);

  // Memoize offline votes calculation to ensure stable reference
  const offlineVotes = useMemo(() => offline.offlineData.queuedActions.length, [offline.offlineData.queuedActions.length]);
  const hasOfflineData = useMemo(() => offlineVotes > 0, [offlineVotes]);

  // H41: Remove updateDeviceInfo from useEffect to prevent infinite loop
  // updateDeviceInfo() updates state.network, which includes network.online
  // Calling it when isOnline changes creates a loop: isOnline changes -> updateDeviceInfo() -> network.online updates -> isOnline changes
  // Device info should only be updated on actual device changes (resize, orientation), not on network status changes
  // The deviceStore already has event listeners for online/offline events that update network status correctly
  
  // Sync deviceStore network status with PWA store
  // H41: Use ref to prevent infinite loop from unstable setOnlineStatus reference
  useEffect(() => {
    setOnlineStatusRef.current(isOnline);
  }, [isOnline]);

  // Always show offline indicator when offline (even if PWA offline mode is disabled)
  // This provides basic network status feedback to users
  if (isOnline && !showDetails) {
    return null
  }

  const getStatusIcon = () => {
    if (isOnline) {
      return <Wifi className="w-5 h-5 text-green-500" />
    }
    return <WifiOff className="w-5 h-5 text-red-500" />
  }

  const getStatusText = () => {
    if (isOnline) {
      return 'You\'re back online'
    }
    return 'No connection - You\'re offline'
  }

  const getStatusColor = () => {
    if (isOnline) {
      return 'bg-green-50 border-green-200 text-green-800'
    }
    return 'bg-red-50 border-red-200 text-red-800'
  }

  if (!showDetails) {
    return (
      <div 
        className={`fixed top-4 left-4 right-4 z-50 ${getStatusColor()} border rounded-lg shadow-lg p-3 ${className}`}
        data-testid="offline-indicator-main"
      >
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
          {!isOnline && (
            <span className="text-sm opacity-75">
              Votes will be stored and synced when you&apos;re back online.
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`} data-testid="offline-indicator">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connection Status</h3>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between" data-testid="connection-status">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">Connection</span>
          </div>
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Offline Data Status */}
        {hasOfflineData && (
          <div className="flex items-center justify-between" data-testid="offline-data-status">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Offline Data</span>
            </div>
            <span className="text-sm text-orange-600">
              {offlineVotes} vote{offlineVotes > 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        {/* Sync Status */}
        {!isOnline && hasOfflineData && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Data will sync when online</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Your offline votes and actions will be automatically synced when you reconnect.
            </p>
          </div>
        )}

        {/* Online Status */}
        {isOnline && hasOfflineData && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Ready to sync</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Your offline data will be synced automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
