'use client';

/**
 * Create Civic Action Page
 *
 * Allows users to create petitions, campaigns, and other civic actions.
 * When navigated from a representative detail page, pre-fills target representative.
 *
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { CreateCivicActionForm } from '@/features/civics/components/civic-actions';

import { useAppActions } from '@/lib/stores/appStore';

import { useI18n } from '@/hooks/useI18n';

function CreateCivicActionPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  const representativeIdParam = searchParams.get('representative_id');
  const representativeId = representativeIdParam
    ? (() => {
        const parsed = parseInt(representativeIdParam, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
      })()
    : undefined;

  useEffect(() => {
    setCurrentRoute('/civic-actions/create');
    setSidebarActiveSection('civics');
    setBreadcrumbs([
      { label: t('navigation.home'), href: '/' },
      { label: t('civics.representatives.detail.sections.civicActions'), href: '/civics' },
      { label: t('civics.actions.create.header.title'), href: '/civic-actions/create' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection, t]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <CreateCivicActionForm
        {...(representativeId !== undefined && { initialTargetRepresentativeId: representativeId })}
        onSuccess={(actionId) => {
          router.push(`/civic-actions/${actionId}`);
        }}
      />
    </div>
  );
}

export default function CreateCivicActionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      }
    >
      <CreateCivicActionPageContent />
    </Suspense>
  );
}
