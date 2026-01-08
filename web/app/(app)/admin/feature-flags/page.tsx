'use client';

import React, { useEffect } from 'react';

import FeatureFlags from '@/features/admin/components/FeatureFlags';

import { useAppActions } from '@/lib/stores/appStore';

// CRITICAL FIX: AdminLayout is provided by parent layout.tsx - don't import or use it here

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

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FeatureFlags />
    </div>
  );
}
