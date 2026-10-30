'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { AuthProvider } from '@/contexts/AuthContext';

import FontProvider from '@/components/shared/FontProvider';

import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

/**
 * Shared session providers for /auth and the signed-in app. Chrome
 * (AppShell) stays on the (app) segment so `/` and `/auth` stay light.
 */
export default function SessionLayout({ children }: { children: React.ReactNode }) {
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
          <UserStoreProvider>{children}</UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}
