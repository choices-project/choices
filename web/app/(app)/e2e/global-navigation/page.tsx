'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import FontProvider from '@/components/shared/FontProvider';
import GlobalNavigation from '@/components/shared/GlobalNavigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { useI18n } from '@/hooks/useI18n';
import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

const queryClient = new QueryClient();

export default function GlobalNavigationHarness() {
  const { t } = useI18n();

  useEffect(() => {
    const doc = document.documentElement;
    doc.dataset.globalNavigationHarness = 'ready';
    return () => {
      delete doc.dataset.globalNavigationHarness;
    };
  }, []);

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            <GlobalNavigation />
            <main
              id="main-content"
              className="mx-auto max-w-5xl px-4 py-12 text-gray-700"
            >
              <h1 className="text-2xl font-semibold mb-4">
                {t('harness.globalNavigation.title')}
              </h1>
              <p>{t('harness.globalNavigation.description')}</p>
            </main>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}

