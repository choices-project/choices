/**
 * useUserDistrict Hook
 * 
 * Returns the user's congressional district from their profile.
 * Used for district-based filtering and content personalization.
 * 
 * Created: November 5, 2025
 */

'use client';

import { useProfileStore } from '@/lib/stores/profileStore';

export type UserDistrict = {
  state?: string;
  district?: string;
  county?: string;
  fullDistrict?: string; // Formatted as "CA-12"
};

/**
 * Get user's district information from their profile
 * 
 * @returns User district data or null if not set
 * 
 * @example
 * const { fullDistrict, state, district } = useUserDistrict();
 * if (fullDistrict) {
 *   // Filter feeds by district
 *   setFilters({ district: fullDistrict });
 * }
 */
export function useUserDistrict(): UserDistrict | null {
  const profile = useProfileStore((state) => state.profile);

  if (!profile || !profile.demographics) {
    return null;
  }

  const demographics = typeof profile.demographics === 'object' && profile.demographics !== null
    ? profile.demographics as any
    : null;

  if (!demographics || !demographics.location) {
    return null;
  }

  const location = demographics.location;
  const state = location.state as string | undefined;
  const district = location.district as string | undefined;
  const county = location.county as string | undefined;

  if (!state) {
    return null;
  }

  // Format as "STATE-DISTRICT" (e.g., "CA-12")
  const fullDistrict = state && district ? `${state}-${district}` : undefined;

  return {
    state,
    district,
    county,
    fullDistrict
  };
}

/**
 * Get just the formatted district string (e.g., "CA-12")
 * 
 * @returns Formatted district string or null
 */
export function useFormattedDistrict(): string | null {
  const districtData = useUserDistrict();
  return districtData?.fullDistrict || null;
}

