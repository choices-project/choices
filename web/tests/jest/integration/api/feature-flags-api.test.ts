/**
 * Integration Tests for Feature Flags API
 * 
 * Tests the API endpoints for feature flag management:
 * - GET /api/feature-flags
 * - PATCH /api/feature-flags
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/feature-flags/route';

// Mock the feature flag manager
jest.mock('@/lib/core/feature-flags', () => ({
  featureFlagManager: {
    getAllFlags: jest.fn(),
    getEnabledFlags: jest.fn(),
    getDisabledFlags: jest.fn(),
    getSystemInfo: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    isEnabled: jest.fn()
  }
}));

import { featureFlagManager } from '@/lib/core/feature-flags';

const mockFeatureFlagManager = featureFlagManager as jest.Mocked<typeof featureFlagManager>;

describe('Feature Flags API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/feature-flags', () => {
    it('should return all feature flags with system info', async () => {
      // Mock the feature flag manager responses
      const mockFlags = new Map([
        ['DEMOGRAPHIC_FILTERING', { id: 'DEMOGRAPHIC_FILTERING', name: 'Demographic Filtering', enabled: true, category: 'personalization', description: 'Filter content based on demographics' }],
        ['ADVANCED_PRIVACY', { id: 'ADVANCED_PRIVACY', name: 'Advanced Privacy', enabled: true, category: 'privacy', description: 'Enhanced privacy controls' }]
      ]);

      const mockEnabledFlags = [
        { id: 'DEMOGRAPHIC_FILTERING', name: 'Demographic Filtering', enabled: true, category: 'personalization', description: 'Filter content based on demographics' },
        { id: 'ADVANCED_PRIVACY', name: 'Advanced Privacy', enabled: true, category: 'privacy', description: 'Enhanced privacy controls' }
      ];

      const mockDisabledFlags = [
        { id: 'AUTOMATED_POLLS', name: 'Automated Polls', enabled: false, category: 'future', description: 'Automatically generated polls' }
      ];

      const mockSystemInfo = {
        totalFlags: 40,
        enabledFlags: 32,
        disabledFlags: 8,
        environment: 'test',
        categories: {
          personalization: 2,
          privacy: 1,
          future: 1
        }
      };

      mockFeatureFlagManager.getAllFlags.mockReturnValue(mockFlags);
      mockFeatureFlagManager.getEnabledFlags.mockReturnValue(mockEnabledFlags);
      mockFeatureFlagManager.getDisabledFlags.mockReturnValue(mockDisabledFlags);
      mockFeatureFlagManager.getSystemInfo.mockReturnValue(mockSystemInfo);

      const request = new NextRequest('http://localhost:3000/api/feature-flags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.flags).toBeDefined();
      expect(data.enabledFlags).toBeDefined();
      expect(data.disabledFlags).toBeDefined();
      expect(data.systemInfo).toBeDefined();
      expect(data.timestamp).toBeDefined();

      expect(mockFeatureFlagManager.getAllFlags).toHaveBeenCalled();
      expect(mockFeatureFlagManager.getEnabledFlags).toHaveBeenCalled();
      expect(mockFeatureFlagManager.getDisabledFlags).toHaveBeenCalled();
      expect(mockFeatureFlagManager.getSystemInfo).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockFeatureFlagManager.getAllFlags.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/feature-flags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch feature flags');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('PATCH /api/feature-flags', () => {
    it('should enable a feature flag', async () => {
      mockFeatureFlagManager.enable.mockReturnValue(true);

      const requestBody = {
        flagId: 'DEMOGRAPHIC_FILTERING',
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Feature flag DEMOGRAPHIC_FILTERING updated to true');
      expect(data.flagId).toBe('DEMOGRAPHIC_FILTERING');
      expect(data.enabled).toBe(true);
      expect(data.timestamp).toBeDefined();

      expect(mockFeatureFlagManager.enable).toHaveBeenCalledWith('DEMOGRAPHIC_FILTERING');
    });

    it('should disable a feature flag', async () => {
      mockFeatureFlagManager.disable.mockReturnValue(true);

      const requestBody = {
        flagId: 'DEMOGRAPHIC_FILTERING',
        enabled: false
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Feature flag DEMOGRAPHIC_FILTERING updated to false');
      expect(data.flagId).toBe('DEMOGRAPHIC_FILTERING');
      expect(data.enabled).toBe(false);
      expect(data.timestamp).toBeDefined();

      expect(mockFeatureFlagManager.disable).toHaveBeenCalledWith('DEMOGRAPHIC_FILTERING');
    });

    it('should handle invalid request body', async () => {
      const requestBody = {
        flagId: 'DEMOGRAPHIC_FILTERING'
        // missing 'enabled' field
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body. Expected { flagId: string, enabled: boolean }');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle missing flagId', async () => {
      const requestBody = {
        enabled: true
        // missing 'flagId' field
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body. Expected { flagId: string, enabled: boolean }');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle invalid enabled type', async () => {
      const requestBody = {
        flagId: 'DEMOGRAPHIC_FILTERING',
        enabled: 'true' // should be boolean, not string
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request body. Expected { flagId: string, enabled: boolean }');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle flag update failure', async () => {
      mockFeatureFlagManager.enable.mockReturnValue(false);

      const requestBody = {
        flagId: 'INVALID_FLAG',
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update feature flag: INVALID_FLAG');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle manager errors', async () => {
      mockFeatureFlagManager.enable.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const requestBody = {
        flagId: 'DEMOGRAPHIC_FILTERING',
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update feature flag');
      expect(data.timestamp).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update feature flag');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Feature Flag Dependencies', () => {
    it('should handle flags with dependencies', async () => {
      // Test enabling a flag that has dependencies
      mockFeatureFlagManager.enable.mockReturnValue(true);

      const requestBody = {
        flagId: 'SOCIAL_SHARING_POLLS',
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFeatureFlagManager.enable).toHaveBeenCalledWith('SOCIAL_SHARING_POLLS');
    });

    it('should handle flags without dependencies', async () => {
      mockFeatureFlagManager.enable.mockReturnValue(true);

      const requestBody = {
        flagId: 'ADVANCED_PRIVACY',
        enabled: true
      };

      const request = new NextRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockFeatureFlagManager.enable).toHaveBeenCalledWith('ADVANCED_PRIVACY');
    });
  });

  describe('System Information', () => {
    it('should return comprehensive system info', async () => {
      const mockSystemInfo = {
        totalFlags: 40,
        enabledFlags: 32,
        disabledFlags: 8,
        environment: 'test',
        categories: {
          core: 7,
          enhanced: 3,
          civics: 7,
          future: 3,
          personalization: 2,
          privacy: 1,
          performance: 2,
          social: 6,
          system: 4,
          analytics: 1,
          admin: 1,
          contact: 1,
          testing: 1,
          auth: 1
        }
      };

      mockFeatureFlagManager.getSystemInfo.mockReturnValue(mockSystemInfo);

      const request = new NextRequest('http://localhost:3000/api/feature-flags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.systemInfo).toEqual(mockSystemInfo);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      mockFeatureFlagManager.getAllFlags.mockReturnValue(new Map());
      mockFeatureFlagManager.getEnabledFlags.mockReturnValue([]);
      mockFeatureFlagManager.getDisabledFlags.mockReturnValue([]);
      mockFeatureFlagManager.getSystemInfo.mockReturnValue({
        totalFlags: 40,
        enabledFlags: 32,
        disabledFlags: 8,
        environment: 'test',
        categories: {}
      });

      const requests = Array.from({ length: 10 }, () => 
        GET(new NextRequest('http://localhost:3000/api/feature-flags'))
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle large flag datasets', async () => {
      const largeFlagSet = new Map();
      for (let i = 0; i < 1000; i++) {
        largeFlagSet.set(`FLAG_${i}`, { id: `FLAG_${i}`, enabled: i % 2 === 0 });
      }

      mockFeatureFlagManager.getAllFlags.mockReturnValue(largeFlagSet);
      mockFeatureFlagManager.getEnabledFlags.mockReturnValue([]);
      mockFeatureFlagManager.getDisabledFlags.mockReturnValue([]);
      mockFeatureFlagManager.getSystemInfo.mockReturnValue({
        totalFlags: 1000,
        enabledFlags: 500,
        disabledFlags: 500,
        environment: 'test',
        categories: {}
      });

      const request = new NextRequest('http://localhost:3000/api/feature-flags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.flags).toBeDefined();
    });
  });
});
