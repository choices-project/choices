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
    <Suspense fallback={<div>{t('onboarding.loading')}</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
