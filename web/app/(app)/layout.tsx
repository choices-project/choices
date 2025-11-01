'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState, useEffect } from 'react';

import FontProvider from '@/components/shared/FontProvider';
import GlobalNavigation from '@/components/shared/GlobalNavigation';
import SiteMessages from '@/components/SiteMessages';
import EnhancedFeedbackWidget from '@/features/analytics/components/FeedbackWidget';
import PWABackground from '@/features/pwa/components/PWABackground';
import { UserStoreProvider } from '@/lib/providers/UserStoreProvider'
import { initializePWA } from '@/lib/pwa/init'
import { logger } from '@/lib/utils/logger'

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

  // Initialize PWA functionality with memory optimization
  useEffect(() => {
    // Only initialize PWA on client side and if supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      logger.info('PWA: Starting initialization...')
      initializePWA().then(() => {
        logger.info('PWA: Initialization completed successfully')
      }).catch(error => {
        console.error('PWA: Failed to initialize PWA:', error)
      })
    }
  }, [])

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <UserStoreProvider>
          {/* Global Navigation */}
          <GlobalNavigation />
          
          {/* Site Messages - Display below navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <SiteMessages />
          </div>
          
          {children}
          
          {/* PWA Background - Only shows offline indicator when needed */}
          <PWABackground />
          
          {/* Enhanced Feedback Widget - Fixed infinite loop issue */}
          <EnhancedFeedbackWidget />
        </UserStoreProvider>
      </QueryClientProvider>
    </FontProvider>
  )
}
