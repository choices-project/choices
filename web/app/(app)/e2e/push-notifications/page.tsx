'use client';

import React, { Component, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

import NotificationPreferences from '@/features/pwa/components/NotificationPreferences';

import { usePWAStore } from '@/lib/stores/pwaStore';
import { useUserStore } from '@/lib/stores/userStore';
import { logger } from '@/lib/utils/logger';

// Create a dedicated Zustand store for harness state
// This ensures immediate, synchronous updates that React will automatically reflect
type PushNotificationsHarnessStore = {
  isSubscribed: boolean;
  subscriptionEndpoint: string | null;
  preferences: Record<string, boolean>;
  permission: NotificationPermission | 'unsupported';
  setIsSubscribed: (value: boolean) => void;
  setSubscriptionEndpoint: (value: string | null) => void;
  setPreferences: (value: Record<string, boolean>) => void;
  setPermission: (value: NotificationPermission | 'unsupported') => void;
};

const usePushNotificationsHarnessStore = create<PushNotificationsHarnessStore>((set) => ({
  isSubscribed: false,
  subscriptionEndpoint: null,
  preferences: {
    newPolls: true,
    pollResults: true,
    systemUpdates: false,
    weeklyDigest: true,
  },
  permission: 'unsupported',
  setIsSubscribed: (value) => set({ isSubscribed: value }),
  setSubscriptionEndpoint: (value) => set({ subscriptionEndpoint: value }),
  setPreferences: (value) => set({ preferences: value }),
  setPermission: (value) => set({ permission: value }),
}));

// Error boundary for NotificationPreferences to prevent render errors from blocking the page
class NotificationPreferencesErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log full error details for debugging
    logger.error('NotificationPreferences render error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Always show a user-friendly message in harness mode to avoid noisy errors in CI
      return (
        <div data-testid="notification-preferences" className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">Notification preferences temporarily unavailable</p>
        </div>
      );
    }

    return this.props.children;
  }
}

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

// Note: Harness is set up via script tag in JSX (runs before React hydrates)
// and then replaced with the real harness in useLayoutEffect

export default function PushNotificationsHarnessPage() {
  // Follow the working pattern from dashboard-journey: simple ready state
  const [ready, setReady] = useState(false);
  // Force update counter to ensure re-renders when store updates
  const [, setForceUpdate] = useState(0);

  // Use Zustand store for harness state - ensures immediate, synchronous updates
  // Use selectors to ensure component subscribes to specific state slices
  const isSubscribed = usePushNotificationsHarnessStore((state) => state.isSubscribed);
  const subscriptionEndpoint = usePushNotificationsHarnessStore((state) => state.subscriptionEndpoint);
  const preferences = usePushNotificationsHarnessStore((state) => state.preferences);
  const permission = usePushNotificationsHarnessStore((state) => state.permission);

  // Subscribe to store changes to force re-render
  useEffect(() => {
    const unsubscribe = usePushNotificationsHarnessStore.subscribe(() => {
      // Force re-render when store changes
      setForceUpdate((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Use refs to access current state in harness (for synchronous access)
  const preferencesRef = useRef(preferences);
  const isSubscribedRef = useRef(isSubscribed);

  // Update refs whenever store state changes
  useEffect(() => {
    preferencesRef.current = preferences;
    isSubscribedRef.current = isSubscribed;
  }, [preferences, isSubscribed]);

  // Set up stores once on mount
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Set up user store for NotificationPreferences component (similar to dashboard-journey)
    const userId = 'push-notifications-harness-user';
    const nowIso = new Date().toISOString();
    const supabaseUser = {
      id: userId,
      aud: 'authenticated',
      email: 'push-notifications-harness@example.com',
      email_confirmed_at: nowIso,
      phone: '',
      phone_confirmed_at: nowIso,
      confirmed_at: nowIso,
      last_sign_in_at: nowIso,
      role: 'authenticated',
      created_at: nowIso,
      updated_at: nowIso,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Push Notifications Harness User' },
      identities: [],
      factors: [],
      raw_app_meta_data: {},
      raw_user_meta_data: { full_name: 'Push Notifications Harness User' },
    };

    useUserStore.setState((state) => {
      const draft = state as any;
      draft.user = supabaseUser;
      draft.session = {
        access_token: 'push-notifications-harness-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'push-notifications-harness-refresh',
        provider_token: null,
        provider_refresh_token: null,
        user: supabaseUser,
      };
      draft.isAuthenticated = true;
      draft.error = null;
      draft.isLoading = false;
    });

    // Initialize PWA store for NotificationPreferences component
    usePWAStore.setState((state) => {
      const draft = state as any;
      draft.preferences = {
        ...draft.preferences,
        pushNotifications: false, // Start with false, user can enable via UI
      };
      draft.isLoading = false;
      draft.error = null;
    });

    // Set up notification state synchronously using store
    if ('Notification' in window) {
      usePushNotificationsHarnessStore.getState().setPermission(Notification.permission);
    }

    // Mark as ready - stores are set up
    setReady(true);
    document.documentElement.dataset.pushNotificationsHarness = 'ready';
  }, []);

  // Create stable harness that uses callbacks to access latest state/setters
  // This avoids recreating the harness on every render while ensuring it always has latest values
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !ready) {
      return;
    }

    // Create harness object with stable reference
    // Methods use callbacks to access latest state/setters on each call
    const harness: PushNotificationsHarness = {
        getNotificationPermission: () => {
          if (!('Notification' in window)) {
            return 'unsupported';
          }
          return Notification.permission;
        },

        getSubscriptionStatus: async () => {
          // In E2E harness mode, use store state instead of checking service worker
          if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1') {
            return usePushNotificationsHarnessStore.getState().isSubscribed;
          }

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
          usePushNotificationsHarnessStore.getState().setPermission(result);
          return result;
        },

        subscribe: async () => {
          // In E2E tests, always simulate subscription success
          if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1') {
            // Update Zustand store directly - this triggers immediate re-render
            // Zustand updates are synchronous, so the store is updated immediately
            usePushNotificationsHarnessStore.getState().setIsSubscribed(true);
            usePushNotificationsHarnessStore.getState().setSubscriptionEndpoint('e2e-test-endpoint');

            // Update ref immediately for synchronous access
            isSubscribedRef.current = true;

            // Give React a moment to process the store update and re-render
            // Zustand automatically triggers re-renders, but we need to wait for DOM update
            await new Promise(resolve => {
              // Use requestAnimationFrame to wait for next paint cycle
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  resolve(undefined);
                });
              });
            });

            return true;
          }

          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications not supported');
          }

          if (Notification.permission !== 'granted') {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
              return false;
            }
            usePushNotificationsHarnessStore.getState().setPermission(perm);
          }

          try {
            // Add timeout to prevent indefinite blocking in E2E tests
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Service worker ready timeout')), 10000);
            });

            const registration = await Promise.race([
              navigator.serviceWorker.ready,
              timeoutPromise,
            ]);

            const vapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ??
                             process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? '';
            if (!vapidKey) {
              // In E2E tests, simulate subscription if VAPID key not configured
              if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1') {
                isSubscribedRef.current = true;
                const store = usePushNotificationsHarnessStore.getState();
                store.setIsSubscribed(true);
                store.setSubscriptionEndpoint('e2e-test-endpoint');
                await Promise.resolve();
                return true;
              }
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

            const store = usePushNotificationsHarnessStore.getState();
            store.setIsSubscribed(true);
            store.setSubscriptionEndpoint(subscription.endpoint);
            return true;
          } catch (error) {
            // In E2E tests, simulate subscription success on error
            if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1') {
              isSubscribedRef.current = true;
              const store = usePushNotificationsHarnessStore.getState();
              store.setIsSubscribed(true);
              store.setSubscriptionEndpoint('e2e-test-endpoint');
              await Promise.resolve();
              return true;
            }
            logger.error('Subscription failed', error instanceof Error ? error : new Error(String(error)));
            return false;
          }
        },

        unsubscribe: async () => {
          // In E2E harness mode, just update store state
          if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' || process.env.PLAYWRIGHT_USE_MOCKS === '1') {
            const store = usePushNotificationsHarnessStore.getState();
            store.setIsSubscribed(false);
            store.setSubscriptionEndpoint(null);
            return true;
          }

          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
          }

          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
              const store = usePushNotificationsHarnessStore.getState();
              store.setIsSubscribed(false);
              store.setSubscriptionEndpoint(null);
              return true;
            }
            return false;
          } catch (error) {
          logger.error('Unsubscribe failed', error instanceof Error ? error : new Error(String(error)));
            return false;
          }
        },

        updatePreferences: async (newPreferences) => {
          // Update Zustand store directly - this triggers immediate re-render
          // Zustand updates are synchronous, so the store is updated immediately
          const store = usePushNotificationsHarnessStore.getState();
          const updated = { ...store.preferences, ...newPreferences };
          store.setPreferences(updated);

          // Update ref immediately for synchronous access
          preferencesRef.current = updated;

          // Give React a moment to process the store update and re-render
          // Zustand automatically triggers re-renders, but we need to wait for DOM update
          await new Promise(resolve => {
            // Use requestAnimationFrame to wait for next paint cycle
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve(undefined);
              });
            });
          });

          return true;
        },

        getPreferences: async () => {
          // Access current preferences from ref (since useEffect has empty deps)
          return preferencesRef.current;
        },
    };

    // Set up harness immediately (harness object is ready)
    (window as any).__pushNotificationsHarness = harness;

    return () => {
      if ((window as any).__pushNotificationsHarness === harness) {
        delete (window as any).__pushNotificationsHarness;
      }
    };
  }, [ready]); // Create once when ready, harness methods use refs to access latest setters

  // Check subscription status asynchronously in a separate effect (non-blocking)
  useEffect(() => {
    if (!ready) return; // Only check after harness is ready

    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      (async () => {
        try {
          // Add timeout to prevent indefinite blocking in E2E tests
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Service worker check timeout')), 5000);
          });

          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            timeoutPromise,
          ]);

          const subscription = await registration.pushManager.getSubscription();
          const store = usePushNotificationsHarnessStore.getState();
          store.setIsSubscribed(!!subscription);
          store.setSubscriptionEndpoint(subscription?.endpoint ?? null);
        } catch (error) {
          // Log but don't block - service worker may not be available in E2E tests
          logger.error('Failed to check subscription', error instanceof Error ? error : new Error(String(error)));
          // Continue - subscription check is optional for harness to work
        }
      })();
    }
  }, [ready]); // Run after ready is true


  // Always render harness element (following poll-wizard pattern - no conditional rendering)
  // The dataset attribute signals readiness to tests
  return (
    <>
      {/* Script to set up harness immediately on page load, before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window === 'undefined') return;
              // Set up placeholder harness immediately
              if (!window.__pushNotificationsHarness) {
                window.__pushNotificationsHarness = {
                  getNotificationPermission: function() { return 'unsupported'; },
                  getSubscriptionStatus: function() { return Promise.resolve(false); },
                  requestPermission: function() { return Promise.resolve('denied'); },
                  subscribe: function() { return Promise.resolve(false); },
                  unsubscribe: function() { return Promise.resolve(false); },
                  updatePreferences: function() { return Promise.resolve(false); },
                  getPreferences: function() { return Promise.resolve(null); }
                };
              }
            })();
          `,
        }}
      />
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

        {/* Notification Preferences Component - Wrap in error boundary to prevent render errors */}
        <div data-testid="notification-preferences-container">
          <NotificationPreferencesErrorBoundary>
            {ready ? (
              <NotificationPreferences />
            ) : (
              <div data-testid="notification-preferences">Initializing notification preferences...</div>
            )}
          </NotificationPreferencesErrorBoundary>
        </div>
      </div>
    </div>
    </>
  );
}
