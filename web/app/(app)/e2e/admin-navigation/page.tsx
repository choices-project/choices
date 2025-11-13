'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AdminLayout } from '@/app/(app)/admin/layout/AdminLayout';
import FontProvider from '@/components/shared/FontProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserStoreProvider } from '@/lib/providers/UserStoreProvider';

const queryClient = new QueryClient();

export default function AdminNavigationHarness() {
  useEffect(() => {
    const doc = document.documentElement;
    doc.dataset.adminNavigationHarness = 'ready';
    return () => {
      delete doc.dataset.adminNavigationHarness;
    };
  }, []);

  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            <AdminLayout>
              <section className="rounded-lg border border-dashed border-gray-300 bg-white p-6">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Admin Navigation Harness
                </h1>
                <p className="text-gray-600">
                  This harness renders the admin layout so accessibility tests can assert sidebar and
                  header landmark behaviour without depending on live data.
                </p>
              </section>
            </AdminLayout>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}

