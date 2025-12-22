'use client';

import { useEffect, useRef, useState } from 'react';

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
  var __notificationHarnessRef: NotificationHarnessRef | undefined;
}

export default function DashboardJourneyHarnessPage() {
  const [ready, setReady] = useState(false);
  const { clearAll, updateSettings } = useNotificationActions();

  // Use refs for stable harness setup
  const clearAllRef = useRef(clearAll);
  useEffect(() => { clearAllRef.current = clearAll; }, [clearAll]);
  const updateSettingsRef = useRef(updateSettings);
  useEffect(() => { updateSettingsRef.current = updateSettings; }, [updateSettings]);

  // Guard to prevent re-initialization (fixes React Error #185)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const harness: NotificationHarnessRef = {
      clearAll: (...args) => clearAllRef.current(...args),
      updateSettings: (...args) => updateSettingsRef.current(...args),
      getSnapshot: () => useNotificationStore.getState(),
    };

    window.__notificationHarnessRef = harness;
  }, []); // Empty deps - harness setup runs once

  // Initialize harness state using useLayoutEffect to run synchronously before paint
  // This prevents render-triggered re-renders that could cause infinite loops
  useEffect(() => {
    // Guard: only initialize once to prevent infinite re-renders
    if (initializedRef.current || typeof window === 'undefined') {
      return;
    }
    
    // Set guard immediately to prevent any re-entry
    initializedRef.current = true;

    const initializeHarness = () => {
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

      // Prepare profile data before batching updates
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

      // Batch all state updates together to minimize re-renders
      // This prevents React Error #185 by ensuring all updates happen in sequence
      // Update user store
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

      // Update profile store
      useProfileStore.setState((state) => {
        const draft = state as any;
        draft.profile = profile;
        draft.isProfileLoaded = true;
        draft.error = null;
        draft.isProfileComplete = true;
        draft.profileCompleteness = 100;
      });

      // Update polls store
      usePollsStore.setState((state) => {
        const draft = state as any;
        draft.lastFetchedAt = nowIso;
        draft.polls = [];
        draft.isLoading = false;
      });
      
      // Mock loadPolls function
      usePollsStore.getState().loadPolls = async () => {
        usePollsStore.setState((state) => {
          const draft = state as any;
          draft.lastFetchedAt = new Date().toISOString();
          draft.isLoading = false;
        });
      };

      // Mock other store functions
      useHashtagStore.getState().getTrendingHashtags = async () => Promise.resolve();
      useRepresentativeStore.getState().getUserRepresentatives = async () =>
        Promise.resolve([] as UserRepresentativeEntry[]);

      // Mark harness as ready
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.dashboardJourneyHarness = 'ready';
      }

      // Set ready state in next tick to allow stores to settle
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setReady(true);
      });
    };

    // Initialize immediately
    initializeHarness();

    // Cleanup function
    return () => {
      // Don't reset initializedRef here - we want it to persist across re-renders
      // Only reset if component actually unmounts (this cleanup should rarely run)
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.dashboardJourneyHarness;
      }
    };
  }, []); // Empty deps - only run once on mount

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
      <PersonalDashboard />
    </div>
  );
}
