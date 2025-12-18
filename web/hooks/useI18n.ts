'use client';

import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';

import { setLocaleCookie } from '@/lib/i18n/client';
import { isSupportedLocale, type SupportedLocale } from '@/lib/i18n/config';
import { logger } from '@/lib/utils/logger';

type TranslationParamValue = string | number | boolean | null | undefined;
type TranslationParams = Record<string, TranslationParamValue>;

function fallbackTranslate(key: string, params?: TranslationParams) {
  if (!params) {
    return key;
  }

  return key.replace(/\{(\w+)\}/g, (match, param) => {
    const value = params[param];
    if (value === undefined || value === null) {
      return match;
    }
    return typeof value === 'string' ? value : String(value);
  });
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
  
  // Keep rawTranslate in a ref to avoid dependency changes
  const translateRef = useRef(rawTranslate);
  translateRef.current = rawTranslate;

  // Stable t function - uses ref to always get latest translate function
  // without causing dependency changes
  const t = useCallback(
    (key: string, params?: TranslationParams): string => {
      try {
        const safeParams = params
          ? Object.fromEntries(
              Object.entries(params).map(([paramKey, value]) => [paramKey, String(value ?? '')]),
            )
          : undefined;

        const result = translateRef.current(key, safeParams);
        
        // If translation returns the key itself (missing translation), use fallback
        if (result === key && process.env.NODE_ENV === 'production') {
          logger.warn(`[i18n] Missing translation for key "${key}"`);
          return fallbackTranslate(key, params);
        }
        
        return result;
      } catch (error) {
        // Always log in development, but be more careful in production
        if (process.env.NODE_ENV !== 'production') {
          logger.warn(`[i18n] Translation error for key "${key}"`, error);
        } else {
          // In production, only log if it's a critical key (not just a missing translation)
          if (error instanceof Error && !error.message.includes('Missing')) {
            logger.error(`[i18n] Translation error for key "${key}"`, error);
          }
        }
        return fallbackTranslate(key, params);
      }
    },
    [], // Empty deps - t is now stable
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

  return useMemo(
    () => ({
      t,
      changeLanguage,
      currentLanguage: locale,
      isReady: true,
    }),
    [t, changeLanguage, locale]
  );
};
