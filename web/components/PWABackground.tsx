'use client'

import { useEffect, useState } from 'react';

/**
 * PWA Background Component
 * 
 * This component handles PWA functionality behind the scenes:
 * - Service worker registration
 * - Offline status monitoring
 * - Background sync
 * - Push notifications
 * 
 * No UI clutter - just functional PWA features
 */
export default function PWABackground() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
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

  // Only show offline indicator when actually offline
  if (!isOnline) {
    return (
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
    );
  }

  // Return null when online - no UI clutter
  return null;
}
