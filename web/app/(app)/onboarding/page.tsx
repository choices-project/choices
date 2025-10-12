'use client'

import { Suspense } from 'react'

import BalancedOnboardingFlow from '@/features/onboarding/components/BalancedOnboardingFlow'

function OnboardingContent() {
  return <BalancedOnboardingFlow />
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}