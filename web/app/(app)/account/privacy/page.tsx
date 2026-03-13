/**
 * Privacy & Data Management Page
 *
 * 🔒 PRIVACY PARAMOUNT: Comprehensive privacy settings and data management
 * Integrates all privacy features in one cohesive interface
 *
 * Features:
 * - View and edit all 16 privacy controls
 * - View all collected data by category
 * - Export data (GDPR/CCPA compliant)
 * - Delete specific data categories
 * - Delete entire account
 * - Navigation back to main dashboard
 *
 * Created: November 5, 2025
 * Status: ✅ ACTIVE - COMPREHENSIVE
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import MyDataDashboard from '@/features/profile/components/MyDataDashboard';
import {
  useProfileData,
  useProfileDraft,
  useProfileDraftActions,
} from '@/features/profile/hooks/use-profile';

import ProfileSubNav from '@/components/shared/ProfileSubNav';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import {
  useProfilePrivacySettings,
  useProfileActions,
  useProfileLoading,
} from '@/lib/stores/profileStore';
import { logger } from '@/lib/utils/logger';
import { getDefaultPrivacySettings } from '@/lib/utils/privacy-guard';

import type { PrivacySettings } from '@/types/profile';

export default function PrivacyPage() {
  const { profile, isLoading: profileLoading, error: profileError } = useProfileData();
  const user = useUser();
  const privacySettingsFromStore = useProfilePrivacySettings();
  const { updatePrivacySettings } = useProfileActions();
  const { isUpdating } = useProfileLoading();
  const draft = useProfileDraft();
  const { mergeDraft, setProfileEditing } = useProfileDraftActions();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);

  // Refs for stable profile draft actions
  const mergeDraftRef = useRef(mergeDraft);
  useEffect(() => { mergeDraftRef.current = mergeDraft; }, [mergeDraft]);
  const setProfileEditingRef = useRef(setProfileEditing);
  useEffect(() => { setProfileEditingRef.current = setProfileEditing; }, [setProfileEditing]);

  const privacySettings = useMemo<PrivacySettings>(() => {
    const existing =
      privacySettingsFromStore ??
      (draft?.privacy_settings as PrivacySettings | null | undefined) ??
      (profile?.privacy_settings as PrivacySettings | null | undefined);
    return existing ?? getDefaultPrivacySettings();
  }, [draft?.privacy_settings, privacySettingsFromStore, profile?.privacy_settings]);

  useEffect(() => {
    setCurrentRouteRef.current('/account/privacy');
    setSidebarActiveSectionRef.current('privacy');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Privacy & Data', href: '/account/privacy' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  useEffect(() => {
    if (privacySettings) {
      mergeDraftRef.current({ privacy_settings: privacySettings });
      setProfileEditingRef.current(true);
    }
  }, [privacySettings]);

  useEffect(
    () => () => {
      setProfileEditingRef.current(false);
    },
    [],
  );

  // Add timeout to prevent infinite loading - must be before early returns
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (!profileLoading) {
      setLoadingTimeout(false);
      return;
    }
    const timeout = setTimeout(() => {
      setLoadingTimeout(true);
    }, 4_000); // 4 second timeout to avoid prolonged spinner
    return () => {
      clearTimeout(timeout);
    };
  }, [profileLoading]);

  const userId = profile?.id ?? profile?.user_id ?? user?.id ?? null;

  // Ref for stable updatePrivacySettings callback
  const updatePrivacySettingsRef = useRef(updatePrivacySettings);
  useEffect(() => { updatePrivacySettingsRef.current = updatePrivacySettings; }, [updatePrivacySettings]);

  const handlePrivacyUpdate = useCallback(
    async (updates: Partial<PrivacySettings>) => {
      try {
        mergeDraftRef.current({
          privacy_settings: {
            ...privacySettings,
            ...updates,
          },
        });

        const result = await updatePrivacySettingsRef.current(updates);

        if (!result) {
          throw new Error('Failed to update privacy settings');
        }

        logger.info('Privacy settings updated', { updates });
      } catch (error) {
        logger.error(
          'Failed to update privacy settings',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    },
    [privacySettings]
  );

  if (!user && !profileLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Privacy & Data</h1>
          <p className="text-muted-foreground mb-6">Please log in to manage your privacy settings.</p>
          <a
            href="/auth?redirectTo=/account/privacy"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            aria-label="Log in to manage privacy settings"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  if (profileLoading || loadingTimeout) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center" role="status" aria-busy="true" aria-live="polite" aria-label="Loading privacy settings">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">
            {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading privacy settings...'}
          </p>
          {loadingTimeout && (
            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 min-h-[44px]"
              aria-label="Reload page to retry loading privacy settings"
            >
              Reload Page
            </button>
          )}
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">We couldn&apos;t load your privacy settings</h1>
          <p className="text-muted-foreground">Please refresh the page or try again later.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Reload page to retry loading privacy settings"
            >
              Reload
            </button>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-md border border-border text-foreground/80 hover:bg-muted"
              aria-label="Navigate back to dashboard"
            >
              Back to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!privacySettings || !userId) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen bg-muted pb-8" aria-label="Privacy and data management">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProfileSubNav />
        <MyDataDashboard
          userId={userId}
          privacySettings={privacySettings}
          onPrivacyUpdate={handlePrivacyUpdate}
          isSaving={isUpdating}
        />
      </div>
    </div>
  );
}
