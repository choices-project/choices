'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import NotificationPreferences from '@/features/pwa/components/NotificationPreferences';

import { usePWAStore } from '@/lib/stores/pwaStore';
import { useUserStore } from '@/lib/stores/userStore';
import { logger } from '@/lib/utils/logger';

const isProduction = process.env.NODE_ENV === 'production';
const allowHarness = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

export type PushNotificationsHarness = {
  getNotificationPermission: () => NotificationPermission | 'unsupported';
  getSubscriptionStatus: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (preferences: { newPolls?: boolean; pollResults?: boolean; systemUpdates?: boolean; weeklyDigest?: boolean }) => Promise<boolean>;
  getPreferences: () => Promise<Record<string, boolean> | null>;
};

declare global {
  var __pushNotificationsHarness: PushNotificationsHarness | undefined;
}

export default function PushNotificationsHarnessPage() {
  if (isProduction && !allowHarness) {
    notFound();
  }

  // In E2E/test environments, skip hydration wait to speed up tests
  // Check E2E mode - only use NEXT_PUBLIC_ vars (available in browser)
  // Use a function to check E2E mode that works in both SSR and client
  const checkIsE2E = () => {
    if (typeof window !== 'undefined') {
      // Client-side: check environment variable
      return process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
    }
    // Server-side: also check environment variable (available during build)
    return process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';
  };
  
  const [isE2E] = useState(() => checkIsE2E());
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEndpoint, setSubscriptionEndpoint] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    newPolls: true,
    pollResults: true,
    systemUpdates: false,
    weeklyDigest: true,
  });
  
  // In E2E mode, always start as ready (skip hydration wait)
  const [storesReady, setStoresReady] = useState(isE2E);

  useEffect(() => {
    if (isE2E) {
      // Set stores as ready immediately in E2E mode
      setStoresReady(true);
      return;
    }

    const userPersist = (useUserStore as typeof useUserStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;
    const pwaPersist = (usePWAStore as typeof usePWAStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let userReady = userPersist?.hasHydrated?.() ?? true;
    let pwaReady = pwaPersist?.hasHydrated?.() ?? true;
    const unsubscribers: Array<(() => void) | void> = [];

    if (!userReady && userPersist?.onFinishHydration) {
      const unsub = userPersist.onFinishHydration(() => {
        userReady = true;
        if (userReady && pwaReady) {
          setStoresReady(true);
        }
      });
      unsubscribers.push(unsub);
    }

    if (!pwaReady && pwaPersist?.onFinishHydration) {
      const unsub = pwaPersist.onFinishHydration(() => {
        pwaReady = true;
        if (userReady && pwaReady) {
          setStoresReady(true);
        }
      });
      unsubscribers.push(unsub);
    }

    if (userReady && pwaReady) {
      setStoresReady(true);
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [isE2E]); // Include isE2E for completeness (it's constant but React wants it)

  useEffect(() => {
    // In E2E mode, skip notification check (not needed for harness)
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    
    // In non-E2E mode, wait for stores to be ready
    if (!isE2E && !storesReady) {
      return;
    }

    setPermission(Notification.permission);

    const checkSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
          setSubscriptionEndpoint(subscription?.endpoint ?? null);
        } catch (error) {
          logger.error('Failed to check subscription', error instanceof Error ? error : new Error(String(error)));
        }
      }
    };

    checkSubscription();
  }, [storesReady, isE2E]); // Include isE2E for completeness (it's constant but React wants it)

  useEffect(() => {
    // In E2E mode, always set up harness (stores are skipped)
    if (typeof window === 'undefined') {
      return;
    }
    
    // In non-E2E mode, wait for stores to be ready
    if (!isE2E && !storesReady) {
      return;
    }

    const harness: PushNotificationsHarness = {
      getNotificationPermission: () => {
        if (!('Notification' in window)) {
          return 'unsupported';
        }
        return Notification.permission;
      },

      getSubscriptionStatus: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return false;
        }
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          return !!subscription;
        } catch {
          return false;
        }
      },

      requestPermission: async () => {
        if (!('Notification' in window)) {
          throw new Error('Notifications not supported');
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      },

      subscribe: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          throw new Error('Push notifications not supported');
        }

        if (Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            return false;
          }
          setPermission(perm);
        }

        try {
          const registration = await navigator.serviceWorker.ready;
          const vapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? 
                           process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? '';
          if (!vapidKey) {
            throw new Error('VAPID key not configured');
          }

          const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
            const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          };

          const applicationServerKey = urlBase64ToUint8Array(vapidKey);
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });

          setIsSubscribed(true);
          setSubscriptionEndpoint(subscription.endpoint);
          return true;
        } catch (error) {
        logger.error('Subscription failed', error instanceof Error ? error : new Error(String(error)));
          return false;
        }
      },

      unsubscribe: async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return false;
        }

        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            setIsSubscribed(false);
            setSubscriptionEndpoint(null);
            return true;
          }
          return false;
        } catch (error) {
        logger.error('Unsubscribe failed', error instanceof Error ? error : new Error(String(error)));
          return false;
        }
      },

      updatePreferences: async (newPreferences) => {
        setPreferences((prev) => ({ ...prev, ...newPreferences }));
        return true;
      },

      getPreferences: async () => {
        return preferences;
      },
    };

    (window as any).__pushNotificationsHarness = harness;
    document.documentElement.dataset.pushNotificationsHarness = 'ready';

    return () => {
      delete (window as any).__pushNotificationsHarness;
      delete document.documentElement.dataset.pushNotificationsHarness;
    };
  }, [preferences, storesReady, isE2E]); // Include isE2E for completeness (it's constant but React wants it)

  // In E2E mode, always render harness immediately (stores are skipped)
  // In non-E2E mode, wait for stores to hydrate
  // Ensure harness always renders in E2E mode - check isE2E directly to avoid hydration issues
  const shouldShowLoading = !isE2E && !storesReady;
  
  if (shouldShowLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600"
        data-testid="push-notifications-hydrating"
      >
        Preparing push notification harness…
      </div>
    );
  }

  // Always render harness in E2E mode, or when stores are ready
  return (
    <div className="min-h-screen bg-gray-50 p-8" data-testid="push-notifications-harness">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Push Notifications E2E Harness</h1>
        <p className="text-gray-600 mb-8">
          Test harness for push notification functionality
        </p>

        {/* Status Panel */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6" data-testid="push-notifications-status">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-700">Permission:</span>{' '}
              <span data-testid="push-notification-permission" className="text-gray-900">
                {permission}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Subscribed:</span>{' '}
              <span data-testid="push-notification-subscribed" className="text-gray-900">
                {isSubscribed ? 'Yes' : 'No'}
              </span>
            </div>
            {subscriptionEndpoint && (
              <div>
                <span className="font-medium text-gray-700">Endpoint:</span>{' '}
                <span data-testid="push-notification-endpoint" className="text-xs text-gray-500 break-all">
                  {subscriptionEndpoint}
                </span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Preferences:</span>
              <div className="mt-2 space-y-1" data-testid="push-notification-preferences">
                <div>New Polls: <span data-testid="pref-new-polls">{preferences.newPolls ? 'Enabled' : 'Disabled'}</span></div>
                <div>Poll Results: <span data-testid="pref-poll-results">{preferences.pollResults ? 'Enabled' : 'Disabled'}</span></div>
                <div>System Updates: <span data-testid="pref-system-updates">{preferences.systemUpdates ? 'Enabled' : 'Disabled'}</span></div>
                <div>Weekly Digest: <span data-testid="pref-weekly-digest">{preferences.weeklyDigest ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences Component */}
        <div data-testid="notification-preferences-container">
          <NotificationPreferences />
        </div>
      </div>
    </div>
  );
}
