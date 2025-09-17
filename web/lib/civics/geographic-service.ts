/**
 * Geographic Service
 * 
 * Service for geographic lookups and spatial data operations
 * Powers location-based candidate discovery and geographic electoral feeds
 */

import { createClient } from '@supabase/supabase-js';
import type {
  GeographicLookup
} from './types';

export interface DistrictInfo {
  district_number: string;
  ocd_division_id: string;
  census_cycle: number;
  congress_number: number;
  is_current: boolean;
}

export interface RedistrictingChange {
  id: string;
  state: string;
  district_type: string;
  old_district?: string;
  new_district?: string;
  census_cycle_from: number;
  census_cycle_to: number;
  change_type: 'split' | 'merge' | 'redraw' | 'eliminate' | 'create';
  change_description?: string;
  effective_date: string;
  created_at: string;
}

export interface GeographicSearchResult {
  ocd_division_id: string;
  confidence: number;
  source: 'zip' | 'latlon' | 'manual';
  metadata?: Record<string, any>;
}

export class GeographicService {
  private _supabase: any = null;

  private get supabase() {
    if (!this._supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      this._supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this._supabase;
  }

  /**
   * Get OCD Division ID from ZIP code
   */
  async getOcdFromZip(zipCode: string): Promise<GeographicSearchResult | null> {
    try {
      // Clean and validate ZIP code
      const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
      if (cleanZip.length !== 5) {
        throw new Error('Invalid ZIP code format');
      }

      const { data, error } = await this.supabase
        .from('zip_to_ocd')
        .select('ocd_division_id, confidence')
        .eq('zip5', cleanZip)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to lookup ZIP: ${error.message}`);
      }

      return {
        ocd_division_id: data.ocd_division_id,
        confidence: data.confidence,
        source: 'zip',
        metadata: { zip_code: cleanZip }
      };
    } catch (error) {
      throw new Error(`ZIP lookup failed: ${error}`);
    }
  }

  /**
   * Get OCD Division ID from latitude/longitude coordinates
   */
  async getOcdFromCoords(lat: number, lon: number): Promise<GeographicSearchResult | null> {
    try {
      // Validate coordinates
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new Error('Invalid coordinates');
      }

      const { data, error } = await this.supabase
        .from('latlon_to_ocd')
        .select('ocd_division_id, confidence')
        .eq('lat', lat)
        .eq('lon', lon)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No results found
        }
        throw new Error(`Failed to lookup coordinates: ${error.message}`);
      }

      return {
        ocd_division_id: data.ocd_division_id,
        confidence: data.confidence,
        source: 'latlon',
        metadata: { latitude: lat, longitude: lon }
      };
    } catch (error) {
      throw new Error(`Coordinate lookup failed: ${error}`);
    }
  }

  /**
   * Get all districts for a state
   */
  async getDistrictsForState(
    stateCode: string, 
    districtType: 'congressional' | 'state_house' | 'state_senate' | 'county' | 'city' = 'congressional'
  ): Promise<DistrictInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from('state_districts')
        .select('district_number, ocd_division_id, census_cycle, congress_number, is_current')
        .eq('state', stateCode.toUpperCase())
        .eq('district_type', districtType)
        .order('census_cycle', { ascending: false })
        .order('district_number');

      if (error) {
        throw new Error(`Failed to get districts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`District lookup failed: ${error}`);
    }
  }

  /**
   * Get redistricting history for a state
   */
  async getRedistrictingHistory(
    stateCode: string,
    districtType?: 'congressional' | 'state_house' | 'state_senate'
  ): Promise<RedistrictingChange[]> {
    try {
      let query = this.supabase
        .from('redistricting_history')
        .select('*')
        .eq('state', stateCode.toUpperCase())
        .order('effective_date', { ascending: false });

      if (districtType) {
        query = query.eq('district_type', districtType);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get redistricting history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Redistricting history lookup failed: ${error}`);
    }
  }

  /**
   * Validate an OCD Division ID
   */
  async validateOcdDivision(ocdId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('geographic_lookups')
        .select('ocd_division_id')
        .eq('ocd_division_id', ocdId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found
        }
        throw new Error(`Validation failed: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      throw new Error(`OCD validation failed: ${error}`);
    }
  }

  /**
   * Get geographic lookup information for an OCD Division ID
   */
  async getGeographicLookup(ocdId: string): Promise<GeographicLookup | null> {
    try {
      const { data, error } = await this.supabase
        .from('geographic_lookups')
        .select('*')
        .eq('ocd_division_id', ocdId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Lookup failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Geographic lookup failed: ${error}`);
    }
  }

  /**
   * Search for candidates by geographic location
   */
  async findCandidatesByLocation(
    location: { zip?: string; lat?: number; lon?: number },
    options: {
      level?: 'federal' | 'state' | 'local';
      office?: string;
      verified?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      let ocdDivisionId: string | null = null;

      // Determine OCD Division ID from location
      if (location.zip) {
        const zipResult = await this.getOcdFromZip(location.zip);
        ocdDivisionId = zipResult?.ocd_division_id || null;
      } else if (location.lat && location.lon) {
        const coordResult = await this.getOcdFromCoords(location.lat, location.lon);
        ocdDivisionId = coordResult?.ocd_division_id || null;
      }

      if (!ocdDivisionId) {
        throw new Error('Could not determine geographic location');
      }

      // Build query for candidates
      let query = this.supabase
        .from('candidates')
        .select('*')
        .eq('ocd_division_id', ocdDivisionId);

      if (options.level) {
        query = query.eq('level', options.level);
      }

      if (options.office) {
        query = query.eq('office', options.office);
      }

      if (options.verified !== undefined) {
        query = query.eq('verified', options.verified);
      }

      const { data, error } = await query.order('quality_score', { ascending: false });

      if (error) {
        throw new Error(`Candidate search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Geographic candidate search failed: ${error}`);
    }
  }

  /**
   * Get elections for a geographic location
   */
  async findElectionsByLocation(
    location: { zip?: string; lat?: number; lon?: string },
    options: {
      type?: 'general' | 'primary' | 'special' | 'runoff';
      status?: 'upcoming' | 'active' | 'completed';
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<any[]> {
    try {
      let ocdDivisionId: string | null = null;

      // Determine OCD Division ID from location
      if (location.zip) {
        const zipResult = await this.getOcdFromZip(location.zip);
        ocdDivisionId = zipResult?.ocd_division_id || null;
      } else if (location.lat && location.lon) {
        const coordResult = await this.getOcdFromCoords(parseFloat(location.lat.toString()), parseFloat(location.lon.toString()));
        ocdDivisionId = coordResult?.ocd_division_id || null;
      }

      if (!ocdDivisionId) {
        throw new Error('Could not determine geographic location');
      }

      // Build query for elections
      let query = this.supabase
        .from('elections')
        .select('*')
        .eq('ocd_division_id', ocdDivisionId);

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.dateRange) {
        query = query
          .gte('election_date', options.dateRange.start)
          .lte('election_date', options.dateRange.end);
      }

      const { data, error } = await query.order('election_date', { ascending: true });

      if (error) {
        throw new Error(`Election search failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Geographic election search failed: ${error}`);
    }
  }

  /**
   * Bulk import ZIP to OCD mappings
   */
  async importZipMappings(mappings: Array<{ zip5: string; ocd_division_id: string; confidence?: number }>): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('zip_to_ocd')
        .upsert(mappings.map(m => ({
          zip5: m.zip5,
          ocd_division_id: m.ocd_division_id,
          confidence: m.confidence || 0.8
        })), {
          onConflict: 'zip5'
        });

      if (error) {
        throw new Error(`Import failed: ${error.message}`);
      }

      return mappings.length;
    } catch (error) {
      throw new Error(`ZIP mapping import failed: ${error}`);
    }
  }

  /**
   * Bulk import lat/lon to OCD mappings
   */
  async importLatLonMappings(mappings: Array<{ lat: number; lon: number; ocd_division_id: string; confidence?: number }>): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('latlon_to_ocd')
        .upsert(mappings.map(m => ({
          lat: m.lat,
          lon: m.lon,
          ocd_division_id: m.ocd_division_id,
          confidence: m.confidence || 0.8
        })), {
          onConflict: 'lat,lon'
        });

      if (error) {
        throw new Error(`Import failed: ${error.message}`);
      }

      return mappings.length;
    } catch (error) {
      throw new Error(`Lat/Lon mapping import failed: ${error}`);
    }
  }

  /**
   * Get geographic system statistics
   */
  async getGeographicStats(): Promise<{
    total_zip_mappings: number;
    total_latlon_mappings: number;
    total_districts: number;
    total_redistricting_changes: number;
    coverage_by_state: Record<string, number>;
  }> {
    try {
      const [zipCount, latlonCount, districtsCount, redistrictingCount] = await Promise.all([
        this.supabase.from('zip_to_ocd').select('*', { count: 'exact', head: true }),
        this.supabase.from('latlon_to_ocd').select('*', { count: 'exact', head: true }),
        this.supabase.from('state_districts').select('*', { count: 'exact', head: true }),
        this.supabase.from('redistricting_history').select('*', { count: 'exact', head: true })
      ]);

      // Get coverage by state
      const { data: stateData } = await this.supabase
        .from('state_districts')
        .select('state')
        .eq('is_current', true);

      const coverageByState: Record<string, number> = {};
      stateData?.forEach((row: { state: string }) => {
        coverageByState[row.state] = (coverageByState[row.state] || 0) + 1;
      });

      return {
        total_zip_mappings: zipCount.count || 0,
        total_latlon_mappings: latlonCount.count || 0,
        total_districts: districtsCount.count || 0,
        total_redistricting_changes: redistrictingCount.count || 0,
        coverage_by_state: coverageByState
      };
    } catch (error) {
      throw new Error(`Geographic stats failed: ${error}`);
    }
  }
}

// Export singleton instance
export const geographicService = new GeographicService();
