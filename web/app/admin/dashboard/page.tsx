'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { DashboardOverview } from './DashboardOverview';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function AdminDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <DashboardOverview />
      </AdminLayout>
    </QueryClientProvider>
  );
}
