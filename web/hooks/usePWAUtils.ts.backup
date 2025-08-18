'use client'

import { useState, useEffect } from 'react'

interface PWAUtils {
  pwaAuth: any
  pwaManager: any
  pwaAnalytics: any
  pwaWebAuthn: any
  privacyStorage: any
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
        const [pwaAuthModule, pwaUtilsModule, pwaAnalyticsModule] = await Promise.all([
          import('../lib/pwa-auth-integration'),
          import('../lib/pwa-utils'),
          import('../lib/pwa-analytics')
        ])
        
        setUtils({
          pwaAuth: pwaAuthModule.pwaAuth,
          pwaManager: pwaUtilsModule.pwaManager,
          pwaAnalytics: pwaAnalyticsModule.pwaAnalytics,
          pwaWebAuthn: pwaUtilsModule.pwaWebAuthn,
          privacyStorage: pwaUtilsModule.privacyStorage
        })
      } catch (err) {
        console.error('Error loading PWA utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPWAUtils()
  }, [])

  return { utils, loading, error }
}
