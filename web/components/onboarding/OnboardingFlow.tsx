'use client'

import { useState, useEffect, useCallback, createContext, useContext, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
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
  authMethod?: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord' | 'instagram' | 'tiktok' | 'email'
  user?: any
  
  // Profile data
  displayName?: string
  avatar?: string
  bio?: string
  
  // Welcome step data
  welcomeStarted?: boolean
  welcomeCompleted?: boolean
  userPreferences?: {
    theme?: string
    language?: string
  }
  
  // Values & interests
  primaryConcerns: string[]
  communityFocus: string[]
  participationStyle: 'observer' | 'contributor' | 'leader'
  valuesCompleted?: boolean
  
  // Demographics (optional)
  demographics: {
    ageRange?: string
    education?: string
    employment?: string
    incomeRange?: string
  }
  demographicsCompleted?: boolean
  
  // Privacy settings
  privacy: {
    shareProfile: boolean
    shareDemographics: boolean
    shareParticipation: boolean
    allowAnalytics: boolean
  }
  privacyCompleted?: boolean
  
  // Auth step data
  authCompleted?: boolean
}

// Create context for sharing onboarding state
const OnboardingContext = createContext<{
  currentStep: OnboardingStep;
  onboardingData: OnboardingData;
  updateData: (_updates: Partial<OnboardingData>) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  isLoading: boolean;
  error: string | null;
}>({
  currentStep: 'welcome',
  onboardingData: {
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
  },
  updateData: (_updates: Partial<OnboardingData>) => {
    // This is a default implementation that will be overridden
    // The underscore prefix indicates this parameter is intentionally unused in the default context
    devLog('OnboardingContext updateData called before initialization')
  },
  setCurrentStep: (_step: OnboardingStep) => {
    // This is a default implementation that will be overridden
    // The underscore prefix indicates this parameter is intentionally unused in the default context
    devLog('OnboardingContext setCurrentStep called before initialization')
  },
  isLoading: false,
  error: null
});

// Hook to use onboarding context
export function useOnboardingContext() {
  return useContext(OnboardingContext);
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
  
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  // Use useCallback for the updateData function to prevent unnecessary re-renders
  const updateData = useCallback((_updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ..._updates }))
  }, [])

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
            displayName: user.user_metadata?.fullname || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatarurl
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
  }, [searchParams, currentStep, supabase])

  // Step navigation handlers
  const handleNext = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }, [currentStep])

  const handleBack = useCallback(() => {
    const stepOrder: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    // Handle onboarding completion
    devLog('Onboarding completed:', onboardingData)
    // Redirect to main app or dashboard
    window.location.href = '/dashboard'
  }, [onboardingData])

  // Create context value
  const contextValue = {
    currentStep,
    onboardingData,
    updateData,
    setCurrentStep,
    isLoading,
    error
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={<div>Loading...</div>}>
              {currentStep === 'welcome' && (
                <WelcomeStep 
                  data={{
                    welcomeStarted: onboardingData.welcomeStarted || false,
                    welcomeCompleted: onboardingData.welcomeCompleted || false,
                    userPreferences: onboardingData.userPreferences || {}
                  }}
                  onUpdate={(updates) => updateData({ ...updates })}
                  onNext={handleNext}
                />
              )}
              {currentStep === 'auth' && (
                <AuthStep 
                  data={onboardingData}
                  onUpdate={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 'values' && (
                <ValuesStep 
                  data={onboardingData}
                  onUpdate={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 'demographics' && (
                <DemographicsStep 
                  data={onboardingData}
                  onUpdate={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 'privacy' && (
                <PrivacyStep 
                  data={onboardingData}
                  onUpdate={updateData}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              {currentStep === 'complete' && (
                <CompleteStep 
                  data={onboardingData}
                  onComplete={handleComplete}
                  onBack={handleBack}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </OnboardingContext.Provider>
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
