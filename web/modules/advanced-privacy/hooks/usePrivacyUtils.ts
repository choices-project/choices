/**
 * Privacy Utils Hook - Modular Implementation
 * 
 * This hook provides access to privacy utilities with feature flag integration.
 * It replaces the existing usePrivacyUtils hook with modular architecture.
 */

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';
import { isFeatureEnabled } from '../../../lib/feature-flags'

interface PrivacyUtils {
  privacyBudgetManager: any
  privateAnalytics: any
  zkProofManager: any
  bridge: any
  auditor: any
}

interface PrivacyStatus {
  enabled: boolean
  initialized: boolean
  features: {
    differentialPrivacy: boolean
    zeroKnowledgeProofs: boolean
    privacyBudget: boolean
    privateAnalytics: boolean
  }
}

export function usePrivacyUtils() {
  const [utils, setUtils] = useState<PrivacyUtils | null>(null)
  const [status, setStatus] = useState<PrivacyStatus>({
    enabled: false,
    initialized: false,
    features: {
      differentialPrivacy: false,
      zeroKnowledgeProofs: false,
      privacyBudget: false,
      privateAnalytics: false
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if advanced privacy is enabled
  const isEnabled = useCallback(() => {
    return isFeatureEnabled('advancedPrivacy')
  }, [])

  // Initialize privacy utilities
  const initializePrivacy = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const privacyEnabled = isEnabled()
      
      if (!privacyEnabled) {
        setStatus({
          enabled: false,
          initialized: true,
          features: {
            differentialPrivacy: false,
            zeroKnowledgeProofs: false,
            privacyBudget: false,
            privateAnalytics: false
          }
        })
        setLoading(false)
        return
      }

      // Import modular privacy components
      const [
        { getPrivacyBudgetManager, getPrivateAnalytics },
        { getZKProofManager },
        { getPrivacyBridge },
        { getPrivacyAuditor }
      ] = await Promise.all([
        import('../differential-privacy'),
        import('../zero-knowledge-proofs'),
        import('../privacy-bridge'),
        import('../privacy-auditor')
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

      // Update utils
      setUtils({
        privacyBudgetManager,
        privateAnalytics,
        zkProofManager,
        bridge,
        auditor
      })

      // Update status
      const bridgeStatus = bridge.getStatus()
      setStatus({
        enabled: privacyEnabled,
        initialized: bridgeStatus.initialized,
        features: bridgeStatus.features
      })

    } catch (err) {
      devLog('Error loading privacy utils:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isEnabled])

  // Load privacy utilities on mount
  useEffect(() => {
    initializePrivacy()
  }, [initializePrivacy])

  // Privacy budget management
  const usePrivacyBudget = useCallback(async (category: string, amount: number): Promise<boolean> => {
    if (!utils?.bridge) return true // Always allow when privacy is disabled
    
    try {
      return await utils.bridge.usePrivacyBudget(category, amount)
    } catch (error) {
      devLog('Failed to use privacy budget:', error)
      return false
    }
  }, [utils])

  const getRemainingBudget = useCallback(async (category: string): Promise<number> => {
    if (!utils?.bridge) return 100 // Return high value when privacy is disabled
    
    try {
      return await utils.bridge.getRemainingPrivacyBudget(category)
    } catch (error) {
      devLog('Failed to get remaining budget:', error)
      return 0
    }
  }, [utils])

  const resetBudget = useCallback(async (category?: string): Promise<void> => {
    if (!utils?.bridge) return
    
    try {
      await utils.bridge.resetPrivacyBudget(category)
    } catch (error) {
      devLog('Failed to reset budget:', error)
    }
  }, [utils])

  // Private analytics
  const runPrivateAnalysis = useCallback(async (
    data: any[], 
    type: 'demographics' | 'voting' | 'trends'
  ): Promise<Map<string, any> | null> => {
    if (!utils?.bridge) return null
    
    try {
      return await utils.bridge.runPrivateAnalysis(data, type)
    } catch (error) {
      devLog('Failed to run private analysis:', error)
      return null
    }
  }, [utils])

  // Zero-knowledge proofs
  const createZKProof = useCallback(async (type: string, data: any): Promise<string | null> => {
    if (!utils?.bridge) return null
    
    try {
      return await utils.bridge.createZKProof(type, data)
    } catch (error) {
      devLog('Failed to create ZK proof:', error)
      return null
    }
  }, [utils])

  const verifyZKProof = useCallback(async (proofId: string): Promise<any | null> => {
    if (!utils?.bridge) return null
    
    try {
      return await utils.bridge.verifyZKProof(proofId)
    } catch (error) {
      devLog('Failed to verify ZK proof:', error)
      return null
    }
  }, [utils])

  // Privacy audit
  const runPrivacyAudit = useCallback(async () => {
    if (!utils?.auditor) return null
    
    try {
      return await utils.auditor.runPrivacyAudit()
    } catch (error) {
      devLog('Failed to run privacy audit:', error)
      return null
    }
  }, [utils])

  const runPrivacyTests = useCallback(async () => {
    if (!utils?.auditor) return []
    
    try {
      return await utils.auditor.runPrivacyTests()
    } catch (error) {
      devLog('Failed to run privacy tests:', error)
      return []
    }
  }, [utils])

  const generateComplianceReport = useCallback(async (): Promise<string | null> => {
    if (!utils?.auditor) return null
    
    try {
      return await utils.auditor.generateComplianceReport()
    } catch (error) {
      devLog('Failed to generate compliance report:', error)
      return null
    }
  }, [utils])

  // Re-initialize privacy utilities
  const reinitialize = useCallback(() => {
    initializePrivacy()
  }, [initializePrivacy])

  return {
    // State
    utils,
    status,
    loading,
    error,
    
    // Core functionality
    isEnabled,
    reinitialize,
    
    // Privacy budget
    usePrivacyBudget,
    getRemainingBudget,
    resetBudget,
    
    // Private analytics
    runPrivateAnalysis,
    
    // Zero-knowledge proofs
    createZKProof,
    verifyZKProof,
    
    // Privacy audit
    runPrivacyAudit,
    runPrivacyTests,
    generateComplianceReport
  }
}
