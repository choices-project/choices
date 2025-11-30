'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import FontProvider from '@/components/shared/FontProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

/**
 * Auth Layout
 *
 * Provides necessary providers for the auth page since it's outside the (app) route group.
 * The auth page needs AuthProvider and UserStoreProvider for its hooks to work.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create QueryClient instance for TanStack Query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            {children}
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}

