import { Suspense } from 'react';
import EnhancedOnboardingFlow from '@/components/onboarding/EnhancedOnboardingFlow'

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your enhanced onboarding experience...</p>
        </div>
      </div>
    }>
      <EnhancedOnboardingFlow />
    </Suspense>
  )
}
