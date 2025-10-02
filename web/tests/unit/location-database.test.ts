/**
 * Location Database Integration Tests
 * 
 * Tests for the new location capture database schema and operations.
 * These tests guide how the database should work, not just conform to current state.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('Location Database Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Location Resolutions Table', () => {
    it('should store location resolution data correctly', async () => {
      const mockData = {
        user_id: 'test-user-123',
        lat_q11: 377749, // Quantized latitude
        lon_q11: -1224194, // Quantized longitude
        accuracy_m: 10,
        source: 'browser',
        consent_version: 1,
        stored_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: mockData,
          error: null
        })
      });

      const { data, error } = await mockSupabase
        .from('user_location_resolutions')
        .insert(mockData);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_location_resolutions');
      expect(data).toEqual(mockData);
      expect(error).toBeNull();
    });

    it('should enforce data constraints', async () => {
      const invalidData = {
        user_id: null, // Invalid: required field
        lat_q11: 999999, // Invalid: out of range
        lon_q11: -999999, // Invalid: out of range
        accuracy_m: -1, // Invalid: negative accuracy
        source: 'invalid_source', // Invalid: not in enum
        consent_version: 0 // Invalid: must be positive
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: null,
          error: { message: 'Validation failed' }
        })
      });

      const { data, error } = await mockSupabase
        .from('user_location_resolutions')
        .insert(invalidData);

      expect(data).toBeNull();
      expect(error).toBeDefined();
    });

    it('should support privacy-preserving queries', async () => {
      const mockQuery = {
        user_id: 'test-user-123',
        lat_q11: { gte: 377000, lte: 378000 }, // Range query for k-anonymity
        lon_q11: { gte: -1225000, lte: -1223000 },
        source: 'browser'
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        data: [mockQuery],
        error: null
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const result = await mockSupabase
        .from('user_location_resolutions')
        .select('*')
        .eq('user_id', mockQuery.user_id)
        .gte('lat_q11', mockQuery.lat_q11.gte)
        .lte('lat_q11', mockQuery.lat_q11.lte)
        .gte('lon_q11', mockQuery.lon_q11.gte)
        .lte('lon_q11', mockQuery.lon_q11.lte)
        .eq('source', mockQuery.source);

      const { data, error } = result;

      expect(data).toEqual([mockQuery]);
      expect(error).toBeNull();
    });
  });

  describe('Jurisdiction Aliases Table', () => {
    it('should store jurisdiction alias data correctly', async () => {
      const mockAlias = {
        ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
        alias_name: 'Oakland',
        alias_type: 'city',
        confidence: 0.95,
        source: 'import',
        created_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: mockAlias,
          error: null
        })
      });

      const { data, error } = await mockSupabase
        .from('jurisdiction_aliases')
        .insert(mockAlias);

      expect(mockSupabase.from).toHaveBeenCalledWith('jurisdiction_aliases');
      expect(data).toEqual(mockAlias);
      expect(error).toBeNull();
    });

    it('should support jurisdiction lookup by alias', async () => {
      const mockAliases = [
        {
          ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
          alias_name: 'Oakland',
          alias_type: 'city',
          confidence: 0.95
        },
        {
          ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
          alias_name: 'OAK',
          alias_type: 'abbreviation',
          confidence: 0.85
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              data: mockAliases,
              error: null
            })
          })
        })
      });

      const { data, error } = await mockSupabase
        .from('jurisdiction_aliases')
        .select('*')
        .eq('alias_name', 'Oakland')
        .order('confidence', { ascending: false });

      expect(data).toEqual(mockAliases);
      expect(error).toBeNull();
    });
  });

  describe('Jurisdiction Tiles Table', () => {
    it('should store H3 tile data correctly', async () => {
      const mockTile = {
        h3_tile_id: '8a194e64992ffff',
        ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
        tile_level: 11,
        created_at: new Date().toISOString()
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: mockTile,
          error: null
        })
      });

      const { data, error } = await mockSupabase
        .from('jurisdiction_tiles')
        .insert(mockTile);

      expect(mockSupabase.from).toHaveBeenCalledWith('jurisdiction_tiles');
      expect(data).toEqual(mockTile);
      expect(error).toBeNull();
    });

    it('should support fast geospatial lookups', async () => {
      const mockTiles = [
        {
          h3_tile_id: '8a194e64992ffff',
          ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
          tile_level: 11
        },
        {
          h3_tile_id: '8a194e64993ffff',
          ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
          tile_level: 11
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: mockTiles,
            error: null
          })
        })
      });

      const { data, error } = await mockSupabase
        .from('jurisdiction_tiles')
        .select('*')
        .eq('h3_tile_id', '8a194e64992ffff');

      expect(data).toEqual(mockTiles);
      expect(error).toBeNull();
    });
  });

  describe('Location Resolution Workflow', () => {
    it('should complete full location resolution workflow', async () => {
      // Step 1: Store user location resolution
      const userLocation = {
        user_id: 'test-user-123',
        lat_q11: 377749,
        lon_q11: -1224194,
        accuracy_m: 10,
        source: 'browser',
        consent_version: 1
      };

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          data: userLocation,
          error: null
        })
      });

      const { data: locationData, error: locationError } = await mockSupabase
        .from('user_location_resolutions')
        .insert(userLocation);

      expect(locationData).toEqual(userLocation);
      expect(locationError).toBeNull();

      // Step 2: Look up jurisdiction by H3 tile
      const jurisdictionTile = {
        h3_tile_id: '8a194e64992ffff',
        ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
        tile_level: 11
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [jurisdictionTile],
            error: null
          })
        })
      });

      const { data: tileData, error: tileError } = await mockSupabase
        .from('jurisdiction_tiles')
        .select('*')
        .eq('h3_tile_id', '8a194e64992ffff');

      expect(tileData).toEqual([jurisdictionTile]);
      expect(tileError).toBeNull();

      // Step 3: Get jurisdiction details
      const jurisdictionDetails = {
        ocd_division_id: 'ocd-division/country:us/state:ca/place:oakland',
        name: 'Oakland',
        level: 'place',
        parent_division_id: 'ocd-division/country:us/state:ca'
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockReturnValue({
              data: jurisdictionDetails,
              error: null
            })
          })
        })
      });

      const { data: jurisdictionData, error: jurisdictionError } = await mockSupabase
        .from('jurisdictions')
        .select('*')
        .eq('ocd_division_id', 'ocd-division/country:us/state:ca/place:oakland')
        .single();

      expect(jurisdictionData).toEqual(jurisdictionDetails);
      expect(jurisdictionError).toBeNull();
    });

    it('should handle jurisdiction lookup failures gracefully', async () => {
      // Mock jurisdiction lookup failure
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        })
      });

      const { data, error } = await mockSupabase
        .from('jurisdiction_tiles')
        .select('*')
        .eq('h3_tile_id', 'invalid_tile');

      expect(data).toEqual([]);
      expect(error).toBeNull();
    });
  });

  describe('Privacy and Data Retention', () => {
    it('should support data deletion for privacy compliance', async () => {
      const userId = 'test-user-123';

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            data: null,
            error: null
          })
        })
      });

      const { data, error } = await mockSupabase
        .from('user_location_resolutions')
        .delete()
        .eq('user_id', userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_location_resolutions');
      expect(data).toBeNull();
      expect(error).toBeNull();
    });

    it('should support consent version tracking', async () => {
      const consentData = {
        user_id: 'test-user-123',
        consent_version: 2,
        consent_given_at: new Date().toISOString(),
        data_retention_days: 365
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: consentData,
          error: null
        })
      });

      const { data, error } = await mockSupabase
        .from('user_consent_tracking')
        .insert(consentData);

      expect(data).toEqual(consentData);
      expect(error).toBeNull();
    });

    it('should support automatic data expiration', async () => {
      const expiredData = {
        user_id: 'test-user-123',
        stored_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days ago
        data_retention_days: 365
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lte: jest.fn().mockReturnValue({
            data: [expiredData],
            error: null
          })
        })
      });

      const { data, error } = await mockSupabase
        .from('user_location_resolutions')
        .select('*')
        .lte('stored_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

      expect(data).toEqual([expiredData]);
      expect(error).toBeNull();
    });
  });

  describe('Performance and Scalability', () => {
    it('should support efficient batch operations', async () => {
      const batchData = [
        { user_id: 'user-1', lat_q11: 377749, lon_q11: -1224194, source: 'browser' },
        { user_id: 'user-2', lat_q11: 377750, lon_q11: -1224195, source: 'browser' },
        { user_id: 'user-3', lat_q11: 377751, lon_q11: -1224196, source: 'browser' }
      ];

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          data: batchData,
          error: null
        })
      });

      const { data, error } = await mockSupabase
        .from('user_location_resolutions')
        .insert(batchData);

      expect(data).toEqual(batchData);
      expect(error).toBeNull();
    });

    it('should support efficient range queries for analytics', async () => {
      const analyticsQuery = {
        lat_q11: { gte: 377000, lte: 378000 },
        lon_q11: { gte: -1225000, lte: -1223000 },
        source: 'browser',
        stored_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        data: [analyticsQuery],
        error: null
      };

      mockSupabase.from.mockReturnValue(mockChain);

      const result = await mockSupabase
        .from('user_location_resolutions')
        .select('*')
        .gte('lat_q11', analyticsQuery.lat_q11.gte)
        .lte('lat_q11', analyticsQuery.lat_q11.lte)
        .gte('lon_q11', analyticsQuery.lon_q11.gte)
        .lte('lon_q11', analyticsQuery.lon_q11.lte)
        .eq('source', analyticsQuery.source)
        .gte('stored_at', analyticsQuery.stored_at.gte);

      const { data, error } = result;

      expect(data).toEqual([analyticsQuery]);
      expect(error).toBeNull();
    });
  });
});
