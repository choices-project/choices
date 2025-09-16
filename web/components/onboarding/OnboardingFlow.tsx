'use client';

import React, { useState, createContext, useContext } from 'react';
import { 
  MapPin, 
  Users, 
  Shield, 
  Heart, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import LocationInput from './LocationInput';
import WelcomeStep from './steps/WelcomeStep';
import InterestSelectionStep from './steps/InterestSelectionStep';
import PrivacyStep from './steps/PrivacyStep';
import CompleteStep from './steps/CompleteStep';

// Onboarding Context
interface OnboardingContextType {
  userData: any;
  setUserData: (updater: (prev: any) => any) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: Set<string>;
  setCompletedSteps: (updater: (prev: Set<string>) => Set<string>) => void;
  updateData: (updates: any) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboardingContext must be used within OnboardingFlow');
  }
  return context;
};

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<any>({});

  const updateData = (updates: any) => {
    setUserData((prev: any) => ({ ...prev, ...updates }));
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to the Democratic Revolution! 🗳️',
      description: 'We\'re leveling the playing field for all candidates',
      icon: <Sparkles className="w-8 h-8" />,
      component: <WelcomeStep onNext={() => nextStep()} />
    },
    {
      id: 'location',
      title: 'Find Your Local Candidates',
      description: 'We\'ll show you everyone running in your area',
      icon: <MapPin className="w-8 h-8" />,
      component: (
        <LocationInput
          onLocationResolved={(jurisdictionIds) => {
            setUserData((prev: any) => ({ ...prev, jurisdictionIds }));
            completeStep('location');
          }}
          onError={(error) => console.error('Location error:', error)}
        />
      )
    },
    {
      id: 'interests',
      title: 'What Matters to You?',
      description: 'Help us show you the most relevant candidates',
      icon: <Target className="w-8 h-8" />,
      component: <InterestSelectionStep onNext={() => nextStep()} onBack={() => prevStep()} />
    },
    {
      id: 'privacy',
      title: 'Your Privacy is Protected',
      description: 'Learn how we keep your data safe',
      icon: <Shield className="w-8 h-8" />,
      component: <PrivacyStep data={userData} onUpdate={updateData} onNext={() => nextStep()} onBack={() => prevStep()} />
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      description: 'Ready to discover your candidates',
      icon: <CheckCircle className="w-8 h-8" />,
      component: <CompleteStep data={userData} onComplete={() => nextStep()} onBack={() => prevStep()} />
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 1000);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const contextValue: OnboardingContextType = {
    userData,
    setUserData,
    currentStep,
    setCurrentStep,
    completedSteps,
    setCompletedSteps,
    updateData
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="pt-8 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-full shadow-lg">
                {currentStepData.icon}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.title}
            </h1>
            <p className="text-lg text-gray-600">
              {currentStepData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 transition-all duration-300 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStepData.component}
        </div>
      </div>

      {/* Fun facts */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-900">10,000+ Voters</p>
                <p className="text-sm text-gray-600">Already using our platform</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-900">100% Private</p>
                <p className="text-sm text-gray-600">Your data stays on your device</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="font-semibold text-gray-900">Equal Access</p>
                <p className="text-sm text-gray-600">All candidates get equal voice</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </OnboardingContext.Provider>
  );
}

// Step components are imported from separate files