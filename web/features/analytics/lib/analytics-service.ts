import { normalizeTrustTier } from '@/lib/trust/trust-tiers'
import { devLog } from '@/lib/utils/logger'
import type { Database } from '@/types/database'
import type {
  TrustTier,
  TrustTierScore,
  PollDemographicInsights,
  AnalyticsSummary,
  PollAnalytics,
  TrustTierHistoryEntry,
  UserAnalytics
} from '@/types/features/analytics'
import { getSupabaseServerClient } from '@/utils/supabase/server'


// Use database types for actual schema

type _TrustTierAnalyticsRow = Database['public']['Tables']['trust_tier_analytics']['Row']
type _UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
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
  voting_history_count?: number;
  verification_methods?: string[];
  last_activity?: string;
}

type TrustTierAnalyticsRecord = {
  id: string;
  user_id: string;
  poll_id: string | null;
  trust_tier: TrustTier;
  trust_score: number | null;
  factors: TrustTierAnalyticsFactors | null;
  created_at: string | null;
  calculated_at?: string | null;
};

type TrustTierAnalyticsInsertPayload = {
  user_id: string;
  poll_id: string;
  trust_tier: TrustTier;
  trust_score: number;
  factors: TrustTierAnalyticsFactors;
  calculated_at: string;
};

type CivicDatabaseEntrySnapshot = {
  id: string;
  current_trust_tier: TrustTier | null;
  trust_tier_history: TrustTierHistoryEntry[];
  trust_tier_upgrade_date: string | null;
};

type CivicDatabaseEntryUpsertPayload = {
  stable_user_id: string;
  user_hash: string;
  total_polls_participated: number;
  total_votes_cast: number;
  average_engagement_score: number;
  current_trust_tier: TrustTier;
  trust_tier_history: TrustTierHistoryEntry[];
  trust_tier_upgrade_date: string | null;
};

type ErrorWithCode = Error & { code?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const items = value.filter((entry): entry is string => typeof entry === 'string');
  return items.length > 0 ? items : undefined;
};

const parseTrustTierFactors = (value: unknown): TrustTierAnalyticsFactors | null => {
  if (!isRecord(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const factors: TrustTierAnalyticsFactors = {};

  if (typeof record.confidence_level === 'number') {
    factors.confidence_level = record.confidence_level;
  }
  if (typeof record.data_quality_score === 'number') {
    factors.data_quality_score = record.data_quality_score;
  }
  if (typeof record.age_group === 'string') {
    factors.age_group = record.age_group;
  }
  if (typeof record.geographic_region === 'string') {
    factors.geographic_region = record.geographic_region;
  }
  if (typeof record.education_level === 'string') {
    factors.education_level = record.education_level;
  }
  if (typeof record.income_bracket === 'string') {
    factors.income_bracket = record.income_bracket;
  }
  if (typeof record.political_affiliation === 'string') {
    factors.political_affiliation = record.political_affiliation;
  }
  if (typeof record.biometric_verified === 'boolean') {
    factors.biometric_verified = record.biometric_verified;
  }
  if (typeof record.phone_verified === 'boolean') {
    factors.phone_verified = record.phone_verified;
  }
  if (typeof record.identity_verified === 'boolean') {
    factors.identity_verified = record.identity_verified;
  }
  if (typeof record.voting_history_count === 'number') {
    factors.voting_history_count = record.voting_history_count;
  }
  const verificationMethods = toStringArray(record.verification_methods);
  if (verificationMethods) {
    factors.verification_methods = verificationMethods;
  }
  if (typeof record.last_activity === 'string') {
    factors.last_activity = record.last_activity;
  }

  return Object.keys(factors).length > 0 ? factors : null;
};

const parseTrustTierAnalyticsRow = (value: unknown): TrustTierAnalyticsRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const trustTierValue = record.trust_tier;
  const trustTier =
    typeof trustTierValue === 'string' || typeof trustTierValue === 'number'
      ? normalizeTrustTier(trustTierValue)
      : null;
  const userId = typeof record.user_id === 'string' ? record.user_id : null;

  if (!trustTier || !userId) {
    return null;
  }

  return {
    id: typeof record.id === 'string' ? record.id : 'unknown',
    user_id: userId,
    poll_id: typeof record.poll_id === 'string' ? record.poll_id : null,
    trust_tier: trustTier,
    trust_score: typeof record.trust_score === 'number' ? record.trust_score : null,
    factors: parseTrustTierFactors(record.factors),
    created_at: typeof record.created_at === 'string' ? record.created_at : null,
    calculated_at: typeof record.calculated_at === 'string' ? record.calculated_at : null
  };
};

const parseTrustTierHistory = (value: unknown): TrustTierHistoryEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<TrustTierHistoryEntry[]>((entries, candidate) => {
    if (!isRecord(candidate)) {
      return entries;
    }

    const record = candidate as Record<string, unknown>;
    const trustTierValue = record.trust_tier;
    const trustTier =
      typeof trustTierValue === 'string' || typeof trustTierValue === 'number'
        ? normalizeTrustTier(trustTierValue)
        : undefined;
    const upgradeDate = typeof record.upgrade_date === 'string' ? record.upgrade_date : undefined;
    const reason = typeof record.reason === 'string' ? record.reason : undefined;
    const verificationMethods = toStringArray(record.verification_methods) ?? [];

    if (trustTier && upgradeDate && reason) {
      entries.push({
        trust_tier: trustTier,
        upgrade_date: upgradeDate,
        reason,
        verification_methods: verificationMethods
      });
    }

    return entries;
  }, []);
};

const parseCivicDatabaseEntry = (value: unknown): CivicDatabaseEntrySnapshot | null => {
  if (!isRecord(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    id: typeof record.id === 'string' ? record.id : 'unknown',
    current_trust_tier:
      typeof record.current_trust_tier === 'string' || typeof record.current_trust_tier === 'number'
        ? normalizeTrustTier(record.current_trust_tier)
        : null,
    trust_tier_history: parseTrustTierHistory(record.trust_tier_history),
    trust_tier_upgrade_date: typeof record.trust_tier_upgrade_date === 'string' ? record.trust_tier_upgrade_date : null
  };
};

const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return (error as { code?: string }).code;
  }
  return undefined;
};


export class AnalyticsService {
  private static instance: AnalyticsService

  private constructor() {
    devLog('AnalyticsService initialized')
  }

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
        .eq('id', userId)
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
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate verification factors
      const biometric_verified = (biometricCreds?.length ?? 0) > 0
      const currentTrustTier =
        user && 'trust_tier' in user ? normalizeTrustTier(user.trust_tier) : 'T0'
      const phone_verified = currentTrustTier === 'T2' || currentTrustTier === 'T3'
      const identity_verified = currentTrustTier === 'T3'
      const voting_history_count = votingHistory ?? 0

      // Calculate score using database function
      const { data: scoreResult, error: scoreError } = await supabase
        .rpc('calculate_user_trust_tier', { p_user_id: userId });

      if (scoreError) {
        throw new Error('Failed to calculate trust tier score')
      }

      const score = typeof scoreResult === 'number' ? scoreResult : 0

      // Determine trust tier using available function
      const { data: tierResult, error: tierError } = await supabase
        .rpc('get_trust_tier_progression', { p_user_id: userId })

      if (tierError) {
        throw new Error('Failed to determine trust tier')
      }

      const trust_tier =
        Array.isArray(tierResult) && tierResult.length > 0
          ? normalizeTrustTier(tierResult[0])
          : currentTrustTier

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
      const factorPayload: TrustTierAnalyticsInsertPayload['factors'] = {
        voting_history_count: trustTierScore.factors.voting_history_count,
        biometric_verified: trustTierScore.factors.biometric_verified,
        phone_verified: trustTierScore.factors.phone_verified,
        identity_verified: trustTierScore.factors.identity_verified,
        verification_methods: verificationMethods,
        data_quality_score: trustTierScore.score,
        confidence_level: trustTierScore.score,
        last_activity: new Date().toISOString()
      };

      if (demographicData?.age_group) {
        factorPayload.age_group = demographicData.age_group;
      }
      if (demographicData?.geographic_region) {
        factorPayload.geographic_region = demographicData.geographic_region;
      }
      if (demographicData?.education_level) {
        factorPayload.education_level = demographicData.education_level;
      }
      if (demographicData?.income_bracket) {
        factorPayload.income_bracket = demographicData.income_bracket;
      }
      if (demographicData?.political_affiliation) {
        factorPayload.political_affiliation = demographicData.political_affiliation;
      }

      const insertPayload: TrustTierAnalyticsInsertPayload = {
        user_id: userId,
        poll_id: pollId,
        trust_tier: trustTierScore.trust_tier,
        trust_score: trustTierScore.score,
        factors: factorPayload,
        calculated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('trust_tier_analytics')
        .insert(insertPayload)

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
   * Calls RPC function to update poll demographic insights
   *
   * Gracefully handles missing `update_poll_demographic_insights` function.
   * Logs warning and continues if function doesn't exist (no throw).
   *
   * @param pollId - Poll UUID
   * @throws {Error} If database connection unavailable
   */
  async updatePollDemographicInsights(pollId: string): Promise<void> {
    try {
      const supabase = await getSupabaseServerClient()
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      // Call database function to update insights
      try {
        const { error } = await supabase
          .rpc('update_poll_demographic_insights', { p_poll_id: pollId })

        if (error) {
          // Check if it's a "function does not exist" error
          if (error.message?.includes('function') && error.message?.includes('does not exist')) {
            devLog('Warning: update_poll_demographic_insights function not yet implemented. Skipping demographic insights update.')
            return // Gracefully skip if function doesn't exist yet
          }
          throw new Error(`Failed to update poll demographic insights: ${error.message}`)
        }
      } catch (rpcError: unknown) {
        // Gracefully handle missing function
        if (rpcError instanceof Error && rpcError.message?.includes('does not exist')) {
          devLog('Warning: update_poll_demographic_insights function not available. Skipping (environment mismatch).')
          return
        }
        throw rpcError
      }
    } catch (error) {
      devLog('Error updating poll demographic insights:', { error })
      // Don't throw - log and continue to prevent cascading failures
    }
  }

  /**
   * Updates civic database entry with user engagement metrics
   *
   * Tracks polls participated, votes cast, engagement score, trust tier,
   * and trust tier history. Gracefully handles missing `civic_database_entries`
   * table by logging warning and continuing (no throw).
   *
   * @param userId - User UUID
   * @param _pollId - Reserved for future use
   * @throws {Error} If database connection unavailable
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

      const analyticsRows = (analytics ?? [])
        .map(parseTrustTierAnalyticsRow)
        .filter((row): row is TrustTierAnalyticsRecord => row !== null)

      // Calculate engagement metrics
      const total_polls_participated = analyticsRows.length
      const total_votes_cast = analyticsRows.length
      const average_engagement_score = analyticsRows.length > 0
        ? analyticsRows.reduce((sum, row) => sum + (row.trust_score ?? 0), 0) / analyticsRows.length
        : 0

      // Get current trust tier
      const trustTierScore = await this.calculateTrustTierScore(userId)

      // Generate user hash (anonymized)
      const userHash = await this.generateUserHash(userId)

      const verificationMethods: string[] = []
      if (trustTierScore.factors.biometric_verified) verificationMethods.push('biometric')
      if (trustTierScore.factors.phone_verified) verificationMethods.push('phone')
      if (trustTierScore.factors.identity_verified) verificationMethods.push('identity')

      // Check if civic database entry exists
      try {
        const { data: existingEntry, error: selectError } = await supabase
          .from('civic_database_entries')
          .select('id, current_trust_tier, trust_tier_history, trust_tier_upgrade_date')
          .eq('stable_user_id', userId)
          .maybeSingle() // Use maybeSingle to avoid error if no rows

        if (selectError) {
          // Check if table doesn't exist
          const message = selectError.message ?? ''
          if (message.includes('does not exist') || selectError.code === '42P01') {
            devLog('Warning: civic_database_entries table not yet implemented. Skipping civic database update. Migration needed.')
            return
          }
          throw selectError
        }

        const civicEntry = parseCivicDatabaseEntry(existingEntry)
        const trustTierHistory: TrustTierHistoryEntry[] = civicEntry?.trust_tier_history ?? []

        // Add new trust tier entry if changed
        if (!civicEntry || civicEntry.current_trust_tier !== trustTierScore.trust_tier) {
          trustTierHistory.push({
            trust_tier: trustTierScore.trust_tier,
            upgrade_date: new Date().toISOString(),
            reason: 'Analytics update',
            verification_methods: verificationMethods
          })
        }

        // Upsert civic database entry
        const upsertPayload: CivicDatabaseEntryUpsertPayload = {
          stable_user_id: userId,
          user_hash: userHash,
          total_polls_participated,
          total_votes_cast,
          average_engagement_score,
          current_trust_tier: trustTierScore.trust_tier,
          trust_tier_history: trustTierHistory,
          trust_tier_upgrade_date: (!civicEntry || civicEntry.current_trust_tier !== trustTierScore.trust_tier)
            ? new Date().toISOString()
            : civicEntry.trust_tier_upgrade_date
        }

        const { error: upsertError } = await supabase
          .from('civic_database_entries')
          .upsert(upsertPayload)

        if (upsertError) {
          throw new Error(`Failed to update civic database entry: ${upsertError.message}`)
        }
      } catch (tableError: unknown) {
        // Gracefully handle missing table
        const message = tableError instanceof Error ? tableError.message : ''
        if (message.includes('does not exist') || getErrorCode(tableError) === '42P01') {
          devLog('Warning: civic_database_entries table unavailable. Skipping (environment mismatch).')
          return
        }
        throw tableError
      }

    } catch (error) {
      devLog('Error updating civic database entry:', { error })
      // Log but don't throw to prevent cascading failures
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

      const trustTierCounts = (tierDistribution ?? []).reduce<Record<TrustTier, number>>((acc, item) => {
        if (isRecord(item) && typeof item.trust_tier === 'string') {
          const tier = item.trust_tier as TrustTier
          acc[tier] = (acc[tier] ?? 0) + 1
        }
        return acc
      }, { T0: 0, T1: 0, T2: 0, T3: 0 })

      // Get average confidence level
      const { data: confidenceData, error: confidenceError } = await supabase
        .from('trust_tier_analytics')
        .select('*')

      if (confidenceError) {
        throw new Error('Failed to load confidence analytics')
      }

      const confidenceRows = (confidenceData ?? [])
        .map(parseTrustTierAnalyticsRow)
        .filter((row): row is TrustTierAnalyticsRecord => row !== null)

      const averageConfidenceLevel = confidenceRows.length > 0
        ? confidenceRows.reduce((sum, item) => sum + (item.factors?.confidence_level ?? 0), 0) / confidenceRows.length
        : 0

      // Get data quality metrics
      const highQuality = confidenceRows.filter(item => (item.factors?.confidence_level ?? 0) >= 0.8).length
      const mediumQuality = confidenceRows.filter(item => {
        const confidence = item.factors?.confidence_level ?? 0
        return confidence >= 0.5 && confidence < 0.8
      }).length
      const lowQuality = confidenceRows.filter(item => (item.factors?.confidence_level ?? 0) < 0.5).length

      // Get engagement metrics from platform_analytics
      const { data: platformData, error: platformError } = await supabase
        .from('platform_analytics')
        .select('metric_name, metric_value')
        .in('metric_name', ['unique_users', 'total_sessions', 'total_page_views'])

      if (platformError) {
        throw new Error('Failed to load platform analytics')
      }

      const metrics = (platformData ?? []).reduce<Record<string, number>>((acc, item) => {
        if (isRecord(item) && typeof item.metric_name === 'string' && typeof item.metric_value === 'number') {
          acc[item.metric_name] = item.metric_value
        }
        return acc
      }, {})

      const activeUsers = metrics.unique_users ?? 0
      const averagePollsParticipated = metrics.total_sessions ?? 0
      const averageVotesCast = metrics.total_page_views ?? 0

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

      // Get poll basic info
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .select('id, title, question, created_at, total_votes, participation')
        .eq('id', pollId)
        .single()

      if (pollError || !pollData) {
        throw new Error('Poll not found')
      }

      // Prefer precomputed demographic insights
      const { data: precomputed, error: preError } = await supabase
        .from('poll_demographic_insights')
        .select('*')
        .eq('poll_id', pollId)
        .maybeSingle()

      if (!preError && precomputed) {
        const trustTierBreakdown = (precomputed.trust_tier_breakdown ?? { T0: 0, T1: 0, T2: 0, T3: 0 }) as Record<TrustTier, number>
        const demographicInsights: PollDemographicInsights = {
          id: pollData.id,
          poll_id: pollData.id,
          total_responses: precomputed.total_responses ?? 0,
          trust_tier_breakdown: trustTierBreakdown,
          age_group_breakdown: (precomputed.age_group_breakdown ?? {}) as Record<string, number>,
          geographic_breakdown: (precomputed.geographic_breakdown ?? {}) as Record<string, number>,
          education_breakdown: (precomputed.education_breakdown ?? {}) as Record<string, number>,
          income_breakdown: (precomputed.income_breakdown ?? {}) as Record<string, number>,
          political_breakdown: (precomputed.political_breakdown ?? {}) as Record<string, number>,
          average_confidence_level: Number(precomputed.average_confidence_level ?? 0),
          data_quality_distribution: (precomputed.data_quality_distribution ?? {}) as Record<string, number>,
          verification_method_distribution: (precomputed.verification_method_distribution ?? {}) as Record<string, number>,
          trust_tier_by_demographic: (precomputed.trust_tier_by_demographic ?? {}) as Record<string, Record<TrustTier, number>>,
          demographic_by_trust_tier: (precomputed.demographic_by_trust_tier ?? { T0: {}, T1: {}, T2: {}, T3: {} }) as Record<TrustTier, Record<string, number>>,
          created_at: precomputed.created_at ?? pollData.created_at ?? new Date().toISOString(),
          updated_at: precomputed.updated_at ?? new Date().toISOString()
        }

        return {
          poll_id: pollId,
          total_responses: demographicInsights.total_responses,
          trust_tier_breakdown: trustTierBreakdown,
          demographic_insights: demographicInsights,
          data_quality_score: demographicInsights.average_confidence_level, // proxy
          confidence_level: demographicInsights.average_confidence_level,
          response_trends: {
            daily_responses: await this.getDailyResponseTrends(pollId)
          }
        }
      }

      // Fallback: compute from votes table
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('trust_tier, vote_status, created_at')
        .eq('poll_id', pollId)

      if (votesError) {
        throw new Error('Failed to get poll votes')
      }

      // Calculate metrics from votes data
      const total_responses = votesData?.length ?? 0
      const data_quality_score = votesData && votesData.length > 0
        ? votesData.reduce((sum, vote) => {
            const tier = vote.trust_tier ?? 1
            return sum + (tier >= 3 ? 1 : tier >= 2 ? 0.7 : 0.3)
          }, 0) / votesData.length
        : 0
      const confidence_level = votesData && votesData.length > 0
        ? votesData.reduce((sum, vote) => {
            const tier = vote.trust_tier ?? 1
            return sum + (tier >= 3 ? 0.9 : tier >= 2 ? 0.7 : 0.5)
          }, 0) / votesData.length
        : 0

      // Calculate trust tier breakdown from votes
      const voteRows: Array<{ trust_tier: number | null }> = Array.isArray(votesData)
        ? (votesData as Array<{ trust_tier: number | null }>)
        : [];

      const trustTierBreakdown: Record<TrustTier, number> = {
        T0: 0,
        T1: 0,
        T2: 0,
        T3: 0
      }

      voteRows.forEach((vote) => {
        const tierValue = vote.trust_tier ?? 1
        const tierKey = `T${tierValue}` as TrustTier
        if (tierKey in trustTierBreakdown) {
          trustTierBreakdown[tierKey] += 1
        }
      })

      const demographicInsights: PollDemographicInsights = {
        id: pollData.id,
        poll_id: pollData.id,
        total_responses,
        trust_tier_breakdown: trustTierBreakdown,
        age_group_breakdown: {},
        geographic_breakdown: {},
        education_breakdown: {},
        income_breakdown: {},
        political_breakdown: {},
        average_confidence_level: confidence_level,
        data_quality_distribution: {},
        verification_method_distribution: {},
        trust_tier_by_demographic: {} as Record<string, Record<TrustTier, number>>,
        demographic_by_trust_tier: {
          T0: {},
          T1: {},
          T2: {},
          T3: {}
        },
        created_at: pollData.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return {
        poll_id: pollId,
        total_responses,
        trust_tier_breakdown: trustTierBreakdown,
        demographic_insights: demographicInsights,
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
        .eq('user_id', userId)
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
      const analyticsRows = (analytics ?? [])
        .map(parseTrustTierAnalyticsRow)
        .filter((row): row is TrustTierAnalyticsRecord => row !== null)

      const latestAnalytics = analyticsRows[0]

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
          total_polls_participated: analyticsRows.length,
          total_votes_cast: analyticsRows.length,
          average_engagement_score: analyticsRows.length > 0 ? analyticsRows.reduce((sum, row) => sum + (row.trust_score ?? 0), 0) / analyticsRows.length : 0,
          last_activity: latestAnalytics?.created_at ?? new Date().toISOString()
        },
        demographic_data: (() => {
          const factors = latestAnalytics?.factors ?? {};
          const demographic: Record<string, string> = {};
          if (factors.age_group) demographic.age_group = factors.age_group;
          if (factors.geographic_region) demographic.geographic_region = factors.geographic_region;
          if (factors.education_level) demographic.education_level = factors.education_level;
          if (factors.income_bracket) demographic.income_bracket = factors.income_bracket;
          if (factors.political_affiliation) demographic.political_affiliation = factors.political_affiliation;
          return demographic;
        })()
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
        .eq('poll_id', pollId)
        .gte('created_at', thirtyDaysAgo.toISOString())

      if (error) {
        throw new Error('Failed to get daily response trends')
      }

      // Group by date and count
      const dailyCounts = new Map<string, number>()
      const trendRows: Array<{ created_at: string | null }> = Array.isArray(trends)
        ? (trends as Array<{ created_at: string | null }>)
        : []

      trendRows.forEach((trend) => {
        const createdAt = trend.created_at;
        if (typeof createdAt === 'string') {
          const isoString = new Date(createdAt).toISOString();
          const [dateKeyRaw] = isoString.split('T', 1);
          const dateKey = dateKeyRaw ?? isoString;
          dailyCounts.set(dateKey, (dailyCounts.get(dateKey) ?? 0) + 1);
        }
      });

      const dailyResponses: Array<{ date: string; count: number }> = Array.from(
        dailyCounts.entries()
      ).map(
        ([date, count]): { date: string; count: number } => ({
          date,
          count
        })
      )

      dailyResponses.sort((a, b) => a.date.localeCompare(b.date))
      return dailyResponses
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

