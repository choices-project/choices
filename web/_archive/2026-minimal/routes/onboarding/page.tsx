'use client'

import React, { Suspense } from 'react';

import BalancedOnboardingFlow from '@/features/onboarding/components/BalancedOnboardingFlow'

import { useI18n } from '@/hooks/useI18n';

function OnboardingContent() {
  return <BalancedOnboardingFlow />
}

export default function OnboardingPage() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-300">{t('onboarding.loading')}</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
