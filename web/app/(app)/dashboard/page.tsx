'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useRef } from 'react';

import { useProfile } from '@/features/profile/hooks/use-profile';

import DashboardNavigation, { MobileDashboardNav } from '@/components/shared/DashboardNavigation';

import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

// Use PersonalDashboard as the main dashboard component
const PersonalDashboard = dynamic(() => import('@/features/dashboard').then(mod => ({ default: mod.PersonalDashboard })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
    </div>
  ),
  ssr: false // Disable SSR due to client-side dependencies (browser APIs, localStorage, etc.)
});

export default function DashboardPage() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const { profile, isLoading, error } = useProfile();
  const { setCurrentRoute, setBreadcrumbs, setSidebarActiveSection } = useAppActions();
  const shouldBypassAuth = useMemo(
    () =>
      process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1' &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem('e2e-dashboard-bypass') === '1',
    [],
  );

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
    if (!isLoading && !profile) {
      logger.debug('🚨 Dashboard: No profile found - redirecting to login');
      routerRef.current.replace('/auth');
    }
  }, [isLoading, profile, shouldBypassAuth]); // Removed router - use ref

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!profile && !shouldBypassAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600">Access denied</h1>
          <p className="text-gray-600">
            {error ?? 'You must be logged in to access the dashboard.'}
          </p>
          <p className="text-sm text-gray-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🔒 Cohesive Dashboard Navigation */}
      <DashboardNavigation />

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      }>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PersonalDashboard />
        </div>
      </Suspense>

      {/* 🔒 Mobile Navigation */}
      <MobileDashboardNav />
    </>
  );
}
