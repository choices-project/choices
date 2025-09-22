'use client'

import { usePWA } from '@/hooks/usePWA';
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

type PWAStatusProps = {
  showDetails?: boolean;
  className?: string;
}

export default function PWAStatus({ showDetails = false, className = '' }: PWAStatusProps) {
  const pwa = usePWA();

  // Debug logging for tests
  if (typeof window !== 'undefined') {
    console.log('PWAStatus: Rendering with status:', {
      isEnabled: pwa.isEnabled,
      isSupported: pwa.isSupported,
      loading: pwa.loading,
      error: pwa.error
    });
  }

  if (!pwa.isEnabled || !pwa.isSupported) {
    console.log('PWAStatus: Not rendering - isEnabled:', pwa.isEnabled, 'isSupported:', pwa.isSupported);
    return null;
  }

  const getStatusIcon = () => {
    if (pwa.installation.isInstalled) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (pwa.installation.isInstallable) {
      return <Download className="w-5 h-5 text-blue-500" />;
    }
    return <Smartphone className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = () => {
    if (pwa.installation.isInstalled) {
      return 'Installed';
    }
    if (pwa.installation.isInstallable) {
      return 'Installable';
    }
    return 'Not Available';
  };

  const getConnectionIcon = () => {
    return pwa.isOnline ? 
      <Wifi className="w-4 h-4 text-green-500" /> : 
      <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getNotificationIcon = () => {
    return pwa.notificationsEnabled ? 
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
          onClick={() => pwa.refresh()}
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
            {pwa.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Notifications Status */}
        <div className="flex items-center justify-between" data-testid="notification-status">
          <div className="flex items-center space-x-2">
            {getNotificationIcon()}
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          <span className="text-sm text-gray-600">
            {pwa.notificationsEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* Offline Data */}
        {pwa.hasOfflineData && (
          <div className="flex items-center justify-between" data-testid="offline-data-status">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Offline Data</span>
            </div>
            <span className="text-sm text-gray-600">
              {pwa.offlineVotes} vote{pwa.offlineVotes !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}

        {/* Service Worker Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {pwa.serviceWorker.isActive ? 
              <CheckCircle className="w-4 h-4 text-green-500" /> : 
              <XCircle className="w-4 h-4 text-red-500" />
            }
            <span className="text-sm font-medium text-gray-700">Service Worker</span>
          </div>
          <span className="text-sm text-gray-600">
            {pwa.serviceWorker.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
        {pwa.installation.isInstallable && !pwa.installation.isInstalled && (
          <button
            onClick={() => pwa.promptInstallation()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            data-testid="pwa-status-install-button"
          >
            Install App
          </button>
        )}

        {!pwa.notificationsEnabled && (
          <button
            onClick={() => pwa.requestNotificationPermission()}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            data-testid="request-notification-permission"
          >
            Enable Notifications
          </button>
        )}

        {pwa.hasOfflineData && pwa.isOnline && (
          <button
            onClick={() => pwa.syncOfflineData()}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
            data-testid="sync-offline-data-button"
          >
            Sync Offline Data
          </button>
        )}

        {pwa.serviceWorker.isWaiting && (
          <button
            onClick={() => pwa.skipWaiting()}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
          >
            Update App
          </button>
        )}
      </div>
    </div>
  );
}
