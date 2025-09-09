'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';

// Import types from respective PWA modules
import type { PWAAuth } from '../lib/pwa-auth-integration';
import type { PWAManager, PWAWebAuthn, PrivacyStorage } from '../lib/pwa-utils';
// import type { PWAAnalytics } from '../lib/pwa-analytics'; // Archived PWA feature

interface PWAUtils {
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
        const [pwaAuthModule, pwaUtilsModule] = await Promise.all([
          import('../lib/pwa-auth-integration'),
          import('../lib/pwa-utils'),
          // import('../lib/pwa-analytics') // Archived PWA feature
        ])
        
        setUtils({
          pwaAuth: pwaAuthModule.pwaAuth,
          pwaManager: pwaUtilsModule.pwaManager,
          pwaAnalytics: null, // Archived PWA feature
          pwaWebAuthn: pwaUtilsModule.pwaWebAuthn,
          privacyStorage: pwaUtilsModule.privacyStorage
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
