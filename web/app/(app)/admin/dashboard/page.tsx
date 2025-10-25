'use client';

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

import { AdminLayout } from '../layout/AdminLayout';

// Dynamically import the ComprehensiveAdminDashboard component with optimizations
const ComprehensiveAdminDashboard = dynamic(() => import('@/features/admin').then(mod => ({ default: mod.ComprehensiveAdminDashboard })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false // Disable SSR due to client-side dependencies (browser APIs, localStorage, etc.)
});

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      }>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ComprehensiveAdminDashboard />
        </div>
      </Suspense>
    </AdminLayout>
  );
}
