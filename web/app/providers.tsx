'use client';

import { NextIntlClientProvider, IntlErrorCode } from 'next-intl';

import type { SupportedLocale } from '@/lib/i18n/config';
import { DEFAULT_TIME_ZONE } from '@/lib/i18n/config';
import { logger } from '@/lib/utils/logger';

import type { AbstractIntlMessages, IntlError } from 'next-intl';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
  locale: SupportedLocale;
  messages: AbstractIntlMessages;
}

// Handle i18n errors gracefully - log but don't crash
function handleI18nError(error: IntlError) {
  // Only log missing translations in development, don't crash the app
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[i18n] Missing translation:', error.message);
    }
    // Don't rethrow - let getMessageFallback handle it
    return;
  }
  
  // Log other errors
  logger.error('[i18n] Error:', error);
}

// Provide fallback for missing translations instead of crashing
function getMessageFallback({ 
  namespace, 
  key, 
  error 
}: { 
  namespace?: string; 
  key: string; 
  error: IntlError;
}) {
  // Return the key itself as a fallback
  const path = [namespace, key].filter(Boolean).join('.');
  
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    // For missing messages, just return the last part of the key
    // e.g., "polls.page.breadcrumbs.home" -> "home" capitalized
    const lastPart = key.split('.').pop() || key;
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
  
  return `[${path}]`;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={DEFAULT_TIME_ZONE}
      onError={handleI18nError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}
