/**
 * AddressLookup Component
 * 
 * Privacy-first address lookup that:
 * - Takes an address as input
 * - Calls Google Civic API (server-side) to extract district
 * - Displays the district result
 * - Saves district to user profile (NOT the full address)
 * - Clears address input after lookup for privacy
 * 
 * IMPORTANT: Full addresses are NEVER stored. Only district information.
 * 
 * Created: November 5, 2025
 */

'use client';

import React, { useState } from 'react';
import { MapPin, Search, AlertCircle, CheckCircle, Info } from 'lucide-react';

import { logger } from '@/lib/utils/logger';

type District = {
  state: string;
  district: string | null;
  county: string | null;
};

type AddressLookupProps = {
  onDistrictFound?: (district: District) => void;
  onDistrictSaved?: (district: District) => void;
  autoSave?: boolean; // If true, automatically save district to profile
  className?: string;
};

export function AddressLookup({
  onDistrictFound,
  onDistrictSaved,
  autoSave = false,
  className = '',
}: AddressLookupProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [district, setDistrict] = useState<District | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleLookup = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDistrict(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error(`Failed to lookup address: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.jurisdiction) {
        const districtData: District = {
          state: data.jurisdiction.state,
          district: data.jurisdiction.district,
          county: data.jurisdiction.county,
        };

        setDistrict(districtData);
        
        // Clear address for privacy
        setAddress('');
        
        // Call callback
        if (onDistrictFound) {
          onDistrictFound(districtData);
        }

        // Auto-save if enabled
        if (autoSave) {
          await saveDistrictToProfile(districtData);
        }

        logger.info('District lookup successful', {
          hasDistrict: !!districtData.district,
          state: districtData.state,
        });
      } else {
        throw new Error('Unable to determine district from address');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Address lookup failed', err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const saveDistrictToProfile = async (districtData: District) => {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          demographics: {
            district: districtData.district,
            state: districtData.state,
            county: districtData.county,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save district to profile');
      }

      const data = await response.json();
      setIsSaved(true);
      
      if (onDistrictSaved) {
        onDistrictSaved(districtData);
      }

      logger.info('District saved to profile', {
        district: districtData.district,
        state: districtData.state,
        success: data.success,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save district';
      setError(errorMessage);
      logger.error('Failed to save district to profile', err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleManualSave = async () => {
    if (district) {
      await saveDistrictToProfile(district);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLookup();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Privacy First</p>
          <p>
            We only store your <strong>congressional district</strong> (e.g., &quot;CA-12&quot;), never your full address.
            This allows us to show you relevant representatives and civic content while protecting your privacy.
          </p>
        </div>
      </div>

      {/* Address Input */}
      <div>
        <label htmlFor="address-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter Your Address
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="address-input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="123 Main St, San Francisco, CA 94102"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={isLoading || !address.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Looking up...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Lookup District</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-900">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* District Result */}
      {district && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-900 text-lg">District Found!</p>
              <div className="mt-2 space-y-1 text-sm text-green-800">
                <p>
                  <span className="font-medium">State:</span> {district.state}
                </p>
                {district.district && (
                  <p>
                    <span className="font-medium">Congressional District:</span> {district.state}-{district.district}
                  </p>
                )}
                {district.county && (
                  <p>
                    <span className="font-medium">County:</span> {district.county}
                  </p>
                )}
              </div>

              {!autoSave && !isSaved && (
                <button
                  onClick={handleManualSave}
                  className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  Save to Profile
                </button>
              )}

              {isSaved && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Saved to your profile</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        We use the Google Civic Information API to determine your district. 
        Your full address is only used for the lookup and is never stored.
      </p>
    </div>
  );
}

