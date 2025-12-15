/**
 * @fileoverview Notification Preferences Component
 * 
 * Comprehensive notification preferences management.
 * Handles permission requests, subscription, and preference toggles.
 * 
 * @author Choices Platform Team
 * @migrated Zustand migration complete - November 4, 2025
 */

'use client';

import { Bell, BellOff, Settings, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { useUser } from '@/lib/stores';
import { usePWAPreferences, usePWAActions } from '@/lib/stores/pwaStore';
import { logger } from '@/lib/utils/logger';

type NotificationPreferencesProps = {
  /** Additional CSS classes */
  className?: string;
};

/**
 * Notification Preferences Component
 * 
 * Advanced notification preference management with:
 * - Permission request handling
 * - Push notification subscription/unsubscription
 * - Individual notification type toggles
 * - Visual feedback for all operations
 * 
 * @param props - Component props
 * @returns Preferences UI or null if notifications not supported
 */
export default function NotificationPreferences({ className = '' }: NotificationPreferencesProps) {
  // PWA preferences are loaded for consistency, but individual notification types are managed separately
  // Hooks must be called unconditionally - stores should handle initialization gracefully
  const preferences = usePWAPreferences();
  const { updatePreferences } = usePWAActions();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [localPreferences, setLocalPreferences] = useState({
    newPolls: true,
    pollResults: true,
    systemUpdates: false,
    weeklyDigest: true,
  });
  const [isMounted, setIsMounted] = useState(false);

  const notificationsSupported = typeof window !== 'undefined' && 'Notification' in window;
  const serviceWorkerSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  // Ensure component only renders on client to avoid hydration mismatches with external stores
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check current permission state
  useEffect(() => {
    if (notificationsSupported) {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationsSupported]);

  // Check if user is already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!serviceWorkerSupported || !user?.id) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        logger.warn('Failed to check push subscription status', err);
      }
    };

    checkSubscription();
  }, [serviceWorkerSupported, user?.id]);

  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      
      if (result === 'granted') {
        setSuccess('Notification permission granted! You can now subscribe to push notifications.');
        updatePreferences({ pushNotifications: true });
        logger.info('Notification permission granted');
      } else if (result === 'denied') {
        setError('Notification permission denied. Please enable notifications in your browser settings.');
        updatePreferences({ pushNotifications: false });
        logger.warn('Notification permission denied');
      } else {
        setError('Notification permission was not granted.');
        updatePreferences({ pushNotifications: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request notification permission.');
      logger.error('Error requesting notification permission:', err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id) {
      setError('You must be logged in to subscribe to push notifications.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Request permission if not already granted
      if (notificationPermission !== 'granted') {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result !== 'granted') {
          setError('Notification permission is required to subscribe.');
          setIsLoading(false);
          return;
        }
      }

      // Check service worker support
      if (!serviceWorkerSupported) {
        setError('Push notifications are not supported in this browser.');
        setIsLoading(false);
        return;
      }

      // Get VAPID public key (support both NEXT_PUBLIC_ prefix and direct name)
      const vapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? 
                       process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? '';
      if (!vapidKey) {
        setError('Push notifications are not configured. Please contact support.');
        logger.error('VAPID public key not configured');
        setIsLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Convert subscription to JSON
      const subscriptionJson = subscription.toJSON();

      // Send subscription to server
      const response = await fetch('/api/pwa/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionJson,
          userId: user.id,
          preferences,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to register subscription');
      }

      const data = await response.json();
      setIsSubscribed(true);
      updatePreferences({ pushNotifications: true });
      setSuccess('Successfully subscribed to push notifications!');
      logger.info('Subscribed to push notifications', { subscriptionId: data.subscriptionId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to push notifications.';
      setError(errorMessage);
      logger.error('Error subscribing to push notifications:', err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.id) {
      setError('You must be logged in to unsubscribe from push notifications.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!serviceWorkerSupported) {
        setError('Push notifications are not supported in this browser.');
        setIsLoading(false);
        return;
      }

      // Get current subscription
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push service
        await subscription.unsubscribe();

        // Remove from server using query parameters
        const url = new URL('/api/pwa/notifications/subscribe', window.location.origin);
        url.searchParams.set('userId', user.id);

        const response = await fetch(url.toString(), {
          method: 'DELETE',
        });

        if (!response.ok) {
          logger.warn('Failed to remove subscription from server, but local unsubscribe succeeded');
        }
      }

      setIsSubscribed(false);
      updatePreferences({ pushNotifications: false });
      setSuccess('Successfully unsubscribed from push notifications.');
      logger.info('Unsubscribed from push notifications');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications.';
      setError(errorMessage);
      logger.error('Error unsubscribing from push notifications:', err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof typeof localPreferences) => {
    const newPreferences = {
      ...localPreferences,
      [key]: !localPreferences[key],
    };
    setLocalPreferences(newPreferences);

    // If subscribed, update preferences on server
    if (isSubscribed && user?.id) {
      try {
        const response = await fetch('/api/pwa/notifications/subscribe', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            preferences: newPreferences,
          }),
        });

        if (!response.ok) {
          logger.warn('Failed to update notification preferences on server');
          // Revert local change
          setLocalPreferences(localPreferences);
          setError('Failed to update notification preferences. Please try again.');
          return;
        }
      } catch (err) {
        logger.error('Error updating notification preferences:', err);
        // Revert local change
        setLocalPreferences(localPreferences);
        setError('Failed to update notification preferences. Please try again.');
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  if (!notificationsSupported) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md" data-testid="notification-preferences-unsupported">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              Notifications are not supported in your browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md" data-testid="notification-preferences-login-required">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Please log in to manage push notification preferences.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg p-6 ${className}`} data-testid="notification-preferences">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2 text-blue-600" /> Notification Preferences
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert" data-testid="notification-error">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Permission Status */}
        <div>
          <p className="text-sm text-gray-700 mb-2">
            Current permission status: <span className={`font-medium ${notificationPermission === 'granted' ? 'text-green-600' : notificationPermission === 'denied' ? 'text-red-600' : 'text-gray-600'}`}>
              {notificationPermission.charAt(0).toUpperCase() + notificationPermission.slice(1)}
            </span>
          </p>
          
          {notificationPermission === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              data-testid="request-notification-permission"
            >
              <Bell className="h-5 w-5 mr-2" />
              {isLoading ? 'Requesting...' : 'Request Notification Permission'}
            </button>
          )}
          
          {notificationPermission === 'granted' && (
            <div className="flex space-x-2">
              {!isSubscribed ? (
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading || !user?.id}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  data-testid="subscribe-notifications"
                >
                  <Bell className="h-5 w-5 mr-2" />
                  {isLoading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
                </button>
              ) : (
                <button
                  onClick={handleUnsubscribe}
                  disabled={isLoading || !user?.id}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  data-testid="unsubscribe-notifications"
                >
                  <BellOff className="h-5 w-5 mr-2" />
                  {isLoading ? 'Unsubscribing...' : 'Unsubscribe from Push Notifications'}
                </button>
              )}
            </div>
          )}
          
          {notificationPermission === 'denied' && (
            <p className="text-sm text-red-600 mt-2">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>

        {/* Notification Types */}
        {isSubscribed && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <label className="text-sm font-medium text-gray-700">New Polls</label>
                  <p className="text-xs text-gray-500">Get notified about new polls</p>
                </div>
              </div>
              <button
                onClick={() => handlePreferenceChange('newPolls')}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  localPreferences.newPolls ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                data-testid="new-polls-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.newPolls ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-green-600" />
                <div>
                  <label className="text-sm font-medium text-gray-700">Poll Results</label>
                  <p className="text-xs text-gray-500">Get notified when polls close with results</p>
                </div>
              </div>
              <button
                onClick={() => handlePreferenceChange('pollResults')}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  localPreferences.pollResults ? 'bg-green-600' : 'bg-gray-200'
                }`}
                data-testid="poll-results-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.pollResults ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-purple-600" />
                <div>
                  <label className="text-sm font-medium text-gray-700">System Updates</label>
                  <p className="text-xs text-gray-500">Get notified about system updates and maintenance</p>
                </div>
              </div>
              <button
                onClick={() => handlePreferenceChange('systemUpdates')}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  localPreferences.systemUpdates ? 'bg-purple-600' : 'bg-gray-200'
                }`}
                data-testid="system-updates-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.systemUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-orange-600" />
                <div>
                  <label className="text-sm font-medium text-gray-700">Weekly Digest</label>
                  <p className="text-xs text-gray-500">Get a weekly summary of activity</p>
                </div>
              </div>
              <button
                onClick={() => handlePreferenceChange('weeklyDigest')}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  localPreferences.weeklyDigest ? 'bg-orange-600' : 'bg-gray-200'
                }`}
                data-testid="weekly-digest-toggle"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
