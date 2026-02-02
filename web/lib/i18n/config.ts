export const SUPPORTED_LOCALES = ['en', 'es'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const DEFAULT_TIME_ZONE = 'UTC';

export const LOCALE_COOKIE_NAME = 'choices.locale';

/**
 * RTL (Right-to-Left) languages
 * These languages require dir="rtl" attribute on HTML element
 */
export const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'] as const;

export type RtlLocale = (typeof RTL_LOCALES)[number];

/**
 * Determine if a locale is RTL (Right-to-Left)
 * @param locale - Locale code to check
 * @returns true if locale is RTL, false otherwise
 */
export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale as RtlLocale);
}

/**
 * Get text direction for a locale
 * @param locale - Locale code
 * @returns 'rtl' for RTL languages, 'ltr' otherwise
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const LOCALE_COOKIE_MAX_AGE = ONE_YEAR_IN_SECONDS;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

function parseAcceptLanguage(header: string | null): string[] {
  if (!header) {
    return [];
  }

  return header
    .split(',')
    .map((part) => {
      const [localePart, qValue] = part.trim().split(';q=');
      if (!localePart) {
        return null;
      }
      const quality = qValue ? Number.parseFloat(qValue) : 1;
      return { locale: localePart.toLowerCase(), quality };
    })
    .filter(
      (entry): entry is { locale: string; quality: number } =>
        entry !== null && Boolean(entry.locale),
    )
    .sort((a, b) => b.quality - a.quality)
    .map(({ locale }) => locale);
}

export function resolveLocale(
  cookieLocale: string | undefined,
  acceptLanguageHeader: string | null,
): SupportedLocale {
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  const candidateLocales = parseAcceptLanguage(acceptLanguageHeader);
  for (const locale of candidateLocales) {
    const base = locale.split('-')[0];
    if (isSupportedLocale(locale)) {
      return locale;
    }
    if (isSupportedLocale(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}


