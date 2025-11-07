'use client';

import { 
MapPinIcon, 
  UserGroupIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useEffect } from 'react';

import { 
  useUserCurrentAddress,
  useUserCurrentState,
  useUserRepresentatives,
  useUserShowAddressForm,
  useUserNewAddress,
  useUserAddressLoading,
  useUserSavedSuccessfully,
  useUserActions
} from '@/lib/stores';
import logger from '@/lib/utils/logger'

import type { UserProfileProps } from '../types';

/**
 * User Profile Component
 * 
 * Enhanced profile management for onboarding:
 * - Address and state management
 * - Representative lookup and display
 * - Data persistence and updates
 * 
 * Features:
 * - Address input and validation
 * - State selection
 * - Representative data display
 * - Data persistence in localStorage
 * 
 * @param {UserProfileProps} props - Component props
 * @returns {JSX.Element} User profile interface
 */
export default function UserProfile({ onRepresentativesUpdate, onClose }: UserProfileProps) {
  // Get state from userStore
  const currentAddress = useUserCurrentAddress();
  const currentState = useUserCurrentState();
  const representatives = useUserRepresentatives();
  const showAddressForm = useUserShowAddressForm();
  const newAddress = useUserNewAddress();
  const addressLoading = useUserAddressLoading();
  const savedSuccessfully = useUserSavedSuccessfully();
  
  // Get actions from userStore
  const {
    setCurrentAddress,
    setCurrentState,
    setRepresentatives,
    setShowAddressForm,
    setNewAddress,
    setAddressLoading,
    setSavedSuccessfully
  } = useUserActions();

  useEffect(() => {
    // Load current user data from localStorage
    const savedAddress = localStorage.getItem('userAddress');
    const savedState = localStorage.getItem('userState');
    const savedRepresentatives = localStorage.getItem('userRepresentatives');
    
    if (savedAddress) setCurrentAddress(savedAddress);
    if (savedState) setCurrentState(savedState);
    if (savedRepresentatives) {
      try {
        setRepresentatives(JSON.parse(savedRepresentatives));
      } catch (e) {
        logger.error('Failed to parse saved representatives:', e);
      }
    }
  }, [setCurrentAddress, setCurrentState, setRepresentatives]);

  const handleAddressUpdateLocal = async () => {
    setAddressLoading(true);
    try {
      const response = await fetch(`/api/v1/civics/address-lookup?address=${encodeURIComponent(newAddress)}`);
      if (!response.ok) throw new Error('Address lookup failed');
      const result = await response.json();
      
      // API returns { data: { representatives: [...] } }
      // Extract representatives array from the nested data structure
      const representatives = result.data?.representatives || [];
      
      // Update state
      setCurrentAddress(newAddress);
      setRepresentatives(representatives);
      
      // Save to localStorage
      localStorage.setItem('userAddress', newAddress);
      localStorage.setItem('userRepresentatives', JSON.stringify(representatives));
      
      // Notify parent component
      onRepresentativesUpdate(representatives);
      
      setShowAddressForm(false);
      setNewAddress('');
      setSavedSuccessfully(true);
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (error) {
      logger.error('Address update failed:', error);
      alert('Failed to update address. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleStateUpdate = async (state: string) => {
    setAddressLoading(true);
    try {
      const response = await fetch(`/api/v1/civics/by-state?state=${state}&level=federal&limit=20`);
      if (!response.ok) throw new Error('State lookup failed');
      const result = await response.json();
      
      // API returns { data: { representatives: [...] } }
      // Extract representatives array from the nested data structure
      const representatives = result.data?.representatives || [];
      
      // Update state
      setCurrentState(state);
      setRepresentatives(representatives);
      
      // Save to localStorage
      localStorage.setItem('userState', state);
      localStorage.setItem('userRepresentatives', JSON.stringify(representatives));
      
      // Notify parent component
      onRepresentativesUpdate(representatives);
      
      setSavedSuccessfully(true);
      setTimeout(() => setSavedSuccessfully(false), 3000);
    } catch (error) {
      logger.error('State update failed:', error);
      alert('Failed to update state. Please try again.');
    } finally {
      setAddressLoading(false);
    }
  };

  const clearUserData = () => {
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userState');
    localStorage.removeItem('userRepresentatives');
    setCurrentAddress('');
    setCurrentState('');
    setRepresentatives([]);
    onRepresentativesUpdate([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {savedSuccessfully && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <CheckIcon className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">Settings saved successfully!</span>
            </div>
          )}

          {/* Current Location */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2 text-blue-500" />
              Your Location
            </h3>
            
            {currentAddress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-900">{currentAddress}</p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : currentState ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium text-gray-900">{currentState}</p>
                  </div>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">No location set</p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Set Your Location
                </button>
              </div>
            )}
          </div>

          {/* Current Representatives */}
          {representatives.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-green-500" />
                Your Representatives ({representatives.length})
              </h3>
              
              <div className="space-y-3">
                {representatives.slice(0, 5).map((rep: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                    {rep.photo ? (
                      <Image 
                        src={rep.photo} 
                        alt={rep.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {rep.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{rep.name}</p>
                      <p className="text-sm text-gray-600">{rep.title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rep.party === 'Democratic' 
                        ? 'bg-blue-100 text-blue-800' 
                        : rep.party === 'Republican'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rep.party}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick State Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick State Selection</h3>
            <div className="grid grid-cols-2 gap-2">
              {['CA', 'NY', 'TX', 'FL', 'IL', 'PA'].map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateUpdate(state)}
                  disabled={addressLoading}
                  className={`p-3 rounded-lg text-center font-medium transition-colors ${
                    currentState === state
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  } ${addressLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={clearUserData}
              className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors"
            >
              Clear All Data
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* Address Update Form */}
        {showAddressForm && (
          <div className="absolute inset-0 bg-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Update Address</h3>
              <button
                onClick={() => setShowAddressForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddressUpdateLocal();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Address
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
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
                  {addressLoading ? 'Updating...' : 'Update Address'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
