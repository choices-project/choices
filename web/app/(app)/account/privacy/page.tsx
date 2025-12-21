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

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';

import { useUser } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { useProfileStore } from '@/lib/stores/profileStore';
import { logger } from '@/lib/utils/logger';
import { getDefaultPrivacySettings } from '@/lib/utils/privacy-guard';

import type { PrivacySettings } from '@/types/profile';

export default function PrivacyPage() {
  const { profile, isLoading: profileLoading, error: profileError } = useProfileData();
  const user = useUser();
  const privacySettingsFromStore = useProfileStore((state) => state.privacySettings);
  const updatePrivacySettings = useProfileStore((state) => state.updatePrivacySettings);
  const isUpdating = useProfileStore((state) => state.isUpdating);
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
    }, 15_000); // 15 second timeout
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

  if (profileLoading || loadingTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading privacy settings...'}
          </p>
          {loadingTimeout && (
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">We couldn&apos;t load your privacy settings</h1>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  if (!privacySettings || !userId) {
    return null; // Redirecting
  }

  return (
    <>
      {/* 🔒 Cohesive Dashboard Navigation */}
      <DashboardNavigation />

      <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <MyDataDashboard
            userId={userId}
            privacySettings={privacySettings}
            onPrivacyUpdate={handlePrivacyUpdate}
            isSaving={isUpdating}
          />
        </div>
      </div>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </>
  );
}
