'use client'

import { CheckCircle, Circle } from 'lucide-react'
import { OnboardingStep } from '../EnhancedOnboardingFlow'

interface ProgressIndicatorProps {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
}

const stepConfig = {
  'welcome': { label: 'Welcome', icon: '👋' },
  'privacy-philosophy': { label: 'Privacy', icon: '🔒' },
  'platform-tour': { label: 'Platform', icon: '🎯' },
  'data-usage': { label: 'Data Usage', icon: '📊' },
  'auth-setup': { label: 'Security', icon: '🔐' },
  'profile-setup': { label: 'Profile', icon: '👤' },
  'first-experience': { label: 'Experience', icon: '🚀' },
  'complete': { label: 'Complete', icon: '✅' }
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

export default function ProgressIndicator({ currentStep, completedSteps }: ProgressIndicatorProps) {
  const currentIndex = stepOrder.indexOf(currentStep)
  const progressPercentage = ((currentIndex + 1) / stepOrder.length) * 100

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentIndex + 1} of {stepOrder.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
              data-testid="progress-bar"
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="hidden md:flex justify-between items-center">
          {stepOrder.map((step, index) => {
            const isCompleted = completedSteps.includes(step)
            const isCurrent = step === currentStep
            const isPast = index < currentIndex
            
            return (
              <div key={step} className="flex flex-col items-center group relative">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-110 transform ${
                    isCompleted || isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg hover:shadow-xl'
                      : isPast
                      ? 'bg-green-500 border-green-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                  }`}
                  data-testid={`step-${step}`}
                  title={`${stepConfig[step].label} - ${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 animate-bounce" />
                  ) : (
                    <span className={`text-sm font-medium ${isCurrent ? 'animate-pulse' : ''}`}>
                      {stepConfig[step].icon}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-2 text-center transition-colors duration-300 font-medium ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                } group-hover:text-blue-600`}>
                  {stepConfig[step].label}
                </span>
                
                {/* Tooltip */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gray-900 text-white text-xs rounded py-1 px-2 -mt-12 transform -translate-x-1/2 left-1/2 z-50">
                  {stepConfig[step].label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg">
              <span className="text-sm font-medium">
                {stepConfig[currentStep].icon}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {stepConfig[currentStep].label}
              </div>
              <div className="text-xs text-gray-500">
                Step {currentIndex + 1} of {stepOrder.length}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mt-4 flex items-center justify-center text-sm text-gray-600">
          <div className="flex items-center space-x-2" data-testid="breadcrumb">
            {stepOrder.slice(0, currentIndex + 1).map((step, index) => (
              <div key={step} className="flex items-center">
                <span className={index === currentIndex ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                  {stepConfig[step].label}
                </span>
                {index < currentIndex && <span className="mx-2 text-gray-400">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Badge */}
        {completedSteps.length > 0 && (
          <div className="mt-4 flex justify-center">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce"
              data-testid="achievement-badge"
            >
              🎉 {completedSteps.length === 1 ? 'First Step Complete!' : `${completedSteps.length} Steps Complete!`}
            </div>
          </div>
        )}

        {/* Auto-save indicator */}
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Progress saved automatically</span>
          </div>
        </div>
      </div>
    </div>
  )
}
