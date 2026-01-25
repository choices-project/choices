'use client';

import { Suspense, useEffect } from 'react';

import PollCreateWizardPage from '@/features/polls/pages/create/page';

import { useAppActions } from '@/lib/stores/appStore';

import { useI18n } from '@/hooks/useI18n';

function CreatePollPageContent() {
  const { t } = useI18n();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/polls/create');
    setSidebarActiveSection('polls');
    setBreadcrumbs([
      { label: t('polls.page.breadcrumbs.home'), href: '/' },
      { label: t('polls.page.breadcrumbs.dashboard'), href: '/dashboard' },
      { label: t('polls.page.breadcrumbs.polls'), href: '/polls' },
      { label: t('polls.create.page.title'), href: '/polls/create' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection, t]);

  return <PollCreateWizardPage />;
}

export default function PollsCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto" />
            </div>
            <p className="text-sm text-muted-foreground">Loading poll creation form...</p>
          </div>
        </div>
      }
    >
      <CreatePollPageContent />
    </Suspense>
  );
}

