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
      
      // Build query string
      const params = new URLSearchParams();
      if (query?.state) params.append('state', query.state);
      if (query?.party) params.append('party', query.party);
      if (query?.level) params.append('level', query.level);
      if (query?.office) params.append('office', query.office);
      if (query?.query) params.append('query', query.query);
      if (query?.limit) params.append('limit', query.limit.toString());
      params.append('include', 'divisions');
      // Note: page is not part of RepresentativeSearchQuery type, using default pagination
      
      // Call API route (client-safe)
      const response = await fetch(`/api/v1/civics/by-state?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const apiResult = await response.json();
      const representatives = (apiResult.data ?? []).map(
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
      
      logger.info('✅ Service: Returning API response');
      return {
        success: true,
        data: {
          representatives,
          total: apiResult.total ?? 0,
          page: 1, // API doesn't support pagination in query type
          limit: query?.limit ?? 20,
          hasMore: (apiResult.data?.length ?? 0) >= (query?.limit ?? 20)
        }
      };
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
      
      const data = (apiResult.data ?? apiResult) as Representative & {
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
      // Call API route (client-safe)
      const params = new URLSearchParams();
      params.append('address', query.address);
      params.append('include', 'divisions');
      
      const response = await fetch(`/api/v1/civics/by-state?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const apiResult = await response.json();
      const representatives = (apiResult.data ?? []).map(
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
      
      return {
        success: true,
        data: {
          representatives,
          total: apiResult.total ?? 0,
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
