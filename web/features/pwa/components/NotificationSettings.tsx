'use client'

import React, { useState, useEffect } from 'react';


import { usePWA } from '@/hooks/usePWA';
import { logger } from '@/lib/utils/logger';

type NotificationSettingsProps = {
  className?: string;
}

export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const pwa = usePWA();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check current notification status
    setIsSubscribed(pwa.notificationsEnabled);
  }, [pwa.notificationsEnabled]);

  const handleToggleNotifications = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isSubscribed) {
        // Unsubscribe from notifications
        const success = await pwa.unsubscribeFromNotifications();
        if (success) {
          setIsSubscribed(false);
          logger.info('Successfully unsubscribed from notifications');
        } else {
          setError('Failed to unsubscribe from notifications');
        }
      } else {
        // Subscribe to notifications
        const success = await pwa.subscribeToNotifications();
        if (success) {
          setIsSubscribed(true);
          logger.info('Successfully subscribed to notifications');
        } else {
          setError('Failed to subscribe to notifications');
        }
      }
    } catch (error) {
      logger.error('Notification toggle failed:', error instanceof Error ? error : new Error(String(error)));
      setError('An error occurred while updating notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const granted = await pwa.requestNotificationPermission();
      if (granted) {
        logger.info('Notification permission granted');
        // Try to subscribe after permission is granted
        const success = await pwa.subscribeToNotifications();
        if (success) {
          setIsSubscribed(true);
        }
      } else {
        setError('Notification permission denied');
      }
    } catch (error) {
      logger.error('Permission request failed:', error instanceof Error ? error : new Error(String(error)));
      setError('Failed to request notification permission');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if notifications are not supported
  if (!pwa.notificationsSupported) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
          <p className="text-sm text-gray-600">
            Get notified about new polls and important updates
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>
            {isSubscribed ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {pwa.notificationsPermission === 'default' ? (
          <button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Requesting...' : 'Enable Notifications'}
          </button>
        ) : (
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubscribed
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isLoading
              ? 'Updating...'
              : isSubscribed
              ? 'Disable Notifications'
              : 'Enable Notifications'}
          </button>
        )}

        <div className="text-xs text-gray-500">
          <p>
            <strong>Permission Status:</strong> {pwa.notificationsPermission}
          </p>
          <p>
            <strong>Supported:</strong> {pwa.notificationsSupported ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </div>
  );
}
