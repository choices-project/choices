'use client';

import React, { useState } from 'react';

import { 
  useOnboardingStep,
  useOnboardingActions,
  useUserStore,
  useNotificationStore
} from '@/lib/stores';

import type { UserOnboardingProps } from '../types';

/**
 * User Onboarding Component
 * 
 * Civics-focused onboarding flow for finding local representatives:
 * - Address input and validation
 * - State selection
 * - Representative lookup and display
 * - Data persistence in localStorage
 * 
 * Features:
 * - Integration with civics API endpoints
 * - Address and state lookup functionality
 * - Representative data display
 * - Skip option for users who prefer not to provide location
 * 
 * @param {UserOnboardingProps} props - Component props
 * @returns {JSX.Element} Civics onboarding interface
 */
export default function UserOnboarding({ onComplete, onSkip }: UserOnboardingProps) {
  // ✅ MIGRATED: Use existing stores instead of useState
  // Onboarding store for step management
  const currentStep = useOnboardingStep();
  const { updateFormData, setCurrentStep } = useOnboardingActions();
  
  // User store for address and representatives
  const currentAddress = useUserStore(state => state.currentAddress);
  const representatives = useUserStore(state => state.representatives);
  const addressLoading = useUserStore(state => state.addressLoading);
  const setCurrentAddress = useUserStore(state => state.setCurrentAddress);
  const setCurrentState = useUserStore(state => state.setCurrentState);
  const setRepresentatives = useUserStore(state => state.setRepresentatives);
  const setAddressLoading = useUserStore(state => state.setAddressLoading);
  
  // Notification store for user feedback
  const addNotification = useNotificationStore(state => state.addNotification);
  
  // ✅ Keep local state for component-specific concerns
  const [selectedState] = useState('CA'); // Default state selection

  const handleAddressLookup = async () => {
    setAddressLoading(true);
    setCurrentStep(2); // loading step
    
    try {
      const response = await fetch(`/api/civics/by-address?address=${encodeURIComponent(currentAddress)}`);
      if (!response.ok) throw new Error('Address lookup failed');
      const result = await response.json();
      
      setRepresentatives(result.data ?? []);
      setCurrentStep(3); // complete step
      
      // Update store with address data
      updateFormData(2, { address: currentAddress, representatives: result.data ?? [] });
      
      // Save to localStorage for future use
      localStorage.setItem('userAddress', currentAddress);
      localStorage.setItem('userRepresentatives', JSON.stringify(result.data ?? []));
      
      // Add success notification
      addNotification({
        type: 'success',
        title: 'Address Found',
        message: 'Address found! Representatives loaded successfully.',
        duration: 3000
      });
      
      onComplete({ address: currentAddress, representatives: result.data ?? [] });
    } catch (error) {
      console.error('Address lookup failed:', error);
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Address Lookup Failed',
        message: 'Address lookup failed. Trying state-based lookup...',
        duration: 5000
      });
      
      // Fallback to state-based lookup
      handleStateLookup();
    }
  };

  const handleStateLookup = async () => {
    setAddressLoading(true);
    setCurrentStep(2); // loading step
    
    try {
      const response = await fetch(`/api/civics/by-state?state=${selectedState}&level=federal&limit=20`);
      if (!response.ok) throw new Error('State lookup failed');
      const result = await response.json();
      
      setRepresentatives(result.data ?? []);
      setCurrentState(selectedState);
      setCurrentStep(3); // complete step
      
      // Update store with state data
      updateFormData(2, { state: selectedState, representatives: result.data ?? [] });
      
      // Save to localStorage for future use
      localStorage.setItem('userState', selectedState);
      localStorage.setItem('userRepresentatives', JSON.stringify(result.data ?? []));
      
      // Add success notification
      addNotification({
        type: 'success',
        title: 'Representatives Loaded',
        message: 'State representatives loaded successfully.',
        duration: 3000
      });
      
      onComplete({ state: selectedState, representatives: result.data ?? [] });
    } catch (error) {
      console.error('State lookup failed:', error);
      
      // Add error notification
      addNotification({
        type: 'error',
        title: 'Representatives Load Failed',
        message: 'Failed to load representatives. You can skip this step.',
        duration: 5000
      });
      
      onSkip();
    }
  };

  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Civics 2.0!</h1>
            <p className="text-gray-600 mb-8">
              Let&apos;s personalize your experience by finding your local representatives. 
              This helps us show you the most relevant political information.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Find My Representatives
              </button>
              
              <button
                onClick={handleStateLookup}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Skip - Show General Representatives
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find Your Representatives</h2>
            <p className="text-gray-600">Enter your address to see your local elected officials</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            void handleAddressLookup();
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Address
              </label>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Enter your full address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={addressLoading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addressLoading ? 'Finding...' : 'Find Representatives'}
              </button>
              
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Finding Your Representatives</h2>
            <p className="text-gray-600">Searching for your local elected officials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">All Set!</h2>
            <p className="text-gray-600 mb-6">
              We found {representatives.length} representatives for your area. 
              You can always update this information later.
            </p>
            
            <button
              onClick={() => onComplete({ address: currentAddress, representatives })}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Continue to Your Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
