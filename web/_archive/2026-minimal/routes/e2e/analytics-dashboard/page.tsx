'use client';

import { useCallback, useEffect, useRef } from 'react';

import { AnalyticsTestBridge } from '@/app/(app)/e2e/_components/AnalyticsTestBridge';

import { EnhancedAnalyticsDashboard } from '@/features/analytics/components/EnhancedAnalyticsDashboard';

import { useUserStore } from '@/lib/stores/userStore';

import type { User } from '@supabase/supabase-js';

const HARNESS_ADMIN_USER: User = {
  id: 'analytics-harness-admin',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'harness-admin@choices-admin.com',
  email_confirmed_at: '2025-11-01T00:00:00.000Z',
  phone: '',
  last_sign_in_at: '2025-11-13T12:00:00.000Z',
  created_at: '2025-11-01T00:00:00.000Z',
  updated_at: '2025-11-13T12:00:00.000Z',
  confirmation_sent_at: null,
  confirmed_at: '2025-11-01T00:00:00.000Z',
  app_metadata: {
    role: 'admin',
  },
  user_metadata: {
    role: 'admin',
    full_name: 'Analytics Harness Admin',
    trust_tier: 'T3',
  },
  identities: [],
  factors: [],
} as unknown as User;

export default function AnalyticsDashboardHarnessPage() {
  const hasSeededUserRef = useRef(false);

  const seedHarnessUser = useCallback(() => {
    if (hasSeededUserRef.current) {
      return;
    }
    useUserStore.getState().initializeAuth(HARNESS_ADMIN_USER, null, true);
    hasSeededUserRef.current = true;
  }, []);

  useEffect(() => {
    const persistApi = (useUserStore as typeof useUserStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribeHydration: (() => void) | void;

    if (persistApi?.hasHydrated?.()) {
      seedHarnessUser();
    } else if (persistApi?.onFinishHydration) {
      unsubscribeHydration = persistApi.onFinishHydration(() => {
        seedHarnessUser();
      });
    } else {
      seedHarnessUser();
    }

    return () => {
      if (typeof unsubscribeHydration === 'function') {
        unsubscribeHydration();
      }
    };
  }, [seedHarnessUser]);

  useEffect(() => {
    return () => {
      useUserStore.getState().initializeAuth(null, null, false);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.analyticsDashboardHarness = 'ready';
    return () => {
      if (document.documentElement.dataset.analyticsDashboardHarness) {
        delete document.documentElement.dataset.analyticsDashboardHarness;
      }
    };
  }, []);

  return (
    <main
      data-testid="analytics-dashboard-harness"
      className="min-h-screen bg-slate-50 p-6"
    >
      <AnalyticsTestBridge />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2 rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">
            Analytics dashboard harness
          </h1>
          <p className="text-sm text-muted-foreground">
            Renders the enhanced analytics dashboard with seeded data so Playwright can audit accessibility,
            summaries, and keyboard affordances without live Supabase dependencies.
          </p>
          <p className="text-xs text-muted-foreground">
            Set <code>window.document.documentElement.dataset.analyticsDashboardHarness</code> to confirm readiness.
          </p>
        </header>

        <section className="rounded-lg border bg-white p-6 shadow-sm">
          <EnhancedAnalyticsDashboard enableRealTime={false} skipAccessGuard />
        </section>
      </div>
    </main>
  );
}

