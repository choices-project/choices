'use client';

import Link from 'next/link';

import { useI18n } from '@/hooks/useI18n';

export function NotFoundView() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-background dark:via-background dark:to-muted flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-6xl font-bold text-muted-foreground">404</div>
        <h1 className="text-2xl font-bold text-foreground">{t('notFound.title')}</h1>
        <p className="text-muted-foreground">{t('notFound.description')}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background transition"
          >
            {t('notFound.backHome')}
          </Link>
          <Link
            href="/auth"
            prefetch={false}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background transition"
          >
            {t('notFound.signIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
