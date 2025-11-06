'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react';

import EnhancedFeedbackWidget from '@/components/EnhancedFeedbackWidget';
import FontProvider from '@/components/shared/FontProvider';
import GlobalNavigation from '@/components/shared/GlobalNavigation';
import SiteMessages from '@/components/SiteMessages';
import { AuthProvider } from '@/contexts/AuthContext';
import { ServiceWorkerProvider } from '@/features/pwa/components/ServiceWorkerProvider';
import { UserStoreProvider } from '@/lib/providers/UserStoreProvider'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create QueryClient instance for TanStack Query with memory optimization
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10)
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Prevent unnecessary refetches
        refetchOnReconnect: false, // Prevent refetch on reconnect
      },
      mutations: {
        retry: 1, // Reduce mutation retries
      },
    },
  }))

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            {/* Service Worker Provider - Handles PWA functionality with update banner and offline indicator */}
            <ServiceWorkerProvider debug={process.env.NODE_ENV === 'development'}>
              {/* Global Navigation */}
              <GlobalNavigation />
              
              {/* Site Messages - Display below navigation */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <SiteMessages />
              </div>
              
              {children}
              
              {/* Enhanced Feedback Widget - Fixed infinite loop issue */}
              <EnhancedFeedbackWidget />
            </ServiceWorkerProvider>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  )
}
