'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

type OnboardingStep = 'welcome' | 'privacy' | 'tour' | 'data-usage' | 'auth-setup' | 'complete';

export default function SimpleOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const router = useRouter();

  const steps: OnboardingStep[] = ['welcome', 'privacy', 'tour', 'data-usage', 'auth-setup', 'complete'];
  const currentIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]!);
    } else {
      // Complete onboarding and redirect to dashboard
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div data-testid="welcome-step" className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to the Democratic Revolution! 🗳️
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're leveling the playing field for all candidates. Get ready to discover 
                your local representatives and make your voice heard in a truly democratic way.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">10,000+ Voters</h3>
                <p className="text-sm text-gray-600">Already using our platform</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">100% Private</h3>
                <p className="text-sm text-gray-600">Your data stays on your device</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Equal Access</h3>
                <p className="text-sm text-gray-600">All candidates get equal voice</p>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div data-testid="privacy-step" className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Your Privacy is Protected</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We believe in privacy by design. Your personal information stays on your device, 
                and we only collect what's necessary to provide you with the best experience.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">Privacy Features</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>End-to-end encryption for all data</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>No tracking or profiling</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>You control your data</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tour':
        return (
          <div data-testid="tour-step" className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Platform Tour</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Let's take a quick tour of the platform to help you get started.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-green-900 mb-3">What You Can Do</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Discover local candidates</span>
                </div>
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Vote on community polls</span>
                </div>
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Track your voting history</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data-usage':
        return (
          <div data-testid="data-usage-step" className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Data Usage</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We only collect the data we need to provide you with the best experience.
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-yellow-900 mb-3">Data We Collect</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-yellow-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Basic profile information</span>
                </div>
                <div className="flex items-center text-yellow-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Voting preferences (anonymized)</span>
                </div>
                <div className="flex items-center text-yellow-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Usage analytics (privacy-preserving)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'auth-setup':
        return (
          <div data-testid="auth-setup-step" className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Authentication Setup</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Set up secure authentication for your account.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-purple-900 mb-3">Security Options</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-purple-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Password authentication</span>
                </div>
                <div className="flex items-center text-purple-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Passkey support (WebAuthn)</span>
                </div>
                <div className="flex items-center text-purple-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Two-factor authentication</span>
                </div>
              </div>
            </div>
            <button
              data-testid="create-passkey-button"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Create Passkey
            </button>
          </div>
        );

      case 'complete':
        return (
          <div data-testid="complete-step" className="text-center space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">You're All Set! 🎉</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Welcome to the future of democracy! You're now ready to discover your local 
                candidates and make your voice heard in a truly democratic way.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Explore your local candidates</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Vote on community polls</span>
                </div>
                <div className="flex items-center text-blue-800">
                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Track your voting history</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress bar */}
      <div className="w-full bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = step === currentStep;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-2 transition-all duration-300 ${
                        index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="flex gap-4 justify-center">
          {currentIndex > 0 && (
            <button
              data-testid={currentStep === 'privacy' ? 'privacy-back' : 
                          currentStep === 'tour' ? 'tour-back' :
                          currentStep === 'data-usage' ? 'data-usage-back' :
                          currentStep === 'auth-setup' ? 'auth-back' : 'onb-back'}
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            data-testid={currentStep === 'welcome' ? 'welcome-next' :
                        currentStep === 'privacy' ? 'privacy-next' :
                        currentStep === 'tour' ? 'tour-next' :
                        currentStep === 'data-usage' ? 'data-usage-continue' :
                        currentStep === 'auth-setup' ? 'auth-next' :
                        currentStep === 'complete' ? 'complete-onboarding' : 'onb-next'}
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            {currentStep === 'complete' ? 'Finish' : 'Next'}
            {currentStep !== 'complete' && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
