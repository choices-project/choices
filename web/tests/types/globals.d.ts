import type { OnboardingStoreHarness } from '@/app/(app)/e2e/onboarding-store/page';
import type { UserStoreHarness } from '@/app/(app)/e2e/user-store/page';
import type { PlaywrightAnalyticsBridge } from '@/types/playwright-analytics';

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
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

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ServiceWorkerRegistration {
    sync?: {
      register: (tag: string) => Promise<void>;
    };
  }

  // eslint-disable-next-line no-var
  var __playwrightAnalytics: PlaywrightAnalyticsBridge | undefined;
  var __pwaQueueHarness: NonNullable<Window['__pwaQueueHarness']>;
  var __onboardingStoreHarness: NonNullable<Window['__onboardingStoreHarness']>;
  var __userStoreHarness: NonNullable<Window['__userStoreHarness']>;
  var deferredPrompt: NonNullable<Window['deferredPrompt']>;
  var lastNotification: NonNullable<Window['lastNotification']>;
  var notificationClicked: NonNullable<Window['notificationClicked']>;
}

