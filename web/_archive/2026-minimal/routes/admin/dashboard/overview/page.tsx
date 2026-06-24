'use client';

import React, { useEffect, useRef } from 'react';

import { DashboardOverview } from '@/app/(app)/admin/dashboard/DashboardOverview';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

export const dynamic = 'force-dynamic';

export default function AdminDashboardOverviewPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const setCurrentRouteRef = useRef(setCurrentRoute);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);

  useEffect(() => {
    setCurrentRouteRef.current = setCurrentRoute;
  }, [setCurrentRoute]);
  useEffect(() => {
    setBreadcrumbsRef.current = setBreadcrumbs;
  }, [setBreadcrumbs]);
  useEffect(() => {
    setSidebarActiveSectionRef.current = setSidebarActiveSection;
  }, [setSidebarActiveSection]);

  useEffect(() => {
    setCurrentRouteRef.current('/admin/dashboard/overview');
    setSidebarActiveSectionRef.current('admin-dashboard');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Overview', href: '/admin/dashboard/overview' },
    ]);
    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardOverview />
      </div>
    </ErrorBoundary>
  );
}
