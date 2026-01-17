'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useEffect } from 'react';

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

  useEffect(() => {
    setCurrentRoute('/admin/users');
    setSidebarActiveSection('admin-users');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Users', href: '/admin/users' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  // CRITICAL FIX: Remove AdminLayout wrapper - parent layout.tsx already provides it
  // Double wrapping causes duplicate sidebar and header rendering
  return (
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
  );
}

