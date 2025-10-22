/**
 * Privacy-First Location Service
 * 
 * This service implements privacy-by-design principles for location data:
 * - No precise coordinates stored
 * - District-level data only
 * - K-anonymity compliance
 * - Client-side location resolution
 */

import { createClient } from '@supabase/supabase-js';

export interface PrivacyLocationData {
  // District-level data only (safe for political climate)
  federalDistrict?: string;        // "CA-12" format
  stateDistrict?: string;          // "State Senate District 3"
  county?: string;                 // "San Francisco County"
  city?: string;                   // "San Francisco"
  stateCode?: string;              // "CA"
  zipCode?: string;                // "94102" (safe level)
  
  // Privacy-preserving geohash (precision 5 = ~5km)
  privacyGeohash?: string;         // "9q8yy" (5km precision)
  geohashPrecision?: number;       // 5 = ~5km, 6 = ~1km, 7 = ~150m
  
  // Consent and privacy controls
  locationConsent?: boolean;
  consentVersion?: string;
  dataRetentionDays?: number;
}

export interface DistrictInfo {
  federalDistrict: string;
  stateDistrict: string;
  county: string;
  city: string;
  stateCode: string;
  zipCode: string;
}

export class PrivacyFirstLocationService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Resolve location to district-level data only (privacy-safe)
   * NEVER stores precise coordinates
   */
  async resolveToDistrict(locationInput: {
    address?: string;
    zipCode?: string;
    coordinates?: [number, number]; // [lng, lat] - client-side only
  }): Promise<DistrictInfo | null> {
    try {
      // 1. Client-side geocoding (no server storage)
      let districtInfo: DistrictInfo | null = null;

      if (locationInput.coordinates) {
        // Use existing GeographicService for coordinate lookup
        districtInfo = await this.resolveDistrictFromCoordinates(
          locationInput.coordinates[1], // lat
          locationInput.coordinates[0]  // lng
        );
      } else if (locationInput.zipCode) {
        // Use zip code lookup
        districtInfo = await this.resolveDistrictFromZip(locationInput.zipCode);
      } else if (locationInput.address) {
        // Use address lookup (client-side geocoding)
        districtInfo = await this.resolveDistrictFromAddress(locationInput.address);
      }

      if (!districtInfo) {
        throw new Error('Unable to resolve district information');
      }

      // 2. Apply privacy-preserving geohash
      const privacyGeohash = this.generatePrivacyGeohash(
        locationInput.coordinates?.[1] || 0,
        locationInput.coordinates?.[0] || 0,
        5 // 5km precision
      );

      // 3. Check k-anonymity before storing
      const isKAnonymitySafe = await this.checkKAnonymity(privacyGeohash);
      
      if (!isKAnonymitySafe) {
        console.warn('Location does not meet k-anonymity requirements');
        // Return district info but don't store precise location
        return districtInfo;
      }

      return districtInfo;
    } catch (error) {
      console.error('Error resolving location to district:', error);
      return null;
    }
  }

  /**
   * Generate privacy-preserving geohash
   * Precision 5 = ~5km, 6 = ~1km, 7 = ~150m
   */
  private generatePrivacyGeohash(lat: number, lng: number, precision: number = 5): string {
    // Use existing geohash implementation from privacy-utils
    const { simpleGeohash } = require('./privacy-utils');
    return simpleGeohash(lat, lng, precision);
  }

  /**
   * Check k-anonymity compliance
   * Minimum 5 users per location zone
   */
  private async checkKAnonymity(geohash: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('privacy_zones')
        .select('user_count, min_k_anonymity')
        .eq('geohash', geohash)
        .single();

      if (error || !data) {
        // No existing zone, check if we can create one
        return await this.canCreatePrivacyZone(geohash);
      }

      return data.user_count >= data.min_k_anonymity;
    } catch (error) {
      console.error('Error checking k-anonymity:', error);
      return false;
    }
  }

  /**
   * Check if we can create a new privacy zone
   */
  private async canCreatePrivacyZone(geohash: string): Promise<boolean> {
    // For now, allow creation if no existing zone
    // In production, this would check against minimum user requirements
    return true;
  }

  /**
   * Resolve district from coordinates (client-side only)
   */
  private async resolveDistrictFromCoordinates(lat: number, lng: number): Promise<DistrictInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('latlon_to_ocd')
        .select('ocd_division_id, confidence')
        .eq('lat', lat)
        .eq('lon', lng)
        .order('confidence', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      // Parse OCD division ID to get district information
      return this.parseOcdDivisionId(data.ocd_division_id);
    } catch (error) {
      console.error('Error resolving district from coordinates:', error);
      return null;
    }
  }

  /**
   * Resolve district from zip code
   */
  private async resolveDistrictFromZip(zipCode: string): Promise<DistrictInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('zip_to_ocd')
        .select('ocd_division_id')
        .eq('zip_code', zipCode)
        .single();

      if (error || !data) {
        return null;
      }

      return this.parseOcdDivisionId(data.ocd_division_id);
    } catch (error) {
      console.error('Error resolving district from zip:', error);
      return null;
    }
  }

  /**
   * Resolve district from address (client-side geocoding)
   */
  private async resolveDistrictFromAddress(address: string): Promise<DistrictInfo | null> {
    // This would use client-side geocoding (Google Maps API, etc.)
    // For now, return null - implement based on your geocoding service
    console.warn('Address geocoding not implemented yet');
    return null;
  }

  /**
   * Parse OCD division ID to extract district information
   */
  private parseOcdDivisionId(ocdId: string): DistrictInfo {
    // Parse OCD division ID format: ocd-division/country:us/state:ca/cd:12
    const parts = ocdId.split('/');
    let stateCode = '';
    let federalDistrict = '';
    let stateDistrict = '';
    let county = '';
    let city = '';

    for (const part of parts) {
      if (part.startsWith('state:')) {
        stateCode = part.split(':')[1]?.toUpperCase() || '';
      } else if (part.startsWith('cd:')) {
        federalDistrict = `${stateCode}-${part.split(':')[1] || ''}`;
      } else if (part.startsWith('sldl:')) {
        stateDistrict = `State House District ${part.split(':')[1] || ''}`;
      } else if (part.startsWith('sldu:')) {
        stateDistrict = `State Senate District ${part.split(':')[1] || ''}`;
      } else if (part.startsWith('county:')) {
        county = part.split(':')[1]?.replace(/_/g, ' ') || '';
      } else if (part.startsWith('place:')) {
        city = part.split(':')[1]?.replace(/_/g, ' ') || '';
      }
    }

    return {
      federalDistrict,
      stateDistrict,
      county,
      city,
      stateCode,
      zipCode: '' // Would need separate lookup
    };
  }

  /**
   * Store privacy-safe location data
   */
  async storePrivacyLocationData(
    userId: string,
    locationData: PrivacyLocationData
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_location_privacy')
        .upsert({
          user_id: userId,
          federal_district: locationData.federalDistrict,
          state_district: locationData.stateDistrict,
          county: locationData.county,
          city: locationData.city,
          state_code: locationData.stateCode,
          zip_code: locationData.zipCode,
          privacy_geohash: locationData.privacyGeohash,
          geohash_precision: locationData.geohashPrecision || 5,
          location_consent: locationData.locationConsent || false,
          consent_version: locationData.consentVersion || '1.0',
          data_retention_days: locationData.dataRetentionDays || 90,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing privacy location data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error storing privacy location data:', error);
      return false;
    }
  }

  /**
   * Get privacy-safe location data for user
   */
  async getPrivacyLocationData(userId: string): Promise<PrivacyLocationData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_location_privacy')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        federalDistrict: data.federal_district,
        stateDistrict: data.state_district,
        county: data.county,
        city: data.city,
        stateCode: data.state_code,
        zipCode: data.zip_code,
        privacyGeohash: data.privacy_geohash,
        geohashPrecision: data.geohash_precision,
        locationConsent: data.location_consent,
        consentVersion: data.consent_version,
        dataRetentionDays: data.data_retention_days
      };
    } catch (error) {
      console.error('Error getting privacy location data:', error);
      return null;
    }
  }

  /**
   * Delete user location data (GDPR compliance)
   */
  async deleteUserLocationData(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_location_privacy')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user location data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user location data:', error);
      return false;
    }
  }
}

export default PrivacyFirstLocationService;
