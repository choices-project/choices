'use client';

import React, { useState } from 'react';

type UserOnboardingProps = {
  onComplete: (userData: { address?: string; state?: string; representatives?: any[] }) => void;
  onSkip: () => void;
}

export default function UserOnboarding({ onComplete, onSkip }: UserOnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'address' | 'loading' | 'complete'>('welcome');
  const [userAddress, setUserAddress] = useState('');
  const [selectedState] = useState('CA');
  const [addressLoading, setAddressLoading] = useState(false);
  const [representatives, setRepresentatives] = useState<any[]>([]);

  const handleAddressLookup = async () => {
    setAddressLoading(true);
    setStep('loading');
    
    try {
      const response = await fetch(`/api/civics/by-address?address=${encodeURIComponent(userAddress)}`);
      if (!response.ok) throw new Error('Address lookup failed');
      const result = await response.json();
      
      setRepresentatives(result.data || []);
      setStep('complete');
      
      // Save to localStorage for future use
      localStorage.setItem('userAddress', userAddress);
      localStorage.setItem('userRepresentatives', JSON.stringify(result.data || []));
      
      onComplete({ address: userAddress, representatives: result.data || [] });
    } catch (error) {
      console.error('Address lookup failed:', error);
      // Fallback to state-based lookup
      handleStateLookup();
    }
  };

  const handleStateLookup = async () => {
    setAddressLoading(true);
    setStep('loading');
    
    try {
      const response = await fetch(`/api/civics/by-state?state=${selectedState}&level=federal&limit=20`);
      if (!response.ok) throw new Error('State lookup failed');
      const result = await response.json();
      
      setRepresentatives(result.data || []);
      setStep('complete');
      
      // Save to localStorage for future use
      localStorage.setItem('userState', selectedState);
      localStorage.setItem('userRepresentatives', JSON.stringify(result.data || []));
      
      onComplete({ state: selectedState, representatives: result.data || [] });
    } catch (error) {
      console.error('State lookup failed:', error);
      onSkip();
    }
  };

  if (step === 'welcome') {
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
                onClick={() => setStep('address')}
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

  if (step === 'address') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find Your Representatives</h2>
            <p className="text-gray-600">Enter your address to see your local elected officials</p>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddressLookup();
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Address
              </label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="123 Main St, City, State 12345"
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
                onClick={() => setStep('welcome')}
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

  if (step === 'loading') {
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

  if (step === 'complete') {
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
              onClick={() => onComplete({ address: userAddress, representatives })}
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
