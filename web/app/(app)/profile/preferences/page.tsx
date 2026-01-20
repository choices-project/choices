'use client';

import { Settings, Heart, Shield, Save, Loader2, Sparkles, Target } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import InterestSelection from '@/features/onboarding/components/InterestSelection';
import { useProfile, useProfileUpdate } from '@/features/profile/hooks/use-profile';

import DataUsageExplanation from '@/components/shared/DataUsageExplanation';

import { useUser, useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import logger from '@/lib/utils/logger';

import { useUserType } from '@/hooks/useUserType';

type StatusMessage = {
  type: 'success' | 'error';
  text: string;
};

const arraysAreEqual = (a: string[], b: string[]) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

export default function ProfilePreferencesPage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const user = useUser();
  // Hooks must be called unconditionally at the top level
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { updateProfile, isUpdating, error: updateError } = useProfileUpdate();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();
  const { userType, recommendations, nextMilestone, isLoading: userTypeLoading } = useUserType(user?.id);

  // Set mounted immediately on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  // Ref for updateProfile callback to prevent infinite re-renders
  const updateProfileRef = useRef(updateProfile);
  useEffect(() => { updateProfileRef.current = updateProfile; }, [updateProfile]);

  // Memoize initialInterests with stable reference
  const initialInterests = useMemo<string[]>(() => {
    return profile?.primary_concerns ?? [];
  }, [profile?.primary_concerns]);

  const [userInterests, setUserInterests] = useState<string[]>(initialInterests);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  useEffect(() => {
    if (!isMounted) return;
    setCurrentRouteRef.current('/profile/preferences');
    setSidebarActiveSectionRef.current('preferences');
    setBreadcrumbsRef.current([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'Preferences', href: '/profile/preferences' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, [isMounted]);  

  // Sync userInterests with initialInterests when profile changes
  // Use a ref to track previous initialInterests to prevent unnecessary updates
  const prevInitialInterestsRef = useRef<string[]>(initialInterests);
  useEffect(() => {
    // Only update if the actual array contents changed (not just reference)
    if (!arraysAreEqual(prevInitialInterestsRef.current, initialInterests)) {
      prevInitialInterestsRef.current = initialInterests;
      setUserInterests(initialInterests);
    }
  }, [initialInterests]);

  useEffect(() => {
    if (statusMessage?.type === 'success') {
      const timer = window.setTimeout(() => setStatusMessage(null), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [statusMessage]);

  // Add timeout to prevent infinite loading - must be before early returns
  const [_loadingTimeout, setLoadingTimeout] = React.useState(false);
  React.useEffect(() => {
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

  const handleSaveInterests = useCallback(async (interests: string[]) => {
    if (arraysAreEqual(interests, initialInterests)) {
      return;
    }

    if (isUpdating) {
      return;
    }

    setStatusMessage(null);

    try {
      const result = await updateProfileRef.current({ primary_concerns: interests });

      if (result.success) {
        setUserInterests(interests);
        setStatusMessage({
          type: 'success',
          text: 'Your interests have been saved successfully!',
        });
      } else {
        throw new Error(result.error ?? 'Failed to save interests');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save interests. Please try again.';
      logger.error('Failed to save interests:', error);
      setStatusMessage({
        type: 'error',
        text: message,
      });
    }
  }, [initialInterests, isUpdating]);  

  // Check authentication - useEffect must be called unconditionally
  useEffect(() => {
    // In E2E harness mode, authentication is mocked - don't redirect
    if (process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1') {
      return;
    }
    // Only redirect if we're certain user is not authenticated
    // Don't redirect while authentication state is still loading
    if (isMounted && !isUserLoading && !isAuthenticated) {
      window.location.href = '/auth?redirectTo=/profile/preferences';
    }
  }, [isMounted, isAuthenticated, isUserLoading]);

  if (!isMounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="preferences-loading-auth" aria-label="Loading preferences" aria-busy="true">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign in to manage your preferences</h1>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.href = '/auth?redirectTo=/profile/preferences'}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Log in
            </button>
            <button
              onClick={() => window.location.href = '/auth?redirectTo=/profile/preferences'}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">We couldn&apos;t load your profile</h1>
          <p className="text-gray-600">Please refresh the page or try again later.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Reload
            </button>
            <button
              onClick={() => window.location.href = '/profile'}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeMessage = statusMessage ?? (updateError
    ? { type: 'error' as const, text: updateError }
    : null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
              <p className="text-gray-600">Customize your experience and manage your data</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {activeMessage && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              activeMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>{activeMessage.text}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Interest Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Content Preferences</h2>
            </div>
            <InterestSelection initialInterests={userInterests} onSave={handleSaveInterests} />
            {isUpdating && (
              <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving your interests...
              </p>
            )}
          </div>

          {/* Personalized Recommendations */}
          {!userTypeLoading && recommendations.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-gray-900">Personalized Tips</h2>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full capitalize">
                  {userType}
                </span>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                <ul className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
                {nextMilestone && (
                  <div className="mt-4 pt-4 border-t border-amber-200 flex items-center space-x-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">Next goal: {nextMilestone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Usage Explanation */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Data & Privacy</h2>
            </div>
            <DataUsageExplanation />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <a
            href="/profile"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>← Back to Profile</span>
          </a>
          <div className="text-sm text-gray-500">
            Your preferences are automatically saved
          </div>
        </div>
      </div>
    </div>
  );
}
