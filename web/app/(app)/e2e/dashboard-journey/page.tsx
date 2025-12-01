'use client';

import { useEffect, useState } from 'react';

import { PersonalDashboard } from '@/features/dashboard';
import { useHashtagStore } from '@/lib/stores/hashtagStore';
import type { NotificationStore } from '@/lib/stores/notificationStore';
import { useNotificationActions, useNotificationStore } from '@/lib/stores/notificationStore';
import { usePollsStore } from '@/lib/stores/pollsStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { useRepresentativeStore, type UserRepresentativeEntry } from '@/lib/stores/representativeStore';
import { useUserStore } from '@/lib/stores/userStore';
import type { ProfileUser } from '@/types/profile';

type NotificationHarnessRef = {
  clearAll: NotificationStore['clearAll'];
  updateSettings: NotificationStore['updateSettings'];
  getSnapshot: () => NotificationStore;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    __notificationHarnessRef?: NotificationHarnessRef;
  }
}

export default function DashboardJourneyHarnessPage() {
  const [ready, setReady] = useState(false);
  const { clearAll, updateSettings } = useNotificationActions();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const harness: NotificationHarnessRef = {
      clearAll,
      updateSettings,
      getSnapshot: () => useNotificationStore.getState(),
    };

    window.__notificationHarnessRef = harness;
  }, [clearAll, updateSettings]);

  useEffect(() => {
    const userId = 'dashboard-harness-user';
    const profileId = 'dashboard-harness-profile';
    const nowIso = new Date().toISOString();

    const supabaseUser = {
      id: userId,
      aud: 'authenticated',
      email: 'dashboard-harness@example.com',
      email_confirmed_at: nowIso,
      phone: '',
      phone_confirmed_at: nowIso,
      confirmed_at: nowIso,
      last_sign_in_at: nowIso,
      role: 'authenticated',
      created_at: nowIso,
      updated_at: nowIso,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: 'Dashboard Harness User' },
      identities: [],
      factors: [],
      raw_app_meta_data: {},
      raw_user_meta_data: { full_name: 'Dashboard Harness User' },
    };

    useUserStore.setState((state) => {
      const draft = state as any;
      draft.user = supabaseUser;
      draft.session = {
        access_token: 'dashboard-harness-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'dashboard-harness-refresh',
        provider_token: null,
        provider_refresh_token: null,
        user: supabaseUser,
      };
      draft.isAuthenticated = true;
      draft.error = null;
      draft.isLoading = false;
    });

    const profile: ProfileUser = {
      id: profileId,
      user_id: userId,
      email: 'dashboard-harness@example.com',
      username: 'dashboard-harness',
      display_name: 'Dashboard Harness User',
      bio: 'Seeded by dashboard journey harness',
      avatar_url: null,
      community_focus: [],
      primary_concerns: [],
      participation_style: 'participant',
      privacy_settings: null,
      analytics_dashboard_mode: null,
      dashboard_layout: null,
      demographics: null,
      trust_tier: null,
      is_active: true,
      is_admin: false,
      created_at: nowIso,
      updated_at: nowIso,
    } as ProfileUser;

    useProfileStore.setState((state) => {
      const draft = state as any;
      draft.profile = profile;
      draft.isProfileLoaded = true;
      draft.error = null;
      draft.isProfileComplete = true;
      draft.profileCompleteness = 100;
    });

    usePollsStore.setState((state) => {
      const draft = state as any;
      draft.lastFetchedAt = nowIso;
      draft.polls = [];
      draft.isLoading = false;
    });
    usePollsStore.getState().loadPolls = async () => {
      usePollsStore.setState((state) => {
        const draft = state as any;
        draft.lastFetchedAt = new Date().toISOString();
        draft.isLoading = false;
      });
    };

    useHashtagStore.getState().getTrendingHashtags = async () => Promise.resolve();
    useRepresentativeStore.getState().getUserRepresentatives = async () =>
      Promise.resolve([] as UserRepresentativeEntry[]);

    if (typeof document !== 'undefined') {
      document.documentElement.dataset.dashboardJourneyHarness = 'ready';
    }

    setReady(true);

    return () => {
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.dashboardJourneyHarness;
      }
    };
  }, []);

  if (!ready) {
    return (
      <div
        data-testid="dashboard-harness-loading"
        className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600"
      >
        Preparing dashboard harness…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* E2E harness accessibility hook: surface a simple, non-empty live message about feeds */}
      <p
        data-testid="feeds-live-message"
        className="sr-only"
      >
        Feeds are live and loaded for the dashboard harness.
      </p>
      <PersonalDashboard />
    </div>
  );
}
