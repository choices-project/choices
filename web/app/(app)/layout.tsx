'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';

import { AppShell } from '@/components/shared/AppShell';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import FontProvider from '@/components/shared/FontProvider';

import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
          mutations: { retry: 1 },
        },
      }),
  );

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            <AppShell>
              <ErrorBoundary>{children}</ErrorBoundary>
            </AppShell>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}
