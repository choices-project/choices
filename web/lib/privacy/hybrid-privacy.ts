/**
 * Hybrid Privacy Module
 * 
 * This module provides hybrid privacy functionality.
 * It replaces the old @/shared/core/privacy/lib/hybrid-privacy imports.
 */

export enum PrivacyLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  MAXIMUM = 'maximum'
}

export const PRIVACY_DESCRIPTIONS = {
  [PrivacyLevel.MINIMAL]: {
    title: 'Minimal Privacy',
    description: 'Basic privacy protection with minimal data collection'
  },
  [PrivacyLevel.STANDARD]: {
    title: 'Standard Privacy',
    description: 'Standard privacy protection with balanced data collection'
  },
  [PrivacyLevel.ENHANCED]: {
    title: 'Enhanced Privacy',
    description: 'Enhanced privacy protection with limited data collection'
  },
  [PrivacyLevel.MAXIMUM]: {
    title: 'Maximum Privacy',
    description: 'Maximum privacy protection with minimal data collection'
  }
};

export class HybridPrivacyManager {
  private level: PrivacyLevel;

  constructor(level: PrivacyLevel = PrivacyLevel.STANDARD) {
    this.level = level;
  }

  getLevel(): PrivacyLevel {
    return this.level;
  }

  setLevel(level: PrivacyLevel): void {
    this.level = level;
  }

  getDescription(): string {
    return PRIVACY_DESCRIPTIONS[this.level].description;
  }

  static getRecommendedPrivacyLevel(data: { title: string; description: string; category: string }): PrivacyLevel {
    // Simple heuristic based on content sensitivity
    const sensitiveKeywords = ['personal', 'private', 'confidential', 'sensitive', 'medical', 'financial'];
    const content = `${data.title} ${data.description} ${data.category}`.toLowerCase();
    
    if (sensitiveKeywords.some(keyword => content.includes(keyword))) {
      return PrivacyLevel.MAXIMUM;
    }
    
    if (data.category === 'politics' || data.category === 'social') {
      return PrivacyLevel.ENHANCED;
    }
    
    return PrivacyLevel.STANDARD;
  }

  static getPrivacyConfig(level: PrivacyLevel): { 
    icon: string; 
    title: string; 
    description: string;
    recommended?: boolean;
    responseTime: string;
    costMultiplier: number;
    features: string[];
  } {
    const description = PRIVACY_DESCRIPTIONS[level];
    const icons = {
      [PrivacyLevel.MINIMAL]: '🔓',
      [PrivacyLevel.STANDARD]: '🔒',
      [PrivacyLevel.ENHANCED]: '🛡️',
      [PrivacyLevel.MAXIMUM]: '🔐'
    };
    
    const configs = {
      [PrivacyLevel.MINIMAL]: {
        responseTime: 'Fast',
        costMultiplier: 1.0,
        features: ['Basic encryption', 'Standard data collection']
      },
      [PrivacyLevel.STANDARD]: {
        responseTime: 'Medium',
        costMultiplier: 1.2,
        features: ['Enhanced encryption', 'Limited data collection', 'Audit logs']
      },
      [PrivacyLevel.ENHANCED]: {
        responseTime: 'Slower',
        costMultiplier: 1.5,
        features: ['Strong encryption', 'Minimal data collection', 'Full audit logs', 'Anonymization']
      },
      [PrivacyLevel.MAXIMUM]: {
        responseTime: 'Slowest',
        costMultiplier: 2.0,
        features: ['Maximum encryption', 'Zero data collection', 'Complete audit logs', 'Full anonymization', 'Zero-knowledge proofs']
      }
    };
    
    return {
      icon: icons[level],
      title: description.title,
      description: description.description,
      recommended: level === PrivacyLevel.STANDARD,
      ...configs[level]
    };
  }
}
