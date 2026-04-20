import { cookies, headers } from 'next/headers';

import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

import { LandingPage } from '@/components/marketing/LandingPage';

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  resolveLocale,
  type SupportedLocale,
} from '@/lib/i18n/config';


import type { Metadata } from 'next';

type LandingMessages = {
  landing: { metadata: { title: string; description: string } };
};

function landingMetadata(locale: SupportedLocale): { title: string; description: string } {
  const pack = (locale === 'es' ? esMessages : enMessages) as unknown as LandingMessages;
  return pack.landing.metadata;
}

/**
 * Marketing home reads locale from cookies/headers for metadata. Force dynamic so
 * `cookies()` / `headers()` always run in a real request context (avoids intermittent
 * `TypeError: Cannot read properties of undefined (reading 'get')` on GET `/` and
 * `HEAD /_next/data/.../index` seen in production logs).
 */
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  let locale: SupportedLocale = DEFAULT_LOCALE;
  try {
    const cookieStore = cookies() as
      | { get?: (name: string) => { value?: string } | undefined }
      | undefined
      | null;
    const headerStore = headers() as
      | { get?: (name: string) => string | null }
      | undefined
      | null;
    locale = resolveLocale(
      cookieStore?.get?.(LOCALE_COOKIE_NAME)?.value,
      headerStore?.get?.('accept-language') ?? null,
    );
  } catch {
    locale = DEFAULT_LOCALE;
  }
  const meta = landingMetadata(locale);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

/**
 * Root marketing home (`/`).
 *
 * Middleware behavior:
 * - Authenticated users are redirected to `/feed` before this page runs.
 * - Unauthenticated users reach this page (no redirect to `/landing`).
 *
 * `/landing` requests are consolidated to `/` or `/feed` via middleware (308).
 */
export default function RootPage() {
  return <LandingPage />;
}
