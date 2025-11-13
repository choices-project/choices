'use client';

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type SupportedLocale } from './config';

export function setLocaleCookie(locale: SupportedLocale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return;
  }

  const maxAgeDirective = `Max-Age=${LOCALE_COOKIE_MAX_AGE}`;
  const sameSiteDirective = 'SameSite=Lax';
  const pathDirective = 'Path=/';

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; ${pathDirective}; ${maxAgeDirective}; ${sameSiteDirective}`;
}


