/**
 * Feature Flags Unit Tests
 * 
 * Tests the centralized feature flag system including:
 * - Flag definitions and defaults
 * - Runtime flag management
 * - Category-based flag retrieval
 * - System information
 * 
 * Created: 2025-09-27
 */

import { 
  FEATURE_FLAGS, 
  isFeatureEnabled, 
  featureFlagManager,
  type FeatureFlag,
  type FeatureFlagKey,
  type FeatureFlagSystemInfo
} from '@/lib/core/feature-flags';

describe('Feature Flags System', () => {
  
  describe('FEATURE_FLAGS constant', () => {
    it('should have all core MVP features enabled', () => {
      expect(FEATURE_FLAGS.WEBAUTHN).toBe(true);
      expect(FEATURE_FLAGS.PWA).toBe(true);
      expect(FEATURE_FLAGS.ADMIN).toBe(true);
      expect(FEATURE_FLAGS.FEEDBACK_WIDGET).toBe(true);
    });

    it('should have enhanced MVP features enabled', () => {
      expect(FEATURE_FLAGS.ENHANCED_ONBOARDING).toBe(true);
      expect(FEATURE_FLAGS.ENHANCED_PROFILE).toBe(true);
      expect(FEATURE_FLAGS.ENHANCED_AUTH).toBe(true);
      expect(FEATURE_FLAGS.ENHANCED_DASHBOARD).toBe(true);
      expect(FEATURE_FLAGS.ENHANCED_POLLS).toBe(true);
      expect(FEATURE_FLAGS.ENHANCED_VOTING).toBe(true);
    });

    it('should have civics features enabled', () => {
      expect(FEATURE_FLAGS.CIVICS_ADDRESS_LOOKUP).toBe(true);
      expect(FEATURE_FLAGS.CIVICS_REPRESENTATIVE_DATABASE).toBe(true);
      expect(FEATURE_FLAGS.CIVICS_CAMPAIGN_FINANCE).toBe(true);
      expect(FEATURE_FLAGS.CIVICS_VOTING_RECORDS).toBe(true);
      expect(FEATURE_FLAGS.CANDIDATE_ACCOUNTABILITY).toBe(true);
      expect(FEATURE_FLAGS.CANDIDATE_CARDS).toBe(true);
      expect(FEATURE_FLAGS.ALTERNATIVE_CANDIDATES).toBe(true);
    });

    it('should have future features disabled', () => {
      expect(FEATURE_FLAGS.AUTOMATED_POLLS).toBe(false);
      expect(FEATURE_FLAGS.ADVANCED_PRIVACY).toBe(false);
      expect(FEATURE_FLAGS.MEDIA_BIAS_ANALYSIS).toBe(false);
      expect(FEATURE_FLAGS.POLL_NARRATIVE_SYSTEM).toBe(false);
      expect(FEATURE_FLAGS.SOCIAL_SHARING).toBe(false);
    });

    it('should have performance features configured', () => {
      expect(FEATURE_FLAGS.FEATURE_DB_OPTIMIZATION_SUITE).toBe(true);
      expect(FEATURE_FLAGS.ANALYTICS).toBe(true);
      expect(FEATURE_FLAGS.PERFORMANCE_OPTIMIZATION).toBe(false);
    });
  });

  describe('isFeatureEnabled function', () => {
    it('should return true for enabled features', () => {
      expect(isFeatureEnabled('WEBAUTHN')).toBe(true);
      expect(isFeatureEnabled('PWA')).toBe(true);
      expect(isFeatureEnabled('ADMIN')).toBe(true);
      expect(isFeatureEnabled('ENHANCED_DASHBOARD')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(isFeatureEnabled('AUTOMATED_POLLS')).toBe(false);
      expect(isFeatureEnabled('ADVANCED_PRIVACY')).toBe(false);
      expect(isFeatureEnabled('SOCIAL_SHARING')).toBe(false);
    });

    it('should handle case-insensitive lookups', () => {
      expect(isFeatureEnabled('webauthn')).toBe(true);
      expect(isFeatureEnabled('pwa')).toBe(true);
      expect(isFeatureEnabled('admin')).toBe(true);
    });

    it('should return false for unknown features', () => {
      expect(isFeatureEnabled('UNKNOWN_FEATURE')).toBe(false);
      expect(isFeatureEnabled('INVALID_FLAG')).toBe(false);
    });
  });

  describe('featureFlagManager', () => {
    beforeEach(() => {
      // Reset to default state
      featureFlagManager.disable('TEST_FLAG');
    });

    describe('enable method', () => {
      it('should enable a feature flag', () => {
        const result = featureFlagManager.enable('TEST_FLAG');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
      });

      it('should handle case-insensitive enabling', () => {
        const result = featureFlagManager.enable('test_flag');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
      });

      it('should return false for unknown flags', () => {
        const result = featureFlagManager.enable('UNKNOWN_FLAG');
        expect(result).toBe(false);
      });
    });

    describe('disable method', () => {
      it('should disable a feature flag', () => {
        featureFlagManager.enable('TEST_FLAG');
        const result = featureFlagManager.disable('TEST_FLAG');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
      });

      it('should handle case-insensitive disabling', () => {
        featureFlagManager.enable('TEST_FLAG');
        const result = featureFlagManager.disable('test_flag');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
      });

      it('should return false for unknown flags', () => {
        const result = featureFlagManager.disable('UNKNOWN_FLAG');
        expect(result).toBe(false);
      });
    });

    describe('toggle method', () => {
      it('should toggle a feature flag from false to true', () => {
        featureFlagManager.disable('TEST_FLAG');
        const result = featureFlagManager.toggle('TEST_FLAG');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
      });

      it('should toggle a feature flag from true to false', () => {
        featureFlagManager.enable('TEST_FLAG');
        const result = featureFlagManager.toggle('TEST_FLAG');
        expect(result).toBe(true);
        expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
      });

      it('should return false for unknown flags', () => {
        const result = featureFlagManager.toggle('UNKNOWN_FLAG');
        expect(result).toBe(false);
      });
    });

    describe('get method', () => {
      it('should return current flag value', () => {
        featureFlagManager.enable('TEST_FLAG');
        expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
        
        featureFlagManager.disable('TEST_FLAG');
        expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
      });

      it('should return false for unknown flags', () => {
        expect(featureFlagManager.get('UNKNOWN_FLAG')).toBe(false);
      });
    });

    describe('all method', () => {
      it('should return all flags with current values', () => {
        const allFlags = featureFlagManager.all();
        expect(allFlags).toHaveProperty('WEBAUTHN');
        expect(allFlags).toHaveProperty('PWA');
        expect(allFlags).toHaveProperty('ADMIN');
        expect(allFlags.WEBAUTHN).toBe(true);
        expect(allFlags.PWA).toBe(true);
        expect(allFlags.ADMIN).toBe(true);
      });
    });

    describe('getAllFlags method', () => {
      it('should return a Map of all flags with metadata', () => {
        const flagsMap = featureFlagManager.getAllFlags();
        expect(flagsMap).toBeInstanceOf(Map);
        expect(flagsMap.size).toBeGreaterThan(0);
        
        const webauthnFlag = flagsMap.get('WEBAUTHN');
        expect(webauthnFlag).toBeDefined();
        expect(webauthnFlag?.enabled).toBe(true);
        expect(webauthnFlag?.name).toBe('Webauthn');
        expect(webauthnFlag?.category).toBe('core');
      });
    });

    describe('isEnabled method', () => {
      it('should return true for enabled flags', () => {
        featureFlagManager.enable('TEST_FLAG');
        expect(featureFlagManager.isEnabled('TEST_FLAG')).toBe(true);
      });

      it('should return false for disabled flags', () => {
        featureFlagManager.disable('TEST_FLAG');
        expect(featureFlagManager.isEnabled('TEST_FLAG')).toBe(false);
      });

      it('should return false for unknown flags', () => {
        expect(featureFlagManager.isEnabled('UNKNOWN_FLAG')).toBe(false);
      });
    });

    describe('getFlag method', () => {
      it('should return flag metadata for existing flags', () => {
        const flag = featureFlagManager.getFlag('WEBAUTHN');
        expect(flag).toBeDefined();
        expect(flag?.id).toBe('WEBAUTHN');
        expect(flag?.enabled).toBe(true);
        expect(flag?.name).toBe('Webauthn');
        expect(flag?.category).toBe('core');
      });

      it('should return null for unknown flags', () => {
        const flag = featureFlagManager.getFlag('UNKNOWN_FLAG');
        expect(flag).toBeNull();
      });
    });

    describe('getFlagsByCategory method', () => {
      it('should return core flags', () => {
        const coreFlags = featureFlagManager.getFlagsByCategory('core');
        expect(coreFlags).toBeDefined();
        expect(coreFlags.length).toBeGreaterThan(0);
        expect(coreFlags.every(flag => flag.category === 'core')).toBe(true);
      });

      it('should return enhanced flags', () => {
        const enhancedFlags = featureFlagManager.getFlagsByCategory('enhanced');
        expect(enhancedFlags).toBeDefined();
        expect(enhancedFlags.length).toBeGreaterThan(0);
        expect(enhancedFlags.every(flag => flag.category === 'enhanced')).toBe(true);
      });

      it('should return future flags', () => {
        const futureFlags = featureFlagManager.getFlagsByCategory('future');
        expect(futureFlags).toBeDefined();
        expect(futureFlags.length).toBeGreaterThan(0);
        expect(futureFlags.every(flag => flag.category === 'future')).toBe(true);
      });

      it('should return empty array for unknown category', () => {
        const unknownFlags = featureFlagManager.getFlagsByCategory('unknown');
        expect(unknownFlags).toEqual([]);
      });
    });

    describe('getSystemInfo method', () => {
      it('should return system information', () => {
        const systemInfo = featureFlagManager.getSystemInfo();
        expect(systemInfo).toHaveProperty('totalFlags');
        expect(systemInfo).toHaveProperty('enabledFlags');
        expect(systemInfo).toHaveProperty('disabledFlags');
        expect(systemInfo).toHaveProperty('categories');
        expect(systemInfo.totalFlags).toBeGreaterThan(0);
        expect(systemInfo.enabledFlags).toBeGreaterThan(0);
        expect(systemInfo.disabledFlags).toBeGreaterThan(0);
        expect(systemInfo.categories).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature Flag Categories', () => {
    it('should have core features properly categorized', () => {
      const coreFlags = featureFlagManager.getFlagsByCategory('core');
      const coreFlagIds = coreFlags.map(flag => flag.id);
      expect(coreFlagIds).toContain('WEBAUTHN');
      expect(coreFlagIds).toContain('PWA');
      expect(coreFlagIds).toContain('ADMIN');
      expect(coreFlagIds).toContain('FEEDBACK_WIDGET');
    });

    it('should have enhanced features properly categorized', () => {
      const enhancedFlags = featureFlagManager.getFlagsByCategory('enhanced');
      const enhancedFlagIds = enhancedFlags.map(flag => flag.id);
      expect(enhancedFlagIds).toContain('ENHANCED_ONBOARDING');
      expect(enhancedFlagIds).toContain('ENHANCED_PROFILE');
      expect(enhancedFlagIds).toContain('ENHANCED_DASHBOARD');
      expect(enhancedFlagIds).toContain('ENHANCED_POLLS');
      expect(enhancedFlagIds).toContain('ENHANCED_VOTING');
    });

    it('should have future features properly categorized', () => {
      const futureFlags = featureFlagManager.getFlagsByCategory('future');
      const futureFlagIds = futureFlags.map(flag => flag.id);
      expect(futureFlagIds).toContain('AUTOMATED_POLLS');
      expect(futureFlagIds).toContain('ADVANCED_PRIVACY');
      expect(futureFlagIds).toContain('SOCIAL_SHARING');
    });
  });

  describe('Feature Flag Integration', () => {
    it('should support runtime flag changes', () => {
      // Start with disabled flag
      featureFlagManager.disable('TEST_FLAG');
      expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
      
      // Enable flag
      featureFlagManager.enable('TEST_FLAG');
      expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
      
      // Toggle flag
      featureFlagManager.toggle('TEST_FLAG');
      expect(featureFlagManager.get('TEST_FLAG')).toBe(false);
    });

    it('should maintain flag state across operations', () => {
      featureFlagManager.enable('TEST_FLAG');
      expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
      
      // Perform other operations
      featureFlagManager.get('WEBAUTHN');
      featureFlagManager.get('PWA');
      
      // Original flag should still be enabled
      expect(featureFlagManager.get('TEST_FLAG')).toBe(true);
    });
  });
});
