'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
import { initializePWA } from '@/lib/pwa/init'

const EnhancedFeedbackWidget = dynamic(() => import('../../components/EnhancedFeedbackWidget'), {
  ssr: false,
  loading: () => null
})

const PWAIntegration = dynamic(() => import('../../components/PWAIntegration'), {
  ssr: false,
  loading: () => null
})
import SiteMessages from '../../components/SiteMessages'
import GlobalNavigation from '../../components/GlobalNavigation'
import FontProvider from '../../components/FontProvider'
import ClientOnly from '../../components/ClientOnly'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create QueryClient instance for TanStack Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Initialize PWA functionality
  useEffect(() => {
    console.log('PWA: Starting initialization...')
    initializePWA().then(() => {
      console.log('PWA: Initialization completed successfully')
    }).catch(error => {
      console.error('PWA: Failed to initialize PWA:', error)
    })
  }, [])

  return (
    <FontProvider>
      <ClientOnly>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* Global Navigation */}
            <GlobalNavigation />
            
            {/* Site Messages - Display below navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <SiteMessages />
            </div>
            
            {children}
            
            {/* PWA Integration - Handles all PWA functionality */}
            <PWAIntegration />
            
            {/* Enhanced Feedback Widget - Only render on client side */}
            <EnhancedFeedbackWidget />
          </AuthProvider>
        </QueryClientProvider>
      </ClientOnly>
    </FontProvider>
  )
}
