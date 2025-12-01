/**
 * Civics Address Lookup Form Component
 *
 * Provides a user-friendly interface for finding representatives by address.
 * Includes privacy protection, validation, and error handling.
 *
 * @fileoverview Address-based representative lookup form
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-11-09 - Integrated representative + user Zustand stores
 * @feature CIVICS_ADDRESS_LOOKUP
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { VoterRegistrationCTA } from '@/features/civics/components/VoterRegistrationCTA';
import { getStateCodeFromDivisions } from '@/features/civics/utils/divisions';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import {
  useUserActions,
  useUserAddressLoading,
  useFetchElectionsForDivisions,
  useUserDivisionIds,
  useFetchVoterRegistrationForState,
  useVoterRegistration,
  useVoterRegistrationLoading,
  useVoterRegistrationError,
  useUserCurrentState
} from '@/lib/stores';
import {
  useFindByLocation,
  useRepresentativeGlobalLoading,
  useRepresentativeError,
  useClearError
} from '@/lib/stores/representativeStore';
import logger from '@/lib/utils/logger';

/**
 * Props for the AddressLookupForm component
 */
type AddressLookupFormProps = {
  /** Callback function when address lookup is submitted */
  onLookup?: (address: string) => void;
  /** Additional CSS classes for styling */
  className?: string;
}

/**
 * Address lookup form component for finding representatives by address
 *
 * @param props - Component props
 * @returns JSX element or null if feature is disabled
 */
export function AddressLookupForm({ onLookup, className = '' }: AddressLookupFormProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { handleAddressUpdate } = useUserActions();
  const addressLoading = useUserAddressLoading();
  const repLoading = useRepresentativeGlobalLoading();
  const representativeError = useRepresentativeError();
  const findByLocation = useFindByLocation();
  const clearRepresentativeError = useClearError();
  const fetchElections = useFetchElectionsForDivisions();
  const userDivisionIds = useUserDivisionIds();
  const fetchVoterRegistration = useFetchVoterRegistrationForState();
  const voterRegistrationLoading = useVoterRegistrationLoading();
  const voterRegistrationError = useVoterRegistrationError();
  const userCurrentState = useUserCurrentState();

  const [registrationStateCode, setRegistrationStateCode] = useState('');
  const voterRegistrationResource = useVoterRegistration(registrationStateCode);

  const isLoading = addressLoading || repLoading;

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError('Please enter an address');
      return;
    }

    setError(null);
    clearRepresentativeError();

    try {
      const results = await Promise.allSettled([
        handleAddressUpdate(trimmedAddress),
        (async () => {
          const response = await findByLocation({ address: trimmedAddress });
          if (!response?.success) {
            throw new Error(response?.error ?? 'Unable to find representatives for that address');
          }
        })()
      ]);

      const rejection = results.find((result) => result.status === 'rejected');
      if (rejection && rejection.status === 'rejected') {
        throw rejection.reason;
      }

      onLookup?.(trimmedAddress);
      setAddress('');
    } catch (lookupError) {
      const message =
        lookupError instanceof Error ? lookupError.message : 'Failed to lookup address';
      setError(message);
      logger.error('Address lookup failed', lookupError);
    }
  }, [address, clearRepresentativeError, findByLocation, handleAddressUpdate, onLookup]);

  useEffect(() => {
    if (userDivisionIds.length === 0) return;
    void fetchElections(userDivisionIds);
  }, [fetchElections, userDivisionIds]);

  useEffect(() => {
    if (userDivisionIds.length === 0) return;
    const detectedState = getStateCodeFromDivisions(userDivisionIds);
    if (!detectedState) return;
    setRegistrationStateCode((previous) => (previous === detectedState ? previous : detectedState));
    void fetchVoterRegistration(detectedState);
  }, [userDivisionIds, fetchVoterRegistration]);

  useEffect(() => {
    if (userDivisionIds.length > 0) return;
    const normalizedState = userCurrentState?.trim().toUpperCase() ?? '';
    if (!normalizedState) return;
    setRegistrationStateCode((previous) => (previous === normalizedState ? previous : normalizedState));
    void fetchVoterRegistration(normalizedState);
  }, [userDivisionIds.length, userCurrentState, fetchVoterRegistration]);

  // Feature flag check - don't render if disabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return null;
  }

  return (
    <div className={`civics-address-lookup ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your address to find your representatives
          </label>
          <input
            type="text"
            id="address"
            data-testid="address-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, State 12345"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            maxLength={500}
          />

          {/* Privacy messaging */}
          <p className="mt-2 text-xs text-gray-500">
            <strong>Privacy first:</strong> We don&apos;t store your address. We keep a one-way fingerprint
            and a rough map square so we can draw anonymous stats. No one can turn that back into your home.
          </p>
        </div>

        {/* Different voting address helper */}
        <div className="text-sm text-blue-600">
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={() => {
              // Implement different address flow - show modal or redirect to different address form
              const differentAddress = prompt('Enter your voting address (this will be used for representative lookup only):');
              if (differentAddress?.trim()) {
                setAddress(differentAddress.trim());
                // Auto-submit the form with the different address
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }, 100);
              }
            }}
          >
            Voting from a different address?
          </button>
          <span className="ml-1">Use &quot;different address&quot; for this search. Same privacy rules—nothing is stored.</span>
        </div>

        {(error ?? representativeError) && (
          <div className="text-red-600 text-sm">
            {error ?? representativeError}
          </div>
        )}

        <button
          type="submit"
          data-testid="address-submit"
          disabled={isLoading || !address.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Looking up...' : 'Find My Representatives'}
        </button>
      </form>

      {/* Privacy status badge */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Privacy Protected
        </div>
      </div>

      <VoterRegistrationCTA
        stateCode={registrationStateCode}
        resource={voterRegistrationResource}
        isLoading={voterRegistrationLoading}
        error={voterRegistrationError}
      />
    </div>
  );
}

export default AddressLookupForm;
