/**
 * Location Service
 * 
 * Handles geographic search and location-based representative discovery
 * Integrates with Google Maps API for geocoding and location services
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import logger from '@/lib/utils/logger';
import type { Representative } from '@/types/representative';

export type LocationQuery = {
  address: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
}

export type LocationResult = {
  address: string;
  latitude: number;
  longitude: number;
  state: string;
  district?: string;
  city?: string;
  county?: string;
}

export type RepresentativesByLocation = {
  location: LocationResult;
  representatives: Representative[];
  federal: Representative[];
  state: Representative[];
  local: Representative[];
}

// Mock data for development (replace with real Google Maps API)
const MOCK_LOCATIONS: Record<string, LocationResult> = {
  '1600 Pennsylvania Avenue NW, Washington, DC': {
    address: '1600 Pennsylvania Avenue NW, Washington, DC',
    latitude: 38.8977,
    longitude: -77.0365,
    state: 'DC',
    city: 'Washington',
    district: '0'
  },
  '123 Main St, San Francisco, CA': {
    address: '123 Main St, San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    state: 'CA',
    city: 'San Francisco',
    district: '11'
  },
  '456 Oak Ave, Austin, TX': {
    address: '456 Oak Ave, Austin, TX',
    latitude: 30.2672,
    longitude: -97.7431,
    state: 'TX',
    city: 'Austin',
    district: '10'
  }
};

export class LocationService {
  private cache: Map<string, LocationResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Geocode an address to get coordinates and location details
   */
  async geocodeAddress(address: string): Promise<LocationResult | null> {
    try {
      logger.info('🌍 LocationService: Geocoding address:', address);
      
      // Check cache first
      const cached = this.cache.get(address);
      if (cached) {
        logger.info('📍 LocationService: Using cached result');
        return cached;
      }

      // Prefer Google Maps Geocoding API if available
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (apiKey) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
          logger.error('❌ LocationService: Geocoding HTTP error', { status: response.status });
          return null;
        }
        const data = (await response.json()) as any;
        if (!data || data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
          logger.info('⚠️ LocationService: Geocoding returned no results', { status: data?.status });
          return null;
        }
        const result = data.results[0];
        const addressComponents: Array<{ long_name: string; short_name: string; types: string[] }> =
          result.address_components ?? [];
        const stateComp = addressComponents.find((c) => c.types.includes('administrative_area_level_1'));
        const districtComp = addressComponents.find((c) => c.types.includes('sublocality_level_1'));
        const cityComp = addressComponents.find((c) => c.types.includes('locality'));
        const countyComp = addressComponents.find((c) => c.types.includes('administrative_area_level_2'));
        const location: LocationResult = {
          address: result.formatted_address ?? address,
          latitude: result.geometry?.location?.lat ?? 0,
          longitude: result.geometry?.location?.lng ?? 0,
          state: stateComp?.short_name ?? '',
          ...(districtComp?.short_name ? { district: districtComp.short_name.replace(/\D+/g, '') } : {}),
          ...(cityComp?.long_name ? { city: cityComp.long_name } : {}),
          ...(countyComp?.long_name ? { county: countyComp.long_name } : {}),
        };
        this.cache.set(address, location);
        return location;
      }

      // Fallback: use mock data when no API key is configured
      const mockResult = MOCK_LOCATIONS[address];
      if (mockResult) {
        logger.info('📍 LocationService: Using mock data');
        this.cache.set(address, mockResult);
        return mockResult;
      }
      logger.info('❌ LocationService: Address not found and no API key configured');
      return null;
    } catch (error) {
      logger.error('❌ LocationService: Geocoding error:', error);
      return null;
    }
  }

  /**
   * Find representatives by location
   */
  async findRepresentativesByLocation(query: LocationQuery): Promise<RepresentativesByLocation | null> {
    try {
      logger.info('🔍 LocationService: Finding representatives for location:', query);
      
      // Geocode the address
      const location = await this.geocodeAddress(query.address);
      if (!location) {
        throw new Error('Could not geocode address');
      }

      // Fetch representatives from API
      const params = new URLSearchParams();
      params.append('state', location.state);
      if (location.district) {
        params.append('district', location.district);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/representatives?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch representatives');
      }

      const representatives = data.data.representatives || [];
      
      // Categorize representatives by level
      const federal = representatives.filter((rep: Representative) => rep.level === 'federal');
      const state = representatives.filter((rep: Representative) => rep.level === 'state');
      const local = representatives.filter((rep: Representative) => rep.level === 'local');

      const result: RepresentativesByLocation = {
        location,
        representatives,
        federal,
        state,
        local
      };

      logger.info('✅ LocationService: Found representatives:', {
        total: representatives.length,
        federal: federal.length,
        state: state.length,
        local: local.length
      });

      return result;
    } catch (error) {
      logger.error('❌ LocationService: Error finding representatives:', error);
      return null;
    }
  }

  /**
   * Get representatives by coordinates
   */
  async findRepresentativesByCoordinates(latitude: number, longitude: number, radius: number = 10): Promise<RepresentativesByLocation | null> {
    try {
      logger.info('📍 LocationService: Finding representatives by coordinates:', { latitude, longitude, radius });
      
      // Reverse geocoding: prefer Google Maps API if configured, fallback to mock/disabled
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (!apiKey) {
        logger.info('⚠️ LocationService: Reverse geocoding disabled (no API key configured)');
        return null;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
        `${latitude},${longitude}`
      )}&key=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        logger.error('❌ LocationService: Reverse geocoding HTTP error', { status: response.status });
        return null;
      }
      const data = (await response.json()) as any;
      if (!data || data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        logger.info('⚠️ LocationService: Reverse geocoding returned no results', { status: data?.status });
        return null;
      }

      const result = data.results[0];
      const addressComponents: Array<{ long_name: string; short_name: string; types: string[] }> =
        result.address_components ?? [];
      const stateComp = addressComponents.find((c) => c.types.includes('administrative_area_level_1'));
      const districtComp = addressComponents.find((c) => c.types.includes('sublocality_level_1'));
      const cityComp = addressComponents.find((c) => c.types.includes('locality'));
      const countyComp = addressComponents.find((c) => c.types.includes('administrative_area_level_2'));

      const location: LocationResult = {
        address: result.formatted_address ?? `${latitude}, ${longitude}`,
        latitude,
        longitude,
        state: stateComp?.short_name ?? '',
        ...(districtComp?.short_name ? { district: districtComp.short_name.replace(/\D+/g, '') } : {}),
        ...(cityComp?.long_name ? { city: cityComp.long_name } : {}),
        ...(countyComp?.long_name ? { county: countyComp.long_name } : {}),
      };

      // Fetch representatives using resolved location
      const params = new URLSearchParams();
      if (location.state) params.append('state', location.state);
      if (location.district) params.append('district', location.district);
      params.append('limit', '50');

      const repsResponse = await fetch(`/api/representatives?${params.toString()}`);
      const repsData = await repsResponse.json();
      if (!repsResponse.ok || !repsData?.success) {
        logger.error('❌ LocationService: Failed to fetch representatives for coordinates', {
          status: repsResponse.status,
        });
        return null;
      }

      const representatives = repsData.data.representatives || [];
      const federal = representatives.filter((rep: Representative) => rep.level === 'federal');
      const state = representatives.filter((rep: Representative) => rep.level === 'state');
      const local = representatives.filter((rep: Representative) => rep.level === 'local');

      const resultPayload: RepresentativesByLocation = {
        location,
        representatives,
        federal,
        state,
        local,
      };

      logger.info('✅ LocationService: Found representatives by coordinates', {
        total: representatives.length,
      });

      return resultPayload;
    } catch (error) {
      logger.error('❌ LocationService: Error finding representatives by coordinates:', error);
      return null;
    }
  }

  /**
   * Get state and district from address
   */
  async getStateAndDistrict(address: string): Promise<{ state: string; district?: string } | null> {
    const location = await this.geocodeAddress(address);
    if (!location) return null;

    const result: { state: string; district?: string } = {
      state: location.state
    };
    if (location.district) {
      result.district = location.district;
    }
    return result;
  }

  /**
   * Validate address format
   */
  validateAddress(address: string): boolean {
    if (!address || address.trim().length < 5) return false;
    
    // Basic validation - should contain at least a street number and name
    const hasNumber = /\d/.test(address);
    const hasStreet = /(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|place|pl)/i.test(address);
    
    return hasNumber && hasStreet;
  }

  /**
   * Format address for display
   */
  formatAddress(location: LocationResult): string {
    const parts = [location.address];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    
    return parts.join(', ');
  }
}

// Export singleton instance
export const locationService = new LocationService();


