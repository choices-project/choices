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

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';
import MyDataDashboard from '@/features/profile/components/MyDataDashboard';
import { logger } from '@/lib/utils/logger';
import { getDefaultPrivacySettings } from '@/lib/utils/privacy-guard';

import type { PrivacySettings } from '@/types/profile';

export default function PrivacyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and privacy settings
  useEffect(() => {
    loadUserData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    try {
      // Get current user profile
      const response = await fetch('/api/profile', {
        credentials: 'include'
      });

      if (!response.ok) {
        logger.warn('Failed to load profile, redirecting to auth');
        router.push('/auth');
        return;
      }

      const data = await response.json();
      
      if (!data.profile) {
        router.push('/auth');
        return;
      }

      setUserId(data.profile.id || data.profile.user_id);
      
      // Get privacy settings or use defaults
      const settings = data.profile.privacy_settings || getDefaultPrivacySettings();
      setPrivacySettings(settings);
      
      logger.info('Privacy page loaded', { userId: data.profile.id });

    } catch (error) {
      logger.error('Failed to load user data', error instanceof Error ? error : new Error(String(error)));
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle privacy settings update
  const handlePrivacyUpdate = async (updates: Partial<PrivacySettings>) => {
    try {
      const updatedSettings = {
        ...privacySettings,
        ...updates
      };

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          privacy_settings: updatedSettings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      setPrivacySettings(updatedSettings as PrivacySettings);
      logger.info('Privacy settings updated', { updates });

    } catch (error) {
      logger.error('Failed to update privacy settings', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading privacy settings...</p>
        </div>
      </div>
    );
  }

  if (!userId || !privacySettings) {
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
          />
        </div>
      </div>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </>
  );
}
