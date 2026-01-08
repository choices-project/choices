'use client';

import React, { useEffect } from 'react';

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
  return <>{children}</>;
}


