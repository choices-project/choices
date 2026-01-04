
import { cookies, headers } from 'next/headers';
import React from 'react';

import { SkipNavLink, SkipNavTarget } from '@/components/accessibility/SkipNavLink';
import SiteFooter from '@/components/layout/SiteFooter';
import { ThemeScript } from '@/components/shared/ThemeScript';

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type SupportedLocale,
  resolveLocale,
} from '@/lib/i18n/config';

import { Providers } from './providers';

import type { Metadata } from 'next';
import type { AbstractIntlMessages } from 'next-intl';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Choices - Democracy That Works For Everyone',
    template: '%s | Choices',
  },
  description: 'A privacy-first platform that levels the playing field for all candidates, exposes financial influence, and empowers citizens to engage directly with democracy.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://choices-app.com'),
  manifest: '/manifest.json',
  keywords: [
    'democracy',
    'civic engagement',
    'campaign finance',
    'political transparency',
    'voting',
    'privacy-first',
    'equal representation',
    'participatory democracy',
  ],
  authors: [{ name: 'Choices Platform' }],
  creator: 'Choices Platform',
  publisher: 'Choices Platform',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Choices',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Choices - Democracy That Works For Everyone',
    description: 'Level the playing field for all candidates. Expose financial influence. Engage directly with democracy.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://choices-app.com',
    siteName: 'Choices',
    locale: 'en_US',
    images: [
      {
        url: '/og/choices-og.png',
        width: 1200,
        height: 630,
        alt: 'Choices - Democracy That Works For Everyone',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@choices_vote',
    creator: '@choices_vote',
    title: 'Choices - Democracy That Works For Everyone',
    description: 'Level the playing field. Expose influence. Engage with democracy.',
    images: ['/og/choices-og.png'],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://choices-app.com',
    languages: {
      'en-US': '/',
      'es-ES': '/?lang=es',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
};

type IntlMessages = AbstractIntlMessages;

async function loadMessages(locale: SupportedLocale): Promise<IntlMessages> {
  switch (locale) {
    case 'es':
      return (await import('@/messages/es.json')).default;
    case 'en':
    default:
      return (await import('@/messages/en.json')).default;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const headerStore = headers();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const acceptLanguage = headerStore.get('accept-language');
  const locale = resolveLocale(cookieLocale, acceptLanguage);

  const messages = await loadMessages(locale);

  return (
    <html lang={locale ?? DEFAULT_LOCALE}>
      <head>
        {/* CRITICAL: Set theme before React hydrates to prevent hydration mismatch */}
        <ThemeScript />
        
        {/* PWA Manifest - no preload needed as it's loaded via rel="manifest" */}
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />

        {/* PWA Icons - Optimized loading */}
        <link rel="icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.svg" />
        <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.svg" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.svg" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.svg" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.svg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.svg" />

        {/* PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Choices" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tileImage" content="/icons/icon-144x144.svg" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Theme */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="background-color" content="#ffffff" />

        {/* Performance optimizations */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-slate-50 text-gray-900">
        <SkipNavLink />
        <Providers locale={locale} messages={messages}>
          <SkipNavTarget>
            <main className="min-h-screen bg-slate-50">
              {children}
            </main>
          </SkipNavTarget>
          <SiteFooter />
        </Providers>

        {/* PWA Background is handled in app layout */}
      </body>
    </html>
  );
}
