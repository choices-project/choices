// Import SSR polyfills first to ensure they're loaded before any other modules
import '../lib/ssr-polyfills'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google';
import './globals.css'
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from '../components/PWAComponents';
import EnhancedFeedbackWidget from '../components/EnhancedFeedbackWidget'
import SiteMessages from '../components/SiteMessages'

import ClientOnly from '../components/ClientOnly'



const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Choices - Democratic Polling Platform',
  description: 'A privacy-first, unbiased polling platform for democratic participation',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Choices'
  },
  formatDetection: {
    telephone: false
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Choices" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tileImage" content="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ClientOnly>
          {/* Global Navigation - Temporarily disabled */}
          {/* <GlobalNavigation /> */}
          
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
          
          {/* Navigation Logger - Only in development */}
          {/* <NavLogger /> */}
          
          {/* Hidden elements for PWA functionality */}
          <div id="install-pwa" style={{ display: 'none' }} />
          <div id="update-pwa" style={{ display: 'none' }} />
          <div id="offline-indicator" style={{ display: 'none' }} />
        </ClientOnly>
      </body>
    </html>
  )
}
