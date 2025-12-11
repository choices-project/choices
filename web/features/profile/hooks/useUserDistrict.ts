/**
 * useUserDistrict Hook
 *
 * Returns the user's congressional district from their profile.
 * Used for district-based filtering and content personalization.
 *
 * Created: November 5, 2025
 */

'use client';

import { profileSelectors, useProfileStore } from '@/lib/stores/profileStore';

import type { ProfileLocation } from '@/types/profile';

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
  const location = useProfileStore(profileSelectors.location) as ProfileLocation | null;

  if (!location?.state) {
    return null;
  }

  const { state, district, county } = location;
  const fullDistrict = district ? `${state}-${district}` : undefined;

  const result: UserDistrict = { state };

  if (district) {
    result.district = district;
  }
  if (county) {
    result.county = county;
  }
  if (fullDistrict) {
    result.fullDistrict = fullDistrict;
  }

  return result;
}

/**
 * Get just the formatted district string (e.g., "CA-12")
 *
 * @returns Formatted district string or null
 */
export function useFormattedDistrict(): string | null {
  const districtData = useUserDistrict();
  return districtData?.fullDistrict ?? null;
}

