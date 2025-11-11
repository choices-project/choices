'use client';

import React, { useEffect, useState } from 'react';

import {
  useOnboardingStep,
  useOnboardingActions,
  useUser,
  useUserLoading,
  useUserCurrentAddress,
  useUserCurrentState,
  useUserRepresentatives,
  useUserAddressLoading,
  useUserActions,
  useNotificationActions
} from '@/lib/stores';
import logger from '@/lib/utils/logger';

import { extractRepresentatives, normalizeJurisdiction } from '../lib/representatives';
import type { OnboardingJurisdiction, UserOnboardingProps, UserOnboardingResult } from '../types';

type LoadRepresentativesOptions = {
  source: 'address' | 'state';
  fallback?: boolean;
  skipLoading?: boolean;
  jurisdiction?: OnboardingJurisdiction | null;
};

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
  const {
    updateFormData,
    goToStep,
    markStepCompleted,
    markStepSkipped,
    restartOnboarding,
    skipOnboarding,
    completeOnboarding,
    clearAllData,
  } = useOnboardingActions();

  // User store for address and representatives
  const currentAddress = useUserCurrentAddress();
  const currentStateValue = useUserCurrentState();
  const representatives = useUserRepresentatives();
  const addressLoading = useUserAddressLoading();
  const {
    setCurrentAddress,
    setCurrentState,
    setRepresentatives,
    setAddressLoading,
  } = useUserActions();

  // Notification store for user feedback
  const { addNotification } = useNotificationActions();

  // ✅ Keep local state for component-specific concerns
  const [selectedState] = useState('CA'); // Default state selection
  const [addressError, setAddressError] = useState<string | null>(null);
  const [completionPayload, setCompletionPayload] = useState<UserOnboardingResult | null>(null);

  useEffect(() => {
    restartOnboarding();
    return () => {
      clearAllData();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRepresentativesForState = async (
    state: string,
    { source, fallback = false, skipLoading = false, jurisdiction = null }: LoadRepresentativesOptions
  ) => {
    if (!state) {
      throw new Error('State is required to load representatives');
    }

    if (!skipLoading) {
      setAddressLoading(true);
      goToStep(2);
    }

    try {
      const response = await fetch(
        `/api/v1/civics/by-state?state=${encodeURIComponent(state)}&level=federal&limit=20`
      );
      if (!response.ok) {
        throw new Error('State lookup failed');
      }

      const result = await response.json();
      const representativesList = extractRepresentatives(result);

      setRepresentatives(representativesList);
      setCurrentState(state);
      goToStep(3);
      markStepCompleted(2);

      updateFormData(2, { state, representatives: representativesList, jurisdiction });
      localStorage.setItem('userState', state);
      localStorage.setItem('userRepresentatives', JSON.stringify(representativesList));
      if (jurisdiction) {
        localStorage.setItem('userJurisdiction', JSON.stringify(jurisdiction));
      }

      const payload: UserOnboardingResult = {
        state,
        jurisdiction,
        representatives: representativesList,
      };

      if (source === 'address' && currentAddress) {
        payload.address = currentAddress;
      }

      setCompletionPayload(payload);

      setAddressError(null);

      const successTitle =
        source === 'address'
          ? fallback
            ? 'Showing statewide representatives'
            : 'Representatives found'
          : 'Representatives loaded';

      const successMessage =
        source === 'address'
          ? fallback
            ? `We couldn't verify a district, so we're showing statewide representatives for ${state}.`
            : `We found representatives near your address in ${state}.`
          : `${representativesList.length} representative(s) loaded for ${state}.`;

      addNotification({
        type: 'success',
        title: successTitle,
        message: successMessage,
        duration: 4000,
      });
    } catch (error) {
      logger.error('Representative lookup failed:', error);

      addNotification({
        type: 'error',
        title: 'Representatives unavailable',
        message:
          source === 'address'
            ? 'We located your jurisdiction, but could not load representatives right now. Please try again shortly or browse by state.'
            : 'We could not load representatives for that state. You can skip this step and update it later.',
        duration: 5000,
      });

      if (source === 'state') {
        markStepSkipped(2);
        skipOnboarding();
        onSkip();
      }

      throw error;
    } finally {
      if (!skipLoading) {
        setAddressLoading(false);
      }
    }
  };

  const handleAddressLookup = async () => {
    if (!currentAddress?.trim()) {
      setAddressError('Please enter a valid address before searching.');
      return;
    }

    setAddressError(null);
    setAddressLoading(true);
    goToStep(2);

    try {
      const response = await fetch('/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: currentAddress }),
      });

      const result = await response.json();
      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.error ?? 'Address lookup failed');
      }

      const jurisdiction = normalizeJurisdiction(result.jurisdiction);
      const resolvedState = jurisdiction?.state ?? null;

      localStorage.setItem('userAddress', currentAddress);

      if (!resolvedState) {
        goToStep(1);
        setAddressError(
          'We could not determine your state from that address. Please double-check the address or use the state option.'
        );

        addNotification({
          type: 'warning',
          title: 'Need a little more info',
          message: 'Please verify your address, or choose “Show General Representatives” to continue.',
          duration: 6000,
        });
        return;
      }

      await loadRepresentativesForState(resolvedState, {
        source: 'address',
        fallback: Boolean(jurisdiction?.fallback ?? false),
        skipLoading: true,
        jurisdiction,
      });
    } catch (error) {
      logger.error('Address lookup failed:', error);

      goToStep(1);
      setAddressError('We could not verify that address. Please double-check or try the state option below.');

      addNotification({
        type: 'error',
        title: 'Address lookup failed',
        message: 'We could not verify your address. You can correct it or browse representatives by state.',
        duration: 6000,
      });
    } finally {
      setAddressLoading(false);
    }
  };

  const handleStateLookup = async () => {
    setAddressError(null);

    try {
      await loadRepresentativesForState(selectedState, { source: 'state' });
    } catch (error) {
      logger.error('State lookup failed:', error);
      goToStep(1);
      setAddressLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Civics!</h1>
            <p className="text-gray-600 mb-8">
              Let&apos;s personalize your experience by finding your local representatives.
              This helps us show you the most relevant political information.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => goToStep(1)}
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
              {addressError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {addressError}
                </p>
              )}
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
                onClick={() => goToStep(0)}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
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
              We found {(completionPayload?.representatives?.length ?? representatives.length)} representatives for your area.
              You can always update this information later.
            </p>

            <button
              onClick={() => {
                if (completionPayload) {
                  completeOnboarding();
                  onComplete(completionPayload);
                  return;
                }
                const fallbackPayload: UserOnboardingResult = {
                  address: currentAddress,
                  state: currentStateValue,
                  jurisdiction: null,
                  representatives,
                };
                completeOnboarding();
                onComplete(fallbackPayload);
              }}
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
