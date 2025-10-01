/**
 * Location Resolver Tests
 * 
 * Tests for the browser location capture and jurisdiction resolution system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { resolveJurisdictions } from '@/lib/privacy/location-resolver';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Location Resolver', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveJurisdictions', () => {
    it('should resolve coordinates to jurisdictions', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          location: {
            lat: 37.7749,
            lon: -122.4194,
            accuracy: 10,
            precision: 'exact',
            provider: 'browser',
            jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
            primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
            jurisdictionName: 'Oakland',
            aliasConfidence: 0.95,
            storedAt: '2025-01-27T10:00:00Z',
            consentVersion: 1
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await resolveJurisdictions({
        coords: {
          lat: 37.7749,
          lon: -122.4194,
          accuracy: 10
        }
      });

      expect(result).toEqual({
        jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
        primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
        jurisdictionName: 'Oakland',
        lat: 37.7749,
        lon: -122.4194,
        accuracy: 10,
        precision: 'exact',
        provider: 'browser',
        aliasConfidence: 0.95,
        storedAt: '2025-01-27T10:00:00Z'
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          coords: {
            lat: 37.7749,
            lon: -122.4194,
            accuracy: 10
          }
        })
      });
    });

    it('should resolve ZIP codes to jurisdictions', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          location: {
            lat: 37.7749,
            lon: -122.4194,
            accuracy: null,
            precision: 'zip',
            provider: 'manual',
            jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
            primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
            jurisdictionName: 'Oakland',
            aliasConfidence: 0.95,
            storedAt: '2025-01-27T10:00:00Z',
            consentVersion: 1
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await resolveJurisdictions({
        zipCode: '94601'
      });

      expect(result).toEqual({
        jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
        primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
        jurisdictionName: 'Oakland',
        lat: 37.7749,
        lon: -122.4194,
        accuracy: null,
        precision: 'zip',
        provider: 'manual',
        aliasConfidence: 0.95,
        storedAt: '2025-01-27T10:00:00Z'
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          error: 'Location not found'
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(resolveJurisdictions({
        coords: { lat: 0, lon: 0 }
      })).rejects.toThrow('Location not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(resolveJurisdictions({
        coords: { lat: 37.7749, lon: -122.4194 }
      })).rejects.toThrow('Unable to resolve location');
    });

    it('should validate input parameters', async () => {
      await expect(resolveJurisdictions({})).rejects.toThrow('Provide address, coordinates, or ZIP code');
    });
  });

  describe('isValidJurisdictionId', () => {
    it('should validate OCD division IDs', () => {
      const { isValidJurisdictionId } = await import('@/lib/privacy/location-resolver');
      
      expect(isValidJurisdictionId('ocd-division/country:us')).toBe(true);
      expect(isValidJurisdictionId('ocd-division/country:us/state:ca')).toBe(true);
      expect(isValidJurisdictionId('ocd-division/country:us/state:ca/place:oakland')).toBe(true);
      expect(isValidJurisdictionId('invalid-id')).toBe(false);
      expect(isValidJurisdictionId('')).toBe(false);
    });
  });

  describe('extractStateFromJurisdictionId', () => {
    it('should extract state codes from OCD IDs', () => {
      const { extractStateFromJurisdictionId } = await import('@/lib/privacy/location-resolver');
      
      expect(extractStateFromJurisdictionId('ocd-division/country:us/state:ca')).toBe('CA');
      expect(extractStateFromJurisdictionId('ocd-division/country:us/state:ny')).toBe('NY');
      expect(extractStateFromJurisdictionId('ocd-division/country:us')).toBe(null);
      expect(extractStateFromJurisdictionId('invalid-id')).toBe(null);
    });
  });
});
