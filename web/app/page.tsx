import { cookies, headers } from 'next/headers';

import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

import { LandingPage } from '@/components/marketing/LandingPage';

import { LOCALE_COOKIE_NAME, resolveLocale, type SupportedLocale } from '@/lib/i18n/config';


import type { Metadata } from 'next';

type LandingMessages = {
  landing: { metadata: { title: string; description: string } };
};

function landingMetadata(locale: SupportedLocale): { title: string; description: string } {
  const pack = (locale === 'es' ? esMessages : enMessages) as unknown as LandingMessages;
  return pack.landing.metadata;
}

export function generateMetadata(): Metadata {
  const cookieStore = cookies();
  const headerStore = headers();
  const locale = resolveLocale(
    cookieStore.get(LOCALE_COOKIE_NAME)?.value,
    headerStore.get('accept-language'),
  );
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
