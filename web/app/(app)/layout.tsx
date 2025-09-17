'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '../../hooks/AuthProvider'
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from '../../lib/shared/pwa-components'
import dynamic from 'next/dynamic'

const EnhancedFeedbackWidget = dynamic(() => import('../../components/EnhancedFeedbackWidget'), {
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
            
            {/* PWA Components - Only render on client side */}
            <PWAInstallPrompt />
            <OfflineIndicator />
            <PWAUpdatePrompt />
            
            {/* Enhanced Feedback Widget - Only render on client side */}
            <EnhancedFeedbackWidget />
            
            {/* Hidden elements for PWA functionality */}
            <div id="install-pwa" style={{ display: 'none' }} />
            <div id="update-pwa" style={{ display: 'none' }} />
            <div id="offline-indicator" style={{ display: 'none' }} />
          </AuthProvider>
        </QueryClientProvider>
      </ClientOnly>
    </FontProvider>
  )
}
