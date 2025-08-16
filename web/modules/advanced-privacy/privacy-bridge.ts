/**
 * Privacy Bridge - Integration Layer
 * 
 * This module provides integration bridges between the modular privacy system
 * and the rest of the application. It handles feature flag integration,
 * backward compatibility, and provides a unified interface.
 */

import { isFeatureEnabled } from '../../lib/feature-flags'
import { DifferentialPrivacy, PrivacyBudgetManager, PrivateAnalytics } from './differential-privacy'
import { ZeroKnowledgeProofs, ZKProofManager } from './zero-knowledge-proofs'

export interface PrivacyBridgeConfig {
  enableBackwardCompatibility: boolean
  enableFeatureFlags: boolean
  enableLogging: boolean
  defaultPrivacyLevel: 'low' | 'medium' | 'high'
}

export interface PrivacyBridgeStatus {
  initialized: boolean
  enabled: boolean
  features: {
    differentialPrivacy: boolean
    zeroKnowledgeProofs: boolean
    privacyBudget: boolean
    privateAnalytics: boolean
  }
  compatibility: {
    legacySupport: boolean
    featureFlags: boolean
  }
}

export class PrivacyBridge {
  private config: PrivacyBridgeConfig
  private status: PrivacyBridgeStatus
  private differentialPrivacy: DifferentialPrivacy | null = null
  private privacyBudgetManager: PrivacyBudgetManager | null = null
  private privateAnalytics: PrivateAnalytics | null = null
  private zkProofManager: ZKProofManager | null = null

  constructor(config?: Partial<PrivacyBridgeConfig>) {
    this.config = {
      enableBackwardCompatibility: true,
      enableFeatureFlags: true,
      enableLogging: true,
      defaultPrivacyLevel: 'medium',
      ...config
    }

    this.status = {
      initialized: false,
      enabled: false,
      features: {
        differentialPrivacy: false,
        zeroKnowledgeProofs: false,
        privacyBudget: false,
        privateAnalytics: false
      },
      compatibility: {
        legacySupport: false,
        featureFlags: false
      }
    }
  }

  /**
   * Initialize the privacy bridge
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.config.enableLogging) {
        console.log('Initializing Privacy Bridge...')
      }

      // Check if advanced privacy is enabled
      const privacyEnabled = isFeatureEnabled('advancedPrivacy')
      this.status.enabled = privacyEnabled
      this.status.compatibility.featureFlags = this.config.enableFeatureFlags

      if (!privacyEnabled) {
        if (this.config.enableLogging) {
          console.log('Advanced privacy features are disabled')
        }
        this.status.initialized = true
        return true
      }

      // Initialize privacy components
      await this.initializePrivacyComponents()

      // Set up backward compatibility if enabled
      if (this.config.enableBackwardCompatibility) {
        await this.setupBackwardCompatibility()
      }

      this.status.initialized = true

      if (this.config.enableLogging) {
        console.log('Privacy Bridge initialized successfully')
      }

      return true
    } catch (error) {
      console.error('Failed to initialize Privacy Bridge:', error)
      return false
    }
  }

  /**
   * Initialize privacy components
   */
  private async initializePrivacyComponents(): Promise<void> {
    // Initialize differential privacy
    this.differentialPrivacy = new DifferentialPrivacy({
      epsilon: this.getEpsilonForLevel(this.config.defaultPrivacyLevel),
      delta: 1e-5,
      sensitivity: 1,
      mechanism: 'gaussian'
    })

    // Initialize privacy budget manager
    this.privacyBudgetManager = new PrivacyBudgetManager()

    // Initialize private analytics
    this.privateAnalytics = new PrivateAnalytics()

    // Initialize ZK proof manager
    this.zkProofManager = new ZKProofManager()

    // Update status
    this.status.features.differentialPrivacy = this.differentialPrivacy.isEnabled()
    this.status.features.privacyBudget = this.privacyBudgetManager.isEnabled()
    this.status.features.privateAnalytics = this.privateAnalytics.isEnabled()
    this.status.features.zeroKnowledgeProofs = this.zkProofManager.isEnabled()
  }

  /**
   * Set up backward compatibility with existing privacy system
   */
  private async setupBackwardCompatibility(): Promise<void> {
    try {
      // Import legacy modules
      const legacyDifferentialPrivacy = await import('../../lib/differential-privacy')
      const legacyZeroKnowledgeProofs = await import('../../lib/zero-knowledge-proofs')

      // Set up compatibility layer
      if (typeof window !== 'undefined') {
        // Make legacy modules available globally for backward compatibility
        ;(window as any).privacyBudgetManager = this.privacyBudgetManager
        ;(window as any).privateAnalytics = this.privateAnalytics
        ;(window as any).zkProofManager = this.zkProofManager
      }

      this.status.compatibility.legacySupport = true

      if (this.config.enableLogging) {
        console.log('Backward compatibility layer initialized')
      }
    } catch (error) {
      console.warn('Failed to set up backward compatibility:', error)
    }
  }

  /**
   * Get epsilon value for privacy level
   */
  private getEpsilonForLevel(level: 'low' | 'medium' | 'high'): number {
    switch (level) {
      case 'low':
        return 5.0 // Less privacy, more accuracy
      case 'medium':
        return 1.0 // Balanced privacy and accuracy
      case 'high':
        return 0.1 // More privacy, less accuracy
      default:
        return 1.0
    }
  }

  /**
   * Get privacy bridge status
   */
  getStatus(): PrivacyBridgeStatus {
    return { ...this.status }
  }

  /**
   * Get differential privacy instance
   */
  getDifferentialPrivacy(): DifferentialPrivacy | null {
    return this.differentialPrivacy
  }

  /**
   * Get privacy budget manager
   */
  getPrivacyBudgetManager(): PrivacyBudgetManager | null {
    return this.privacyBudgetManager
  }

  /**
   * Get private analytics instance
   */
  getPrivateAnalytics(): PrivateAnalytics | null {
    return this.privateAnalytics
  }

  /**
   * Get ZK proof manager
   */
  getZKProofManager(): ZKProofManager | null {
    return this.zkProofManager
  }

  /**
   * Run private analysis with bridge
   */
  async runPrivateAnalysis(data: any[], type: 'demographics' | 'voting' | 'trends'): Promise<Map<string, any> | null> {
    if (!this.privateAnalytics || !this.status.enabled) {
      return null
    }

    try {
      switch (type) {
        case 'demographics':
          return this.privateAnalytics.privateDemographics(data)
        case 'voting':
          return this.privateAnalytics.privateVotingPatterns(data)
        case 'trends':
          return this.privateAnalytics.privateTrendAnalysis(data)
        default:
          throw new Error(`Unknown analysis type: ${type}`)
      }
    } catch (error) {
      console.error(`Failed to run ${type} analysis:`, error)
      return null
    }
  }

  /**
   * Create ZK proof with bridge
   */
  async createZKProof(type: string, data: any): Promise<string | null> {
    if (!this.zkProofManager || !this.status.enabled) {
      return null
    }

    try {
      return this.zkProofManager.createProof(type, data)
    } catch (error) {
      console.error(`Failed to create ZK proof of type ${type}:`, error)
      return null
    }
  }

  /**
   * Verify ZK proof with bridge
   */
  async verifyZKProof(proofId: string): Promise<any | null> {
    if (!this.zkProofManager || !this.status.enabled) {
      return null
    }

    try {
      return this.zkProofManager.verifyProof(proofId)
    } catch (error) {
      console.error(`Failed to verify ZK proof ${proofId}:`, error)
      return null
    }
  }

  /**
   * Use privacy budget with bridge
   */
  async usePrivacyBudget(category: string, amount: number): Promise<boolean> {
    if (!this.privacyBudgetManager || !this.status.enabled) {
      return true // Always allow when privacy is disabled
    }

    try {
      return this.privacyBudgetManager.useBudget(category, amount)
    } catch (error) {
      console.error(`Failed to use privacy budget for ${category}:`, error)
      return false
    }
  }

  /**
   * Get remaining privacy budget with bridge
   */
  async getRemainingPrivacyBudget(category: string): Promise<number> {
    if (!this.privacyBudgetManager || !this.status.enabled) {
      return 100 // Return high value when privacy is disabled
    }

    try {
      return this.privacyBudgetManager.getRemainingBudget(category)
    } catch (error) {
      console.error(`Failed to get remaining privacy budget for ${category}:`, error)
      return 0
    }
  }

  /**
   * Reset privacy budget with bridge
   */
  async resetPrivacyBudget(category?: string): Promise<void> {
    if (!this.privacyBudgetManager || !this.status.enabled) {
      return
    }

    try {
      if (category) {
        this.privacyBudgetManager.resetBudget(category)
      } else {
        this.privacyBudgetManager.resetAllBudgets()
      }
    } catch (error) {
      console.error('Failed to reset privacy budget:', error)
    }
  }

  /**
   * Update privacy bridge configuration
   */
  updateConfig(newConfig: Partial<PrivacyBridgeConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (this.config.enableLogging) {
      console.log('Privacy Bridge configuration updated:', this.config)
    }
  }

  /**
   * Cleanup privacy bridge
   */
  async cleanup(): Promise<void> {
    try {
      // Clear any stored data
      if (this.zkProofManager) {
        this.zkProofManager.clearProofs()
      }

      if (this.privacyBudgetManager) {
        this.privacyBudgetManager.resetAllBudgets()
      }

      // Reset status
      this.status.initialized = false
      this.status.enabled = false

      if (this.config.enableLogging) {
        console.log('Privacy Bridge cleaned up')
      }
    } catch (error) {
      console.error('Failed to cleanup Privacy Bridge:', error)
    }
  }
}

// Export singleton instance
let privacyBridgeInstance: PrivacyBridge | null = null

export const getPrivacyBridge = (): PrivacyBridge => {
  if (!privacyBridgeInstance) {
    privacyBridgeInstance = new PrivacyBridge()
  }
  return privacyBridgeInstance
}

// For backward compatibility
export const privacyBridge = typeof window !== 'undefined' ? getPrivacyBridge() : null
