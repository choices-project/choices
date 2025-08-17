'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Eye, Users, TrendingUp, CheckCircle } from 'lucide-react'
import WelcomeStep from './steps/WelcomeStep'
import AuthStep from './steps/AuthStep'
import ValuesStep from './steps/ValuesStep'
import DemographicsStep from './steps/DemographicsStep'
import PrivacyStep from './steps/PrivacyStep'
import CompleteStep from './steps/CompleteStep'

export type OnboardingStep = 'welcome' | 'auth' | 'values' | 'demographics' | 'privacy' | 'complete'

interface OnboardingData {
  // Auth data
  authMethod?: 'google' | 'github' | 'twitter' | 'email'
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

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
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

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleComplete = async () => {
    try {
      // Save profile data
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      })
      
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
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
            {['welcome', 'auth', 'values', 'demographics', 'privacy', 'complete'].map((step, index) => (
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
        </div>

        {/* Step content */}
        <div className="max-w-2xl mx-auto">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
