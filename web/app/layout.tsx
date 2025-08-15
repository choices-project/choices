import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PWAInstallPrompt, OfflineIndicator, PWAUpdatePrompt } from '../components/PWAComponents'
import FeedbackWidget from '../components/FeedbackWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Choices - Democratic Polling Platform',
  description: 'A privacy-first, unbiased polling platform for democratic participation',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Choices'
  },
  formatDetection: {
    telephone: false
  }
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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Choices" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={inter.className}>
        {children}
        
        {/* PWA Components */}
        <PWAInstallPrompt />
        <OfflineIndicator />
        <PWAUpdatePrompt />
        
        {/* Feedback Widget - Appears on all pages */}
        <FeedbackWidget />
        
        {/* Hidden elements for PWA functionality */}
        <div id="install-pwa" style={{ display: 'none' }} />
        <div id="update-pwa" style={{ display: 'none' }} />
        <div id="offline-indicator" style={{ display: 'none' }} />
      </body>
    </html>
  )
}
