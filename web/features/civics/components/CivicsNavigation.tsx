'use client';

import { 
MapPinIcon, 
  UserGroupIcon, 
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';

import logger from '@/lib/utils/logger'

type CivicsNavigationProps = {
  onRepresentativesClick: () => void;
  onAddressUpdate: (address: string) => void;
  currentAddress?: string;
}

export default function CivicsNavigation({ 
  onRepresentativesClick, 
  onAddressUpdate, 
  currentAddress 
}: CivicsNavigationProps) {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);

  const handleAddressUpdate = async () => {
    try {
      setAddressLoading(true);
      onAddressUpdate(newAddress);
      setShowAddressForm(false);
      setNewAddress('');
    } catch (error) {
      logger.error('Address update failed:', error);
    } finally {
      setAddressLoading(false);
    }
  };

  return (
    <>
      {/* Main Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and main nav */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Civics</h1>
                  <p className="text-sm text-gray-500">Your Democratic Voice</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-6">
                <button
                  onClick={onRepresentativesClick}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5" />
                  <span>My Representatives</span>
                </button>
                
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <MapPinIcon className="w-5 h-5" />
                  <span>Update Location</span>
                </button>
              </nav>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              {/* Current Location Display */}
              {currentAddress && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4" />
                  <span className="truncate max-w-32">{currentAddress}</span>
                </div>
              )}

              {/* Settings Button */}
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Address Update Modal */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Update Your Location</h2>
              <p className="text-gray-600">Enter your new address to see updated representatives</p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddressUpdate();
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
                  {addressLoading ? 'Updating...' : 'Update Location'}
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
        </div>
      )}
    </>
  );
}
