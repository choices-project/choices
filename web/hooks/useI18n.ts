'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCallback } from 'react';

import { setLocaleCookie } from '@/lib/i18n/client';
import { isSupportedLocale, type SupportedLocale } from '@/lib/i18n/config';

type TranslationParams = Record<string, string>;

function fallbackTranslate(key: string, params?: TranslationParams) {
  if (!params) {
    return key;
  }

  return key.replace(/\{(\w+)\}/g, (match, param) => params[param] ?? match);
}

/**
 * Internationalization hook for translation and locale management.
 *
 * Wraps next-intl and preserves the legacy signature used across the app.
 */
export const useI18n = () => {
  const locale = useLocale();
  const rawTranslate = useTranslations();
  const router = useRouter();

  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      try {
        const safeParams = params
          ? Object.fromEntries(
              Object.entries(params).map(([paramKey, value]) => [paramKey, String(value)]),
            )
          : undefined;

        return rawTranslate(key, safeParams);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing translation for key "${key}"`, error);
        }
        return fallbackTranslate(key, params);
      }
    },
    [rawTranslate],
  );

  const changeLanguage = useCallback(
    async (nextLocale: string) => {
      if (!isSupportedLocale(nextLocale) || nextLocale === locale) {
        return;
      }

      setLocaleCookie(nextLocale as SupportedLocale);
      // Refresh to pick up new messages during the next render pass
      router.refresh();
    },
    [locale, router],
  );

  return {
    t,
    changeLanguage,
    currentLanguage: locale,
    isReady: true,
  };
};
