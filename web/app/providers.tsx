'use client';

import { NextIntlClientProvider } from 'next-intl';


import type { SupportedLocale } from '@/lib/i18n/config';
import { DEFAULT_TIME_ZONE } from '@/lib/i18n/config';
import { logger } from '@/lib/utils/logger';

import type { AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';

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
          logger.warn('[i18n]', error.code, error.message);
        } else {
          logger.error('[i18n]', new Error(error.message));
        }
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
