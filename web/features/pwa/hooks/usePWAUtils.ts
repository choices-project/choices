'use client'

import { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger';

// Import types from respective PWA modules
import type { PWAAuth } from '../lib/pwa-auth-integration';
// PWA utils types not implemented yet
type PWAManager = any;
type PWAWebAuthn = any;
type PrivacyStorage = any;
// import type { PWAAnalytics } from '../lib/pwa-analytics'; // Archived PWA feature

type PWAUtils = {
  pwaAuth: PWAAuth;
  pwaManager: PWAManager;
  pwaAnalytics: null; // Archived PWA feature
  pwaWebAuthn: PWAWebAuthn;
  privacyStorage: PrivacyStorage;
}

export function usePWAUtils() {
  const [utils, setUtils] = useState<PWAUtils | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPWAUtils = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Dynamic imports - only loaded on client side
        const [pwaAuthModule] = await Promise.all([
          import('../lib/pwa-auth-integration'),
          // import('../lib/pwa-utils'), // Not implemented yet
          // import('../lib/pwa-analytics') // Archived PWA feature
        ])
        
        setUtils({
          pwaAuth: pwaAuthModule.pwaAuth,
          pwaManager: {} as PWAManager, // Not implemented yet
          pwaAnalytics: null, // Archived PWA feature
          pwaWebAuthn: {} as PWAWebAuthn, // Not implemented yet
          privacyStorage: {} as PrivacyStorage // Not implemented yet
        })
      } catch (err) {
        devLog('Error loading PWA utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPWAUtils()
  }, [])

  return { utils, loading, error }
}
