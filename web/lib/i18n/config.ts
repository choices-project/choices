export const SUPPORTED_LOCALES = ['en', 'es'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const DEFAULT_TIME_ZONE = 'UTC';

export const LOCALE_COOKIE_NAME = 'choices.locale';

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


