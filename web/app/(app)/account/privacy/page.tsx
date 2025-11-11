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

import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';
import MyDataDashboard from '@/features/profile/components/MyDataDashboard';
import { useProfile, useProfileUpdate } from '@/features/profile/hooks/use-profile';
import { useUser } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import { getDefaultPrivacySettings } from '@/lib/utils/privacy-guard';
import type { PrivacySettings } from '@/types/profile';

export default function PrivacyPage() {
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useProfile();
  const user = useUser();
  const { updateProfile } = useProfileUpdate();
  const [isSaving, setIsSaving] = useState(false);

  const storedPrivacySettings = profile?.privacy_settings as PrivacySettings | null | undefined;
  const privacySettings: PrivacySettings | null = storedPrivacySettings ?? getDefaultPrivacySettings();
  const userId = profile?.id ?? profile?.user_id ?? user?.id ?? null;

  const handlePrivacyUpdate = useCallback(
    async (updates: Partial<PrivacySettings>) => {
      if (!privacySettings) {
        return;
      }

      try {
        setIsSaving(true);
        const updatedSettings = {
          ...privacySettings,
          ...updates,
        };

        const result = await updateProfile({ privacy_settings: updatedSettings });

        if (!result.success) {
          throw new Error(result.error ?? 'Failed to update privacy settings');
        }

        logger.info('Privacy settings updated', { updates });
      } catch (error) {
        logger.error(
          'Failed to update privacy settings',
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [privacySettings, updateProfile]
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading privacy settings...</p>
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
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </>
  );
}
