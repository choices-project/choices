import { devLog } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

import type {
  TrustTier,
  TrustTierScore,
  PollDemographicInsights,
  AnalyticsSummary,
  PollAnalytics,
  UserAnalytics
} from '../types/analytics'

// Use database types for actual schema
import type { Database } from '@/types/database'

type TrustTierAnalyticsRow = Database['public']['Tables']['trust_tier_analytics']['Row']
type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
type TrustTierAnalyticsFactors = {
  confidence_level?: number;
  data_quality_score?: number;
  age_group?: string;
  geographic_region?: string;
  education_level?: string;
  income_bracket?: string;
  political_affiliation?: string;
  biometric_verified?: boolean;
  phone_verified?: boolean;
  identity_verified?: boolean;
}

export class AnalyticsService {
  private static instance: AnalyticsService

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Calculate trust tier score based on verification methods and engagement
   */
  async calculateTrustTierScore(userId: string): Promise<TrustTierScore> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get user verification status
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('trust_tier, email')
        .eq('id', userId as any)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // Get biometric verification status
      const { data: biometricCreds } = await supabase
        .from('webauthn_credentials')
        .select('id')
        .eq('user_id', userId as any)

      // Get voting history count
      const { count: votingHistory } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId as any)

      // Calculate verification factors
      const biometric_verified = (biometricCreds?.length ?? 0) > 0
      const phone_verified = user && 'trust_tier' in user ? (user.trust_tier === 'T2' || user.trust_tier === 'T3') : false
      const identity_verified = user && 'trust_tier' in user ? user.trust_tier === 'T3' : false
      const voting_history_count = votingHistory ?? 0

      // Calculate score using database function
      const { data: scoreResult, error: scoreError } = await supabase
        .rpc('calculate_trust_tier_score', {
          p_biometric_verified: biometric_verified,
          p_phone_verified: phone_verified,
          p_identity_verified: identity_verified,
          p_voting_history_count: voting_history_count
        });

      if (scoreError) {
        throw new Error('Failed to calculate trust tier score')
      }

      const score = Array.isArray(scoreResult) && scoreResult.length > 0 ? scoreResult[0]?.trust_score || 0 : 0

      // Determine trust tier
      const { data: tierResult, error: tierError } = await supabase
        .rpc('determine_trust_tier', { p_score: score })

      if (tierError) {
        throw new Error('Failed to determine trust tier')
      }

      const trust_tier = Array.isArray(tierResult) && tierResult.length > 0 ? tierResult[0] as TrustTier : 'T1' as TrustTier

      return {
        score,
        trust_tier,
        factors: {
          biometric_verified,
          phone_verified,
          identity_verified,
          voting_history_count
        }
      }
    } catch (error) {
      devLog('Error calculating trust tier score:', { error })
      throw error
    }
  }

  /**
   * Record analytics data for a user's poll participation
   */
  async recordPollAnalytics(
    userId: string,
    pollId: string,
    demographicData?: {
      age_group?: string
      geographic_region?: string
      education_level?: string
      income_bracket?: string
      political_affiliation?: string
    }
  ): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Calculate trust tier score
      const trustTierScore = await this.calculateTrustTierScore(userId)

      // Get verification methods
      const verificationMethods: string[] = []
      if (trustTierScore.factors.biometric_verified) verificationMethods.push('biometric')
      if (trustTierScore.factors.phone_verified) verificationMethods.push('phone')
      if (trustTierScore.factors.identity_verified) verificationMethods.push('identity')

      // Insert analytics record
      const { error: insertError } = await supabase
        .from('trust_tier_analytics')
        .insert({
          user_id: userId,
          poll_id: pollId,
          trust_tier: trustTierScore.trust_tier,
          trust_score: trustTierScore.score,
          factors: {
            age_group: demographicData?.age_group,
            geographic_region: demographicData?.geographic_region,
            education_level: demographicData?.education_level,
            income_bracket: demographicData?.income_bracket,
            political_affiliation: demographicData?.political_affiliation,
            voting_history_count: trustTierScore.factors.voting_history_count,
            biometric_verified: trustTierScore.factors.biometric_verified,
            phone_verified: trustTierScore.factors.phone_verified,
            identity_verified: trustTierScore.factors.identity_verified,
            verification_methods: verificationMethods,
            data_quality_score: trustTierScore.score,
            confidence_level: trustTierScore.score,
            last_activity: new Date().toISOString()
          } as any, // Type assertion for JSON field
          calculated_at: new Date().toISOString()
        } as any) // Type assertion for insert data

      if (insertError) {
        throw new Error('Failed to record poll analytics')
      }

      // Update poll demographic insights
      await this.updatePollDemographicInsights(pollId)

      // Update civic database entry
      await this.updateCivicDatabaseEntry(userId, pollId)

    } catch (error) {
      devLog('Error recording poll analytics:', { error })
      throw error
    }
  }

  /**
   * Update poll demographic insights
   */
  async updatePollDemographicInsights(pollId: string): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Call database function to update insights
      // Note: update_poll_demographic_insights function not yet implemented
      // const { error } = await supabase
      //   .rpc('update_poll_demographic_insights', { p_poll_id: pollId })

      // if (error) {
      //   throw new Error('Failed to update poll demographic insights')
      // }
    } catch (error) {
      devLog('Error updating poll demographic insights:', { error })
      throw error
    }
  }

  /**
   * Update civic database entry for a user
   */
  async updateCivicDatabaseEntry(userId: string, _pollId?: string): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get user analytics summary
      const { data: analytics, error: analyticsError } = await supabase
        .from('trust_tier_analytics')
        .select('*')
        .eq('user_id', userId as any)

      if (analyticsError) {
        throw new Error('Failed to get user analytics')
      }

      // Calculate engagement metrics
      const total_polls_participated = analytics?.length ?? 0
      const total_votes_cast = analytics?.length ?? 0
      const average_engagement_score = analytics && analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a && 'trust_score' in a ? (a as any).trust_score : 0), 0) / analytics.length
        : 0

      // Get current trust tier
      const trustTierScore = await this.calculateTrustTierScore(userId)

      // Generate user hash (anonymized)
      const userHash = await this.generateUserHash(userId)

      // Check if civic database entry exists
      // Note: civic_database_entries table not yet implemented
      // const { data: existingEntry } = await supabase
      //   .from('civic_database_entries')
      //   .select('id, current_trust_tier, trust_tier_history, trust_tier_upgrade_date')
      //   .eq('stable_user_id', userId)
      //   .single()

      // const trustTierHistory = existingEntry?.trust_tier_history ?? []
      
      // // Add new trust tier entry if changed
      // if (!existingEntry || existingEntry.current_trust_tier !== trustTierScore.trust_tier) {
      //   trustTierHistory.push({
      //     trust_tier: trustTierScore.trust_tier,
      //     upgrade_date: new Date().toISOString(),
      //     reason: 'Analytics update',
      //     verification_methods: [
      //       ...(trustTierScore.factors.biometric_verified ? ['biometric'] : []),
      //       ...(trustTierScore.factors.phone_verified ? ['phone'] : []),
      //       ...(trustTierScore.factors.identity_verified ? ['identity'] : [])
      //     ]
      //   })
      // }

      // // Upsert civic database entry
      // const { error: upsertError } = await supabase
      //   .from('civic_database_entries')
      //   .upsert({
      //     stable_user_id: userId,
      //     user_hash: userHash,
      //     total_polls_participated,
      //     total_votes_cast,
      //     average_engagement_score,
      //     current_trust_tier: trustTierScore.trust_tier,
      //     trust_tier_history: trustTierHistory,
      //     trust_tier_upgrade_date: existingEntry?.current_trust_tier !== trustTierScore.trust_tier 
      //       ? new Date().toISOString() 
      //       : existingEntry.trust_tier_upgrade_date
      //   })

      // if (upsertError) {
      //   throw new Error('Failed to update civic database entry')
      // }

    } catch (error) {
      devLog('Error updating civic database entry:', { error })
      throw error
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get total users
      const { count: totalUsers } = await supabase
        .from('trust_tier_analytics')
        .select('*', { count: 'exact', head: true })

      // Get trust tier distribution
      const { data: tierDistribution } = await supabase
        .from('trust_tier_analytics')
        .select('trust_tier')

      const trustTierCounts = tierDistribution?.reduce((acc, item) => {
        const tier = item && 'trust_tier' in item ? item.trust_tier as TrustTier : 'T1' as TrustTier
        acc[tier] = (acc[tier] ?? 0) + 1
        return acc
      }, {} as Record<TrustTier, number>) ?? { T0: 0, T1: 0, T2: 0, T3: 0 }

      // Get average confidence level
      const { data: confidenceData } = await supabase
        .from('trust_tier_analytics')
        .select('*')

      const averageConfidenceLevel = confidenceData && confidenceData.length > 0
        ? confidenceData.reduce((sum, item) => {
            const factors = item && 'factors' in item ? item.factors as TrustTierAnalyticsFactors | null : null
            return sum + (factors?.confidence_level ?? 0)
          }, 0) / confidenceData.length
        : 0

      // Get data quality metrics
      const highQuality = confidenceData?.filter(item => {
        const factors = item && 'factors' in item ? item.factors as TrustTierAnalyticsFactors | null : null
        return (factors?.confidence_level ?? 0) >= 0.8
      }).length ?? 0
      const mediumQuality = confidenceData?.filter(item => {
        const factors = item && 'factors' in item ? item.factors as TrustTierAnalyticsFactors | null : null
        const confidence = factors?.confidence_level ?? 0
        return confidence >= 0.5 && confidence < 0.8
      }).length ?? 0
      const lowQuality = confidenceData?.filter(item => {
        const factors = item && 'factors' in item ? item.factors as TrustTierAnalyticsFactors | null : null
        return (factors?.confidence_level ?? 0) < 0.5
      }).length ?? 0

      // Get engagement metrics
      const { data: engagementData } = await supabase
        .from('analytics_user_engagement')
        .select('total_sessions, total_page_views, engagement_score')

      const activeUsers = engagementData?.filter(entry => 
        entry && 'total_sessions' in entry ? (entry.total_sessions ?? 0) > 0 : false
      ).length ?? 0

      const averagePollsParticipated = engagementData && engagementData.length > 0
        ? engagementData.reduce((sum, entry) => sum + (entry && 'total_sessions' in entry ? entry.total_sessions ?? 0 : 0), 0) / engagementData.length
        : 0

      const averageVotesCast = engagementData && engagementData.length > 0
        ? engagementData.reduce((sum, entry) => sum + (entry && 'total_page_views' in entry ? entry.total_page_views ?? 0 : 0), 0) / engagementData.length
        : 0

      return {
        total_users: totalUsers ?? 0,
        trust_tier_distribution: trustTierCounts,
        average_confidence_level: averageConfidenceLevel,
        data_quality_metrics: {
          high_quality: highQuality,
          medium_quality: mediumQuality,
          low_quality: lowQuality
        },
        engagement_metrics: {
          active_users: activeUsers,
          average_polls_participated: averagePollsParticipated,
          average_votes_cast: averageVotesCast
        }
      }

    } catch (error) {
      devLog('Error getting analytics summary:', { error })
      throw error
    }
  }

  /**
   * Get poll analytics
   */
  async getPollAnalytics(pollId: string): Promise<PollAnalytics> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get poll demographic insights
      const { data: insights, error: insightsError } = await supabase
        .from('demographic_analytics')
        .select('*')
        .eq('poll_id', pollId as any)
        .single()

      if (insightsError || !insights) {
        throw new Error('Poll insights not found')
      }

      // Get analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('trust_tier_analytics')
        .select('*')
        .eq('poll_id', pollId as any)

      if (analyticsError) {
        throw new Error('Failed to get poll analytics')
      }

      // Calculate metrics
      const total_responses = analytics.length ?? 0
      const data_quality_score = analytics.length > 0
        ? analytics.reduce((sum, a) => {
            const factors = (a as any).factors as TrustTierAnalyticsFactors | null
            return sum + (factors?.data_quality_score ?? 0)
          }, 0) / analytics.length
        : 0
      const confidence_level = analytics.length > 0
        ? analytics.reduce((sum, a) => {
            const factors = (a as any).factors as TrustTierAnalyticsFactors | null
            return sum + (factors?.confidence_level ?? 0)
          }, 0) / analytics.length
        : 0

      // Calculate trust tier breakdown
      const trustTierBreakdown = analytics.reduce((acc, item) => {
        const tier = (item as any).trust_tier as TrustTier
        acc[tier] = (acc[tier] ?? 0) + 1
        return acc
      }, {} as Record<TrustTier, number>) ?? { T0: 0, T1: 0, T2: 0, T3: 0 }

      return {
        poll_id: pollId,
        total_responses,
        trust_tier_breakdown: trustTierBreakdown,
        demographic_insights: {
          id: (insights as any)?.poll_id ?? '',
          poll_id: (insights as any)?.poll_id ?? '',
          total_responses: (insights as any)?.participant_count ?? 0,
          trust_tier_breakdown: trustTierBreakdown,
          age_group_breakdown: (insights as any)?.age_bucket ? { [(insights as any).age_bucket]: (insights as any).participant_count ?? 0 } : {},
          education_breakdown: (insights as any)?.education_bucket ? { [(insights as any).education_bucket]: (insights as any).participant_count ?? 0 } : {},
          region_breakdown: (insights as any)?.region_bucket ? { [(insights as any).region_bucket]: (insights as any).participant_count ?? 0 } : {},
          geographic_breakdown: (insights as any)?.region_bucket ? { [(insights as any).region_bucket]: (insights as any).participant_count ?? 0 } : {},
          political_breakdown: {},
          income_breakdown: {},
          gender_breakdown: {},
          device_breakdown: {},
          time_breakdown: {},
          data_quality_distribution: {},
          verification_method_distribution: {},
          engagement_metrics: {
            average_choice: (insights as any)?.average_choice ?? 0,
            choice_variance: (insights as any)?.choice_variance ?? 0
          },
          response_velocity: 0,
          participation_trends: {}
        } as unknown as PollDemographicInsights,
        data_quality_score,
        confidence_level,
        response_trends: {
          daily_responses: await this.getDailyResponseTrends(pollId)
        }
      }

    } catch (error) {
      devLog('Error getting poll analytics:', { error })
      throw error
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get trust tier score
      const trustTierScore = await this.calculateTrustTierScore(userId)

      // Get analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('trust_tier_analytics')
        .select('*')
        .eq('user_id', userId as any)
        .order('created_at', { ascending: false })

      if (analyticsError) {
        throw new Error('Failed to get user analytics')
      }

      // Note: civic_database_entries table not yet implemented
      // Get civic database entry
      // const { data: civicEntry, error: civicError } = await supabase
      //   .from('civic_database_entries')
      //   .select('*')
      //   .eq('stable_user_id', userId)
      //   .single()

      // if (civicError) {
      //   throw new Error('Failed to get civic database entry')
      // }

      // Get latest demographic data
      const latestAnalytics = analytics[0]

      return {
        user_id: userId,
        trust_tier: trustTierScore.trust_tier,
        trust_tier_score: trustTierScore.score,
        verification_status: {
          biometric_verified: trustTierScore.factors.biometric_verified,
          phone_verified: trustTierScore.factors.phone_verified,
          identity_verified: trustTierScore.factors.identity_verified
        },
        engagement_metrics: {
          total_polls_participated: analytics.length,
          total_votes_cast: analytics.length,
          average_engagement_score: analytics.length > 0 ? analytics.reduce((sum, a) => sum + ((a as any).trust_score ?? 0), 0) / analytics.length : 0,
          last_activity: (latestAnalytics as any)?.created_at ?? new Date().toISOString()
        },
        demographic_data: {
          age_group: ((latestAnalytics as any)?.factors as TrustTierAnalyticsFactors)?.age_group,
          geographic_region: ((latestAnalytics as any)?.factors as TrustTierAnalyticsFactors)?.geographic_region,
          education_level: ((latestAnalytics as any)?.factors as TrustTierAnalyticsFactors)?.education_level,
          income_bracket: ((latestAnalytics as any)?.factors as TrustTierAnalyticsFactors)?.income_bracket,
          political_affiliation: ((latestAnalytics as any)?.factors as TrustTierAnalyticsFactors)?.political_affiliation
        }
      }

    } catch (error) {
      devLog('Error getting user analytics:', { error })
      throw error
    }
  }

  /**
   * Get daily response trends for a poll
   */
  private async getDailyResponseTrends(pollId: string): Promise<Array<{ date: string; count: number }>> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Get daily response counts for the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: trends, error } = await supabase
        .from('trust_tier_analytics')
        .select('created_at')
        .eq('poll_id', pollId as any)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error) {
        throw new Error('Failed to get daily response trends')
      }

      // Group by date and count
      const dailyCounts = new Map<string, number>()
      trends?.forEach(trend => {
        if ((trend as any).created_at && typeof (trend as any).created_at === 'string') {
          const date = new Date((trend as any).created_at).toISOString().split('T')[0]
          if (date) {
            dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1)
          }
        }
      })

      // Convert to array format
      return Array.from(dailyCounts.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      devLog('Error getting daily response trends:', { error })
      return []
    }
  }

  /**
   * Generate anonymized user hash
   */
  private async generateUserHash(userId: string): Promise<string> {
    // Simple hash generation - in production, use proper cryptographic hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(userId + (process.env.ANALYTICS_SALT ?? 'default-salt'))
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

