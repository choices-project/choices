'use client'

import { useState } from 'react'
import { CheckCircle2, ArrowRight, User, Heart, Shield, Zap } from 'lucide-react'
import { completeOnboarding } from '@/app/actions/complete-onboarding'

type OnboardingStep = {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState({
    notifications: true,
    dataSharing: false,
    theme: 'system'
  })

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Welcome to Choices',
      description: 'Let\'s get to know you and set up your account',
      icon: <User className="h-6 w-6" />,
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'Privacy & Security',
      description: 'Your data is yours. We\'ll never share it without your permission',
      icon: <Shield className="h-6 w-6" />,
      completed: currentStep > 2
    },
    {
      id: 3,
      title: 'Personalization',
      description: 'Help us tailor your experience to your preferences',
      icon: <Heart className="h-6 w-6" />,
      completed: currentStep > 3
    },
    {
      id: 4,
      title: 'You\'re All Set!',
      description: 'Ready to start making better decisions',
      icon: <Zap className="h-6 w-6" />,
      completed: currentStep > 4
    }
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = completeOnboarding

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Choices</h2>
            <p className="text-gray-600 mb-6">
              We're excited to have you on board! Let's get to know you and set up your account 
              so you can start making better decisions with the help of our community.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">What you'll get:</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Access to community polls and discussions</li>
                <li>• Personalized recommendations based on your interests</li>
                <li>• Privacy-focused data handling</li>
                <li>• Real-time insights and analytics</li>
              </ul>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy & Security</h2>
            <p className="text-gray-600 mb-6">
              Your privacy is our top priority. We believe you should have complete control 
              over your data and how it's used.
            </p>
            <div className="bg-green-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-900 mb-2">Our commitment to you:</h3>
              <ul className="text-green-800 space-y-1 text-sm">
                <li>• Your data never leaves our secure servers</li>
                <li>• We don't sell or share your personal information</li>
                <li>• You can delete your data at any time</li>
                <li>• End-to-end encryption for sensitive data</li>
              </ul>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Personalization</h2>
            <p className="text-gray-600 mb-6">
              Help us tailor your experience by sharing your preferences. 
              This will help us show you the most relevant content and polls.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={preferences.notifications}
                    onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Email notifications</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="dataSharing"
                    checked={preferences.dataSharing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, dataSharing: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Share anonymous usage data</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme preference</label>
                <select
                  name="theme"
                  value={preferences.theme}
                  onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="system">System default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">You're All Set!</h2>
            <p className="text-gray-600 mb-6">
              Congratulations! Your account is ready. You can now start exploring polls, 
              participating in discussions, and making better decisions with our community.
            </p>
            <div className="bg-yellow-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-900 mb-2">What's next:</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• Browse trending polls and topics</li>
                <li>• Create your first poll</li>
                <li>• Connect with other users</li>
                <li>• Explore advanced features</li>
              </ul>
            </div>

            <form action={handleComplete} noValidate className="space-y-4 mt-6">
              <input type="hidden" name="notifications" value={preferences.notifications.toString()} />
              <input type="hidden" name="dataSharing" value={preferences.dataSharing.toString()} />
              <input type="hidden" name="theme" value={preferences.theme} />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </form>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Choices
          </h1>
          <p className="text-gray-600">
            Let's get you set up
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === step.id 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="text-center flex-1">
                <p className={`text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
