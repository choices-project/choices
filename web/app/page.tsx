'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { useI18n } from '@/hooks/useI18n';

/**
 * Root Landing Page
 * Redirects authenticated users to dashboard, unauthenticated users to auth page
 */
export default function RootPage() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    // Check for user session
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // User is not authenticated, redirect to auth
          router.push('/auth');
        }
      } catch {
        // On error, default to auth page
        router.push('/auth');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">{t('accessibility.loading')}</p>
      </div>
    </div>
  );
}