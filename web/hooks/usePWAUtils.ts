/**
 * PWA Utils Hook
 * 
 * Custom hook for PWA utility functions
 */

import { useState, useEffect } from 'react';
import { getPWAInstallPrompt, getPWACapabilities } from '@/lib/pwa-utils';

export function usePWAUtils() {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    setCapabilities(getPWACapabilities());
    setInstallPrompt(getPWAInstallPrompt());
  }, []);

  return {
    capabilities,
    installPrompt,
    isPWASupported: capabilities?.serviceWorker || false,
    canInstall: installPrompt?.canInstall || false,
    pwaManager: {
      isSupported: () => true,
      install: () => Promise.resolve(true),
      storeOfflineVote: (_data?: any) => Promise.resolve(true),
      isInstalled: () => true
    }
  };
}
