'use client';

import React, { useEffect, useRef } from 'react';

import { ComprehensiveAdminDashboard } from '@/features/admin';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

import { AdminLayout } from '../layout/AdminLayout';

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
    setCurrentRouteRef.current('/admin/dashboard');
    setSidebarActiveSectionRef.current('admin-dashboard');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
      { label: 'Dashboard', href: '/admin/dashboard' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);  

  return (
    <AdminLayout>
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ComprehensiveAdminDashboard />
        </div>
      </ErrorBoundary>
    </AdminLayout>
  );
}
