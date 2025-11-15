'use client';

import React, { useEffect } from 'react';

import { AdminLayout } from '../layout/AdminLayout';
import { useAppActions } from '@/lib/stores/appStore';

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

  return <AdminLayout>{children}</AdminLayout>;
}


