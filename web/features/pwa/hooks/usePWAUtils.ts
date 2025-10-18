'use client'

import { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger';

// Import types from respective PWA modules
import type { PWAAuth } from '../lib/pwa-auth-integration';
// PWA utils types not implemented yet
type PWAManager = any;
type PWAWebAuthn = any;
type PrivacyStorage = any;
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
        const [pwaAuthModule] = await Promise.all([
          import('../lib/pwa-auth-integration'),
          // import('../lib/pwa-utils'), // Not implemented yet
          // import('../lib/pwa-analytics') // Archived PWA feature
        ])
        
        // Import PWA utilities
        const [pwaUtilsModule] = await Promise.all([
          import('../lib/pwa-utils')
        ])
        
        setUtils({
          pwaAuth: pwaAuthModule.pwaAuth,
          pwaManager: new pwaUtilsModule.PWAManager(),
          pwaAnalytics: null, // Archived PWA feature
          pwaWebAuthn: new pwaUtilsModule.PWAWebAuthn(),
          privacyStorage: new pwaUtilsModule.PrivacyStorage()
        })
      } catch (err) {
        devLog('Error loading PWA utils:', { error: err })
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPWAUtils()
  }, [])

  return { utils, loading, error }
}
