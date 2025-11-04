/**
 * @fileoverview Notification Settings Component
 * 
 * Toggle notification subscription on/off.
 * Manages push notification preferences via Zustand store.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

'use client'

import { useState, useEffect } from 'react';

import { usePWAStore } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/utils/logger';

type NotificationSettingsProps = {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Notification Settings Component
 * 
 * Provides toggle UI for enabling/disabling push notifications.
 * Handles permission requests and updates store preferences.
 * Shows current permission status and support information.
 * 
 * @param props - Component props
 * @returns Settings UI or null if notifications not supported
 */
export default function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { preferences, updatePreferences } = usePWAStore();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const notificationsSupported = 'Notification' in window;

  useEffect(() => {
    // Check current notification status from preferences
    setIsSubscribed(preferences.pushNotifications && Notification.permission === 'granted');
    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [preferences.pushNotifications, notificationsSupported]);

  const handleToggleNotifications = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isSubscribed) {
        // Unsubscribe from notifications
        updatePreferences({ pushNotifications: false });
        setIsSubscribed(false);
        logger.info('Successfully unsubscribed from notifications');
      } else {
        // Check permission first
        if (Notification.permission !== 'granted') {
          const result = await Notification.requestPermission();
          if (result !== 'granted') {
            setError('Notification permission required');
            setIsLoading(false);
            return;
          }
        }
        // Subscribe to notifications
        updatePreferences({ pushNotifications: true });
        setIsSubscribed(true);
        logger.info('Successfully subscribed to notifications');
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
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        logger.info('Notification permission granted');
        // Auto-subscribe after permission is granted
        updatePreferences({ pushNotifications: true });
        setIsSubscribed(true);
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
  if (!('Notification' in window)) {
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
        {notificationPermission === 'default' ? (
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
            <strong>Permission Status:</strong> {notificationPermission}
          </p>
          <p>
            <strong>Supported:</strong> {notificationsSupported ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </div>
  );
}
