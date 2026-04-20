import { cookies, headers } from 'next/headers';

import { NotFoundView } from '@/components/not-found/NotFoundView';

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  resolveLocale,
  type SupportedLocale,
} from '@/lib/i18n/config';

import type { Metadata } from 'next';

const notFoundMetadata: Record<SupportedLocale, { title: string; description: string }> = {
  en: {
    title: 'Page Not Found',
    description: "Sorry, we couldn't find the page you're looking for.",
  },
  es: {
    title: 'Página no encontrada',
    description: 'No pudimos encontrar la página que buscas.',
  },
};

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
  const meta = notFoundMetadata[locale] ?? notFoundMetadata[DEFAULT_LOCALE];
  return {
    title: meta.title,
    description: meta.description,
  };
}

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return <NotFoundView />;
}
