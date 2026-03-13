/**
 * @fileoverview Unified Offline Indicator Component
 *
 * Single consolidated component for offline/online status across the app.
 * Replaces ServiceWorkerProvider inline banner, OfflineIndicator, and PWABackground.
 *
 * Features:
 * - Uses navigator.onLine + online/offline event listeners
 * - Amber/yellow top banner when offline with WifiOff icon
 * - Dark mode support
 * - Auto-dismiss with "Back online" success toast when reconnecting
 * - Optional showDetails mode for PWA features page (connection status card)
 *
 * @author Choices Platform Team
 */

'use client';

import { WifiOff, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useNotificationStore } from '@/lib/stores/notificationStore';
import { usePWAOffline, usePWAActions } from '@/lib/stores/pwaStore';

type OfflineIndicatorProps = {
  /** Whether to show detailed status information (for PWA features page) */
  showDetails?: boolean;
  /** Additional CSS classes */
  className?: string;
};

/**
 * Unified Offline Indicator
 *
 * Shows a consistent amber top banner when offline. Auto-dismisses with
 * "Back online" toast when connection is restored.
 */
export default function OfflineIndicator({
  showDetails = false,
  className = '',
}: OfflineIndicatorProps) {
  // Use navigator.onLine + event listeners (no Zustand for core state to avoid hydration issues)
  const [isOnline, setIsOnline] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const wasOfflineRef = useRef(false);

  // Optional: sync to PWA store and get offline data for showDetails mode
  const offline = usePWAOffline();
  const { setOnlineStatus } = usePWAActions();
  const setOnlineStatusRef = useRef(setOnlineStatus);
  useEffect(() => {
    setOnlineStatusRef.current = setOnlineStatus;
  }, [setOnlineStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Back online',
          message: 'Your connection has been restored.',
          duration: 3000,
        });
        wasOfflineRef.current = false;
      }
      setIsOnline(true);
      setOnlineStatusRef.current(true);
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
      setOnlineStatusRef.current(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Memoize offline data for showDetails mode
  const offlineVotes = useMemo(
    () => offline.offlineData.queuedActions.length,
    [offline.offlineData.queuedActions.length]
  );
  const hasOfflineData = useMemo(() => offlineVotes > 0, [offlineVotes]);

  // Banner mode: show when offline, hide when online (unless showDetails)
  if (isOnline && !showDetails) {
    return null;
  }

  // Banner: subtle top banner with amber styling
  if (!showDetails) {
    return (
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
          bg-amber-100 text-amber-900 border-b border-amber-200
          dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800
          ${className}`}
        data-testid="offline-indicator"
        role="alert"
        aria-live="polite"
        style={{ display: isMounted && !isOnline ? 'flex' : 'none' }}
      >
        <WifiOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>You&apos;re offline. Some features may be limited.</span>
      </div>
    );
  }

  // Detailed view for PWA features page
  const getStatusIcon = () => {
    if (isOnline) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    }
    return <WifiOff className="h-5 w-5 text-red-500" />;
  };

  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${className}`}
      data-testid="offline-indicator"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Connection Status
        </h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span
            className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between" data-testid="connection-status">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Connection
            </span>
          </div>
          <span
            className={`text-sm ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {hasOfflineData && (
          <div className="flex items-center justify-between" data-testid="offline-data-status">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-foreground/80">
                Offline Data
              </span>
            </div>
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {offlineVotes} vote{offlineVotes > 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        {!isOnline && hasOfflineData && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Data will sync when online</span>
            </div>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Your offline votes and actions will be automatically synced when you reconnect.
            </p>
          </div>
        )}

        {isOnline && hasOfflineData && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Ready to sync</span>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Your offline data will be synced automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
