/**
 * Civics API Caching Utility
 * 
 * Provides intelligent caching for civics endpoints to improve performance
 * and reduce database load. Implements multi-layer caching strategy.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */


// Cache configuration
const CACHE_CONFIG = {
  // Representative data cache (longer TTL for stable data)
  representative: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 1000,
    keyPrefix: 'civics:rep:'
  },
  
  // Address lookup cache (medium TTL for electoral data)
  address: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 500,
    keyPrefix: 'civics:addr:'
  },
  
  // State lookup cache (longer TTL for stable state data)
  state: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100,
    keyPrefix: 'civics:state:'
  }
};

// In-memory cache store
const cacheStore = new Map<string, { data: any; timestamp: number; ttl: number }>();

export class CivicsCache {
  /**
   * Generate cache key for representative data
   */
  static getRepresentativeKey(id: string): string {
    return `${CACHE_CONFIG.representative.keyPrefix}${id}`;
  }

  /**
   * Generate cache key for address lookup
   */
  static getAddressKey(address: string): string {
    const normalizedAddress = address.toLowerCase().trim();
    return `${CACHE_CONFIG.address.keyPrefix}${Buffer.from(normalizedAddress).toString('base64')}`;
  }

  /**
   * Generate cache key for state lookup
   */
  static getStateKey(state: string, level?: string, chamber?: string): string {
    const params = [state, level || 'all', chamber || 'all'].join(':');
    return `${CACHE_CONFIG.state.keyPrefix}${params}`;
  }

  /**
   * Get cached data if available and not expired
   */
  static get<T>(key: string): T | null {
    const cached = cacheStore.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      cacheStore.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached data with TTL
   */
  static set<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (cacheStore.size >= 1000) {
      const firstKey = cacheStore.keys().next().value;
      if (firstKey) {
        cacheStore.delete(firstKey);
      }
    }

    cacheStore.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Cache representative data
   */
  static cacheRepresentative(id: string, data: any): void {
    const key = this.getRepresentativeKey(id);
    this.set(key, data, CACHE_CONFIG.representative.ttl);
  }

  /**
   * Get cached representative data
   */
  static getCachedRepresentative(id: string): any | null {
    const key = this.getRepresentativeKey(id);
    return this.get(key);
  }

  /**
   * Cache address lookup data
   */
  static cacheAddressLookup(address: string, data: any): void {
    const key = this.getAddressKey(address);
    this.set(key, data, CACHE_CONFIG.address.ttl);
  }

  /**
   * Get cached address lookup data
   */
  static getCachedAddressLookup(address: string): any | null {
    const key = this.getAddressKey(address);
    return this.get(key);
  }

  /**
   * Cache state lookup data
   */
  static cacheStateLookup(state: string, level: string | undefined, chamber: string | undefined, data: any): void {
    const key = this.getStateKey(state, level, chamber);
    this.set(key, data, CACHE_CONFIG.state.ttl);
  }

  /**
   * Get cached state lookup data
   */
  static getCachedStateLookup(state: string, level?: string, chamber?: string): any | null {
    const key = this.getStateKey(state, level, chamber);
    return this.get(key);
  }

  /**
   * Clear cache for specific representative
   */
  static clearRepresentative(id: string): void {
    const key = this.getRepresentativeKey(id);
    cacheStore.delete(key);
  }

  /**
   * Clear all cache
   */
  static clearAll(): void {
    cacheStore.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalEntries: number;
    representativeEntries: number;
    addressEntries: number;
    stateEntries: number;
    memoryUsage: string;
  } {
    const totalEntries = cacheStore.size;
    let representativeEntries = 0;
    let addressEntries = 0;
    let stateEntries = 0;

    for (const key of cacheStore.keys()) {
      if (key.startsWith(CACHE_CONFIG.representative.keyPrefix)) {
        representativeEntries++;
      } else if (key.startsWith(CACHE_CONFIG.address.keyPrefix)) {
        addressEntries++;
      } else if (key.startsWith(CACHE_CONFIG.state.keyPrefix)) {
        stateEntries++;
      }
    }

    return {
      totalEntries,
      representativeEntries,
      addressEntries,
      stateEntries,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}

/**
 * Database query optimization utilities
 */
export class CivicsQueryOptimizer {
  /**
   * Optimized representative query with all related data
   */
  static getRepresentativeQuery(supabase: any, id: string) {
    return supabase
      .from('civics_representatives')
      .select(`
        id,
        canonical_id,
        name,
        party,
        office,
        level,
        jurisdiction,
        district,
        ocd_division_id,
        external_id,
        source,
        data_origin,
        valid_from,
        valid_to,
        created_at,
        last_updated,
        civics_contact_info!inner(
          id,
          representative_id,
          official_email,
          official_phone,
          official_fax,
          official_website,
          office_addresses,
          preferred_contact_method,
          response_time_expectation,
          data_quality_score,
          last_verified,
          created_at,
          updated_at
        ),
        civics_social_engagement(
          id,
          representative_id,
          platform,
          handle,
          followers_count,
          engagement_rate,
          created_at,
          last_updated
        ),
        civics_campaign_finance(
          id,
          representative_id,
          candidate_name,
          candidate_id,
          cycle,
          party,
          state,
          district,
          office,
          raw_data,
          created_at,
          updated_at
        ),
        civics_voting_behavior(
          id,
          representative_id,
          analysis_period,
          total_votes,
          missed_votes,
          party_line_votes,
          bipartisan_votes,
          attendance_rate,
          party_loyalty_score,
          bipartisanship_score,
          created_at,
          updated_at
        ),
        civics_votes(
          id,
          representative_id,
          bill_id,
          bill_title,
          vote_date,
          vote_position,
          chamber,
          session,
          raw_data,
          created_at
        ),
        civics_policy_positions(
          id,
          representative_id,
          issue,
          position,
          confidence_score,
          source,
          source_url,
          created_at,
          last_updated
        ),
        civics_crosswalk(
          id,
          canonical_id,
          source_id,
          source,
          source_type,
          created_at,
          last_verified
        )
      `)
      .eq('id', id)
      .single();
  }

  /**
   * Optimized state query with filtering
   */
  static getStateQuery(supabase: any, state: string, level?: string, chamber?: string, limit: number = 200) {
    let query = supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        party,
        office,
        level,
        state,
        district,
        bioguide_id,
        openstates_id,
        fec_id,
        google_civic_id,
        legiscan_id,
        congress_gov_id,
        govinfo_id,
        wikipedia_url,
        ballotpedia_url,
        twitter_handle,
        facebook_url,
        instagram_handle,
        linkedin_url,
        youtube_channel,
        primary_email,
        primary_phone,
        primary_website,
        primary_photo_url,
        data_quality_score,
        data_sources,
        last_verified,
        verification_status,
        created_at,
        last_updated,
        enhanced_contacts,
        enhanced_photos,
        enhanced_activity,
        enhanced_social_media
      `)
      .eq('state', state)
      .limit(limit);

    if (level) {
      query = query.eq('level', level);
    }

    if (chamber) {
      query = query.eq('office', chamber);
    }

    return query;
  }

  /**
   * Optimized address query with electoral info
   */
  static getAddressQuery(supabase: any, state: string, districts: string[]) {
    return supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        party,
        office,
        level,
        state,
        district,
        bioguide_id,
        openstates_id,
        fec_id,
        google_civic_id,
        legiscan_id,
        congress_gov_id,
        govinfo_id,
        wikipedia_url,
        ballotpedia_url,
        twitter_handle,
        facebook_url,
        instagram_handle,
        linkedin_url,
        youtube_channel,
        primary_email,
        primary_phone,
        primary_website,
        primary_photo_url,
        data_quality_score,
        data_sources,
        last_verified,
        verification_status,
        created_at,
        last_updated,
        enhanced_contacts,
        enhanced_photos,
        enhanced_activity,
        enhanced_social_media
      `)
      .eq('state', state)
      .in('district', districts);
  }
}

/**
 * Cache warming utilities
 */
export class CivicsCacheWarmer {
  /**
   * Warm cache for popular representatives
   */
  static async warmPopularRepresentatives(supabase: any): Promise<void> {
    try {
      // Get most accessed representatives from analytics
      const { data: popularReps } = await supabase
        .from('civics_representatives')
        .select('id, name, level, state')
        .order('data_quality_score', { ascending: false })
        .limit(50);

      if (popularReps) {
        for (const rep of popularReps) {
          // Pre-cache representative data
          const { data: repData } = await CivicsQueryOptimizer.getRepresentativeQuery(supabase, rep.id);
          if (repData) {
            CivicsCache.cacheRepresentative(rep.id, repData);
          }
        }
      }
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  /**
   * Warm cache for state data
   */
  static async warmStateData(supabase: any): Promise<void> {
    try {
      const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
      
      for (const state of states) {
        const { data: stateData } = await CivicsQueryOptimizer.getStateQuery(supabase, state);
        if (stateData) {
          CivicsCache.cacheStateLookup(state, undefined, undefined, stateData);
        }
      }
    } catch (error) {
      console.error('State cache warming failed:', error);
    }
  }
}
