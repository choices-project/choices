import logger from '@/lib/utils/logger';
/**
 * Civics API Caching Utility
 * 
 * Provides intelligent caching for civics endpoints to improve performance
 * and reduce database load. Implements multi-layer caching strategy.
 * Updated to use normalized tables instead of JSONB columns.
 * 
 * @fileoverview Civics caching and query optimization with normalized data
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use normalized tables instead of JSONB
 * @feature CIVICS_CACHING
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */


// Cache configuration
// Rep/state/address/votes all change on ingest. Cache until next ingest (daily/weekly).
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const CACHE_CONFIG = {
  // Representative data: ingest-updated. Cache until next ingest.
  representative: {
    ttl: ONE_DAY_MS,
    maxSize: 1000,
    keyPrefix: 'civics:rep:'
  },

  // Address → jurisdiction: stable until redistricting. Ingest-adjacent.
  address: {
    ttl: ONE_DAY_MS,
    maxSize: 500,
    keyPrefix: 'civics:addr:'
  },

  // State-level rep lists: ingest-updated.
  state: {
    ttl: ONE_DAY_MS,
    maxSize: 100,
    keyPrefix: 'civics:state:'
  },

  // Vote lookup (rep votes on bills): historical, ingest-updated. Walk-the-Talk is after-the-fact.
  votes: {
    ttl: ONE_WEEK_MS,
    maxSize: 500,
    keyPrefix: 'civics:votes:'
  },

  // Full representative list (card payload) per request params. Ingest-updated.
  repList: {
    ttl: ONE_DAY_MS,
    maxSize: 200,
    keyPrefix: 'civics:repslist:'
  }
};

// In-memory cache store
const cacheStore = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

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
    const params = [state, level ?? 'all', chamber ?? 'all'].join(':');
    return `${CACHE_CONFIG.state.keyPrefix}${params}`;
  }

  /**
   * Generate cache key for vote lookup (representative_activity type=vote)
   */
  static getVotesKey(representativeId: string, congress?: number): string {
    const suffix = congress != null ? `:${congress}` : ':all';
    return `${CACHE_CONFIG.votes.keyPrefix}${representativeId}${suffix}`;
  }

  /**
   * Generate cache key for representative list (full card payload) per request params.
   * Include `include` and `fields` so different response shapes do not share cache entries.
   */
  static getRepListKey(params: {
    state: string | null;
    level: string | null;
    city: string | null;
    zip: string | null;
    offset: number;
    limit: number;
    search: string | null;
    ocdDivisionId: string | null;
    district: string | null;
    party: string | null;
    sortBy: string;
    sortOrder: string;
    include: string | null;
    fields: string | null;
  }): string {
    const parts = [
      params.state ?? '',
      params.level ?? 'all',
      params.city ?? '',
      params.zip ?? '',
      String(params.offset),
      String(params.limit),
      params.search ?? '',
      params.ocdDivisionId ?? '',
      params.district ?? '',
      params.party ?? '',
      params.sortBy,
      params.sortOrder,
      params.include ?? '',
      params.fields ?? ''
    ];
    return `${CACHE_CONFIG.repList.keyPrefix}${parts.join(':')}`;
  }

  /**
   * Get cached representative list if available and not expired.
   */
  static getCachedRepList<T>(key: string): T | null {
    return this.get<T>(key);
  }

  /**
   * Cache representative list (full card payload).
   */
  static cacheRepList<T>(key: string, data: T): void {
    this.set(key, data, CACHE_CONFIG.repList.ttl);
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
  static cacheRepresentative(id: string, data: unknown): void {
    const key = this.getRepresentativeKey(id);
    this.set(key, data, CACHE_CONFIG.representative.ttl);
  }

  /**
   * Get cached representative data
   */
  static getCachedRepresentative(id: string): unknown {
    const key = this.getRepresentativeKey(id);
    return this.get(key);
  }

  /**
   * Cache address lookup data
   */
  static cacheAddressLookup(address: string, data: unknown): void {
    const key = this.getAddressKey(address);
    this.set(key, data, CACHE_CONFIG.address.ttl);
  }

  /**
   * Get cached address lookup data
   */
  static getCachedAddressLookup(address: string): unknown {
    const key = this.getAddressKey(address);
    return this.get(key);
  }

  /**
   * Cache state lookup data
   */
  static cacheStateLookup(state: string, level: string | undefined, chamber: string | undefined, data: unknown): void {
    const key = this.getStateKey(state, level, chamber);
    this.set(key, data, CACHE_CONFIG.state.ttl);
  }

  /**
   * Get cached state lookup data
   */
  static getCachedStateLookup(state: string, level?: string, chamber?: string): unknown {
    const key = this.getStateKey(state, level, chamber);
    return this.get(key);
  }

  /**
   * Cache vote lookup data (getVotingRecord)
   */
  static cacheVotes(representativeId: string, data: unknown, congress?: number): void {
    const key = this.getVotesKey(representativeId, congress);
    this.set(key, data, CACHE_CONFIG.votes.ttl);
  }

  /**
   * Get cached vote lookup data
   */
  static getCachedVotes<T>(representativeId: string, congress?: number): T | null {
    const key = this.getVotesKey(representativeId, congress);
    return this.get<T>(key);
  }

  /**
   * Clear vote cache for a representative (e.g. after activity backfill)
   */
  static clearVotes(representativeId: string): void {
    const prefix = CACHE_CONFIG.votes.keyPrefix + representativeId;
    for (const k of Array.from(cacheStore.keys())) {
      if (k.startsWith(prefix)) cacheStore.delete(k);
    }
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
    voteEntries: number;
    memoryUsage: string;
  } {
    const totalEntries = cacheStore.size;
    let representativeEntries = 0;
    let addressEntries = 0;
    let stateEntries = 0;
    let voteEntries = 0;

    for (const key of cacheStore.keys()) {
      if (key.startsWith(CACHE_CONFIG.representative.keyPrefix)) {
        representativeEntries++;
      } else if (key.startsWith(CACHE_CONFIG.address.keyPrefix)) {
        addressEntries++;
      } else if (key.startsWith(CACHE_CONFIG.state.keyPrefix)) {
        stateEntries++;
      } else if (key.startsWith(CACHE_CONFIG.votes.keyPrefix)) {
        voteEntries++;
      }
    }

    return {
      totalEntries,
      representativeEntries,
      addressEntries,
      stateEntries,
      voteEntries,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }
}


// Minimal Supabase client interface for type safety
type SupabaseQueryBuilder = {
  select: (columns?: string) => SupabaseQueryBuilder;
  eq: (column: string, value: string | number) => SupabaseQueryBuilder;
  in: (column: string, values: string[]) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending: boolean }) => SupabaseQueryBuilder;
  single: () => SupabaseQueryBuilder;
  then: <T>(onfulfilled?: ((value: { data: T | null; error: { message: string } | null }) => T | PromiseLike<T>) | null, onrejected?: ((reason: unknown) => T | PromiseLike<T>) | null) => Promise<{ data: T | null; error: { message: string } | null }>;
};

type SupabaseClientLike = {
  from: (table: string) => SupabaseQueryBuilder;
};

/**
 * Database query optimization utilities
 */
export class CivicsQueryOptimizer {
  /**
   * Optimized representative query with normalized table joins
   */
  static getRepresentativeQuery(supabase: SupabaseClientLike, id: string) {
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
        openstates_id,
        bioguide_id,
        fec_id,
        google_civic_id,
        legiscan_id,
        congress_gov_id,
        govinfo_id,
        primary_email,
        primary_phone,
        primary_website,
        primary_photo_url,
        data_quality_score,
        data_sources,
        verification_status,
        last_verified,
        created_at,
        last_updated,
        representative_contacts(contact_type, value, is_verified, source),
        representative_photos(url, is_primary, source),
        representative_social_media(platform, handle, url, is_verified),
        representative_activity(type, title, description, date, source)
      `)
      .eq('id', id)
      .single();
  }

  /**
   * Optimized state query with filtering
   */
  static getStateQuery(supabase: SupabaseClientLike, state: string, level?: string, chamber?: string, limit = 200) {
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
        representative_contacts(contact_type, value, is_verified, source),
        representative_photos(url, is_primary, source),
        representative_social_media(platform, handle, url, is_verified),
        representative_activity(type, title, description, date, source)
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
  static getAddressQuery(supabase: SupabaseClientLike, state: string, districts: string[]) {
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
  static async warmPopularRepresentatives(supabase: SupabaseClientLike): Promise<void> {
    try {
      // Get most accessed representatives from analytics
      const { data: popularReps } = await supabase
        .from('civics_representatives')
        .select('id, name, level, state')
        .order('data_quality_score', { ascending: false })
        .limit(50);

      if (popularReps && Array.isArray(popularReps)) {
        for (const rep of popularReps) {
          // Pre-cache representative data
          const { data: repData } = await CivicsQueryOptimizer.getRepresentativeQuery(supabase, rep.id);
          if (repData) {
            CivicsCache.cacheRepresentative(rep.id, repData);
          }
        }
      }
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }

  /**
   * Warm cache for state data
   */
  static async warmStateData(supabase: SupabaseClientLike): Promise<void> {
    try {
      const states = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
      
      for (const state of states) {
        const { data: stateData } = await CivicsQueryOptimizer.getStateQuery(supabase, state);
        if (stateData) {
          CivicsCache.cacheStateLookup(state, undefined, undefined, stateData);
        }
      }
    } catch (error) {
      logger.error('State cache warming failed:', error);
    }
  }
}
