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

      // For development, use mock data
      const mockResult = MOCK_LOCATIONS[address];
      if (mockResult) {
        logger.info('📍 LocationService: Using mock data');
        this.cache.set(address, mockResult);
        return mockResult;
      }

      // Google Maps Geocoding: configure API key and enable in production
      // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
      // const data = await response.json();
      
      logger.info('❌ LocationService: Address not found in mock data');
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
      
      // Reverse geocoding: use Google Maps or alternative geocoding service
      // For now, return null as this requires Google Maps API
      logger.info('⚠️ LocationService: Coordinate search not implemented yet');
      return null;
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


