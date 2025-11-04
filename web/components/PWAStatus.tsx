'use client'

import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import React from 'react';

import { usePWAStore } from '@/lib/stores/pwaStore';

type PWAStatusProps = {
  showDetails?: boolean;
  className?: string;
}

export default function PWAStatus({ showDetails = false, className = '' }: PWAStatusProps) {
  const { installation, offline, preferences, isLoading, error: pwaError, installPWA, syncData, updateServiceWorker } = usePWAStore();
  
  const isSupported = 'serviceWorker' in navigator;
  const isEnabled = preferences.installPrompt;
  const notificationsEnabled = preferences.pushNotifications && Notification.permission === 'granted';
  const hasOfflineData = offline.offlineData.queuedActions.length > 0;
  
  // Service worker status - check if registered
  const [serviceWorkerActive, setServiceWorkerActive] = React.useState(false);
  
  React.useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setServiceWorkerActive(true);
    }
  }, []);

  // Debug logging for tests
  if (typeof window !== 'undefined') {
    console.log('PWAStatus: Rendering with status:', {
      isEnabled,
      isSupported,
      loading: isLoading,
      error: pwaError
    });
  }

  if (!isEnabled || !isSupported) {
    console.log('PWAStatus: Not rendering - isEnabled:', isEnabled, 'isSupported:', isSupported);
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
    return notificationsEnabled ? 
      <Bell className="w-4 h-4 text-green-500" /> : 
      <BellOff className="w-4 h-4 text-gray-400" />;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {getConnectionIcon()}
        {getNotificationIcon()}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`} data-testid="pwa-status">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PWA Status</h3>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh PWA status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Installation Status */}
        <div className="flex items-center justify-between" data-testid="installation-status">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">Installation</span>
          </div>
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between" data-testid="offline-status">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm font-medium text-gray-700">Connection</span>
          </div>
          <span className="text-sm text-gray-600">
            {offline.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notifications Status */}
        <div className="flex items-center justify-between" data-testid="notification-status">
          <div className="flex items-center space-x-2">
            {getNotificationIcon()}
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          <span className="text-sm text-gray-600">
            {notificationsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Offline Data */}
        {offline.offlineData.queuedActions.length > 0 && (
          <div className="flex items-center justify-between" data-testid="offline-data-status">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Offline Data</span>
            </div>
            <span className="text-sm text-gray-600">
              {offline.offlineData.queuedActions.length} vote{offline.offlineData.queuedActions.length !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {serviceWorkerActive ? 
              <CheckCircle className="w-4 h-4 text-green-500" /> : 
              <XCircle className="w-4 h-4 text-red-500" />
            }
            <span className="text-sm font-medium text-gray-700">Service Worker</span>
          </div>
          <span className="text-sm text-gray-600">
            {serviceWorkerActive ? 'Active' : 'Inactive'}
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
          >
            Install App
          </button>
        )}

        {!notificationsEnabled && (
          <button
            onClick={async () => {
              const result = await Notification.requestPermission();
              // Result is handled by effect in component
            }}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            data-testid="request-notification-permission"
          >
            Enable Notifications
          </button>
        )}

        {hasOfflineData && offline.isOnline && (
          <button
            onClick={() => syncData()}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            data-testid="sync-offline-data-button"
          >
            Sync Offline Data
          </button>
        )}

        {/* Note: Service worker waiting state handled by ServiceWorkerProvider */}
      </div>
    </div>
  );
}
