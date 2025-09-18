/**
 * Privacy utilities for civics address lookup system
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 */

import crypto from 'crypto';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

// Privacy helpers - only available when feature flag is enabled
const PEPPER = process.env.PRIVACY_PEPPER || 'dev-pepper-consistent-for-testing-12345678901234567890';

/**
 * Normalize address string for consistent HMAC generation
 */
export function normalizeAddress(address: string): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Generate HMAC-SHA256 hash with secret pepper
 */
export function hmac256(data: string): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return crypto.createHmac('sha256', PEPPER).update(data).digest('hex');
}

/**
 * Generate HMAC for normalized address
 */
export function generateAddressHMAC(address: string): string {
  const normalized = normalizeAddress(address);
  return hmac256(normalized);
}

/**
 * Generate HMAC for place ID
 */
export function generatePlaceIdHMAC(placeId: string): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return hmac256(placeId);
}

/**
 * Generate HMAC for IP address
 */
export function generateIPHMAC(ip: string): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return hmac256(ip);
}

/**
 * Simple geohash encoder (base32) for 5/7 precision
 * Based on expert recommendations for privacy-safe location bucketing
 */
const GH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function geohash(lat: number, lng: number, precision: number): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;
  let hash = "", bit = 0, ch = 0, even = true;
  
  while (hash.length < precision) {
    if (even) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) { 
        ch |= 1 << (4 - bit); 
        minLng = mid; 
      } else { 
        maxLng = mid; 
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) { 
        ch |= 1 << (4 - bit); 
        minLat = mid; 
      } else { 
        maxLat = mid; 
      }
    }
    even = !even;
    if (bit < 4) { 
      bit++; 
    } else { 
      hash += GH_BASE32[ch]; 
      bit = 0; 
      ch = 0; 
    }
  }
  return hash;
}

/**
 * Generate geohash with tiered precision based on user access level
 */
export function generateGeohashWithTier(
  lat: number, 
  lng: number, 
  userTier: 'public' | 'authenticated' | 'internal'
): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  const precisionMap = {
    public: 5,        // ~24km x 24km area (free/public)
    authenticated: 6, // ~6km x 6km area (signed-in users)
    internal: 7       // ~153m x 153m area (internal/admin)
  };
  
  const precision = precisionMap[userTier];
  return geohash(lat, lng, precision);
}

/**
 * Cover bounding box with geohash prefixes for heatmap queries
 */
export function coverBBoxWithPrefixes(
  bbox: [number, number, number, number], 
  precision: 5 | 6 | 7
): string[] {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  const [minLat, minLng, maxLat, maxLng] = bbox;
  const prefixes = new Set<string>();
  const step = precision === 5 ? 0.5 : precision === 6 ? 0.2 : 0.05; // rough tiling
  
  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      prefixes.add(geohash(lat, lng, precision));
    }
  }
  
  return [...prefixes];
}

/**
 * Validate address input for DoS protection
 */
export function validateAddressInput(address: string): { valid: boolean; error?: string } {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return { valid: false, error: 'Feature disabled' };
  }
  
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  if (address.length > 500) {
    return { valid: false, error: 'Address too long' };
  }
  
  if (address.length < 5) {
    return { valid: false, error: 'Address too short' };
  }
  
  // Basic character validation (allow letters, numbers, spaces, common punctuation)
  if (!/^[a-zA-Z0-9\s\.,\-#]+$/.test(address)) {
    return { valid: false, error: 'Invalid characters in address' };
  }
  
  return { valid: true };
}

/**
 * Check if civics feature is enabled
 */
export function isCivicsEnabled(): boolean {
  return isFeatureEnabled('CIVICS_ADDRESS_LOOKUP');
}

/**
 * Privacy-safe request ID generator
 */
export function generateRequestId(): string {
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    throw new Error('Civics address lookup feature is disabled');
  }
  
  return crypto.randomUUID();
}
