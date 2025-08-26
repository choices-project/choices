'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { devLog } from '@/lib/logger'
import WelcomeStep from './steps/WelcomeStep'
import PrivacyPhilosophyStep from './steps/PrivacyPhilosophyStep'
import PlatformTourStep from './steps/PlatformTourStep'
import DataUsageStep from './steps/DataUsageStep'
import AuthSetupStep from './steps/AuthSetupStep'
import ProfileSetupStep from './steps/ProfileSetupStep'
import FirstExperienceStep from './steps/FirstExperienceStep'
import CompleteStep from './steps/CompleteStep'
import ProgressIndicator from './components/ProgressIndicator'

export type OnboardingStep = 
  | 'welcome' 
  | 'privacy-philosophy' 
  | 'platform-tour' 
  | 'data-usage' 
  | 'auth-setup' 
  | 'profile-setup' 
  | 'first-experience' 
  | 'complete'

interface OnboardingData {
  // User data
  user?: any
  displayName?: string
  avatar?: string
  
  // Privacy preferences
  privacyLevel?: 'low' | 'medium' | 'high' | 'maximum'
  profileVisibility?: 'public' | 'private' | 'friends_only' | 'anonymous'
  dataSharing?: 'none' | 'analytics_only' | 'research' | 'full'
  
  // Platform preferences
  notificationPreferences?: {
    email: boolean
    push: boolean
    sms: boolean
  }
  
  // Progress tracking
  completedSteps: OnboardingStep[]
  stepData: Record<string, any>
  
  // Completion flags
  privacyPhilosophyCompleted?: boolean
  platformTourCompleted?: boolean
  dataUsageCompleted?: boolean
  authSetupCompleted?: boolean
  profileSetupCompleted?: boolean
  firstExperienceCompleted?: boolean
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  currentStep: OnboardingStep
  setCurrentStep: (step: OnboardingStep) => void
  isLoading: boolean
  error: string | null
  startOnboarding: () => Promise<void>
  updateOnboardingStep: (step: OnboardingStep, stepData?: any) => Promise<void>
  completeOnboarding: () => Promise<void>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboardingContext() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingProvider')
  }
  return context
}

const stepOrder: OnboardingStep[] = [
  'welcome',
  'privacy-philosophy',
  'platform-tour',
  'data-usage',
  'auth-setup',
  'profile-setup',
  'first-experience',
  'complete'
]

function EnhancedOnboardingFlowInner() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [data, setData] = useState<OnboardingData>({
    completedSteps: [],
    stepData: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }, [])

  const startOnboarding = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'welcome', action: 'start' })
      })

      if (!response.ok) {
        throw new Error('Failed to start onboarding')
      }

      devLog('Onboarding started successfully')
    } catch (error) {
      devLog('Error starting onboarding:', error)
      setError('Failed to start onboarding')
    }
  }, [])

  const updateOnboardingStep = useCallback(async (step: OnboardingStep, stepData?: any) => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          step, 
          action: 'update',
          data: stepData || {}
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update onboarding step')
      }

      // Update local state
      setData(prev => ({
        ...prev,
        completedSteps: [...new Set([...prev.completedSteps, step])],
        stepData: { ...prev.stepData, [step]: stepData }
      }))

      devLog(`Onboarding step ${step} updated successfully`)
    } catch (error) {
      devLog('Error updating onboarding step:', error)
      setError('Failed to update onboarding progress')
    }
  }, [])

  const completeOnboarding = useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'complete', action: 'complete' })
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      devLog('Onboarding completed successfully')
      router.push('/dashboard')
    } catch (error) {
      devLog('Error completing onboarding:', error)
      setError('Failed to complete onboarding')
    }
  }, [router])

  // Check authentication status and handle step from URL
  useEffect(() => {
    const checkAuthAndStep = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check URL step parameter
        const stepParam = searchParams.get('step')
        if (stepParam && stepOrder.includes(stepParam as OnboardingStep)) {
          setCurrentStep(stepParam as OnboardingStep)
        }

        // Check if user is authenticated
        if (!supabase) {
          throw new Error('Authentication service not available')
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user && !userError) {
          // User is authenticated, update data
          setData(prev => ({
            ...prev,
            user,
            displayName: user.user_metadata?.fullname || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatarurl
          }))
          
          // Load existing onboarding progress
          const progressResponse = await fetch('/api/onboarding/progress')
          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            if (progressData.progress) {
              setData(prev => ({
                ...prev,
                completedSteps: progressData.progress.completed_steps || [],
                stepData: progressData.progress.step_data || {}
              }))
              
              // Set current step from progress
              if (progressData.progress.current_step && stepOrder.includes(progressData.progress.current_step)) {
                setCurrentStep(progressData.progress.current_step)
              }
            }
          }

          // Load privacy preferences
          const preferencesResponse = await fetch('/api/privacy/preferences')
          if (preferencesResponse.ok) {
            const preferencesData = await preferencesResponse.json()
            if (preferencesData.preferences) {
              setData(prev => ({
                ...prev,
                privacyLevel: preferencesData.preferences.data_sharing_level === 'none' ? 'maximum' :
                              preferencesData.preferences.data_sharing_level === 'analytics_only' ? 'high' :
                              preferencesData.preferences.data_sharing_level === 'research' ? 'medium' : 'low',
                profileVisibility: preferencesData.preferences.profile_visibility,
                dataSharing: preferencesData.preferences.data_sharing_level,
                notificationPreferences: preferencesData.preferences.notification_preferences
              }))
            }
          }
        } else if (currentStep !== 'welcome' && currentStep !== 'auth-setup') {
          // User is not authenticated but trying to access protected steps
          setCurrentStep('auth-setup')
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
  const handleNext = useCallback(async () => {
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1]
      
      // Update onboarding progress
      await updateOnboardingStep(currentStep, data.stepData[currentStep])
      
      // Update URL
      router.push(`/onboarding?step=${nextStep}`)
      setCurrentStep(nextStep)
    }
  }, [currentStep, data.stepData, updateOnboardingStep, router])

  const handleBack = useCallback(() => {
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      const prevStep = stepOrder[currentIndex - 1]
      router.push(`/onboarding?step=${prevStep}`)
      setCurrentStep(prevStep)
    }
  }, [currentStep, router])

  const handleComplete = useCallback(async () => {
    await updateOnboardingStep(currentStep, data.stepData[currentStep])
    await completeOnboarding()
  }, [currentStep, data.stepData, updateOnboardingStep, completeOnboarding])

  const contextValue: OnboardingContextType = {
    data,
    updateData,
    currentStep,
    setCurrentStep,
    isLoading,
    error,
    startOnboarding,
    updateOnboardingStep,
    completeOnboarding
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your onboarding experience...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Something went wrong</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} completedSteps={data.completedSteps} />
        
        {/* Step Content */}
        <div className="container mx-auto px-4 py-8">
          {currentStep === 'welcome' && (
            <WelcomeStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
            />
          )}
          {currentStep === 'privacy-philosophy' && (
            <PrivacyPhilosophyStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'platform-tour' && (
            <PlatformTourStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'data-usage' && (
            <DataUsageStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'auth-setup' && (
            <AuthSetupStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'profile-setup' && (
            <ProfileSetupStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'first-experience' && (
            <FirstExperienceStep 
              data={data}
              onUpdate={updateData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep 
              data={data}
              onComplete={handleComplete}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </OnboardingContext.Provider>
  )
}

export default function EnhancedOnboardingFlow() {
  return <EnhancedOnboardingFlowInner />
}

