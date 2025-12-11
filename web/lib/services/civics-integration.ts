/**
 * Civics Backend Integration Service
 *
 * Bridges the civics backend data with the web application
 * Handles data transformation, caching, and real-time updates
 *
 * Created: October 28, 2025
 * Status: ✅ PRODUCTION
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import logger from '@/lib/utils/logger'

import type {
Representative,
  RepresentativeSearchQuery,
  RepresentativeSearchResult,
  RepresentativeCommittee
} from '@/types/representative';

// Note: This service only queries Supabase - it does NOT call external APIs.
// All external API calls are handled by the backend service at /services/civics-backend.

export class CivicsIntegrationService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Get representatives from civics backend with full data integration
   */
  async getRepresentatives(query?: RepresentativeSearchQuery): Promise<RepresentativeSearchResult> {
    try {
      const cacheKey = `representatives_${JSON.stringify(query)}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      logger.info('🔍 CivicsIntegration: Fetching representatives with query:', query);

      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        throw new Error('Database connection not available');
      }

      // Build the main query
      let dbQuery = supabase
        .from('representatives_core')
        .select(`
          *,
          representative_photos(*),
          representative_contacts(*),
          representative_social_media(*),
          representative_activity(*)
        `)
        .eq('is_active', true)
        .not('name', 'ilike', '%test%'); // Exclude test data

      // Apply filters
      if (query?.state) {
        dbQuery = dbQuery.eq('state', query.state);
      }
      if (query?.party) {
        dbQuery = dbQuery.eq('party', query.party);
      }
      if (query?.level) {
        dbQuery = dbQuery.eq('level', query.level);
      }
      if (query?.office) {
        dbQuery = dbQuery.eq('office', query.office);
      }
      if (query?.query) {
        dbQuery = dbQuery.or(`name.ilike.%${query.query}%,office.ilike.%${query.query}%`);
      }

      // Apply pagination
      const limit = query?.limit ?? 20;
      const offset = query?.offset ?? 0;
      dbQuery = dbQuery
        .range(offset, offset + limit - 1)
        .order('data_quality_score', { ascending: false })
        .order('name');

      const { data: representatives, error, count } = await dbQuery;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Get committee data from OpenStates integration
      const representativeIds = (representatives ?? []).map(rep => rep.id);
      const committees = await this.getCommitteeData(representativeIds);

      // Get crosswalk data for external IDs
      const crosswalkData = await this.getCrosswalkData(representativeIds);

      // Transform data to match our interface
      const transformedRepresentatives = (representatives ?? []).map(rep =>
        this.transformRepresentative(rep, committees, crosswalkData)
      );

      const result: RepresentativeSearchResult = {
        representatives: transformedRepresentatives,
        total: count ?? 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        hasMore: (offset + limit) < (count ?? 0)
      };

      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('CivicsIntegration.getRepresentatives error:', error);
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
   * Get committee data from OpenStates integration
   */
  private async getCommitteeData(representativeIds: number[]): Promise<Map<number, RepresentativeCommittee[]>> {
    if (representativeIds.length === 0) return new Map();

    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        logger.warn('Database connection not available for committee data');
        return new Map();
      }

      const { data: committees, error } = await supabase
        .from('openstates_people_roles')
        .select(`
          openstates_person_id,
          role_type,
          title,
          jurisdiction,
          start_date,
          end_date,
          district,
          division,
          is_current,
          openstates_people_data!inner(id, openstates_id)
        `)
        .in('openstates_person_id', representativeIds)
        .eq('is_current', true)
        .or('title.ilike.%committee%,title.ilike.%chair%,title.ilike.%member%,title.ilike.%vice%');

      if (error) {
        logger.warn('Committee data fetch error:', error);
        return new Map();
      }

      // Group committees by representative ID
      const committeeMap = new Map<number, RepresentativeCommittee[]>();

      for (const committee of committees ?? []) {
        const repId = (committee.openstates_people_data as any)?.[0]?.id;
        if (!repId) continue;

        if (!committeeMap.has(repId)) {
          committeeMap.set(repId, []);
        }

        const committeeData: any = {
          id: committee.openstates_person_id,
          representative_id: repId,
          committee_name: committee.title ?? 'Unknown Committee',
          role: this.mapRoleType(committee.role_type),
          jurisdiction: committee.jurisdiction,
          is_current: committee.is_current ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (committee.start_date) committeeData.start_date = committee.start_date;
        if (committee.end_date) committeeData.end_date = committee.end_date;
        const existing = committeeMap.get(repId);
        if (existing) {
          existing.push(committeeData);
          committeeMap.set(repId, existing);
        }
      }

      return committeeMap;
    } catch (error) {
      logger.warn('Error fetching committee data:', error);
      return new Map();
    }
  }

  /**
   * Get crosswalk data for external IDs
   */
  private async getCrosswalkData(representativeIds: number[]): Promise<Map<number, any[]>> {
    if (representativeIds.length === 0) return new Map();

    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        logger.warn('Database connection not available for crosswalk data');
        return new Map();
      }

      // Get representatives to get their canonical_ids
      const { data: reps, error: repsError } = await supabase
        .from('representatives_core')
        .select('id, canonical_id')
        .in('id', representativeIds);

      if (repsError || !reps) {
        logger.warn('Representatives fetch error for crosswalk:', repsError);
        return new Map();
      }

      const canonicalIds = reps.map(rep => rep.canonical_id).filter(Boolean);
      if (canonicalIds.length === 0) return new Map();

      const { data: crosswalk, error} = await supabase
        .from('id_crosswalk')
        .select('*')
        .in('canonical_id', canonicalIds.filter((id): id is string => id !== null));

      if (error) {
        logger.warn('Crosswalk data fetch error:', error);
        return new Map();
      }

      // Group crosswalk data by representative ID using canonical_id mapping
      const crosswalkMap = new Map<number, any[]>();
      const canonicalToRepId = new Map(reps.map(rep => [rep.canonical_id, rep.id]));

      for (const item of crosswalk ?? []) {
        const repId = canonicalToRepId.get(item.canonical_id);
        if (!repId) continue;

        if (!crosswalkMap.has(repId)) {
          crosswalkMap.set(repId, []);
        }

        const existing = crosswalkMap.get(repId);
        if (existing) {
          existing.push(item);
          crosswalkMap.set(repId, existing);
        }
      }

      return crosswalkMap;
    } catch (error) {
      logger.warn('Error fetching crosswalk data:', error);
      return new Map();
    }
  }

  /**
   * Transform database representative to our interface
   */
  private transformRepresentative(
    rep: any,
    committees: Map<number, RepresentativeCommittee[]>,
    crosswalk: Map<number, any[]>,
    overrides?: Map<number, {
      profile_photo_url?: string | null;
      socials?: Record<string, string> | null;
      short_bio?: string | null;
      campaign_website?: string | null;
      press_contact?: string | null;
    }>
  ): Representative {
    const ov = overrides?.get(rep.id);
    return {
      id: rep.id,
      name: rep.name,
      party: rep.party,
      office: rep.office,
      level: rep.level,
      state: rep.state,
      district: rep.district,

      // Contact Information
      primary_email: rep.primary_email,
      primary_phone: rep.primary_phone,
      primary_website: ov?.campaign_website ?? rep.primary_website,

      // Social Media
      twitter_handle: rep.twitter_handle,
      facebook_url: rep.facebook_url,
      instagram_handle: rep.instagram_handle,
      linkedin_url: rep.linkedin_url,
      youtube_channel: rep.youtube_channel,

      // External IDs
      bioguide_id: rep.bioguide_id,
      openstates_id: rep.openstates_id,
      fec_id: rep.fec_id,
      google_civic_id: rep.google_civic_id,
      congress_gov_id: rep.congress_gov_id,

      // Additional Info
      primary_photo_url: ov?.profile_photo_url ?? rep.primary_photo_url,
      term_start_date: rep.term_start_date,
      term_end_date: rep.term_end_date,
      next_election_date: rep.next_election_date,

      // Data Quality
      data_quality_score: rep.data_quality_score ?? 0,
      verification_status: rep.verification_status ?? 'pending',
      data_sources: rep.data_sources ?? [],

      // Timestamps
      created_at: rep.created_at,
      updated_at: rep.updated_at,
      last_verified: rep.last_verified,

      // Related Data
      photos: rep.representative_photos?.map((photo: any) => ({
        id: photo.id,
        representative_id: photo.representative_id,
        url: photo.url,
        source: photo.source,
        width: photo.width,
        height: photo.height,
        alt_text: photo.alt_text,
        attribution: photo.attribution,
        is_primary: photo.is_primary,
        created_at: photo.created_at,
        updated_at: photo.updated_at
      })) ?? [],

      activities: rep.representative_activity?.map((activity: any) => ({
        id: activity.id,
        representative_id: activity.representative_id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        source: activity.source,
        source_url: activity.source_url,
        url: activity.url,
        metadata: activity.metadata,
        created_at: activity.created_at,
        updated_at: activity.updated_at
      })) ?? [],

      committees: committees.get(rep.id) ?? [],

      crosswalk: crosswalk.get(rep.id)?.map((item: any) => ({
        id: item.id,
        entity_type: item.entity_type,
        canonical_id: item.canonical_id,
        source: item.source,
        source_id: item.source_id,
        attrs: item.attrs,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) ?? []
    };
  }

  /**
   * Map OpenStates role types to our interface
   */
  private mapRoleType(roleType: string): 'chair' | 'vice_chair' | 'member' {
    if (roleType.includes('chair')) {
      return roleType.includes('vice') ? 'vice_chair' : 'chair';
    }
    return 'member';
  }

  /**
   * Get representative by ID with full data
   */
  async getRepresentativeById(id: number): Promise<Representative | null> {
    try {
      const cacheKey = `representative_${id}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        return null;
      }

      const { data: representative, error } = await supabase
        .from('representatives_core')
        .select(`
          *,
          representative_photos(*),
          representative_contacts(*),
          representative_social_media(*),
          representative_activity(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !representative) {
        return null;
      }

      // Get committee and crosswalk data
      const committees = await this.getCommitteeData([id]);
      const crosswalk = await this.getCrosswalkData([id]);
      // Get overrides
      const overrides = await this.getOverridesData([id]);

      const transformed = this.transformRepresentative(representative, committees, crosswalk, overrides);
      this.setCachedData(cacheKey, transformed);
      return transformed;

    } catch (error) {
      logger.error('Error fetching representative by ID:', error);
      return null;
    }
  }

  private async getOverridesData(representativeIds: number[]): Promise<Map<number, any>> {
    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase || representativeIds.length === 0) {
        return new Map();
      }
      const { data, error } = await supabase
        .from('representative_overrides')
        .select('representative_id, profile_photo_url, socials, short_bio, campaign_website, press_contact')
        .in('representative_id', representativeIds);
      if (error || !Array.isArray(data)) {
        return new Map();
      }
      const map = new Map<number, any>();
      for (const row of data) {
        map.set(row.representative_id, {
          profile_photo_url: row.profile_photo_url ?? null,
          socials: (row.socials ?? null) as Record<string, string> | null,
          short_bio: row.short_bio ?? null,
          campaign_website: row.campaign_website ?? null,
          press_contact: row.press_contact ?? null,
        });
      }
      return map;
    } catch {
      return new Map();
    }
  }

  /**
   * Search representatives by location
   * Note: Location-based search should use /api/v1/civics/address-lookup endpoint
   * which is the sole exception that calls external APIs for address → district mapping.
   */
  async findByLocation(address: string): Promise<RepresentativeSearchResult> {
    try {
      // Location search should query Supabase after getting jurisdiction from address lookup
      // The /api/v1/civics/address-lookup endpoint handles address → district mapping
      logger.info('Location search should use address lookup endpoint first:', address);
      return {
        representatives: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      };
    } catch (error) {
      logger.error('Error in location search:', error);
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
   * Get data quality statistics
   */
  async getDataQualityStats(): Promise<{
    total: number;
    highQuality: number;
    averageScore: number;
    byState: Record<string, number>;
  }> {
    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        return {
          total: 0,
          highQuality: 0,
          averageScore: 0,
          byState: {}
        };
      }

      const { data: stats, error } = await supabase
        .from('representatives_core')
        .select('data_quality_score, state')
        .eq('is_active', true);

      if (error) throw error;

      const total = stats?.length ?? 0;
      const highQuality = stats?.filter(s => (s.data_quality_score ?? 0) >= 80).length ?? 0;
      const averageScore = total > 0 ? stats?.reduce((sum, s) => sum + (s.data_quality_score ?? 0), 0) / total : 0;

      const byState: Record<string, number> = {};
      stats?.forEach(stat => {
        byState[stat.state] = (byState[stat.state] ?? 0) + 1;
      });

      return {
        total,
        highQuality,
        averageScore: Math.round(averageScore * 100) / 100,
        byState
      };
    } catch (error) {
      logger.error('Error fetching data quality stats:', error);
      return {
        total: 0,
        highQuality: 0,
        averageScore: 0,
        byState: {}
      };
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const civicsIntegration = new CivicsIntegrationService();
