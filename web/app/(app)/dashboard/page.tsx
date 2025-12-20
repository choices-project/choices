'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { useProfile } from '@/features/profile/hooks/use-profile';

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useIsAuthenticated, useUserLoading } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

// Use PersonalDashboard as the main dashboard component
const PersonalDashboard = dynamic(() => import('@/features/dashboard').then(mod => ({ default: mod.PersonalDashboard })), {
  loading: () => (
    <div className="space-y-6" aria-label="Loading dashboard content">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  ),
  ssr: false // Disable SSR due to client-side dependencies (browser APIs, localStorage, etc.)
});

export default function DashboardPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { profile, isLoading } = useProfile();
  const isAuthenticated = useIsAuthenticated();
  const isUserLoading = useUserLoading();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();
  const shouldBypassAuth = useMemo(
    () =>
      process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('e2e-dashboard-bypass') === '1',
    [],
  );
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const adminCheckRef = useRef<boolean>(false);

  useEffect(() => {
    setCurrentRoute('/dashboard');
    setSidebarActiveSection('dashboard');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
    if (shouldBypassAuth) {
      return;
    }
    // First check if user is authenticated - if not, redirect to auth
    if (!isUserLoading && !isAuthenticated) {
      logger.debug('🚨 Dashboard: Unauthenticated user - redirecting to auth');
      routerRef.current.replace('/auth');
      return;
    }
    // If authenticated but no profile, check if user is admin first
    // Admin users should have profiles, but if profile is still loading or missing,
    // we should check admin status before redirecting to onboarding
    if (!isLoading && isAuthenticated && !profile && !isCheckingAdmin) {
      // Check if user is admin by making a quick API call
      // This prevents admin users from being incorrectly redirected to onboarding
      const checkAdminAndRedirect = async () => {
        if (adminCheckRef.current) {
          return; // Already checking
        }
        adminCheckRef.current = true;
        setIsCheckingAdmin(true);

        try {
          const response = await fetch('/api/admin/health?type=status', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            signal: AbortSignal.timeout(5_000), // 5 second timeout
          });

          if (response.ok) {
            // User is admin - allow access to dashboard (they can navigate to admin dashboard)
            logger.debug('🚨 Dashboard: No profile but user is admin - allowing dashboard access');
            setIsCheckingAdmin(false);
            adminCheckRef.current = false;
            return; // Don't redirect
          } else if (response.status === 401 || response.status === 403) {
            // Not admin or not authenticated - redirect to onboarding
            logger.debug('🚨 Dashboard: User is not admin (401/403) - redirecting to onboarding');
          } else {
            // Other error - log but still redirect to be safe
            logger.warn('🚨 Dashboard: Admin check returned non-OK status:', response.status);
          }
        } catch (error) {
          // If admin check fails or times out, assume not admin and redirect
          logger.debug('🚨 Dashboard: Admin check failed or user is not admin - redirecting to onboarding', error);
        }

        // Not admin or check failed - redirect to onboarding
        logger.debug('🚨 Dashboard: No profile found - redirecting to onboarding');
        setIsCheckingAdmin(false);
        adminCheckRef.current = false;
        routerRef.current.replace('/onboarding');
      };

      void checkAdminAndRedirect();
    }
  }, [isLoading, isUserLoading, isAuthenticated, profile, shouldBypassAuth, isCheckingAdmin]); // Added isCheckingAdmin to dependencies

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Loading dashboard">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !shouldBypassAuth && !isLoading && !isCheckingAdmin) {
    // Only show access denied if we're sure the user isn't authenticated and not loading
    // This prevents showing error during redirect or while checking admin status
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Access denied</h1>
            <p className="text-gray-600 dark:text-gray-400">
              You must be logged in to access the dashboard.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Redirecting to login…</p>
          </div>
        </div>
      );
    }
    // If authenticated but no profile, show loading while checking admin or redirecting
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* 🔒 Cohesive Dashboard Navigation */}
      <DashboardNavigation />

      <Suspense fallback={
        <div className="space-y-6" aria-label="Loading dashboard content">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 dark:bg-gray-700 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 dark:bg-gray-700 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      }>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PersonalDashboard />
        </div>
      </Suspense>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </ErrorBoundary>
  );
}
