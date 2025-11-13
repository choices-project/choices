'use client'

import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  Bell,
  BellOff,
  CheckCircle,
  RefreshCw,
  Settings,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';


import {
  usePWAInstallation,
  usePWAOffline,
  usePWANotifications,
  usePWALoading,
  usePWAError,
  usePWAActions,
} from '@/lib/stores/pwaStore';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { logger } from '@/lib/utils/logger';

type PWAStatusProps = {
  showDetails?: boolean;
  className?: string;
}

export default function PWAStatus({ showDetails = false, className = '' }: PWAStatusProps) {
  const installation = usePWAInstallation();
  const offline = usePWAOffline();
  const notifications = usePWANotifications();
  const loading = usePWALoading();
  const error = usePWAError();
  const { installPWA, addNotification, processOfflineActions } = usePWAActions();
  const previousState = useRef({
    isOnline: offline.isOnline,
    queuedActions: offline.offlineData.queuedActions.length,
    notifications: notifications.length,
    isInstalled: installation.isInstalled,
    error,
  });

  useEffect(() => {
    const prev = previousState.current;

    if (prev.isOnline !== offline.isOnline) {
      ScreenReaderSupport.announce(
        offline.isOnline ? 'Connection restored. You are online.' : 'You are offline. Changes will sync when reconnected.',
        offline.isOnline ? 'polite' : 'assertive',
      );
    }

    if (prev.queuedActions !== offline.offlineData.queuedActions.length && offline.offlineData.queuedActions.length > 0) {
      ScreenReaderSupport.announce(
        `${offline.offlineData.queuedActions.length} offline action${offline.offlineData.queuedActions.length === 1 ? '' : 's'} pending.`,
        'polite',
      );
    }

    if (prev.notifications !== notifications.length && notifications.length > 0) {
      ScreenReaderSupport.announce('Notifications enabled.', 'polite');
    }

    if (!prev.isInstalled && installation.isInstalled) {
      ScreenReaderSupport.announce('App installed successfully.', 'polite');
    }

    if (error && error !== prev.error) {
      ScreenReaderSupport.announce(`PWA error: ${error}`, 'assertive');
    }

    previousState.current = {
      isOnline: offline.isOnline,
      queuedActions: offline.offlineData.queuedActions.length,
      notifications: notifications.length,
      isInstalled: installation.isInstalled,
      error,
    };
  }, [error, installation.isInstalled, notifications.length, offline.isOnline, offline.offlineData.queuedActions.length]);

  // Debug logging for tests
  if (typeof window !== 'undefined') {
    logger.info('PWAStatus: Rendering with status:', {
      isInstalled: installation.isInstalled,
      canInstall: installation.canInstall,
      loading,
      error
    });
  }

  if (!installation.isInstalled && !installation.canInstall) {
    logger.info('PWAStatus: Not rendering', { isInstalled: installation.isInstalled, canInstall: installation.canInstall });
    return null;
  }

  const getStatusIcon = () => {
    if (installation.isInstalled) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (installation.canInstall) {
      return <Download className="w-5 h-5 text-blue-500" />;
    }
    return <Smartphone className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (installation.isInstalled) {
      return 'Installed';
    }
    if (installation.canInstall) {
      return 'Installable';
    }
    return 'Not Available';
  };

  const getConnectionIcon = () => {
    return offline.isOnline ?
      <Wifi className="w-4 h-4 text-green-500" /> :
      <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getNotificationIcon = () => {
    return notifications.length > 0 ?
      <Bell className="w-4 h-4 text-green-500" /> :
      <BellOff className="w-4 h-4 text-gray-400" />;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} role="status" aria-live="polite">
        <span aria-hidden="true">{getStatusIcon()}</span>
        <span className="text-sm font-medium" aria-label={`PWA status: ${getStatusText()}`}>
          {getStatusText()}
        </span>
        <span aria-hidden="true">{getConnectionIcon()}</span>
        <span aria-hidden="true">{getNotificationIcon()}</span>
        <span className="sr-only">
          {offline.isOnline ? 'Online' : 'Offline'}. Notifications{' '}
          {notifications.length > 0 ? 'enabled' : 'disabled'}.
        </span>
      </div>
    );
  }

  return (
    <section
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      data-testid="pwa-status"
      aria-live="polite"
      aria-busy={loading}
      role="status"
      aria-label="Progressive web app status"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PWA Status</h3>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh PWA status"
          aria-label="Refresh PWA status"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Installation Status */}
        <div className="flex items-center justify-between" data-testid="installation-status">
          <div className="flex items-center space-x-2">
            <span aria-hidden="true">{getStatusIcon()}</span>
            <span className="text-sm font-medium text-gray-700">Installation</span>
          </div>
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between" data-testid="offline-status">
          <div className="flex items-center space-x-2">
            <span aria-hidden="true">{getConnectionIcon()}</span>
            <span className="text-sm font-medium text-gray-700">Connection</span>
          </div>
          <span className="text-sm text-gray-600">
            {offline.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notifications Status */}
        <div className="flex items-center justify-between" data-testid="notification-status">
          <div className="flex items-center space-x-2">
            <span aria-hidden="true">{getNotificationIcon()}</span>
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          <span className="text-sm text-gray-600">
            {notifications.length > 0 ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Offline Data */}
        {offline.offlineData.cachedPages.length > 0 && (
          <div className="flex items-center justify-between" data-testid="offline-data-status">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-yellow-500" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Offline Data</span>
            </div>
            <span className="text-sm text-gray-600">
              {offline.offlineData.queuedActions.length} action{offline.offlineData.queuedActions.length !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Service Worker</span>
          </div>
          <span className="text-sm text-gray-600">
            Active
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        {installation.canInstall && !installation.isInstalled && (
          <button
            onClick={() => installPWA()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            data-testid="pwa-status-install-button"
            aria-label="Install app"
          >
            Install App
          </button>
        )}

        {notifications.length === 0 && (
          <button
            onClick={() =>
              addNotification({
                type: 'permission',
                title: 'Enable Notifications',
                message: 'Allow notifications for better experience',
                dismissible: true,
                priority: 'medium',
                read: false,
              })
            }
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            data-testid="request-notification-permission"
          >
            Enable Notifications
          </button>
        )}

        {offline.offlineData.cachedPages.length > 0 && offline.isOnline && (
          <button
            onClick={() => processOfflineActions()}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            data-testid="sync-offline-data-button"
          >
            Sync Offline Data
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
          aria-label="Update app"
        >
          Update App
        </button>
      </div>
    </section>
  );
}
