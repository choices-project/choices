'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';

import { AdminLayout } from '../layout/AdminLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Dynamically import the DashboardOverview component to reduce initial bundle size
const DashboardOverview = dynamic(() => import('./DashboardOverview').then(mod => ({ default: mod.DashboardOverview })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false // Disable SSR for this component to reduce server bundle size
});

export default function AdminDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        }>
          <DashboardOverview />
        </Suspense>
      </AdminLayout>
    </QueryClientProvider>
  );
}
