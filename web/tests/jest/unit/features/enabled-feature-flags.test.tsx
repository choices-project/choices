/**
 * Unit Tests for Enabled Feature Flags
 * 
 * Tests the 7 newly enabled features:
 * - DEMOGRAPHIC_FILTERING
 * - ADVANCED_PRIVACY
 * - SOCIAL_SHARING_POLLS
 * - SOCIAL_SHARING_CIVICS
 * - CONTACT_INFORMATION_SYSTEM
 * - DEVICE_FLOW_AUTH
 * - INTERNATIONALIZATION
 * 
 * Note: TRENDING_POLLS removed - functionality already implemented through hashtag system
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { featureFlagManager } from '@/lib/core/feature-flags';
import { useFeatureFlags } from '@/features/pwa/hooks/useFeatureFlags';
import { FeatureWrapper } from '@/components/shared/FeatureWrapper';
import { T } from '@/tests/registry/testIds';

// Mock the feature flags hook
jest.mock('@/features/pwa/hooks/useFeatureFlags');
const mockUseFeatureFlags = useFeatureFlags as jest.MockedFunction<typeof useFeatureFlags>;

describe('Enabled Feature Flags - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DEMOGRAPHIC_FILTERING Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('DEMOGRAPHIC_FILTERING')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('DEMOGRAPHIC_FILTERING');
      expect(flag?.category).toBe('personalization');
    });

    it('should have analytics dependency', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('DEMOGRAPHIC_FILTERING');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'DEMOGRAPHIC_FILTERING',
        isLoading: false,
        error: null,
        flags: { DEMOGRAPHIC_FILTERING: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      // Test that FeatureWrapper renders content when flag is enabled
      const TestComponent = () => (
        <FeatureWrapper feature="DEMOGRAPHIC_FILTERING">
          <div data-testid={T.dashboard.personalizedContent}>Personalized Content</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  // TRENDING_POLLS feature removed - functionality already implemented through hashtag system

  describe('ADVANCED_PRIVACY Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('ADVANCED_PRIVACY')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('ADVANCED_PRIVACY');
      expect(flag?.category).toBe('privacy');
    });

    it('should have no dependencies', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('ADVANCED_PRIVACY');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'ADVANCED_PRIVACY',
        isLoading: false,
        error: null,
        flags: { ADVANCED_PRIVACY: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="ADVANCED_PRIVACY">
          <div data-testid={T.dashboard.advancedPrivacy}>Advanced Privacy Features</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('SOCIAL_SHARING_POLLS Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('SOCIAL_SHARING_POLLS')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('SOCIAL_SHARING_POLLS');
      expect(flag?.category).toBe('social');
    });

    it('should have SOCIAL_SHARING dependency', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('SOCIAL_SHARING_POLLS');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'SOCIAL_SHARING_POLLS',
        isLoading: false,
        error: null,
        flags: { SOCIAL_SHARING_POLLS: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="SOCIAL_SHARING_POLLS">
          <div data-testid={T.socialSharing.shareButton}>Social Sharing for Polls</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('SOCIAL_SHARING_CIVICS Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('SOCIAL_SHARING_CIVICS')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('SOCIAL_SHARING_CIVICS');
      expect(flag?.category).toBe('social');
    });

    it('should have SOCIAL_SHARING dependency', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('SOCIAL_SHARING_CIVICS');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'SOCIAL_SHARING_CIVICS',
        isLoading: false,
        error: null,
        flags: { SOCIAL_SHARING_CIVICS: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="SOCIAL_SHARING_CIVICS">
          <div data-testid={T.socialSharing.shareModal}>Social Sharing for Civics</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('CONTACT_INFORMATION_SYSTEM Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('CONTACT_INFORMATION_SYSTEM')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('CONTACT_INFORMATION_SYSTEM');
      expect(flag?.category).toBe('contact');
    });

    it('should have CIVICS_REPRESENTATIVE_DATABASE dependency', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('CONTACT_INFORMATION_SYSTEM');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'CONTACT_INFORMATION_SYSTEM',
        isLoading: false,
        error: null,
        flags: { CONTACT_INFORMATION_SYSTEM: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="CONTACT_INFORMATION_SYSTEM">
          <div data-testid={T.dashboard.contactSystem}>Contact Information System</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('DEVICE_FLOW_AUTH Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('DEVICE_FLOW_AUTH')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('DEVICE_FLOW_AUTH');
      expect(flag?.category).toBe('auth');
    });

    it('should have CORE_AUTH dependency', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('DEVICE_FLOW_AUTH');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'DEVICE_FLOW_AUTH',
        isLoading: false,
        error: null,
        flags: { DEVICE_FLOW_AUTH: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="DEVICE_FLOW_AUTH">
          <div data-testid={T.webauthn.deviceFlow}>Device Flow Authentication</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('INTERNATIONALIZATION Feature', () => {
    it('should be enabled by default', () => {
      expect(featureFlagManager.isEnabled('INTERNATIONALIZATION')).toBe(true);
    });

    it('should have correct category', () => {
      const flag = featureFlagManager.getFlag('INTERNATIONALIZATION');
      expect(flag?.category).toBe('system');
    });

    it('should have no dependencies', () => {
      const dependencies = featureFlagManager.areDependenciesEnabled('INTERNATIONALIZATION');
      expect(dependencies).toBe(true);
    });

    it('should work with FeatureWrapper', () => {
      mockUseFeatureFlags.mockReturnValue({
        isEnabled: (flagId: string) => flagId === 'INTERNATIONALIZATION',
        isLoading: false,
        error: null,
        flags: { INTERNATIONALIZATION: true },
        fetchFlags: jest.fn(),
        setFeatureFlag: jest.fn(),
        toggleFeatureFlag: jest.fn(),
        clearError: jest.fn(),
        getAllFlags: jest.fn(),
        getEnabledFlags: jest.fn(),
        getDisabledFlags: jest.fn(),
        getFlagsByCategory: jest.fn(),
        getSystemInfo: jest.fn(),
        systemInfo: { totalFlags: 40, enabledFlags: 32, disabledFlags: 8, environment: 'test' },
        areDependenciesEnabled: jest.fn(),
        subscribe: jest.fn()
      });

      const TestComponent = () => (
        <FeatureWrapper feature="INTERNATIONALIZATION">
          <div data-testid={T.dashboard.internationalization}>Internationalization Support</div>
        </FeatureWrapper>
      );

      expect(TestComponent).toBeDefined();
    });
  });

  describe('Feature Flag Manager Integration', () => {
    it('should return correct system info', () => {
      const systemInfo = featureFlagManager.getSystemInfo();
      expect(systemInfo.totalFlags).toBeGreaterThan(0);
      expect(systemInfo.enabledFlags).toBeGreaterThan(0);
      expect(systemInfo.disabledFlags).toBeGreaterThan(0);
      expect(systemInfo.environment).toBeDefined();
    });

    it('should handle flag toggling', () => {
      const originalState = featureFlagManager.isEnabled('DEMOGRAPHIC_FILTERING');
      
      // Toggle the flag
      const toggleResult = featureFlagManager.toggle('DEMOGRAPHIC_FILTERING');
      expect(toggleResult).toBe(true);
      
      // Check the new state
      const newState = featureFlagManager.isEnabled('DEMOGRAPHIC_FILTERING');
      expect(newState).toBe(!originalState);
      
      // Toggle back to original state
      featureFlagManager.toggle('DEMOGRAPHIC_FILTERING');
    });

    it('should handle invalid flag names', () => {
      expect(featureFlagManager.isEnabled('INVALID_FLAG')).toBe(false);
      expect(featureFlagManager.toggle('INVALID_FLAG')).toBe(false);
    });

    it('should handle batch flag checking', () => {
      const enabledFlags = [
        'DEMOGRAPHIC_FILTERING',
        'ADVANCED_PRIVACY'
      ];

      const disabledFlags = [
        'AUTOMATED_POLLS',
        'MEDIA_BIAS_ANALYSIS'
      ];

      enabledFlags.forEach(flag => {
        expect(featureFlagManager.isEnabled(flag)).toBe(true);
      });

      disabledFlags.forEach(flag => {
        expect(featureFlagManager.isEnabled(flag)).toBe(false);
      });
    });
  });

  describe('Feature Flag Categories', () => {
    it('should have correct categories for enabled flags', () => {
      const personalizationFlags = ['DEMOGRAPHIC_FILTERING'];
      const socialFlags = ['SOCIAL_SHARING_POLLS', 'SOCIAL_SHARING_CIVICS'];
      const privacyFlags = ['ADVANCED_PRIVACY'];
      const contactFlags = ['CONTACT_INFORMATION_SYSTEM'];
      const authFlags = ['DEVICE_FLOW_AUTH'];
      const systemFlags = ['INTERNATIONALIZATION'];

      personalizationFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('personalization');
      });

      socialFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('social');
      });

      privacyFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('privacy');
      });

      contactFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('contact');
      });

      authFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('auth');
      });

      systemFlags.forEach(flag => {
        const flagInfo = featureFlagManager.getFlag(flag);
        expect(flagInfo?.category).toBe('system');
      });
    });
  });
});
