'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect } from 'react';

import { useAppActions } from '@/lib/stores/appStore';
import { AdminLayout } from '../layout/AdminLayout';

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

  return (
    <AdminLayout>
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
    </AdminLayout>
  );
}

