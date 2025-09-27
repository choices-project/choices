'use client'

import { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger';
import { isFeatureEnabled } from '../lib/feature-flags'

type PrivacyUtils = {
  privacyBudgetManager: unknown
  privateAnalytics: unknown
  zkProofManager: unknown
  bridge?: unknown
  auditor?: unknown
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
        
        // Check if advanced privacy is enabled
        const privacyEnabled = isFeatureEnabled('advancedPrivacy')
        
        if (privacyEnabled) {
          // Use new modular privacy system
          const [
            { getPrivacyBudgetManager, getPrivateAnalytics },
            { getZKProofManager },
            { getPrivacyBridge },
            { getPrivacyAuditor }
          ] = await Promise.all([
            import('../modules/advanced-privacy/differential-privacy'),
            import('../modules/advanced-privacy/zero-knowledge-proofs'),
            import('../modules/advanced-privacy/privacy-bridge'),
            import('../modules/advanced-privacy/privacy-auditor')
          ])

          // Initialize bridge
          const bridge = getPrivacyBridge()
          await bridge.initialize()

          // Initialize auditor
          const auditor = getPrivacyAuditor()
          await auditor.initialize()

          // Get component instances
          const privacyBudgetManager = getPrivacyBudgetManager()
          const privateAnalytics = getPrivateAnalytics()
          const zkProofManager = getZKProofManager()
          
          setUtils({
            privacyBudgetManager,
            privateAnalytics,
            zkProofManager,
            bridge,
            auditor
          })
        } else {
          // Fallback to legacy system for backward compatibility
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
        }
      } catch (err) {
        devLog('Error loading privacy utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPrivacyUtils()
  }, [])

  return { utils, loading, error }
}
