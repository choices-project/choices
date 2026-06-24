'use client';

import React, { useEffect, useRef } from 'react';

import { ComprehensiveAdminDashboard } from '@/features/admin';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

// Prevent static generation since this requires client-side state
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Refs for stable app store actions
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => { setCurrentRouteRef.current = setCurrentRoute; }, [setCurrentRoute]);
  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => { setBreadcrumbsRef.current = setBreadcrumbs; }, [setBreadcrumbs]);
  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => { setSidebarActiveSectionRef.current = setSidebarActiveSection; }, [setSidebarActiveSection]);

  useEffect(() => {
    setCurrentRouteRef.current('/admin');
    setSidebarActiveSectionRef.current('admin-dashboard');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  // Double wrapping causes duplicate sidebar and header rendering
  // This page should only render the dashboard content, not its own full page layout
    return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComprehensiveAdminDashboard />
      </div>
    </ErrorBoundary>
  );
}
