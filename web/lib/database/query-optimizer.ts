/**
 * Database Query Optimizer
 * 
 * Optimizes database queries for maximum performance:
 * - Reduces query count through batching
 * - Implements intelligent caching
 * - Uses database indexes effectively
 * - Provides query performance monitoring
 * 
 * Target: <100ms database query times
 * 
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface QueryPerformance {
  query: string;
  duration: number;
  rows: number;
  cached: boolean;
}

interface OptimizedQueryResult<T> {
  data: T;
  performance: QueryPerformance;
  fromCache: boolean;
}

class DatabaseQueryOptimizer {
  private performanceLog: QueryPerformance[] = [];
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  /**
   * Execute optimized query with caching
   */
  async executeQuery<T>(
    supabase: SupabaseClient,
    queryName: string,
    queryFn: () => Promise<{ data: T | null; error: any }>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<OptimizedQueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = queryName;
    
    console.log(`🔍 executeQuery called for: ${queryName}`);

    // Check cache first
    const cached = this.queryCache.get(queryName);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      const duration = Date.now() - startTime;
      console.log(`📦 Cache hit for ${queryName}, returning cached data:`, cached.data);
      this.logPerformance({
        query: queryName,
        duration,
        rows: Array.isArray(cached.data) ? cached.data.length : 1,
        cached: true
      });

      return {
        data: cached.data,
        performance: {
          query: queryName,
          duration,
          rows: Array.isArray(cached.data) ? cached.data.length : 1,
          cached: true
        },
        fromCache: true
      };
    }
    
    console.log(`🚀 Cache miss for ${queryName}, executing query...`);

    try {
      // Execute query
      console.log(`⚡ Executing query function for ${queryName}...`);
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      console.log(`📊 Query ${queryName} result:`, result);

      if (result.error) {
        console.error(`❌ Query ${queryName} failed:`, result.error);
        throw new Error(`Query ${queryName} failed: ${result.error.message}`);
      }

      const data = result.data;
      const rows = Array.isArray(data) ? data.length : (data ? 1 : 0);
      
      console.log(`✅ Query ${queryName} successful, data:`, data, `rows: ${rows}`);

      // Cache results (including null/undefined for performance)
      this.queryCache.set(queryName, {
        data,
        timestamp: Date.now(),
        ttl
      });
      
      console.log(`💾 Cached result for ${queryName}`);

      this.logPerformance({
        query: queryName,
        duration,
        rows,
        cached: false
      });

      return {
        data: data as T,
        performance: {
          query: queryName,
          duration,
          rows,
          cached: false
        },
        fromCache: false
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query ${queryName} failed:`, error as Error);
      
      this.logPerformance({
        query: queryName,
        duration,
        rows: 0,
        cached: false
      });

      throw error;
    }
  }

  /**
   * Batch multiple queries for efficiency
   */
  async executeBatch<T>(
    supabase: SupabaseClient,
    queries: Array<{
      name: string;
      query: () => Promise<{ data: any; error: any }>;
      ttl?: number;
    }>
  ): Promise<Record<string, OptimizedQueryResult<T>>> {
    const startTime = Date.now();
    const results: Record<string, OptimizedQueryResult<T>> = {};

    // Execute all queries in parallel
    const promises = queries.map(async ({ name, query, ttl = 300000 }) => {
      try {
        const result = await this.executeQuery(supabase, name, query, ttl);
        results[name] = result;
      } catch (error) {
        console.error(`Batch query ${name} failed:`, error as Error);
        results[name] = {
          data: null as T,
          performance: {
            query: name,
            duration: 0,
            rows: 0,
            cached: false
          },
          fromCache: false
        };
      }
    });

    await Promise.all(promises);

    const totalDuration = Date.now() - startTime;
    console.log(`⚡ Batch query completed in ${totalDuration}ms (${queries.length} queries)`);

    return results;
  }

  /**
   * Optimized user analytics query
   */
  async getUserAnalytics(supabase: SupabaseClient, userId: string) {
    console.log('🚀 getUserAnalytics called for user:', userId);
    return this.executeQuery(
      supabase,
      'user_analytics',
      async () => {
        console.log('📊 Executing user analytics query for user:', userId);
        
        // Get user's vote count
        console.log('🔍 Getting vote count for user:', userId);
        const { count: totalVotes, error: votesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        console.log('📊 Vote count result:', { totalVotes, votesError });

        // Get user's polls created
        console.log('🔍 Getting polls created for user:', userId);
        const { count: totalPollsCreated, error: pollsError } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', userId);
        console.log('📊 Polls created result:', { totalPollsCreated, pollsError });

        // Get active polls
        console.log('🔍 Getting active polls for user:', userId);
        const { count: activePolls, error: activePollsError } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', userId)
          .eq('status', 'active');
        console.log('📊 Active polls result:', { activePolls, activePollsError });

        // Get votes on user's polls
        const { data: userPolls } = await supabase
          .from('polls')
          .select('id')
          .eq('created_by', userId);

        let totalVotesOnUserPolls = 0;
        if (userPolls && userPolls.length > 0) {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .in('poll_id', userPolls.map(p => p.id));
          totalVotesOnUserPolls = count || 0;
        }

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const { count: votesLast30Days } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo);

        const { count: pollsCreatedLast30Days } = await supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', userId)
          .gte('created_at', thirtyDaysAgo);

        // Calculate participation score (0-100)
        const participationScore = Math.min(100, Math.max(0, 
          ((totalVotes || 0) * 10) + ((totalPollsCreated || 0) * 20)
        ));

        const analyticsData = {
          total_votes: totalVotes || 0,
          total_polls_created: totalPollsCreated || 0,
          active_polls: activePolls || 0,
          total_votes_on_user_polls: totalVotesOnUserPolls,
          participation_score: participationScore,
          recent_activity: {
            votes_last_30_days: votesLast30Days || 0,
            polls_created_last_30_days: pollsCreatedLast30Days || 0
          }
        };

        console.log('🎯 Final analytics data constructed:', analyticsData);
        return { data: analyticsData, error: null };
      },
      300000 // 5 minutes
    );
  }

  /**
   * Optimized user preferences query
   */
  async getUserPreferences(supabase: SupabaseClient, userId: string) {
    return this.executeQuery(
      supabase,
      'user_preferences',
      async () => {
        const result = await supabase
          .from('user_profiles')
          .select('preferences')
          .eq('user_id', userId)
          .single();
        
        // Provide default preferences if none exist
        const defaultPreferences = {
          showElectedOfficials: true,
          showQuickActions: true,
          showRecentActivity: true,
          showEngagementScore: true
        };
        
        return { 
          data: result.data?.preferences || defaultPreferences, 
          error: result.error 
        };
      },
      600000 // 10 minutes
    );
  }

  /**
   * Optimized platform stats query
   */
  async getPlatformStats(supabase: SupabaseClient) {
    return this.executeQuery(
      supabase,
      'platform_stats',
      async () => {
        // Execute multiple count queries in parallel
        const [users, polls, votes] = await Promise.all([
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('polls').select('id', { count: 'exact', head: true }),
          supabase.from('votes').select('id', { count: 'exact', head: true })
        ]);

        return {
          data: {
            total_users: users.count || 0,
            total_polls: polls.count || 0,
            total_votes: votes.count || 0,
            active_polls: 0 // Would need separate query
          },
          error: null
        };
      },
      600000 // 10 minutes
    );
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats() {
    const totalQueries = this.performanceLog.length;
    const totalDuration = this.performanceLog.reduce((sum, log) => sum + log.duration, 0);
    const avgDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;
    const cachedQueries = this.performanceLog.filter(log => log.cached).length;
    const cacheHitRate = totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0;

    return {
      totalQueries,
      avgDuration: Math.round(avgDuration),
      cacheHitRate: Math.round(cacheHitRate),
      slowestQuery: this.performanceLog.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest,
        { query: 'none', duration: 0, rows: 0, cached: false }
      ),
      fastestQuery: this.performanceLog.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest,
        { query: 'none', duration: Infinity, rows: 0, cached: false }
      )
    };
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
    console.log('📦 Database query cache cleared');
  }

  /**
   * Log query performance
   */
  private logPerformance(performance: QueryPerformance) {
    this.performanceLog.push(performance);
    
    // Keep only last 100 queries in memory
    if (this.performanceLog.length > 100) {
      this.performanceLog = this.performanceLog.slice(-100);
    }

    // Log slow queries
    if (performance.duration > 1000) {
      console.warn(`🐌 Slow query detected: ${performance.query} took ${performance.duration}ms`);
    } else if (performance.duration < 100) {
      console.log(`⚡ Fast query: ${performance.query} completed in ${performance.duration}ms`);
    }
  }
}

// Singleton instance
const queryOptimizer = new DatabaseQueryOptimizer();

export default queryOptimizer;

// Export types
export type { QueryPerformance, OptimizedQueryResult };