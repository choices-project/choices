import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from '../components/PWAComponents'
import EnhancedFeedbackWidget from '../components/EnhancedFeedbackWidget'
import ClientOnly from '../components/ClientOnly'
import { AuthProvider } from '../contexts/AuthContext'

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
        <AuthProvider>
          {children}
          
          {/* PWA Components - Only render on client side */}
          <ClientOnly>
            <PWAInstallPrompt />
            <OfflineIndicator />
            <PWAUpdatePrompt />
          </ClientOnly>
          
          {/* Enhanced Feedback Widget - Only render on client side */}
          <ClientOnly>
            <EnhancedFeedbackWidget />
          </ClientOnly>
          
          {/* Hidden elements for PWA functionality */}
          <div id="install-pwa" style={{ display: 'none' }} />
          <div id="update-pwa" style={{ display: 'none' }} />
          <div id="offline-indicator" style={{ display: 'none' }} />
        </AuthProvider>
      </body>
    </html>
  )
}
