'use client'

import { useState, useEffect, useCallback, createContext, useContext, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import WelcomeStep from './steps/WelcomeStep'
import AuthStep from './steps/AuthStep'
import ValuesStep from './steps/ValuesStep'
import DemographicsStep from './steps/DemographicsStep'
import PrivacyStep from './steps/PrivacyStep'
import CompleteStep from './steps/CompleteStep'
import { devLog } from '@/lib/logger';

export type OnboardingStep = 'welcome' | 'auth' | 'values' | 'demographics' | 'privacy' | 'complete'

interface OnboardingData {
  // Auth data
  authMethod?: 'google' | 'github' | 'email'
  user?: any
  
  // Profile data
  displayName?: string
  avatar?: string
  bio?: string
  
  // Values & interests
  primaryConcerns: string[]
  communityFocus: string[]
  participationStyle: 'observer' | 'contributor' | 'leader'
  
  // Demographics (optional)
  demographics: {
    ageRange?: string
    education?: string
    employment?: string
    incomeRange?: string
  }
  
  // Privacy settings
  privacy: {
    shareProfile: boolean
    shareDemographics: boolean
    shareParticipation: boolean
    allowAnalytics: boolean
  }
}

function OnboardingFlowInner() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    primaryConcerns: [],
    communityFocus: [],
    participationStyle: 'observer',
    demographics: {},
    privacy: {
      shareProfile: false,
      shareDemographics: false,
      shareParticipation: false,
      allowAnalytics: false
    }
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check authentication status and handle step from URL
  useEffect(() => {
    const checkAuthAndStep = async () => {
      try {
        const stepParam = searchParams.get('step')
        if (stepParam && ['auth', 'values', 'demographics', 'privacy', 'complete'].includes(stepParam)) {
          setCurrentStep(stepParam as OnboardingStep)
        }

        // Check if user is authenticated
        if (!supabase) {
          throw new Error('Authentication service not available')
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user && !userError) {
          // User is authenticated, update data
          setOnboardingData(prev => ({
            ...prev,
            user,
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatar_url
          }))
          
          // If we're on auth step and user is authenticated, move to values
          if (currentStep === 'auth') {
            setCurrentStep('values')
          }
        } else if (currentStep !== 'welcome' && currentStep !== 'auth') {
          // User is not authenticated but trying to access protected steps
          setCurrentStep('auth')
        }
      } catch (error) {
        devLog('Error checking auth status:', error)
        setError('Failed to check authentication status')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndStep()
  }, [searchParams, currentStep, supabase?.auth])

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      const nextStepName = steps[currentIndex + 1]
      setCurrentStep(nextStepName)
      
      // Update URL to reflect current step
      const url = new URL(window.location.href)
      url.searchParams.set('step', nextStepName)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      const prevStepName = steps[currentIndex - 1]
      setCurrentStep(prevStepName)
      
      // Update URL to reflect current step
      const url = new URL(window.location.href)
      url.searchParams.set('step', prevStepName)
      window.history.replaceState({}, '', url.toString())
    }
  }

  const handleComplete = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Save profile data
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile')
      }
      
      const result = await response.json()
      devLog('Profile saved successfully:', result)
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error: any) {
      devLog('Error saving profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading your onboarding experience...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />
      case 'auth':
        return (
          <AuthStep
            data={onboardingData}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 'values':
        return (
          <ValuesStep
            data={onboardingData}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 'demographics':
        return (
          <DemographicsStep
            data={onboardingData}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 'privacy':
        return (
          <PrivacyStep
            data={onboardingData}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )
      case 'complete':
        return (
          <CompleteStep
            data={onboardingData}
            onComplete={handleComplete}
            onBack={prevStep}
            isLoading={isLoading}
          />
        )
      default:
        return <WelcomeStep onNext={nextStep} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].map((step: any, index: any) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].indexOf(currentStep)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {index < ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].indexOf(currentStep) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 5 && (
                  <div className={`
                    w-12 h-1 mx-2
                    ${index < ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Step {['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].indexOf(currentStep) + 1} of 6
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingFlow() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading your onboarding experience...</p>
        </div>
      </div>
    }>
      <OnboardingFlowInner />
    </Suspense>
  )
}
