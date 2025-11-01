/**
 * Civics Address Lookup Form Component
 * 
 * Provides a user-friendly interface for finding representatives by address.
 * Includes privacy protection, validation, and error handling.
 * 
 * @fileoverview Address-based representative lookup form
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use correct API endpoint
 * @feature CIVICS_ADDRESS_LOOKUP
 */

import React, { useState } from 'react';


import { isFeatureEnabled } from '@/lib/core/feature-flags';

'use client';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature flag check - don't render if disabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the address lookup API
      const response = await fetch(`/api/civics/by-address?address=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Address lookup failed: ${response.status}`);
      }
      
      const _data = await response.json();
      
      // Call the callback with the results
      onLookup?.(address);
      
      // Clear the form on success
      setAddress('');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch {
      setError('Failed to lookup address');
    } finally {
      setIsLoading(false);
    }
  };

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
              if (differentAddress && differentAddress.trim()) {
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

        {error && (
          <div className="text-red-600 text-sm">
            {error}
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
    </div>
  );
}

export default AddressLookupForm;
