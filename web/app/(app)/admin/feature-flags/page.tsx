'use client';

import React, { useEffect } from 'react';

import { useAppActions } from '@/lib/stores/appStore';
import FeatureFlags from '@/features/admin/components/FeatureFlags';
import { AdminLayout } from '../layout/AdminLayout';

export default function AdminFeatureFlagsPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/admin/feature-flags');
    setSidebarActiveSection('admin-feature-flags');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Feature Flags', href: '/admin/feature-flags' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeatureFlags />
      </div>
    </AdminLayout>
  );
}
