/**
 * @fileoverview Push Notifications Client Library
 * 
 * Client-side utilities for managing Web Push notifications.
 * Handles subscription, permission requests, and notification display.
 * 
 * @author Choices Platform Team
 */

import { logger } from '@/lib/utils/logger';

import { PUSH_CONFIG } from './sw-config';

/**
 * Push subscription state
 */
export type PushSubscriptionState = {
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  permission: NotificationPermission;
  error?: string;
}

/**
 * Notification options for different types
 */
export type NotificationOptions = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Check if push notifications are supported
 * 
 * @returns {boolean} True if supported
 */
export function isPushNotificationSupported(): boolean {
  return 'PushManager' in window && 
         'Notification' in window &&
         'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 * 
 * @returns {NotificationPermission} Permission status (granted, denied, default)
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
}

/**
 * Request notification permission from user
 * Best UX: Call this in response to user action, with context about why
 * 
 * @param {object} context - Context about why permission is needed
 * @returns {Promise<NotificationPermission>} Permission result
 * 
 * @example
 * ```typescript
 * const permission = await requestNotificationPermission({
 *   reason: 'Get notified when your followed hashtags trend',
 *   feature: 'hashtag-trending'
 * });
 * 
 * if (permission === 'granted') {
 *   await subscribeToPushNotifications();
 * }
 * ```
 */
export async function requestNotificationPermission(context?: {
  reason?: string;
  feature?: string;
}): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    logger.warn('Push notifications not supported');
    return 'denied';
  }
  
  try {
    logger.info('Requesting notification permission', { context });
    
    const permission = await Notification.requestPermission();
    
    logger.info('Notification permission result:', permission);
    
    // Track permission result
    window.dispatchEvent(new CustomEvent('pwa-analytics', {
      detail: {
        eventName: 'notification-permission-requested',
        properties: {
          result: permission,
          ...context,
        },
      },
    }));
    
    return permission;
  } catch (error) {
    logger.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Subscribe to push notifications
 * Requires notification permission and active service worker
 * 
 * @returns {Promise<PushSubscription | null>} Push subscription or null if failed
 * 
 * @example
 * ```typescript
 * const subscription = await subscribeToPushNotifications();
 * if (subscription) {
 *   // Send subscription to backend
 *   await fetch('/api/pwa/notifications/subscribe', {
 *     method: 'POST',
 *     body: JSON.stringify(subscription)
 *   });
 * }
 * ```
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    logger.warn('Push notifications not supported');
    return null;
  }
  
  // Check permission
  if (Notification.permission !== 'granted') {
    logger.warn('Notification permission not granted');
    return null;
  }
  
  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      logger.info('Already subscribed to push notifications');
      return subscription;
    }
    
    // Convert VAPID public key from base64 to Uint8Array
    const vapidPublicKey = PUSH_CONFIG.vapidPublicKey;
    
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.');
    }
    
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    
    // Subscribe to push notifications
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });
    
    logger.info('Subscribed to push notifications');
    
    // Track subscription
    window.dispatchEvent(new CustomEvent('pwa-analytics', {
      detail: {
        eventName: 'push-subscribed',
        properties: {
          endpoint: subscription.endpoint,
        },
      },
    }));
    
    return subscription;
  } catch (error) {
    logger.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * 
 * @returns {Promise<boolean>} True if unsubscribed successfully
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      logger.info('Not subscribed to push notifications');
      return true;
    }
    
    const success = await subscription.unsubscribe();
    
    if (success) {
      logger.info('Unsubscribed from push notifications');
      
      // Track unsubscription
      window.dispatchEvent(new CustomEvent('pwa-analytics', {
        detail: {
          eventName: 'push-unsubscribed',
        },
      }));
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get current push subscription
 * 
 * @returns {Promise<PushSubscription | null>} Current subscription or null
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    logger.error('Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Get push subscription state
 * 
 * @returns {Promise<PushSubscriptionState>} Subscription state
 */
export async function getPushSubscriptionState(): Promise<PushSubscriptionState> {
  const subscription = await getPushSubscription();
  const permission = getNotificationPermission();
  
  return {
    isSubscribed: !!subscription,
    subscription,
    permission,
  };
}

/**
 * Show a local notification (doesn't require backend)
 * Useful for immediate feedback without server interaction
 * 
 * @param {NotificationOptions} options - Notification options
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * await showNotification({
 *   title: 'Vote Recorded',
 *   body: 'Your vote has been saved offline and will sync when online',
 *   icon: '/icons/icon-192x192.svg',
 *   tag: 'vote-recorded'
 * });
 * ```
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!isPushNotificationSupported()) {
    logger.warn('Notifications not supported');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    logger.warn('Notification permission not granted');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || PUSH_CONFIG.defaultOptions.icon,
      badge: options.badge || PUSH_CONFIG.defaultOptions.badge,
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      vibrate: PUSH_CONFIG.defaultOptions.vibrate,
    });
    
    logger.info('Notification shown:', options.title);
  } catch (error) {
    logger.error('Failed to show notification:', error);
  }
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 * Required for push subscription
 * 
 * @param {string} base64String - Base64 encoded VAPID key
 * @returns {Uint8Array} Uint8Array representation
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Test notification (shows example notification)
 * Useful for testing notification permission and display
 * 
 * @returns {Promise<void>}
 */
export async function testNotification(): Promise<void> {
  await showNotification({
    title: 'Choices PWA',
    body: 'Notifications are working! You\'ll receive updates about polls, civic actions, and trending hashtags.',
    icon: '/icons/icon-192x192.svg',
    tag: 'test-notification',
  });
}

