import type { OnboardingStoreHarness } from '@/app/(app)/e2e/onboarding-store/page';
import type { UserStoreHarness } from '@/app/(app)/e2e/user-store/page';
import type { AnalyticsStoreHarness } from '@/app/(app)/e2e/analytics-store/page';
import type { NavigationShellHarness } from '@/app/(app)/e2e/navigation-shell/page';
import type { NotificationStoreHarness } from '@/app/(app)/e2e/notification-store/page';
import type { PlaywrightAnalyticsBridge } from '@/types/playwright-analytics';

export {};

declare global {
   
  interface Window {
    __analyticsStoreHarness?: AnalyticsStoreHarness;
    __navigationShellHarness?: NavigationShellHarness;
    __notificationStoreHarness?: NotificationStoreHarness;
    __playwrightAnalytics?: PlaywrightAnalyticsBridge;
    __pwaQueueHarness?: {
      setQueueState?: (count: number, state: Record<string, unknown>) => void;
      reset?: () => void;
    };
    __onboardingStoreHarness?: OnboardingStoreHarness;
    __userStoreHarness?: UserStoreHarness;
    deferredPrompt?: {
      prompt: () => Promise<void>;
      userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    lastNotification?: Notification & {
      tag?: string;
      data?: unknown;
    };
    notificationClicked?: boolean;
  }

   
  interface ServiceWorkerRegistration {
    sync?: {
      register: (tag: string) => Promise<void>;
    };
  }

   
  var __playwrightAnalytics: PlaywrightAnalyticsBridge | undefined;
  var __analyticsStoreHarness: AnalyticsStoreHarness | undefined;
  var __navigationShellHarness: NavigationShellHarness | undefined;
  var __notificationStoreHarness: NotificationStoreHarness | undefined;
  var __pwaQueueHarness: NonNullable<Window['__pwaQueueHarness']>;
  var __onboardingStoreHarness: NonNullable<Window['__onboardingStoreHarness']>;
  var __userStoreHarness: NonNullable<Window['__userStoreHarness']>;
  var deferredPrompt: NonNullable<Window['deferredPrompt']>;
  var lastNotification: NonNullable<Window['lastNotification']>;
  var notificationClicked: NonNullable<Window['notificationClicked']>;
}

