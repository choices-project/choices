'use client';

import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type SupportedLocale } from './config';

export function setLocaleCookie(locale: SupportedLocale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return;
  }

  const maxAgeDirective = `Max-Age=${LOCALE_COOKIE_MAX_AGE}`;
  const sameSiteDirective = 'SameSite=Lax';
  const pathDirective = 'Path=/';

  // Add Secure flag in production (HTTPS required)
  const isProduction = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
     window.location.hostname.includes('choices-app.com'));
  const secureDirective = isProduction ? 'Secure' : '';

  // Build cookie string with all directives
  const cookieParts = [
    `${LOCALE_COOKIE_NAME}=${locale}`,
    pathDirective,
    maxAgeDirective,
    sameSiteDirective,
  ];

  if (secureDirective) {
    cookieParts.push(secureDirective);
  }

  document.cookie = cookieParts.join('; ');
}


