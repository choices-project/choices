/**
 * Representative Service
 * 
 * Core business logic for representative management
 * Handles data fetching, searching, and user interactions
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import type {
  Representative,
  RepresentativeSearchQuery,
  RepresentativeSearchResult,
  RepresentativeLocationQuery,
  RepresentativeApiResponse,
  RepresentativeListResponse,
  UserRepresentative,
  RepresentativeSubscription
} from '@/types/representative';

import { createClient } from '@supabase/supabase-js';
import { civicsIntegration } from './civics-integration';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc'
);

// ============================================================================
// MOCK DATA (for development before real data is ready)
// ============================================================================

const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 1,
    name: "Alexandria Ocasio-Cortez",
    party: "Democratic",
    office: "Representative",
    level: "federal",
    state: "NY",
    district: "14",
    primary_email: "aoc@mail.house.gov",
    primary_phone: "(202) 225-3965",
    primary_website: "https://ocasio-cortez.house.gov",
    twitter_handle: "AOC",
    facebook_url: "https://facebook.com/AlexandriaOcasioCortez",
    instagram_handle: "aoc",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Alexandria_Ocasio-Cortez_Official_Portrait.jpg/330px-Alexandria_Ocasio-Cortez_Official_Portrait.jpg",
    data_quality_score: 95,
    verification_status: "verified",
    data_sources: ["congressGov", "googleCivic", "fec"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z",
    committees: [
      {
        id: 1,
        representative_id: 1,
        committee_name: "Financial Services",
        role: "member",
        is_current: true,
        created_at: "2025-10-28T00:00:00Z",
        updated_at: "2025-10-28T00:00:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "Ted Cruz",
    party: "Republican",
    office: "Senator",
    level: "federal",
    state: "TX",
    primary_email: "ted.cruz@senate.gov",
    primary_phone: "(202) 224-5922",
    primary_website: "https://www.cruz.senate.gov",
    twitter_handle: "tedcruz",
    facebook_url: "https://facebook.com/SenatorTedCruz",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Ted_Cruz%2C_Official_Portrait%2C_113th_Congress.jpg/330px-Ted_Cruz%2C_Official_Portrait%2C_113th_Congress.jpg",
    data_quality_score: 92,
    verification_status: "verified",
    data_sources: ["congressGov", "googleCivic", "fec"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z",
    committees: [
      {
        id: 2,
        representative_id: 2,
        committee_name: "Judiciary",
        role: "member",
        is_current: true,
        created_at: "2025-10-28T00:00:00Z",
        updated_at: "2025-10-28T00:00:00Z"
      }
    ]
  },
  {
    id: 3,
    name: "Gavin Newsom",
    party: "Democratic",
    office: "Governor",
    level: "state",
    state: "CA",
    primary_email: "governor@ca.gov",
    primary_phone: "(916) 445-2841",
    primary_website: "https://www.gov.ca.gov",
    twitter_handle: "GavinNewsom",
    facebook_url: "https://facebook.com/GavinNewsom",
    instagram_handle: "gavinnewsom",
    primary_photo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gavin_Newsom_2021.jpg/330px-Gavin_Newsom_2021.jpg",
    data_quality_score: 98,
    verification_status: "verified",
    data_sources: ["googleCivic", "openStatesApi"],
    created_at: "2025-10-28T00:00:00Z",
    updated_at: "2025-10-28T00:00:00Z",
    last_verified: "2025-10-28T00:00:00Z"
  }
];

// ============================================================================
// REPRESENTATIVE SERVICE CLASS
// ============================================================================

export class RepresentativeService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all representatives with optional filtering
   * Now uses real civics backend data instead of mock data
   */
  async getRepresentatives(query?: RepresentativeSearchQuery): Promise<RepresentativeListResponse> {
    try {
      console.log('🔍 Service: getRepresentatives called with query:', query);
      
      // Use civics integration for real data
      const result = await civicsIntegration.getRepresentatives(query);
      
      console.log('✅ Service: Returning civics integration response');
      return {
        success: true,
        data: {
          representatives: result.representatives,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
        }
      };
    } catch (error) {
      console.error('RepresentativeService.getRepresentatives error:', error);
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
   * Now uses civics integration for real data with committee information
   */
  async getRepresentativeById(id: number): Promise<RepresentativeApiResponse> {
    try {
      const representative = await civicsIntegration.getRepresentativeById(id);
      
      if (!representative) {
        return {
          success: false,
          error: 'Representative not found'
        };
      }

      return {
        success: true,
        data: representative
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
   * Now uses civics integration for real location-based data
   */
  async findByLocation(query: RepresentativeLocationQuery): Promise<RepresentativeListResponse> {
    try {
      const result = await civicsIntegration.findByLocation(query.address);
      
      return {
        success: true,
        data: {
          representatives: result.representatives,
          total: result.total,
          page: result.page,
          limit: result.limit,
          hasMore: result.hasMore
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
   */
  async getCommitteeMembers(committeeName: string): Promise<Representative[]> {
    try {
      await this.delay(300);

      const representatives = MOCK_REPRESENTATIVES.filter(rep => 
        rep.committees?.some(committee => 
          committee.committee_name.toLowerCase().includes(committeeName.toLowerCase())
        )
      );

      return representatives;
    } catch (error) {
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
      console.log(`User ${userId} followed representative ${representativeId}`);
      return true;
    } catch (error) {
      console.error('Error following representative:', error);
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
      console.log(`User ${userId} unfollowed representative ${representativeId}`);
      return true;
    } catch (error) {
      console.error('Error unfollowing representative:', error);
      return false;
    }
  }

  /**
   * Get user's followed representatives
   */
  async getUserRepresentatives(userId: string): Promise<Representative[]> {
    try {
      await this.delay(300);
      
      // Mock implementation - return empty array for now
      return [];
    } catch (error) {
      console.error('Error getting user representatives:', error);
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
