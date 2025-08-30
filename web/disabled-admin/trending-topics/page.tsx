'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from '../layout/AdminLayout';
import { TrendingTopicsPage } from './TrendingTopicsPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function AdminTrendingTopicsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminLayout>
        <TrendingTopicsPage />
      </AdminLayout>
    </QueryClientProvider>
  );
}
