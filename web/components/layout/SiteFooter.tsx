'use client';

import Link from 'next/link';

import { useI18n } from '@/hooks/useI18n';

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-background"
      data-testid="site-footer"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center sm:text-left">
          © {year} Choices. {t('footer.rights')}
        </p>

        <nav
          aria-label={t('footer.legalNav')}
          className="flex flex-wrap items-center justify-center gap-4 text-primary"
        >
          <Link
            href="/terms"
            prefetch={false}
            className="font-medium transition-colors hover:text-primary/90 focus-visible:underline"
          >
            {t('footer.terms')}
          </Link>
          <Link
            href="/privacy"
            prefetch={false}
            className="font-medium transition-colors hover:text-primary/90 focus-visible:underline"
          >
            {t('footer.privacy')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;
