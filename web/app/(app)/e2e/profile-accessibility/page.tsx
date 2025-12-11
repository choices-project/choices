'use client';

import { useEffect, useState } from 'react';

import ProfilePage from '@/features/profile/components/ProfilePage';

import { useProfileStore } from '@/lib/stores/profileStore';
import { useUserStore } from '@/lib/stores/userStore';

import type { ProfileExportData, ProfilePreferences, PrivacySettings, UserProfile } from '@/types/profile';

const HARNESS_PRIVACY: PrivacySettings = {
  collectLocationData: false,
  collectVotingHistory: false,
  trackInterests: true,
  trackFeedActivity: true,
  collectAnalytics: true,
  trackRepresentativeInteractions: false,
  showReadHistory: false,
  showBookmarks: false,
  showLikes: false,
  shareActivity: false,
  participateInTrustTier: true,
  personalizeFeeds: true,
  personalizeRecommendations: true,
  retainVotingHistory: false,
  retainSearchHistory: false,
  retainLocationHistory: false,
};

const HARNESS_PREFERENCES: ProfilePreferences = {
  theme: 'light',
  language: 'en-US',
  timezone: 'America/Los_Angeles',
  notifications: {
    email: true,
    push: false,
    inApp: true,
    mentions: true,
    votes: true,
    comments: true,
    follows: false,
  },
  privacy: HARNESS_PRIVACY,
  feed: {
    showTrending: true,
    showFollowing: true,
    showRecommended: false,
    autoRefresh: true,
    itemsPerPage: 10,
  },
  voting: {
    defaultMethod: 'single',
    showResults: true,
    allowComments: true,
    requireVerification: true,
  },
  dashboard: {
    showElectedOfficials: true,
    showQuickActions: true,
    showRecentActivity: true,
    showEngagementScore: true,
  },
};

const HARNESS_PROFILE = {
  id: 'profile-harness-user',
  user_id: 'profile-harness-user',
  display_name: 'Keyboard Ready User',
  username: 'keyboard.user',
  email: 'keyboard@example.com',
  bio: 'Ensures the export dialog supports keyboard-only navigation.',
  trust_tier: 'T2',
  created_at: new Date('2025-01-15').toISOString(),
  updated_at: new Date('2025-12-01').toISOString(),
  avatar_url: null,
  phone: null,
  location: null,
  demographics: null,
  primary_concerns: ['transparency', 'safety'],
  community_focus: ['district-7'],
  participation_style: 'participant',
  preferences: HARNESS_PREFERENCES,
  privacy_settings: HARNESS_PRIVACY,
} as unknown as UserProfile;

export default function ProfileAccessibilityHarness() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('e2e-dashboard-bypass', '1');

    const profileStore = useProfileStore.getState();
    profileStore.setProfile(HARNESS_PROFILE);
    profileStore.setUserProfile(HARNESS_PROFILE);
    profileStore.setProfileLoading(false);
    profileStore.setUpdating(false);
    profileStore.setExporting(false);
    profileStore.setUploadingAvatar(false);
    profileStore.updateProfileCompleteness();
    profileStore.exportProfile = async (): Promise<ProfileExportData | null> => ({
      profile: HARNESS_PROFILE,
      preferences: HARNESS_PREFERENCES,
      // Required by ProfileExportData — provide empty arrays / defaults for the harness
      activity: [],
      votes: [],
      comments: [],
    });

    const userStore = useUserStore.getState();
    userStore.setAuthenticated(true);
    userStore.setProfile(HARNESS_PROFILE);
    userStore.setProfileLoading(false);
    userStore.setUpdating(false);

    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <main
        data-testid='profile-accessibility-harness'
        className='min-h-screen bg-slate-50 p-6'
      >
        <div className='mx-auto max-w-3xl rounded-lg border bg-white p-6 text-sm text-slate-600 shadow-sm'>
          Preparing profile accessibility harness…
        </div>
      </main>
    );
  }

  return (
    <main
      data-testid='profile-accessibility-harness'
      className='min-h-screen bg-slate-50 p-6'
    >
      <div className='mx-auto max-w-5xl space-y-4'>
        <header className='rounded-lg border bg-white p-6 shadow-sm'>
          <h1 className='text-2xl font-semibold'>Profile Accessibility Harness</h1>
          <p className='text-sm text-slate-600'>
            This page renders `features/profile/components/ProfilePage` with deterministic store
            data so automated tests can exercise the export dialog without relying on Supabase.
          </p>
        </header>

        <section className='rounded-lg border bg-white p-6 shadow-sm'>
          <ProfilePage user={HARNESS_PROFILE} isOwnProfile canEdit />
        </section>
      </div>
    </main>
  );
}

