'use client'

import { Suspense } from 'react'
import EnhancedOnboardingFlow from '@/components/onboarding/EnhancedOnboardingFlow'

function OnboardingContent() {
  return <EnhancedOnboardingFlow />
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Loading onboarding...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}