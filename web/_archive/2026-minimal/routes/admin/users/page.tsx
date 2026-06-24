'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef } from 'react';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

const UserManagement = dynamic(
  () => import('@/features/admin/components/UserManagement'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    ),
    ssr: false,
  },
);

export default function AdminUsersPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  // Refs for stable app store actions - use separate useEffect for each to prevent infinite loops
  const setCurrentRouteRef = useRef(setCurrentRoute);
  useEffect(() => {
    setCurrentRouteRef.current = setCurrentRoute;
  }, [setCurrentRoute]);

  const setBreadcrumbsRef = useRef(setBreadcrumbs);
  useEffect(() => {
    setBreadcrumbsRef.current = setBreadcrumbs;
  }, [setBreadcrumbs]);

  const setSidebarActiveSectionRef = useRef(setSidebarActiveSection);
  useEffect(() => {
    setSidebarActiveSectionRef.current = setSidebarActiveSection;
  }, [setSidebarActiveSection]);

  useEffect(() => {
    setCurrentRouteRef.current('/admin/users');
    setSidebarActiveSectionRef.current('admin-users');
    setBreadcrumbsRef.current([
      { label: 'Admin', href: '/admin' },
      { label: 'Users', href: '/admin/users' },
    ]);

    return () => {
      setSidebarActiveSectionRef.current(null);
      setBreadcrumbsRef.current([]);
    };
  }, []);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  // Double wrapping causes duplicate sidebar and header rendering
  return (
    <ErrorBoundary>
      <Suspense
        fallback={(
          <div className="flex items-center justify-center py-24" data-testid="user-management-suspense-fallback">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="user-management-container">
          <UserManagement />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

