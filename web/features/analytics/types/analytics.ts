/**
 * Trust Tier Analytics System Types
 * Comprehensive type definitions for the analytics system
 */

export type TrustTierAnalytics = {
  id: string
  user_id: string
  poll_id?: string
  trust_tier: TrustTier
  age_group?: string
  geographic_region?: string
  education_level?: string
  income_bracket?: string
  political_affiliation?: string
  voting_history_count: number
  biometric_verified: boolean
  phone_verified: boolean
  identity_verified: boolean
  verification_methods: string[]
  data_quality_score: number
  confidence_level: number
  last_activity?: string
  created_at: string
  updated_at: string
}

export type PollDemographicInsights = {
  id: string
  poll_id: string
  total_responses: number
  trust_tier_breakdown: Record<TrustTier, number>
  age_group_breakdown: Record<string, number>
  geographic_breakdown: Record<string, number>
  education_breakdown: Record<string, number>
  income_breakdown: Record<string, number>
  political_breakdown: Record<string, number>
  average_confidence_level?: number
  data_quality_distribution: Record<string, number>
  verification_method_distribution: Record<string, number>
  trust_tier_by_demographic: Record<string, Record<TrustTier, number>>
  demographic_by_trust_tier: Record<TrustTier, Record<string, number>>
  created_at: string
  updated_at: string
}

export type CivicDatabaseEntry = {
  id: string
  user_hash: string
  stable_user_id: string
  total_polls_participated: number
  total_votes_cast: number
  average_engagement_score?: number
  current_trust_tier: TrustTier
  trust_tier_history: TrustTierHistoryEntry[]
  trust_tier_upgrade_date?: string
  representative_district?: string
  representative_id?: string
  last_representative_contact?: string
  data_sharing_consent: boolean
  consent_date?: string
  consent_version?: string
  created_at: string
  updated_at: string
}

export type TrustTierHistoryEntry = {
  trust_tier: TrustTier
  upgrade_date: string
  reason: string
  verification_methods: string[]
}

export type TrustTier = 'T0' | 'T1' | 'T2' | 'T3'

export type TrustTierScore = {
  score: number
  trust_tier: TrustTier
  factors: {
    biometric_verified: boolean
    phone_verified: boolean
    identity_verified: boolean
    voting_history_count: number
  }
}

export type AnalyticsFilters = {
  trust_tiers?: TrustTier[]
  age_groups?: string[]
  geographic_regions?: string[]
  education_levels?: string[]
  income_brackets?: string[]
  political_affiliations?: string[]
  date_range?: {
    start: string
    end: string
  }
}

export type AnalyticsSummary = {
  total_users: number
  trust_tier_distribution: Record<TrustTier, number>
  average_confidence_level: number
  data_quality_metrics: {
    high_quality: number
    medium_quality: number
    low_quality: number
  }
  engagement_metrics: {
    active_users: number
    average_polls_participated: number
    average_votes_cast: number
  }
}

export type PollAnalytics = {
  poll_id: string
  total_responses: number
  trust_tier_breakdown: Record<TrustTier, number>
  demographic_insights: PollDemographicInsights
  data_quality_score: number
  confidence_level: number
  response_trends: {
    daily_responses: Array<{
      date: string
      count: number
    }>
  }
}

export type UserAnalytics = {
  user_id: string
  trust_tier: TrustTier
  trust_tier_score: number
  verification_status: {
    biometric_verified: boolean
    phone_verified: boolean
    identity_verified: boolean
  }
  engagement_metrics: {
    total_polls_participated: number
    total_votes_cast: number
    average_engagement_score: number
    last_activity: string
  }
  demographic_data: {
    age_group?: string
    geographic_region?: string
    education_level?: string
    income_bracket?: string
    political_affiliation?: string
  }
}

export type AnalyticsExport = {
  export_id: string
  export_type: 'poll_analytics' | 'user_analytics' | 'demographic_insights'
  filters: AnalyticsFilters
  data: TrustTierAnalytics[] | PollDemographicInsights[] | UserAnalytics[]
  created_at: string
  expires_at: string
}

export type AnalyticsDashboard = {
  summary: AnalyticsSummary
  recent_polls: PollAnalytics[]
  top_insights: {
    most_engaged_trust_tier: TrustTier
    highest_quality_data_source: string
    trending_demographic: string
  }
  charts: {
    trust_tier_distribution: Array<{
      trust_tier: TrustTier
      count: number
      percentage: number
    }>
    engagement_trends: Array<{
      date: string
      active_users: number
      new_registrations: number
    }>
    data_quality_distribution: Array<{
      quality_level: string
      count: number
      percentage: number
    }>
  }
}

// ---------------------------------------------------------------------------
// Enhanced Analytics Feature Types
// ---------------------------------------------------------------------------

export type AnalyticsDateRange = '7d' | '30d' | '90d'

export type DemographicsCategory = 'trust' | 'age' | 'district' | 'education'

export type TrustTierBreakdown = {
  tier: string
  count: number
  percentage: number
}

export type AgeGroupBreakdown = {
  ageGroup: string
  count: number
  percentage: number
}

export type DistrictBreakdown = {
  district: string
  count: number
  percentage: number
}

export type EducationBreakdown = {
  level: string
  count: number
  percentage: number
}

export type DemographicsData = {
  ok: boolean
  trustTiers: TrustTierBreakdown[]
  ageGroups: AgeGroupBreakdown[]
  districts: DistrictBreakdown[]
  education: EducationBreakdown[]
  totalUsers: number
  privacyOptOuts: number
  k_anonymity: number
}

export type TrendDataPoint = {
  date: string
  votes: number
  participation: number
  velocity: number
}

export type TrendsDataset = {
  range: AnalyticsDateRange
  points: TrendDataPoint[]
}

export type TemporalHourlyData = {
  hour: number
  activity: number
  label: string
}

export type TemporalDailyData = {
  day: string
  activity: number
  dayIndex: number
}

export type TemporalVelocityPoint = {
  timestamp: string
  velocity: number
}

export type TemporalAnalyticsData = {
  ok: boolean
  hourly: TemporalHourlyData[]
  daily: TemporalDailyData[]
  velocity: TemporalVelocityPoint[]
  peakHour: number
  peakDay: string
  avgActivity: number
}

export type PollHeatmapEntry = {
  poll_id: string
  title: string
  category: string
  total_votes: number
  unique_voters: number
  engagement_score: number
  created_at: string
  is_active: boolean
}

export type PollHeatmapFilters = {
  category: string
  limit: number
}

export type PollHeatmapData = {
  ok: boolean
  polls: PollHeatmapEntry[]
  categories: string[]
}

export type TrustTierMetrics = {
  tier: string
  tierName: string
  userCount: number
  participationRate: number
  completionRate: number
  avgEngagement: number
  botLikelihood: number
  avgPollsVoted: number
  avgTimeOnSite: number
}

export type TrustTierComparisonData = {
  ok: boolean
  tiers: TrustTierMetrics[]
  totalUsers: number
  insights: string[]
}

export type AnalyticsAsyncState<TData, TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  data: TData
  loading: boolean
  error: string | null
  lastUpdated: string | null
  meta: TMeta
}
