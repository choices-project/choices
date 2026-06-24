'use client';

import React, { useEffect } from 'react';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';

// CRITICAL FIX: AdminLayout is provided by parent layout.tsx - don't import or use it here
// AdminMonitoringShell is just a wrapper for setting breadcrumbs/route state

type AdminMonitoringShellProps = {
  children: React.ReactNode;
};

export function AdminMonitoringShell({ children }: AdminMonitoringShellProps) {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/admin/monitoring');
    setSidebarActiveSection('admin-monitoring');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Monitoring', href: '/admin/monitoring' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  // This shell component is just for setting route state, not layout structure
  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-8">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Monitoring Page Error</h3>
          <p className="text-red-600 dark:text-red-400 mt-2">
            An error occurred while loading the monitoring page. Please try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}


