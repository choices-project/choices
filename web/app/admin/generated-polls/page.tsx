'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '../../../components/admin/layout/AdminLayout';
import { GeneratedPollsPage } from './GeneratedPollsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function AdminGeneratedPollsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <GeneratedPollsPage />
      </AdminLayout>
    </QueryClientProvider>
  );
}
