'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect } from 'react';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

// CRITICAL FIX: AdminLayout is provided by parent layout.tsx - don't import or use it here

const SystemSettings = dynamic(() => import('@/features/admin/components/SystemSettings'), {
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  ),
  ssr: false,
});

export default function SystemSettingsPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/admin/system');
    setSidebarActiveSection('admin-system');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'System Settings', href: '/admin/system' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-8">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">System Settings Error</h3>
          <p className="text-red-600 dark:text-red-400 mt-2">
            An error occurred while loading the system settings page. Please try refreshing the page.
          </p>
        </div>
      }
    >
      <Suspense
        fallback={(
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SystemSettings />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

