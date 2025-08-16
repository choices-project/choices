'use client'

import { useState, useEffect } from 'react'

interface PrivacyUtils {
  privacyBudgetManager: any
  privateAnalytics: any
  zkProofManager: any
}

export function usePrivacyUtils() {
  const [utils, setUtils] = useState<PrivacyUtils | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPrivacyUtils = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Dynamic imports - only loaded on client side
        const [privacyBudgetModule, privateAnalyticsModule, zkProofModule] = await Promise.all([
          import('../lib/differential-privacy'),
          import('../lib/differential-privacy'),
          import('../lib/zero-knowledge-proofs')
        ])
        
        setUtils({
          privacyBudgetManager: privacyBudgetModule.privacyBudgetManager,
          privateAnalytics: privateAnalyticsModule.privateAnalytics,
          zkProofManager: zkProofModule.zkProofManager
        })
      } catch (err) {
        console.error('Error loading privacy utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPrivacyUtils()
  }, [])

  return { utils, loading, error }
}
