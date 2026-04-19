'use client';

import { SkipNavLink } from '@/components/accessibility/SkipNavLink';

import { useI18n } from '@/hooks/useI18n';

/** Skip link text follows the active locale (must render inside `NextIntlClientProvider`). */
export function LocaleSkipNavLink() {
  const { t } = useI18n();
  return <SkipNavLink>{t('common.skipToContent')}</SkipNavLink>;
}
