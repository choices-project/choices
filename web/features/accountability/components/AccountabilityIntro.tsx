'use client';

import { Info } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

import type { CompanyProfile } from '@/lib/accountability/types';

import { useI18n } from '@/hooks/useI18n';

import { CompanyBadge } from './RecipientCard';


export function AccountabilityIntro({
  generatedAt,
  companies,
}: {
  generatedAt: string;
  companies: CompanyProfile[];
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('accountability.title')}</h1>
        <p className="mt-2 max-w-3xl text-lg text-muted-foreground">{t('accountability.lede')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('accountability.updated', { date: generatedAt })}</p>
        <p className="mt-2 text-sm">
          <a href="/welcome" className="text-primary underline-offset-2 hover:underline">
            {t('accountability.aboutPlatform')}
          </a>
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {companies.map((c) => (
          <div key={c.id} className="rounded-md border border-border p-3 text-sm">
            <dt className="flex flex-wrap items-center gap-2 font-medium text-foreground">
              <CompanyBadge company={c.id} />
              {c.name}
            </dt>
            <dd className="mt-1 text-muted-foreground">
              {c.hq} · {c.products}
              {c.formerly ? ` · ${c.formerly}` : ''}
            </dd>
          </div>
        ))}
      </dl>
      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>{t('accountability.disclaimer')}</AlertDescription>
      </Alert>
    </div>
  );
}
