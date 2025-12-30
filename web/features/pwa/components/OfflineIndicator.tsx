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
import React, { useEffect } from 'react';

import { useIsOnline, useDeviceActions } from '@/lib/stores/deviceStore';
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
  const { updateDeviceInfo } = useDeviceActions();
  
  // Use PWA store for offline data management
  const offline = usePWAOffline();
  const { setOnlineStatus } = usePWAActions();

  const offlineVotes = offline.offlineData.queuedActions.length;
  const hasOfflineData = offlineVotes > 0;

  // Sync deviceStore network status with PWA store
  useEffect(() => {
    setOnlineStatus(isOnline);
  }, [isOnline, setOnlineStatus]);

  // Update device info when network status changes (ensures deviceStore stays in sync)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      updateDeviceInfo();
    }
  }, [isOnline, updateDeviceInfo]);

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
