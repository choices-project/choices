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
      console.error('Cache warming failed:', error);
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
      console.error('State cache warming failed:', error);
    }
  }
}
