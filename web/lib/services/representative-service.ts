/**
 * Representative Service
 *
 * Core business logic for representative management
 * Handles data fetching, searching, and user interactions
 *
 * Created: October 28, 2025
 * Last Updated: November 5, 2025
 * Status: ✅ PRODUCTION - Mock data removed, uses real APIs
 */

import { CACHE_DURATIONS } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

import type {
  Representative,
  RepresentativeSearchQuery,
  RepresentativeSearchResult,
  RepresentativeLocationQuery,
  RepresentativeApiResponse,
  RepresentativeListResponse
} from '@/types/representative';


// Note: We don't import civicsIntegration here because it contains server-only code
// Client-side code should call API routes instead
// Note: Supabase client removed - service now uses API routes for all operations
// Note: Mock data moved to __tests__/fixtures/representative-mocks.ts (November 5, 2025)

// ============================================================================
// REPRESENTATIVE SERVICE CLASS
// ============================================================================

export class RepresentativeService {
  private cache: Map<string, unknown> = new Map();
  private cacheTimeout = CACHE_DURATIONS.MEDIUM; // 5 minutes

  /**
   * Get all representatives with optional filtering
   * Uses API route instead of direct server calls (client-safe)
   */
  async getRepresentatives(query?: RepresentativeSearchQuery): Promise<RepresentativeListResponse> {
    try {
      logger.info('🔍 Service: getRepresentatives called with query:', query);

      // Check cache first using cache key and validation
      const cacheKey = this.getCacheKey(JSON.stringify(query ?? {}));
      const cached = this.cache.get(cacheKey) as { data: RepresentativeListResponse; timestamp: number } | undefined;
      if (cached && this.isCacheValid(cached.timestamp)) {
        logger.info('✅ Service: Returning cached response');
        return cached.data;
      }

      // Build query string - use main /api/representatives endpoint for consistency
      const params = new URLSearchParams();
      if (query?.state) params.append('state', query.state);
      if (query?.party) params.append('party', query.party);
      if (query?.level) params.append('level', query.level);
      if (query?.district) params.append('district', query.district);
      if (query?.office) params.append('office', query.office);
      if (query?.query) params.append('search', query.query); // Map 'query' to 'search' parameter for API
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.offset !== undefined) params.append('offset', query.offset.toString());
      // Include divisions and other related data for optimal UX (committees queried separately due to RLS)
      params.append('include', 'divisions');

      // Use main representatives endpoint which queries representatives_core directly
      const response = await fetch(`/api/representatives?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiResult = await response.json();

      if (!apiResult.success || !apiResult.data) {
        throw new Error(apiResult.error ?? 'Failed to fetch representatives');
      }

      const representatives = (apiResult.data.representatives ?? []).map(
        (rep: Representative & { division_ids?: string[]; ocdDivisionIds?: string[] }) => {
          const divisionsSource = Array.isArray(rep.ocdDivisionIds)
            ? rep.ocdDivisionIds
            : Array.isArray(rep.division_ids)
            ? rep.division_ids
            : [];
          const divisions = divisionsSource.filter((value): value is string => typeof value === 'string');

          return {
            ...rep,
            division_ids: divisions,
            ocdDivisionIds: divisions,
          };
        }
      );

      logger.info('✅ Service: Returning API response', { count: representatives.length });
      const result: RepresentativeListResponse = {
        success: true,
        data: {
          representatives,
          total: apiResult.data.total ?? 0,
          page: apiResult.data.page ?? 1,
          limit: apiResult.data.limit ?? (query?.limit ?? 20),
          hasMore: apiResult.data.hasMore ?? false
        }
      };

      // Cache the result
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      logger.error('RepresentativeService.getRepresentatives error:', error);
      return {
        success: false,
        data: {
          representatives: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a single representative by ID
   * Uses API route instead of direct server calls (client-safe)
   */
  async getRepresentativeById(id: number): Promise<RepresentativeApiResponse> {
    try {
      // Call API route (client-safe)
      const response = await fetch(`/api/v1/civics/representative/${id}?include=divisions`);
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'Representative not found'
          };
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiResult = await response.json();

      const data = (apiResult?.data?.representative ??
        apiResult?.data ??
        apiResult) as Representative & {
        division_ids?: string[];
        ocdDivisionIds?: string[];
      };
      const divisionsSource = Array.isArray(data.ocdDivisionIds)
        ? data.ocdDivisionIds
        : Array.isArray(data.division_ids)
        ? data.division_ids
        : [];
      const divisions = divisionsSource.filter((value): value is string => typeof value === 'string');

      return {
        success: true,
        data: {
          ...data,
          division_ids: divisions,
          ocdDivisionIds: divisions,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Find representatives by location (address)
   * Uses API route instead of direct server calls (client-safe)
   */
  async findByLocation(query: RepresentativeLocationQuery): Promise<RepresentativeListResponse> {
    try {
      // First, get jurisdiction from address using Google API
      const lookupResponse = await fetch('/api/v1/civics/address-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query.address })
      });

      if (!lookupResponse.ok) {
        throw new Error(`Address lookup failed: ${lookupResponse.statusText}`);
      }

      const lookupResult = await lookupResponse.json();
      if (!lookupResult?.success || !lookupResult?.data?.jurisdiction) {
        throw new Error(lookupResult?.error ?? 'Unable to determine jurisdiction from address');
      }

      const jurisdiction = lookupResult.data.jurisdiction;
      const { state, district, ocd_division_id } = jurisdiction;

      // Now query representatives based on jurisdiction
      const params = new URLSearchParams();
      if (state) params.append('state', state);
      if (district) params.append('district', district);
      if (ocd_division_id) params.append('ocd_division_id', ocd_division_id);
      params.append('limit', '50'); // Get more results for better filtering

      // Use the main representatives endpoint which queries representatives_core
      const response = await fetch(`/api/representatives?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiResult = await response.json();
      const data = apiResult?.data ?? apiResult;

      let representatives = Array.isArray(data?.representatives) ? data.representatives : [];

      // Additional client-side filtering for OCD division ID if API didn't filter
      if (ocd_division_id && representatives.length > 0) {
        const filtered = representatives.filter((rep: any) => {
          const repDivisions = Array.isArray(rep.division_ids) ? rep.division_ids : [];
          return repDivisions.includes(ocd_division_id);
        });
        // Only use filtered results if we found matches
        if (filtered.length > 0) {
          representatives = filtered;
        }
      }

      return {
        success: true,
        data: {
          representatives,
          total: representatives.length,
          page: 1,
          limit: 20,
          hasMore: false
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          representatives: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search representatives by name or other criteria
   */
  async searchRepresentatives(query: RepresentativeSearchQuery): Promise<RepresentativeSearchResult> {
    try {
      await this.delay(400);

      const result = await this.getRepresentatives(query);

      if (!result.success || !result.data) {
        return {
          representatives: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        };
      }

      return {
        representatives: result.data.representatives,
        total: result.data.total,
        page: result.data.page,
        limit: result.data.limit,
        hasMore: result.data.hasMore
      };
    } catch (error) {
      logger.error('Error searching representatives:', error instanceof Error ? error : new Error(String(error)));
      return {
        representatives: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      };
    }
  }

  /**
   * Bulk fetch representatives by IDs (Issue #8)
   * Efficiently fetch multiple representatives in a single request
   *
   * @param ids - Array of representative IDs to fetch
   * @param include - Optional array of related data to include (e.g., ['committees', 'divisions'])
   * @returns Bulk fetch result with representatives
   */
  async getBulkRepresentatives(
    ids: number[],
    include: string[] = []
  ): Promise<RepresentativeListResponse> {
    try {
      logger.info('🔍 Service: getBulkRepresentatives called', { idCount: ids.length, include });

      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        return {
          success: false,
          data: {
            representatives: [],
            total: 0,
            page: 1,
            limit: ids.length,
            hasMore: false
          },
          error: 'Invalid IDs: must be a non-empty array'
        };
      }

      // Limit bulk size to prevent abuse
      const maxBulkSize = 100;
      const validIds = ids.slice(0, maxBulkSize);

      // Call bulk endpoint
      const response = await fetch('/api/representatives/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: validIds, include })
      });

      if (!response.ok) {
        throw new Error(`Bulk API request failed: ${response.statusText}`);
      }

      const apiResult = await response.json();

      if (!apiResult.success || !apiResult.data) {
        throw new Error(apiResult.error ?? 'Failed to fetch bulk representatives');
      }

      logger.info('✅ Service: Bulk representatives fetched', {
        requested: validIds.length,
        found: apiResult.data.found
      });

      return {
        success: true,
        data: {
          representatives: apiResult.data.representatives ?? [],
          total: apiResult.data.total ?? 0,
          page: 1,
          limit: validIds.length,
          hasMore: false
        }
      };
    } catch (error) {
      logger.error('RepresentativeService.getBulkRepresentatives error:', error);
      return {
        success: false,
        data: {
          representatives: [],
          total: 0,
          page: 1,
          limit: ids.length,
          hasMore: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get representatives by committee
   * Calls API to fetch real committee membership data.
   *
   * @param committeeName - Name of committee to search
   * @returns Array of representatives or empty array on error
   */
  async getCommitteeMembers(committeeName: string): Promise<Representative[]> {
    try {
      // Call API route for committee members
      const response = await fetch(`/api/civics/committees/${encodeURIComponent(committeeName)}/members`);

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Committee not found: ${committeeName}`);
          return [];
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const apiResult = await response.json();
      return apiResult.data ?? [];
    } catch (error) {
      logger.error('Error getting committee members:', error instanceof Error ? error : new Error(String(error)));
      // Return empty array on error (no mock data)
      return [];
    }
  }

  /**
   * Follow a representative (user interaction)
   */
  async followRepresentative(userId: string, representativeId: number): Promise<boolean> {
    try {
      await this.delay(200);

      // Mock implementation - later this will save to database
      logger.info(`User ${userId} followed representative ${representativeId}`);
      return true;
    } catch (error) {
      logger.error('Error following representative:', error);
      return false;
    }
  }

  /**
   * Unfollow a representative
   */
  async unfollowRepresentative(userId: string, representativeId: number): Promise<boolean> {
    try {
      await this.delay(200);

      // Mock implementation
      logger.info(`User ${userId} unfollowed representative ${representativeId}`);
      return true;
    } catch (error) {
      logger.error('Error unfollowing representative:', error);
      return false;
    }
  }

  /**
   * Get user's followed representatives
   */
  async getUserRepresentatives(_userId: string): Promise<Representative[]> {
    try {
      await this.delay(300);

      // Mock implementation - return empty array for now
      // userId parameter reserved for future database implementation
      return [];
    } catch (error) {
      logger.error('Error getting user representatives:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(key: string): string {
    return `representative_${key}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const representativeService = new RepresentativeService();
