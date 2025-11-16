'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';

import type { SupportedLocale } from '@/lib/i18n/config';
import { DEFAULT_TIME_ZONE } from '@/lib/i18n/config';

type ProvidersProps = {
  children: ReactNode;
  locale: SupportedLocale;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={DEFAULT_TIME_ZONE}
      onError={(error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[i18n]', error.code, error.message);
        }
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
