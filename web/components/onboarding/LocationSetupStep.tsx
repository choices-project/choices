'use client';

import React, { useState } from 'react';
import { MapPin, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import LocationInput from './LocationInput';
import { useOnboardingContext } from './EnhancedOnboardingFlow';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { DEFAULT_STEP_ORDER } from './types';

export default function LocationSetupStep() {
  const { updateStepData, currentStep, setCurrentStep } = useOnboardingContext();
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if location capture is enabled
  const isLocationEnabled = isFeatureEnabled('BROWSER_LOCATION_CAPTURE');

  // Navigation helpers
  const getNextStep = () => {
    const currentIndex = DEFAULT_STEP_ORDER.indexOf(currentStep);
    return DEFAULT_STEP_ORDER[currentIndex + 1] || 'complete';
  };

  const getPrevStep = () => {
    const currentIndex = DEFAULT_STEP_ORDER.indexOf(currentStep);
    return DEFAULT_STEP_ORDER[currentIndex - 1] || 'welcome';
  };

  const handleNext = () => {
    setCurrentStep(getNextStep());
  };

  const handleBack = () => {
    setCurrentStep(getPrevStep());
  };

  const handleLocationResolved = async (jurisdictionIds: string[]) => {
    setIsCapturing(true);
    setError(null);
    setSuccess(false);

    try {
      // Update step data with jurisdiction information
      updateStepData('location')({
        jurisdictionIds,
        primaryOcdId: jurisdictionIds[0] || undefined, // Use first jurisdiction as primary
        locationCaptured: true,
        locationSource: 'browser', // Will be updated based on actual source
        locationCompleted: true,
      } as any);

      setSuccess(true);
      
      // Auto-advance after successful capture
      setTimeout(() => {
        handleNext();
      }, 1500);

    } catch (err) {
      console.error('Location capture failed:', err);
      setError('Failed to save your location. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleLocationError = (errorMessage: string) => {
    setError(errorMessage);
    setIsCapturing(false);
  };

  const handleSkip = () => {
    updateStepData('location')({
      locationCaptured: false,
      locationCompleted: true,
    });
    handleNext();
  };

  if (!isLocationEnabled) {
    // If feature is disabled, show a message and allow skipping
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Location Services
            </h2>
            <p className="text-blue-700 mb-4">
              Location capture is currently disabled. You can add your location later in your profile settings.
            </p>
            <button
              onClick={handleSkip}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue Without Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Help us personalize your experience
          </h1>
          <p className="text-gray-600">
            We&apos;ll use your location to show you relevant local candidates and issues
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800 font-medium">
                Location captured successfully! Moving to next step...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Your privacy is protected</p>
              <p className="text-sm text-green-700 mt-1">
                We only store approximate coordinates (within ~100m) and never your exact address. 
                You can remove this data anytime in your profile settings.
              </p>
            </div>
          </div>
        </div>

        {/* Location Input Component */}
        <div className="mb-6">
          <LocationInput
            onLocationResolved={handleLocationResolved}
            onError={handleLocationError}
          />
        </div>

        {/* Skip Option */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            disabled={isCapturing}
            className="text-gray-500 hover:text-gray-700 text-sm underline disabled:opacity-50"
          >
            Skip for now (you can add this later)
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={isCapturing}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          <button
            onClick={handleSkip}
            disabled={isCapturing}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip Location
          </button>
        </div>
      </div>
    </div>
  );
}
