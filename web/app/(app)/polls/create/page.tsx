'use client';

import { useEffect } from 'react';

import { AccessiblePollWizard } from '@/features/polls/components/AccessiblePollWizard';
import { useI18n } from '@/hooks/useI18n';
import { useAppActions } from '@/lib/stores/appStore';

export default function CreatePollPage() {
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

  return <AccessiblePollWizard />;
}

