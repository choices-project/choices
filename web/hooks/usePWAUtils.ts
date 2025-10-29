/**
 * PWA Utils Hook
 * 
 * Custom hook for PWA utility functions
 */

import { useState, useEffect } from 'react';

import { pwaManager } from '@/features/pwa/lib/pwa-utils';

export function usePWAUtils() {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Get PWA capabilities from the manager
    pwaManager.getPWAStatus().then(status => {
      setCapabilities(status);
    });
    
    // Check if install prompt is available
    setInstallPrompt({
      canInstall: pwaManager.isInstalled()
    });
  }, []);

  return {
    capabilities,
    installPrompt,
    isPWASupported: capabilities?.serviceWorker || false,
    canInstall: installPrompt?.canInstall || false,
    pwaManager: {
      isSupported: () => true,
      install: () => Promise.resolve(true),
      storeOfflineVote: (data?: any) => pwaManager.storeOfflineVote(data),
      isInstalled: () => pwaManager.isInstalled()
    }
  };
}
