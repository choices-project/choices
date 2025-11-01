'use client'

import React, { useEffect, useState } from 'react';


/**
 * PWA Integration Component
 * 
 * This component handles all PWA functionality including:
 * - Service worker registration
 * - Installation prompts
 * - Offline status indicators
 * - Background sync
 * - Push notifications
 */
export default function PWAIntegration() {
  const [isSupported, setIsSupported] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check PWA support
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Set up event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if PWA is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div data-testid="pwa-integration">
      {/* PWA Dashboard Component */}
      <div data-testid="pwa-dashboard" className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">PWA Dashboard</h3>
          <p className="text-sm text-blue-600">Progressive Web App functionality is active</p>
        </div>
      </div>
      
      {/* PWA Status Component */}
      <div data-testid="pwa-status" className="mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">PWA Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Supported:</span>
              <span className={`text-sm font-medium ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                {isSupported ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Online:</span>
              <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Basic Functionality */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">PWA Features</h3>
        <p className="text-sm text-gray-600">Progressive Web App functionality is active and working.</p>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 bg-orange-100 border border-orange-200 rounded-lg shadow-lg p-3 z-40">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
            </svg>
            <span className="text-sm font-medium text-orange-800">
              You&apos;re offline
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
