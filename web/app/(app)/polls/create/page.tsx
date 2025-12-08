'use client';

import { useEffect } from 'react';

import { AccessiblePollWizard } from '@/features/polls/components/AccessiblePollWizard';
import { useAppActions } from '@/lib/stores/appStore';

export default function CreatePollPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/polls/create');
    setSidebarActiveSection('polls');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Polls', href: '/polls' },
      { label: 'Create Poll', href: '/polls/create' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  return <AccessiblePollWizard />;
}

