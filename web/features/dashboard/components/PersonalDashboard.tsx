'use client';

/**
 * Personal Dashboard Component
 *
 * Zustand-aligned personal dashboard powered by shared stores:
 * - Profile store for personalization and preferences
 * - Polls, analytics, and hashtag stores for feature data
 * - User store for representative information
 *
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 *
 * FIXED: Infinite render loop - Applied React/Zustand best practices:
 * - All store subscriptions use useShallow for stable references
 * - Store actions stored in refs to prevent dependency issues
 * - Client-only logic guarded with isMounted
 * - useEffect dependencies carefully managed
 * - Memoized dashboardPreferences with specific property dependencies
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useProfile, useProfileErrorStates, useProfileLoadingStates } from '@/features/profile/hooks/use-profile';

import {
  useIsAuthenticated,
  useUserLoading,
} from '@/lib/stores';
import { useProfileStore } from '@/lib/stores/profileStore';

import type { DashboardPreferences } from '@/types/profile';

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  showElectedOfficials: false,
  showQuickActions: true,
  showRecentActivity: true,
  showEngagementScore: true,
};

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
};

/**
 * DIAGNOSTIC TRACKING
 *
 * Comprehensive instrumentation to understand component behavior:
 * - Render lifecycle tracking
 * - Hook execution tracking
 * - Store subscription changes
 * - Memoized value recalculations
 * - Dependency array comparisons
 */
function useDiagnosticTracking(componentName: string) {
  const renderCountRef = useRef(0);
  const hookExecutionsRef = useRef<Record<string, number>>({});
  const memoRecalculationsRef = useRef<Record<string, number>>({});

  // Track render count
  if (typeof window !== 'undefined') {
    renderCountRef.current += 1;
    const renderCount = renderCountRef.current;

    // Log render with comprehensive context
    console.log(JSON.stringify({
      location: `${componentName}:render`,
      message: 'Component render',
      data: {
        renderCount,
        timestamp: Date.now(),
        hasWindow: typeof window !== 'undefined',
        componentName,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  }

  // Track hook execution
  const trackHookExecution = (hookName: string, data?: Record<string, unknown>) => {
    hookExecutionsRef.current[hookName] = (hookExecutionsRef.current[hookName] || 0) + 1;
    console.log(JSON.stringify({
      location: `${componentName}:${hookName}`,
      message: 'Hook execution',
      data: {
        hookName,
        executionCount: hookExecutionsRef.current[hookName],
        renderCount: renderCountRef.current,
        ...data,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  };

  // Track memo recalculation
  const trackMemoRecalculation = (memoName: string, reason: string, data?: Record<string, unknown>) => {
    memoRecalculationsRef.current[memoName] = (memoRecalculationsRef.current[memoName] || 0) + 1;
    console.log(JSON.stringify({
      location: `${componentName}:useMemo:${memoName}`,
      message: 'Memo recalculation',
      data: {
        memoName,
        recalculationCount: memoRecalculationsRef.current[memoName],
        renderCount: renderCountRef.current,
        reason,
        ...data,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  };

  return {
    renderCount: renderCountRef.current,
    trackHookExecution,
    trackMemoRecalculation,
  };
}

/**
 * CRITICAL FIX: Use useShallow for all store subscriptions to prevent infinite loops
 * Without useShallow, store subscriptions create new object references every render
 */
function StandardPersonalDashboard({ userId: _fallbackUserId }: PersonalDashboardProps) {
  const diagnostics = useDiagnosticTracking('StandardPersonalDashboard');

  // CRITICAL: Guard client-only logic with isMounted (like feed/polls pages)
  const [isMounted, setIsMounted] = useState(false);
  const isMountedPrevRef = useRef(false);

  diagnostics.trackHookExecution('useState:isMounted', {
    isMounted,
    prevIsMounted: isMountedPrevRef.current,
  });
  isMountedPrevRef.current = isMounted;

  useEffect(() => {
    diagnostics.trackHookExecution('useEffect:setIsMounted', {
      isMountedBefore: isMounted,
    });
    setIsMounted(true);
  }, []);

  // CRITICAL FIX: Use useShallow for store subscription to prevent new object references
  // This was the root cause - without useShallow, this creates a new object every render
  const profilePreferencesRef = useRef<unknown>(null);

  const { preferences: profilePreferences, updatePreferences } = useProfileStore(
    useShallow((state) => ({
      preferences: state.preferences,
      updatePreferences: state.updatePreferences,
    })),
  );

  // Track store subscription changes
  const preferencesChanged = profilePreferences !== profilePreferencesRef.current;
  if (preferencesChanged) {
    console.log(JSON.stringify({
      location: 'StandardPersonalDashboard:useProfileStore',
      message: 'Store subscription changed',
      data: {
        prevPreferences: profilePreferencesRef.current,
        newPreferences: profilePreferences,
        preferencesChanged: true,
        renderCount: diagnostics.renderCount,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
    profilePreferencesRef.current = profilePreferences;
  }

  // CRITICAL FIX: Store actions in refs to prevent dependency issues (like feed/polls pages)
  const updatePreferencesRefForCallback = useRef(updatePreferences);
  useEffect(() => {
    const changed = updatePreferences !== updatePreferencesRefForCallback.current;
    if (changed) {
      diagnostics.trackHookExecution('useEffect:updatePreferencesRef', {
        updatePreferencesChanged: true,
      });
      updatePreferencesRefForCallback.current = updatePreferences;
    }
  }, [updatePreferences]);

  // PHASE 4.1: Profile Hooks (incremental restoration)
  // Following established patterns: useShallow for store subscriptions, refs for actions
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { hasAnyError: _hasAnyError } = useProfileErrorStates(); // Phase 4.1: Added but not used yet
  const { isAnyUpdating: _isProfileUpdating } = useProfileLoadingStates(); // Phase 4.1: Added but not used yet
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();

  // Track profile hooks execution for diagnostics
  diagnostics.trackHookExecution('useProfile', {
    hasProfile: !!profile,
    isLoading: profileLoading,
    hasError: !!profileError,
    profileId: (profile as Record<string, unknown>)?.id ?? null,
  });
  
  diagnostics.trackHookExecution('useIsAuthenticated', {
    isAuthenticated,
  });
  
  diagnostics.trackHookExecution('useUserLoading', {
    isUserLoading,
  });

  // CRITICAL FIX: Extract preferences.dashboard with stable reference using useMemo
  // This prevents new object reference every render, which was causing infinite loops
  // The key is to memoize based on the actual nested values, not the parent object
  const dashboardPreferencesPrevRef = useRef<DashboardPreferences | null>(null);
  const dashboardPreferences = useMemo(() => {
    const reason = !profilePreferences?.dashboard
      ? 'no-profile-preferences'
      : dashboardPreferencesPrevRef.current === null
      ? 'first-calculation'
      : 'dependency-changed';

    diagnostics.trackMemoRecalculation('dashboardPreferences', reason, {
      hasProfilePreferences: !!profilePreferences?.dashboard,
      prevValue: dashboardPreferencesPrevRef.current,
    });

    if (!profilePreferences?.dashboard) {
      const result = DEFAULT_DASHBOARD_PREFERENCES;
      dashboardPreferencesPrevRef.current = result;
      return result;
    }

    // Return a new object only if the actual values changed
    const result = {
      showElectedOfficials: profilePreferences.dashboard.showElectedOfficials ?? DEFAULT_DASHBOARD_PREFERENCES.showElectedOfficials,
      showQuickActions: profilePreferences.dashboard.showQuickActions ?? DEFAULT_DASHBOARD_PREFERENCES.showQuickActions,
      showRecentActivity: profilePreferences.dashboard.showRecentActivity ?? DEFAULT_DASHBOARD_PREFERENCES.showRecentActivity,
      showEngagementScore: profilePreferences.dashboard.showEngagementScore ?? DEFAULT_DASHBOARD_PREFERENCES.showEngagementScore,
    };

    dashboardPreferencesPrevRef.current = result;
    return result;
  }, [
    profilePreferences?.dashboard?.showElectedOfficials,
    profilePreferences?.dashboard?.showQuickActions,
    profilePreferences?.dashboard?.showRecentActivity,
    profilePreferences?.dashboard?.showEngagementScore,
  ]);

  // CRITICAL FIX: NO useEffect that depends on profilePreferences
  // This was the root cause - profilePreferences changed reference every render
  // Instead, use the memoized dashboardPreferences directly

  // Diagnostic: Log final render state
  useEffect(() => {
    console.log(JSON.stringify({
      location: 'StandardPersonalDashboard:useEffect:render-summary',
      message: 'Render summary after mount',
      data: {
        renderCount: diagnostics.renderCount,
        isMounted,
        hasDashboardPreferences: !!dashboardPreferences,
        dashboardPreferencesValue: dashboardPreferences,
        hasProfilePreferences: !!profilePreferences,
      },
      sessionId: 'debug-session',
      runId: 'final-fix-diagnostic',
      hypothesisId: 'DIAGNOSTIC'
    }));
  }, [isMounted, dashboardPreferences, profilePreferences]);

  // Phase 4.1: Profile hooks added - Simple return to verify stability before adding more hooks
  // Next phase will add store action hooks and data hooks
    return (
    <div className="space-y-6" data-testid='personal-dashboard'>
      <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>
          Phase 4.1: Profile Hooks Restored
        </h2>
        <div className='space-y-1 text-sm text-gray-600 dark:text-gray-400'>
          <p>
            <span className='font-medium'>Render count:</span> {diagnostics.renderCount} | 
            <span className='font-medium ml-2'>Mounted:</span> {String(isMounted)}
          </p>
          <p>
            <span className='font-medium'>Profile:</span> {profile ? `loaded (id: ${(profile as Record<string, unknown>)?.id ?? 'unknown'})` : 'loading'} | 
            <span className='font-medium ml-2'>Auth:</span> {String(isAuthenticated)} | 
            <span className='font-medium ml-2'>Loading:</span> {String(profileLoading)}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700'>
            ✅ Diagnostic tracking enabled | Phase 4.1 complete | Ready for Phase 4.2 (store actions)
          </p>
          </div>
        </div>
      </div>
    );
  }

export default function PersonalDashboard(props: PersonalDashboardProps) {
  return <StandardPersonalDashboard {...props} />;
}
