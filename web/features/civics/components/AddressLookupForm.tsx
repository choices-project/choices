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

import React, { useCallback, useEffect, useRef, useState } from 'react';

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

import { useI18n } from '@/hooks/useI18n';

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
  const isEnabled = isFeatureEnabled('CIVICS_ADDRESS_LOOKUP');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const { t } = useI18n();
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
      setError(t('civics.addressLookup.errors.addressRequired'));
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
            throw new Error(response?.error ?? t('civics.addressLookup.errors.noRepresentatives'));
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
        lookupError instanceof Error && lookupError.message
          ? lookupError.message
          : t('civics.addressLookup.errors.lookupFailed');
      setError(message);
      logger.error('Address lookup failed', lookupError);
    }
  }, [address, clearRepresentativeError, findByLocation, handleAddressUpdate, onLookup, t]);

  const handleDifferentAddress = useCallback(() => {
    const differentAddress = window.prompt(
      t('civics.addressLookup.prompts.differentAddress')
    );

    const trimmed = differentAddress?.trim();
    if (!trimmed) {
      return;
    }

    setAddress(trimmed);
    // Allow state to update before submitting
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }, [setAddress, t]);

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
  }, [userDivisionIds, userCurrentState, fetchVoterRegistration]);

  // Render guard after all hooks to preserve hook ordering
  if (!isEnabled) {
    return null;
  }

  return (
    <div className={`civics-address-lookup ${className}`}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            {t('civics.addressLookup.form.label')}
          </label>
          <input
            type="text"
            id="address"
            data-testid="address-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('civics.addressLookup.form.placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            maxLength={500}
          />

          {/* Privacy messaging */}
          <p className="mt-2 text-xs text-gray-500">
            <strong>{t('civics.addressLookup.privacy.heading')}</strong>{' '}
            {t('civics.addressLookup.privacy.copy')}
          </p>
        </div>

        {/* Different voting address helper */}
        <div className="text-sm text-blue-600">
          <button
            type="button"
            data-testid="address-lookup-different-address"
            className="underline hover:no-underline"
            onClick={handleDifferentAddress}
          >
            {t('civics.addressLookup.actions.differentAddressButton')}
          </button>
          <span className="ml-1">
            {t('civics.addressLookup.actions.differentAddressHelper')}
          </span>
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
          {isLoading
            ? t('civics.addressLookup.actions.submit.loading')
            : t('civics.addressLookup.actions.submit.default')}
        </button>
      </form>

      {/* Privacy status badge */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          {t('civics.addressLookup.status.privacyProtected')}
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
