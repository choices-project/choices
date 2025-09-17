import { getSupabaseServerClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'
import type {
  TrustTier,
  TrustTierScore,
  PollDemographicInsights,
  AnalyticsSummary,
  PollAnalytics,
  UserAnalytics
} from '@/features/analytics/types/analytics'

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
        .from('ia_users')
        .select('verification_tier, email')
        .eq('stable_id', userId)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // Get biometric verification status
      const { data: biometricCreds } = await supabase
        .from('webauthn_credentials')
        .select('id')
        .eq('user_id', userId)

      // Get voting history count
      const { count: votingHistory } = await supabase
        .from('po_votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate verification factors
      const biometric_verified = (biometricCreds?.length || 0) > 0
      const phone_verified = user.verification_tier === 'T2' || user.verification_tier === 'T3'
      const identity_verified = user.verification_tier === 'T3'
      const voting_history_count = votingHistory || 0

      // Calculate score using database function
      const { data: scoreResult, error: scoreError } = await supabase
        .rpc('calculate_trust_tier_score', {
          p_biometric_verified: biometric_verified,
          p_phone_verified: phone_verified,
          p_identity_verified: identity_verified,
          p_voting_history_count: voting_history_count
        })

      if (scoreError) {
        throw new Error('Failed to calculate trust tier score')
      }

      const score = scoreResult || 0

      // Determine trust tier
      const { data: tierResult, error: tierError } = await supabase
        .rpc('determine_trust_tier', { p_score: score })

      if (tierError) {
        throw new Error('Failed to determine trust tier')
      }

      const trust_tier = tierResult as TrustTier

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
      devLog('Error calculating trust tier score:', error)
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
        })

      if (insertError) {
        throw new Error('Failed to record poll analytics')
      }

      // Update poll demographic insights
      await this.updatePollDemographicInsights(pollId)

      // Update civic database entry
      await this.updateCivicDatabaseEntry(userId, pollId)

    } catch (error) {
      devLog('Error recording poll analytics:', error)
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
      const { error } = await supabase
        .rpc('update_poll_demographic_insights', { p_poll_id: pollId })

      if (error) {
        throw new Error('Failed to update poll demographic insights')
      }
    } catch (error) {
      devLog('Error updating poll demographic insights:', error)
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
        .eq('user_id', userId)

      if (analyticsError) {
        throw new Error('Failed to get user analytics')
      }

      // Calculate engagement metrics
      const total_polls_participated = analytics?.length || 0
      const total_votes_cast = analytics?.length || 0
      const average_engagement_score = analytics?.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.data_quality_score || 0), 0) / analytics.length
        : 0

      // Get current trust tier
      const trustTierScore = await this.calculateTrustTierScore(userId)

      // Generate user hash (anonymized)
      const userHash = await this.generateUserHash(userId)

      // Check if civic database entry exists
      const { data: existingEntry } = await supabase
        .from('civic_database_entries')
        .select('id, current_trust_tier, trust_tier_history, trust_tier_upgrade_date')
        .eq('stable_user_id', userId)
        .single()

      const trustTierHistory = existingEntry?.trust_tier_history || []
      
      // Add new trust tier entry if changed
      if (!existingEntry || existingEntry.current_trust_tier !== trustTierScore.trust_tier) {
        trustTierHistory.push({
          trust_tier: trustTierScore.trust_tier,
          upgrade_date: new Date().toISOString(),
          reason: 'Analytics update',
          verification_methods: [
            ...(trustTierScore.factors.biometric_verified ? ['biometric'] : []),
            ...(trustTierScore.factors.phone_verified ? ['phone'] : []),
            ...(trustTierScore.factors.identity_verified ? ['identity'] : [])
          ]
        })
      }

      // Upsert civic database entry
      const { error: upsertError } = await supabase
        .from('civic_database_entries')
        .upsert({
          stable_user_id: userId,
          user_hash: userHash,
          total_polls_participated,
          total_votes_cast,
          average_engagement_score,
          current_trust_tier: trustTierScore.trust_tier,
          trust_tier_history: trustTierHistory,
          trust_tier_upgrade_date: existingEntry?.current_trust_tier !== trustTierScore.trust_tier 
            ? new Date().toISOString() 
            : existingEntry?.trust_tier_upgrade_date
        })

      if (upsertError) {
        throw new Error('Failed to update civic database entry')
      }

    } catch (error) {
      devLog('Error updating civic database entry:', error)
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
        const tier = item.trust_tier as TrustTier
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      }, {} as Record<TrustTier, number>) || { T0: 0, T1: 0, T2: 0, T3: 0 }

      // Get average confidence level
      const { data: confidenceData } = await supabase
        .from('trust_tier_analytics')
        .select('confidence_level')

      const averageConfidenceLevel = confidenceData && confidenceData.length > 0
        ? confidenceData.reduce((sum, item) => sum + (item.confidence_level || 0), 0) / confidenceData.length
        : 0

      // Get data quality metrics
      const highQuality = confidenceData?.filter(item => (item.confidence_level || 0) >= 0.8).length || 0
      const mediumQuality = confidenceData?.filter(item => 
        (item.confidence_level || 0) >= 0.5 && (item.confidence_level || 0) < 0.8
      ).length || 0
      const lowQuality = confidenceData?.filter(item => (item.confidence_level || 0) < 0.5).length || 0

      // Get engagement metrics
      const { data: civicEntries } = await supabase
        .from('civic_database_entries')
        .select('total_polls_participated, total_votes_cast')

      const activeUsers = civicEntries?.filter(entry => 
        (entry.total_polls_participated || 0) > 0
      ).length || 0

      const averagePollsParticipated = civicEntries && civicEntries.length > 0
        ? civicEntries.reduce((sum, entry) => sum + (entry.total_polls_participated || 0), 0) / civicEntries.length
        : 0

      const averageVotesCast = civicEntries && civicEntries.length > 0
        ? civicEntries.reduce((sum, entry) => sum + (entry.total_votes_cast || 0), 0) / civicEntries.length
        : 0

      return {
        total_users: totalUsers || 0,
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
      devLog('Error getting analytics summary:', error)
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
        .from('poll_demographic_insights')
        .select('*')
        .eq('poll_id', pollId)
        .single()

      if (insightsError || !insights) {
        throw new Error('Poll insights not found')
      }

      // Get analytics data
      const { data: analytics, error: analyticsError } = await supabase
        .from('trust_tier_analytics')
        .select('*')
        .eq('poll_id', pollId)

      if (analyticsError) {
        throw new Error('Failed to get poll analytics')
      }

      // Calculate metrics
      const total_responses = analytics?.length || 0
      const data_quality_score = analytics?.length > 0
        ? analytics.reduce((sum, a) => sum + (a.data_quality_score || 0), 0) / analytics.length
        : 0
      const confidence_level = analytics?.length > 0
        ? analytics.reduce((sum, a) => sum + (a.confidence_level || 0), 0) / analytics.length
        : 0

      // Calculate trust tier breakdown
      const trustTierBreakdown = analytics?.reduce((acc, item) => {
        acc[item.trust_tier] = (acc[item.trust_tier] || 0) + 1
        return acc
      }, {} as Record<TrustTier, number>) || { T0: 0, T1: 0, T2: 0, T3: 0 }

      return {
        poll_id: pollId,
        total_responses,
        trust_tier_breakdown: trustTierBreakdown,
        demographic_insights: insights as PollDemographicInsights,
        data_quality_score,
        confidence_level,
        response_trends: {
          daily_responses: [] // TODO: Implement daily response tracking
        }
      }

    } catch (error) {
      devLog('Error getting poll analytics:', error)
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (analyticsError) {
        throw new Error('Failed to get user analytics')
      }

      // Get civic database entry
      const { data: civicEntry, error: civicError } = await supabase
        .from('civic_database_entries')
        .select('*')
        .eq('stable_user_id', userId)
        .single()

      if (civicError) {
        throw new Error('Failed to get civic database entry')
      }

      // Get latest demographic data
      const latestAnalytics = analytics?.[0]

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
          total_polls_participated: civicEntry?.total_polls_participated || 0,
          total_votes_cast: civicEntry?.total_votes_cast || 0,
          average_engagement_score: civicEntry?.average_engagement_score || 0,
          last_activity: latestAnalytics?.last_activity || new Date().toISOString()
        },
        demographic_data: {
          age_group: latestAnalytics?.age_group,
          geographic_region: latestAnalytics?.geographic_region,
          education_level: latestAnalytics?.education_level,
          income_bracket: latestAnalytics?.income_bracket,
          political_affiliation: latestAnalytics?.political_affiliation
        }
      }

    } catch (error) {
      devLog('Error getting user analytics:', error)
      throw error
    }
  }

  /**
   * Generate anonymized user hash
   */
  private async generateUserHash(userId: string): Promise<string> {
    // Simple hash generation - in production, use proper cryptographic hashing
    const encoder = new TextEncoder()
    const data = encoder.encode(userId + process.env.ANALYTICS_SALT || 'default-salt')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
