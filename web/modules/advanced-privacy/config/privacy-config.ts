/**
 * Privacy Configuration - Centralized Configuration Management
 * 
 * This module provides centralized configuration management for the privacy system.
 * It includes default configurations, environment-based overrides, and validation.
 */

import { isFeatureEnabled } from '../../../lib/feature-flags';

export interface PrivacyConfig {
  // Feature flags
  features: {
    differentialPrivacy: boolean
    zeroKnowledgeProofs: boolean
    privacyBudget: boolean
    privateAnalytics: boolean
    privacyAudit: boolean
  }
  
  // Privacy levels
  privacyLevel: 'low' | 'medium' | 'high'
  
  // Differential privacy settings
  differentialPrivacy: {
    epsilon: number
    delta: number
    sensitivity: number
    mechanism: 'laplace' | 'gaussian' | 'exponential'
  }
  
  // Privacy budget settings
  privacyBudget: {
    defaultBudgets: Record<string, number>
    maxBudget: number
    resetInterval: number // in days
  }
  
  // Compliance settings
  compliance: {
    gdpr: boolean
    ccpa: boolean
    coppa: boolean
    hipaa: boolean
    dataRetentionDays: number
    requireUserConsent: boolean
    enableDataMinimization: boolean
  }
  
  // Audit settings
  audit: {
    enableLogging: boolean
    enableTesting: boolean
    enableReporting: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
  }
  
  // Integration settings
  integration: {
    enableBackwardCompatibility: boolean
    enableFeatureFlags: boolean
    enableLogging: boolean
  }
}

export class PrivacyConfigManager {
  private config: PrivacyConfig
  private static instance: PrivacyConfigManager | null = null

  private constructor() {
    this.config = this.getDefaultConfig()
    this.loadEnvironmentOverrides()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PrivacyConfigManager {
    if (!PrivacyConfigManager.instance) {
      PrivacyConfigManager.instance = new PrivacyConfigManager()
    }
    return PrivacyConfigManager.instance
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): PrivacyConfig {
    return {
      features: {
        differentialPrivacy: true,
        zeroKnowledgeProofs: true,
        privacyBudget: true,
        privateAnalytics: true,
        privacyAudit: true
      },
      
      privacyLevel: 'medium',
      
      differentialPrivacy: {
        epsilon: 1.0,
        delta: 1e-5,
        sensitivity: 1,
        mechanism: 'gaussian'
      },
      
      privacyBudget: {
        defaultBudgets: {
          demographics: 1.0,
          voting: 2.0,
          trends: 1.5,
          analytics: 3.0
        },
        maxBudget: 10.0,
        resetInterval: 30
      },
      
      compliance: {
        gdpr: true,
        ccpa: true,
        coppa: true,
        hipaa: false,
        dataRetentionDays: 30,
        requireUserConsent: true,
        enableDataMinimization: true
      },
      
      audit: {
        enableLogging: true,
        enableTesting: true,
        enableReporting: true,
        logLevel: 'info'
      },
      
      integration: {
        enableBackwardCompatibility: true,
        enableFeatureFlags: true,
        enableLogging: true
      }
    }
  }

  /**
   * Load environment-based overrides
   */
  private loadEnvironmentOverrides(): void {
    // Override with environment variables
    if (process.env.PRIVACY_LEVEL) {
      this.config.privacyLevel = process.env.PRIVACY_LEVEL as 'low' | 'medium' | 'high'
    }

    if (process.env.DP_EPSILON) {
      this.config.differentialPrivacy.epsilon = parseFloat(process.env.DP_EPSILON)
    }

    if (process.env.DP_DELTA) {
      this.config.differentialPrivacy.delta = parseFloat(process.env.DP_DELTA)
    }

    if (process.env.DP_SENSITIVITY) {
      this.config.differentialPrivacy.sensitivity = parseFloat(process.env.DP_SENSITIVITY)
    }

    if (process.env.DP_MECHANISM) {
      this.config.differentialPrivacy.mechanism = process.env.DP_MECHANISM as 'laplace' | 'gaussian' | 'exponential'
    }

    if (process.env.DATA_RETENTION_DAYS) {
      this.config.compliance.dataRetentionDays = parseInt(process.env.DATA_RETENTION_DAYS)
    }

    if (process.env.ENABLE_GDPR) {
      this.config.compliance.gdpr = process.env.ENABLE_GDPR === 'true'
    }

    if (process.env.ENABLE_CCPA) {
      this.config.compliance.ccpa = process.env.ENABLE_CCPA === 'true'
    }

    if (process.env.ENABLE_COPPA) {
      this.config.compliance.coppa = process.env.ENABLE_COPPA === 'true'
    }

    if (process.env.ENABLE_HIPAA) {
      this.config.compliance.hipaa = process.env.ENABLE_HIPAA === 'true'
    }

    if (process.env.REQUIRE_USER_CONSENT) {
      this.config.compliance.requireUserConsent = process.env.REQUIRE_USER_CONSENT === 'true'
    }

    if (process.env.ENABLE_DATA_MINIMIZATION) {
      this.config.compliance.enableDataMinimization = process.env.ENABLE_DATA_MINIMIZATION === 'true'
    }

    if (process.env.AUDIT_LOG_LEVEL) {
      this.config.audit.logLevel = process.env.AUDIT_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error'
    }

    // Update features based on feature flags
    this.updateFeaturesFromFlags()
  }

  /**
   * Update features based on feature flags
   */
  private updateFeaturesFromFlags(): void {
    const advancedPrivacyEnabled = isFeatureEnabled('advancedPrivacy')
    
    if (!advancedPrivacyEnabled) {
      // Disable all advanced privacy features if the flag is off
      this.config.features.differentialPrivacy = false
      this.config.features.zeroKnowledgeProofs = false
      this.config.features.privacyBudget = false
      this.config.features.privateAnalytics = false
      this.config.features.privacyAudit = false
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PrivacyConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...updates }
    this.updateFeaturesFromFlags()
  }

  /**
   * Get privacy level configuration
   */
  getPrivacyLevelConfig(): PrivacyConfig['differentialPrivacy'] {
    const level = this.config.privacyLevel
    
    switch (level) {
      case 'low':
        return {
          epsilon: 5.0,
          delta: 1e-4,
          sensitivity: 1,
          mechanism: 'gaussian'
        }
      case 'high':
        return {
          epsilon: 0.1,
          delta: 1e-6,
          sensitivity: 1,
          mechanism: 'laplace'
        }
      default: // medium
        return this.config.differentialPrivacy
    }
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(): PrivacyConfig['features'] {
    return { ...this.config.features }
  }

  /**
   * Get compliance configuration
   */
  getComplianceConfig(): PrivacyConfig['compliance'] {
    return { ...this.config.compliance }
  }

  /**
   * Get audit configuration
   */
  getAuditConfig(): PrivacyConfig['audit'] {
    return { ...this.config.audit }
  }

  /**
   * Get integration configuration
   */
  getIntegrationConfig(): PrivacyConfig['integration'] {
    return { ...this.config.integration }
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof PrivacyConfig['features']): boolean {
    return this.config.features[feature]
  }

  /**
   * Check if compliance is enabled
   */
  isComplianceEnabled(regulation: keyof PrivacyConfig['compliance']): boolean {
    return Boolean(this.config.compliance[regulation])
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate differential privacy settings
    if (this.config.differentialPrivacy.epsilon <= 0) {
      errors.push('Differential privacy epsilon must be positive')
    }

    if (this.config.differentialPrivacy.delta <= 0 || this.config.differentialPrivacy.delta >= 1) {
      errors.push('Differential privacy delta must be between 0 and 1')
    }

    if (this.config.differentialPrivacy.sensitivity <= 0) {
      errors.push('Differential privacy sensitivity must be positive')
    }

    // Validate privacy budget settings
    if (this.config.privacyBudget.maxBudget <= 0) {
      errors.push('Privacy budget max budget must be positive')
    }

    if (this.config.privacyBudget.resetInterval <= 0) {
      errors.push('Privacy budget reset interval must be positive')
    }

    // Validate compliance settings
    if (this.config.compliance.dataRetentionDays < 0) {
      errors.push('Data retention days must be non-negative')
    }

    // Validate audit settings
    const validLogLevels = ['debug', 'info', 'warn', 'error']
    if (!validLogLevels.includes(this.config.audit.logLevel)) {
      errors.push('Invalid audit log level')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.config = this.getDefaultConfig()
    this.loadEnvironmentOverrides()
  }

  /**
   * Export configuration for debugging
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import configuration
   */
  importConfig(configString: string): { success: boolean; error?: string } {
    try {
      const importedConfig = JSON.parse(configString)
      this.config = { ...this.getDefaultConfig(), ...importedConfig }
      
      const validation = this.validateConfig()
      if (!validation.valid) {
        return {
          success: false,
          error: `Configuration validation failed: ${validation.errors.join(', ')}`
        }
      }
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse configuration: ${error}`
      }
    }
  }
}

// Export singleton instance
export const privacyConfig = PrivacyConfigManager.getInstance()

// Export convenience functions
export const getPrivacyConfig = (): PrivacyConfig => privacyConfig.getConfig()
export const updatePrivacyConfig = (updates: Partial<PrivacyConfig>): void => privacyConfig.updateConfig(updates)
export const isPrivacyFeatureEnabled = (feature: keyof PrivacyConfig['features']): boolean => privacyConfig.isFeatureEnabled(feature)
export const isPrivacyComplianceEnabled = (regulation: keyof PrivacyConfig['compliance']): boolean => privacyConfig.isComplianceEnabled(regulation)
export const validatePrivacyConfig = (): { valid: boolean; errors: string[] } => privacyConfig.validateConfig()
