// Hybrid Privacy Implementation
// This module provides a flexible privacy system that allows users to choose
// between different privacy levels for their polls and votes.

export type PrivacyLevel = 'public' | 'private' | 'high-privacy';

export type PrivacyConfig = {
  level: PrivacyLevel;
  requiresTokens: boolean;
  usesIA: boolean;
  usesPO: boolean;
  responseTime: number; // ms
  costMultiplier: number;
  features: string[];
}

export type PollPrivacySettings = {
  pollId: string;
  privacyLevel: PrivacyLevel;
  requiresAuthentication: boolean;
  allowsAnonymousVoting: boolean;
  usesBlindedTokens: boolean;
  providesAuditReceipts: boolean;
  createdAt: string;
  updatedAt: string;
}

// Privacy level configurations
export const PRIVACY_LEVELS: Record<PrivacyLevel, PrivacyConfig> = {
  'public': {
    level: 'public',
    requiresTokens: false,
    usesIA: false,
    usesPO: false,
    responseTime: 200,
    costMultiplier: 1.0,
    features: [
      'Fast voting',
      'Low cost',
      'Simple implementation',
      'Basic privacy'
    ]
  },
  'private': {
    level: 'private',
    requiresTokens: false,
    usesIA: false,
    usesPO: false,
    responseTime: 250,
    costMultiplier: 1.2,
    features: [
      'User authentication required',
      'Vote linking prevention',
      'Enhanced privacy',
      'Moderate cost'
    ]
  },
  'high-privacy': {
    level: 'high-privacy',
    requiresTokens: true,
    usesIA: true,
    usesPO: true,
    responseTime: 400,
    costMultiplier: 3.0,
    features: [
      'Blinded token voting',
      'Cryptographic verification',
      'Audit receipts',
      'Maximum privacy',
      'Research-grade security'
    ]
  }
};

// Privacy level descriptions for UI
export const PRIVACY_DESCRIPTIONS = {
  'public': {
    title: 'Public Poll',
    description: 'Fast and simple voting with basic privacy protection',
    icon: '🌐',
    color: 'green',
    recommended: 'For casual polls and surveys'
  },
  'private': {
    title: 'Private Poll',
    description: 'Enhanced privacy with user authentication',
    icon: '🔒',
    color: 'blue',
    recommended: 'For sensitive topics and user data'
  },
  'high-privacy': {
    title: 'High Privacy Poll',
    description: 'Maximum privacy with cryptographic guarantees',
    icon: '🛡️',
    color: 'purple',
    recommended: 'For confidential voting and research'
  }
};

// Helper functions
export class HybridPrivacyManager {
  /**
   * Get privacy configuration for a specific level
   */
  static getPrivacyConfig(level: PrivacyLevel): PrivacyConfig {
    return PRIVACY_LEVELS[level];
  }

  /**
   * Check if a privacy level requires IA/PO services
   */
  static requiresIAServices(level: PrivacyLevel): boolean {
    return PRIVACY_LEVELS[level].usesIA;
  }

  /**
   * Check if a privacy level requires PO services
   */
  static requiresPOServices(level: PrivacyLevel): boolean {
    return PRIVACY_LEVELS[level].usesPO;
  }

  /**
   * Get estimated response time for a privacy level
   */
  static getEstimatedResponseTime(level: PrivacyLevel): number {
    return PRIVACY_LEVELS[level].responseTime;
  }

  /**
   * Get cost multiplier for a privacy level
   */
  static getCostMultiplier(level: PrivacyLevel): number {
    return PRIVACY_LEVELS[level].costMultiplier;
  }

  /**
   * Validate privacy level
   */
  static isValidPrivacyLevel(level: string): level is PrivacyLevel {
    return level in PRIVACY_LEVELS;
  }

  /**
   * Get recommended privacy level based on poll characteristics
   */
  static getRecommendedPrivacyLevel(pollData: {
    title: string;
    description: string;
    category?: string;
    isSensitive?: boolean;
  }): PrivacyLevel {
    const { isSensitive } = pollData;
    const text = `${pollData.title} ${pollData.description} ${pollData.category || ''}`.toLowerCase();
    
    // High privacy keywords
    const highPrivacyKeywords = [
      'confidential', 'secret', 'private', 'sensitive', 'personal',
      'medical', 'health', 'financial', 'salary', 'income',
      'political', 'election', 'vote', 'candidate', 'party',
      'research', 'study', 'academic', 'thesis', 'dissertation'
    ];
    
    // Private keywords
    const privateKeywords = [
      'opinion', 'preference', 'choice', 'decision', 'feedback',
      'rating', 'review', 'satisfaction', 'experience', 'behavior'
    ];
    
    if (isSensitive || highPrivacyKeywords.some(keyword => text.includes(keyword))) {
      return 'high-privacy';
    }
    
    if (privateKeywords.some(keyword => text.includes(keyword))) {
      return 'private';
    }
    
    return 'public';
  }
}
