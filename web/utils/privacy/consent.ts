/**
 * Privacy Consent Management System
 * 
 * Handles user consent for data collection and analytics.
 * All consent is user-controlled and granular.
 * 
 * @created September 9, 2025
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type ConsentType = 
  | 'analytics'           // Basic usage analytics
  | 'demographics'        // Age, location, education data
  | 'behavioral'          // Voting patterns and preferences
  | 'contact'             // Email, phone for notifications
  | 'research'            // Data for research purposes
  | 'marketing';          // Marketing communications

export type ConsentRecord = {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  granted_at: Date;
  revoked_at?: Date;
  consent_version: number;
  purpose: string;
  data_types: string[];
}

export type ConsentPreferences = {
  analytics: boolean;
  demographics: boolean;
  behavioral: boolean;
  contact: boolean;
  research: boolean;
  marketing: boolean;
}

export class ConsentManager {
  private supabase: SupabaseClient<unknown>;

  constructor(supabase: SupabaseClient<unknown>) {
    this.supabase = supabase;
  }

  /**
   * Get all consent records for the current user
   */
  async getUserConsent(): Promise<ConsentRecord[]> {
    const { data, error } = await this.supabase
      .from('user_consent')
      .select('*')
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching user consent:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get current consent preferences as a simple object
   */
  async getConsentPreferences(): Promise<ConsentPreferences> {
    const consentRecords = await this.getUserConsent();
    const preferences: ConsentPreferences = {
      analytics: false,
      demographics: false,
      behavioral: false,
      contact: false,
      research: false,
      marketing: false
    };

    // Get the most recent consent for each type
    const latestConsent = new Map<ConsentType, ConsentRecord>();
    
    for (const record of consentRecords) {
      const existing = latestConsent.get(record.consent_type);
      if (!existing || record.granted_at > existing.granted_at) {
        latestConsent.set(record.consent_type, record);
      }
    }

    // Set preferences based on latest consent
    for (const [type, record] of latestConsent) {
      preferences[type] = record.granted && !record.revoked_at;
    }

    return preferences;
  }

  /**
   * Grant consent for a specific type
   */
  async grantConsent(
    consentType: ConsentType,
    purpose: string,
    dataTypes: string[]
  ): Promise<boolean> {
    // Note: user_consent table needs to be created via migration
    // For now, store in localStorage as fallback
    try {
      if (typeof window !== 'undefined') {
        const consent = {
          consent_type: consentType,
          granted: true,
          purpose,
          data_types: dataTypes,
          consent_version: 1,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`consent_${consentType}`, JSON.stringify(consent));
      }
      return true;
    } catch (error) {
      console.error('Error granting consent:', error);
      return false;
    }
  }

  /**
   * Revoke consent for a specific type
   */
  async revokeConsent(consentType: ConsentType): Promise<boolean> {
    // Note: user_consent table needs to be created via migration
    // For now, remove from localStorage as fallback
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`consent_${consentType}`);
      }
      return true;
    } catch (error) {
      console.error('Error revoking consent:', error);
      return false;
    }
  }

  /**
   * Update consent preferences in bulk
   */
  async updateConsentPreferences(preferences: Partial<ConsentPreferences>): Promise<boolean> {
    const consentTypes: ConsentType[] = [
      'analytics', 'demographics', 'behavioral', 'contact', 'research', 'marketing'
    ];

    for (const type of consentTypes) {
      if (preferences[type] !== undefined) {
        if (preferences[type]) {
          await this.grantConsent(type, this.getDefaultPurpose(type), this.getDefaultDataTypes(type));
        } else {
          await this.revokeConsent(type);
        }
      }
    }

    return true;
  }

  /**
   * Check if user has granted consent for a specific type
   */
  async hasConsent(consentType: ConsentType): Promise<boolean> {
    const preferences = await this.getConsentPreferences();
    return preferences[consentType];
  }

  /**
   * Get consent summary for display
   */
  async getConsentSummary(): Promise<{
    totalConsents: number;
    activeConsents: number;
    consentTypes: { [key in ConsentType]: boolean };
  }> {
    const preferences = await this.getConsentPreferences();
    const activeConsents = Object.values(preferences).filter(Boolean).length;
    
    return {
      totalConsents: Object.keys(preferences).length,
      activeConsents,
      consentTypes: preferences
    };
  }

  /**
   * Export consent data for user
   */
  async exportConsentData(): Promise<ConsentRecord[]> {
    return await this.getUserConsent();
  }

  /**
   * Get default purpose for consent type
   */
  private getDefaultPurpose(consentType: ConsentType): string {
    const purposes = {
      analytics: 'To improve user experience and system performance',
      demographics: 'To provide demographic insights and analytics',
      behavioral: 'To understand voting patterns and preferences',
      contact: 'To send important notifications and updates',
      research: 'To contribute to civic research and analysis',
      marketing: 'To send relevant updates and information'
    };
    return purposes[consentType];
  }

  /**
   * Get default data types for consent type
   */
  private getDefaultDataTypes(consentType: ConsentType): string[] {
    const dataTypes = {
      analytics: ['usage_stats', 'performance_metrics', 'error_logs'],
      demographics: ['age_bucket', 'region_bucket', 'education_bucket'],
      behavioral: ['voting_patterns', 'preferences', 'interaction_data'],
      contact: ['email', 'phone', 'notification_preferences'],
      research: ['anonymized_data', 'aggregated_insights', 'trend_analysis'],
      marketing: ['contact_info', 'preferences', 'engagement_data']
    };
    return dataTypes[consentType];
  }
}

/**
 * Consent UI Components and Utilities
 */
export class ConsentUI {
  /**
   * Generate consent description for UI
   */
  static getConsentDescription(consentType: ConsentType): {
    title: string;
    description: string;
    benefits: string[];
    dataTypes: string[];
  } {
    const descriptions = {
      analytics: {
        title: 'Usage Analytics',
        description: 'Help us improve the platform by sharing anonymous usage data.',
        benefits: [
          'Better user experience',
          'Faster performance',
          'Fewer bugs and errors'
        ],
        dataTypes: ['Page views', 'Feature usage', 'Performance metrics']
      },
      demographics: {
        title: 'Demographic Data',
        description: 'Share your demographic information for better insights and analysis.',
        benefits: [
          'Personalized content',
          'Demographic insights',
          'Better civic representation'
        ],
        dataTypes: ['Age range', 'General location', 'Education level']
      },
      behavioral: {
        title: 'Behavioral Data',
        description: 'Share your voting patterns and preferences for research purposes.',
        benefits: [
          'Better poll recommendations',
          'Understanding of civic trends',
          'Improved platform features'
        ],
        dataTypes: ['Voting history', 'Preferences', 'Interaction patterns']
      },
      contact: {
        title: 'Contact Information',
        description: 'Allow us to send you important updates and notifications.',
        benefits: [
          'Important platform updates',
          'New feature announcements',
          'Security notifications'
        ],
        dataTypes: ['Email address', 'Phone number', 'Notification preferences']
      },
      research: {
        title: 'Research Participation',
        description: 'Contribute your data to civic research and analysis.',
        benefits: [
          'Advance civic understanding',
          'Better public policy insights',
          'Democratic participation research'
        ],
        dataTypes: ['Anonymized voting data', 'Demographic insights', 'Trend analysis']
      },
      marketing: {
        title: 'Marketing Communications',
        description: 'Receive relevant updates and information about the platform.',
        benefits: [
          'New feature announcements',
          'Platform updates',
          'Relevant civic information'
        ],
        dataTypes: ['Contact information', 'Preferences', 'Engagement data']
      }
    };

    return descriptions[consentType];
  }

  /**
   * Generate consent form data for all types
   */
  static getAllConsentForms(): Array<{
    type: ConsentType;
    title: string;
    description: string;
    benefits: string[];
    dataTypes: string[];
  }> {
    const types: ConsentType[] = [
      'analytics', 'demographics', 'behavioral', 'contact', 'research', 'marketing'
    ];

    return types.map(type => ({
      type,
      ...this.getConsentDescription(type)
    }));
  }
}


