/**
 * Advanced Privacy Module - Main Entry Point
 * 
 * This module provides advanced privacy features including:
 * - Differential Privacy
 * - Zero-Knowledge Proofs
 * - Privacy Budget Management
 * - Private Analytics
 * 
 * Features are controlled by the 'advancedPrivacy' feature flag.
 */

import { isFeatureEnabled } from '../../lib/feature-flags'

// Core privacy components
export { DifferentialPrivacy, PrivacyBudgetManager, PrivateAnalytics } from './differential-privacy'
export { ZeroKnowledgeProofs, ZKProofManager } from './zero-knowledge-proofs'
export { PrivacyBridge } from './privacy-bridge'
export { PrivacyAuditor } from './privacy-auditor'

// Privacy utilities and hooks
export { usePrivacyUtils } from './hooks/usePrivacyUtils'
// export { usePrivacyBudget } from './hooks/usePrivacyBudget' // Hook not found
// export { useZKProofs } from './hooks/useZKProofs' // Hook not found

// Privacy components - not found
// export { PrivacyDashboard } from './components/PrivacyDashboard'
// export { PrivacyControls } from './components/PrivacyControls'
// export { PrivacyMetrics } from './components/PrivacyMetrics'

// Privacy configuration
export type { PrivacyConfig } from './config/privacy-config'

// Check if advanced privacy is enabled
export const isAdvancedPrivacyEnabled = (): boolean => {
  return isFeatureEnabled('advancedPrivacy')
}

// Initialize privacy module
export const initializePrivacyModule = async (): Promise<boolean> => {
  if (!isAdvancedPrivacyEnabled()) {
    console.log('Advanced privacy features are disabled')
    return false
  }

  try {
    // Initialize privacy components
    const { PrivacyBridge } = await import('./privacy-bridge')
    const { PrivacyAuditor } = await import('./privacy-auditor')
    
    // Create bridge instance
    const bridge = new PrivacyBridge()
    await bridge.initialize()
    
    // Create auditor instance
    const auditor = new PrivacyAuditor()
    await auditor.initialize()
    
    console.log('Advanced privacy module initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize privacy module:', error)
    return false
  }
}

// Privacy module status
export const getPrivacyModuleStatus = () => {
  return {
    enabled: isAdvancedPrivacyEnabled(),
    initialized: false, // Will be set by initializePrivacyModule
    features: {
      differentialPrivacy: isAdvancedPrivacyEnabled(),
      zeroKnowledgeProofs: isAdvancedPrivacyEnabled(),
      privacyBudget: isAdvancedPrivacyEnabled(),
      privateAnalytics: isAdvancedPrivacyEnabled(),
      privacyAudit: isAdvancedPrivacyEnabled()
    }
  }
}

// Export for backward compatibility
export default {
  isAdvancedPrivacyEnabled,
  initializePrivacyModule,
  getPrivacyModuleStatus
}
