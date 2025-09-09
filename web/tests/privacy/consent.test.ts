/**
 * Privacy Consent Management Tests
 * 
 * Tests for consent management functionality
 * 
 * @created September 9, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConsentManager, ConsentUI, ConsentType } from '../../utils/privacy/consent';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [],
        error: null
      }))
    })),
    insert: jest.fn(() => ({
      data: null,
      error: null
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        is: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }))
};

describe('ConsentManager', () => {
  let consentManager: ConsentManager;

  beforeEach(() => {
    jest.clearAllMocks();
    consentManager = new ConsentManager(mockSupabase);
  });

  describe('getUserConsent', () => {
    it('should return empty array when no consent records exist', async () => {
      const result = await consentManager.getUserConsent();
      expect(result).toEqual([]);
    });

    it('should return consent records when they exist', async () => {
      const mockConsentData = [
        {
          id: '1',
          user_id: 'user-123',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      const result = await consentManager.getUserConsent();
      expect(result).toEqual(mockConsentData);
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      });

      const result = await consentManager.getUserConsent();
      expect(result).toEqual([]);
    });
  });

  describe('getConsentPreferences', () => {
    it('should return default preferences when no consent exists', async () => {
      const result = await consentManager.getConsentPreferences();
      
      expect(result).toEqual({
        analytics: false,
        demographics: false,
        behavioral: false,
        contact: false,
        research: false,
        marketing: false
      });
    });

    it('should return correct preferences based on consent records', async () => {
      const mockConsentData = [
        {
          id: '1',
          user_id: 'user-123',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        },
        {
          id: '2',
          user_id: 'user-123',
          consent_type: 'demographics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: '2025-09-09T01:00:00Z', // Revoked
          consent_version: 1,
          purpose: 'Demographics',
          data_types: ['age', 'location']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      const result = await consentManager.getConsentPreferences();
      
      expect(result.analytics).toBe(true);
      expect(result.demographics).toBe(false); // Revoked
      expect(result.behavioral).toBe(false);
      expect(result.contact).toBe(false);
      expect(result.research).toBe(false);
      expect(result.marketing).toBe(false);
    });
  });

  describe('grantConsent', () => {
    it('should grant consent successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: null
        }))
      });

      const result = await consentManager.grantConsent(
        'analytics',
        'To improve user experience',
        ['usage_stats']
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_consent');
    });

    it('should handle errors when granting consent', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({
          data: null,
          error: { message: 'Database error' }
        }))
      });

      const result = await consentManager.grantConsent(
        'analytics',
        'To improve user experience',
        ['usage_stats']
      );

      expect(result).toBe(false);
    });
  });

  describe('revokeConsent', () => {
    it('should revoke consent successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const result = await consentManager.revokeConsent('analytics');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_consent');
    });

    it('should handle errors when revoking consent', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      const result = await consentManager.revokeConsent('analytics');

      expect(result).toBe(false);
    });
  });

  describe('updateConsentPreferences', () => {
    it('should update multiple consent preferences', async () => {
      // Mock successful grant and revoke operations
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => ({ data: null, error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            is: jest.fn(() => ({ data: null, error: null }))
          }))
        }))
      });

      const preferences = {
        analytics: true,
        demographics: false
      };

      const result = await consentManager.updateConsentPreferences(preferences);

      expect(result).toBe(true);
    });
  });

  describe('hasConsent', () => {
    it('should return true when user has granted consent', async () => {
      const mockConsentData = [
        {
          id: '1',
          user_id: 'user-123',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      const result = await consentManager.hasConsent('analytics');
      expect(result).toBe(true);
    });

    it('should return false when user has not granted consent', async () => {
      const result = await consentManager.hasConsent('analytics');
      expect(result).toBe(false);
    });
  });

  describe('getConsentSummary', () => {
    it('should return correct consent summary', async () => {
      const mockConsentData = [
        {
          id: '1',
          user_id: 'user-123',
          consent_type: 'analytics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Analytics',
          data_types: ['usage_stats']
        },
        {
          id: '2',
          user_id: 'user-123',
          consent_type: 'demographics',
          granted: true,
          granted_at: '2025-09-09T00:00:00Z',
          revoked_at: null,
          consent_version: 1,
          purpose: 'Demographics',
          data_types: ['age', 'location']
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockConsentData,
            error: null
          }))
        }))
      });

      const result = await consentManager.getConsentSummary();

      expect(result.totalConsents).toBe(6);
      expect(result.activeConsents).toBe(2);
      expect(result.consentTypes.analytics).toBe(true);
      expect(result.consentTypes.demographics).toBe(true);
      expect(result.consentTypes.behavioral).toBe(false);
    });
  });
});

describe('ConsentUI', () => {
  describe('getConsentDescription', () => {
    it('should return correct description for analytics consent', () => {
      const description = ConsentUI.getConsentDescription('analytics');

      expect(description.title).toBe('Usage Analytics');
      expect(description.description).toContain('improve the platform');
      expect(description.benefits).toContain('Better user experience');
      expect(description.dataTypes).toContain('Page views');
    });

    it('should return correct description for demographics consent', () => {
      const description = ConsentUI.getConsentDescription('demographics');

      expect(description.title).toBe('Demographic Data');
      expect(description.description).toContain('demographic information');
      expect(description.benefits).toContain('Personalized content');
      expect(description.dataTypes).toContain('Age range');
    });

    it('should return correct description for behavioral consent', () => {
      const description = ConsentUI.getConsentDescription('behavioral');

      expect(description.title).toBe('Behavioral Data');
      expect(description.description).toContain('voting patterns');
      expect(description.benefits).toContain('Better poll recommendations');
      expect(description.dataTypes).toContain('Voting history');
    });

    it('should return correct description for contact consent', () => {
      const description = ConsentUI.getConsentDescription('contact');

      expect(description.title).toBe('Contact Information');
      expect(description.description).toContain('send you important updates');
      expect(description.benefits).toContain('Important platform updates');
      expect(description.dataTypes).toContain('Email address');
    });

    it('should return correct description for research consent', () => {
      const description = ConsentUI.getConsentDescription('research');

      expect(description.title).toBe('Research Participation');
      expect(description.description).toContain('civic research');
      expect(description.benefits).toContain('Advance civic understanding');
      expect(description.dataTypes).toContain('Anonymized voting data');
    });

    it('should return correct description for marketing consent', () => {
      const description = ConsentUI.getConsentDescription('marketing');

      expect(description.title).toBe('Marketing Communications');
      expect(description.description).toContain('relevant updates');
      expect(description.benefits).toContain('New feature announcements');
      expect(description.dataTypes).toContain('Contact information');
    });
  });

  describe('getAllConsentForms', () => {
    it('should return all consent forms', () => {
      const forms = ConsentUI.getAllConsentForms();

      expect(forms).toHaveLength(6);
      expect(forms.map(f => f.type)).toEqual([
        'analytics',
        'demographics',
        'behavioral',
        'contact',
        'research',
        'marketing'
      ]);

      // Check that each form has required properties
      forms.forEach(form => {
        expect(form).toHaveProperty('type');
        expect(form).toHaveProperty('title');
        expect(form).toHaveProperty('description');
        expect(form).toHaveProperty('benefits');
        expect(form).toHaveProperty('dataTypes');
        expect(Array.isArray(form.benefits)).toBe(true);
        expect(Array.isArray(form.dataTypes)).toBe(true);
      });
    });
  });
});


