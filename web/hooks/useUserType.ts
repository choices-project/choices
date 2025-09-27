import { useState, useEffect, useCallback } from 'react'
import { devLog } from '@/lib/logger'

// Types
export type UserType = 'newcomer' | 'active' | 'power_user' | 'influencer' | 'admin'

export type UserBehavior = {
  login_frequency: number
  polls_created: number
  votes_cast: number
  comments_made: number
  session_duration: number
  sessions: number
  feature_usage: Record<string, number>
  last_active: string
  total_sessions: number
  is_admin?: boolean
}

export type SegmentationData = {
  user_type: UserType
  confidence_score: number
  behavior_metrics: UserBehavior
  recommendations: string[]
  next_milestone: string
  type_changed_at: string
}

export type UserTypeThresholds = {
  newcomer: {
    max_polls_created: number
    max_votes_cast: number
    max_sessions: number
  }
  active: {
    min_polls_created: number
    min_votes_cast: number
    min_sessions: number
    max_polls_created: number
  }
  power_user: {
    min_polls_created: number
    min_votes_cast: number
    min_sessions: number
    min_feature_usage: number
  }
  influencer: {
    min_polls_created: number
    min_votes_cast: number
    min_engagement_rate: number
    min_followers: number
  }
  admin: {
    is_admin: boolean
  }
}

const DEFAULT_THRESHOLDS: UserTypeThresholds = {
  newcomer: {
    max_polls_created: 0,
    max_votes_cast: 5,
    max_sessions: 3
  },
  active: {
    min_polls_created: 1,
    min_votes_cast: 6,
    min_sessions: 4,
    max_polls_created: 10
  },
  power_user: {
    min_polls_created: 11,
    min_votes_cast: 50,
    min_sessions: 20,
    min_feature_usage: 5
  },
  influencer: {
    min_polls_created: 25,
    min_votes_cast: 100,
    min_engagement_rate: 0.8,
    min_followers: 50
  },
  admin: {
    is_admin: true
  }
}

const TYPE_RECOMMENDATIONS: Record<UserType, string[]> = {
  newcomer: [
    'Complete your profile to get personalized recommendations',
    'Try voting on a few polls to see how the platform works',
    'Explore different poll categories to find what interests you'
  ],
  active: [
    'Create your first poll to engage with the community',
    'Try advanced features like poll analytics',
    'Connect with other active users in your areas of interest'
  ],
  power_user: [
    'Share your expertise by creating high-quality polls',
    'Mentor newcomers and help them get started',
    'Explore advanced analytics and insights'
  ],
  influencer: [
    'Lead community discussions on important topics',
    'Create polls that drive meaningful conversations',
    'Share your insights and help shape the platform'
  ],
  admin: [
    'Monitor platform health and user engagement',
    'Support community moderation and guidelines',
    'Provide feedback on platform improvements'
  ]
}

const TYPE_MILESTONES: Record<UserType, string> = {
  newcomer: 'Become an active user by voting on 5+ polls',
  active: 'Become a power user by creating 10+ polls',
  power_user: 'Become an influencer by reaching 100+ votes',
  influencer: 'Maintain your influence and help grow the community',
  admin: 'Continue supporting the platform and community'
}

export function useUserType(userId?: string) {
  const [segmentationData, setSegmentationData] = useState<SegmentationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateUserType = useCallback((behavior: UserBehavior): UserType => {
    const { polls_created, votes_cast, sessions, feature_usage } = behavior
    
    // Check for admin first (special case)
    if (behavior.is_admin) {
      return 'admin'
    }

    // Calculate engagement rate
    const engagement_rate = votes_cast > 0 ? (polls_created / votes_cast) : 0
    const total_features_used = Object.keys(feature_usage).length

    // Check influencer criteria
    if (polls_created >= DEFAULT_THRESHOLDS.influencer.min_polls_created &&
        votes_cast >= DEFAULT_THRESHOLDS.influencer.min_votes_cast &&
        engagement_rate >= DEFAULT_THRESHOLDS.influencer.min_engagement_rate) {
      return 'influencer'
    }

    // Check power user criteria
    if (polls_created >= DEFAULT_THRESHOLDS.power_user.min_polls_created &&
        votes_cast >= DEFAULT_THRESHOLDS.power_user.min_votes_cast &&
        sessions >= DEFAULT_THRESHOLDS.power_user.min_sessions &&
        total_features_used >= DEFAULT_THRESHOLDS.power_user.min_feature_usage) {
      return 'power_user'
    }

    // Check active user criteria
    if (polls_created >= DEFAULT_THRESHOLDS.active.min_polls_created &&
        votes_cast >= DEFAULT_THRESHOLDS.active.min_votes_cast &&
        sessions >= DEFAULT_THRESHOLDS.active.min_sessions &&
        polls_created <= DEFAULT_THRESHOLDS.active.max_polls_created) {
      return 'active'
    }

    // Default to newcomer
    return 'newcomer'
  }, [])

  const calculateConfidenceScore = useCallback((behavior: UserBehavior, userType: UserType): number => {
    let score = 0
    let totalChecks = 0

    switch (userType) {
      case 'newcomer':
        const newcomerThresholds = DEFAULT_THRESHOLDS.newcomer
        if (behavior.polls_created <= newcomerThresholds.max_polls_created) score++
        if (behavior.votes_cast <= newcomerThresholds.max_votes_cast) score++
        if (behavior.sessions <= newcomerThresholds.max_sessions) score++
        totalChecks = 3
        break

      case 'active':
        const activeThresholds = DEFAULT_THRESHOLDS.active
        if (behavior.polls_created >= activeThresholds.min_polls_created) score++
        if (behavior.votes_cast >= activeThresholds.min_votes_cast) score++
        if (behavior.sessions >= activeThresholds.min_sessions) score++
        if (behavior.polls_created <= activeThresholds.max_polls_created) score++
        totalChecks = 4
        break

      case 'power_user':
        const powerUserThresholds = DEFAULT_THRESHOLDS.power_user
        if (behavior.polls_created >= powerUserThresholds.min_polls_created) score++
        if (behavior.votes_cast >= powerUserThresholds.min_votes_cast) score++
        if (behavior.sessions >= powerUserThresholds.min_sessions) score++
        if (Object.keys(behavior.feature_usage).length >= powerUserThresholds.min_feature_usage) score++
        totalChecks = 4
        break

      case 'influencer':
        const influencerThresholds = DEFAULT_THRESHOLDS.influencer
        if (behavior.polls_created >= influencerThresholds.min_polls_created) score++
        if (behavior.votes_cast >= influencerThresholds.min_votes_cast) score++
        const engagement_rate = behavior.votes_cast > 0 ? (behavior.polls_created / behavior.votes_cast) : 0
        if (engagement_rate >= influencerThresholds.min_engagement_rate) score++
        totalChecks = 3
        break

      case 'admin':
        score = 1
        totalChecks = 1
        break
    }

    return totalChecks > 0 ? (score / totalChecks) * 100 : 0
  }, [])

  const fetchUserBehavior = useCallback(async (userId: string): Promise<UserBehavior> => {
    try {
      const response = await fetch(`/api/user/behavior/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user behavior')
      }
      
      const data = await response.json()
      return data.behavior
    } catch (error) {
      devLog('Error fetching user behavior:', error)
      // Return default behavior for new users
      return {
        login_frequency: 0,
        polls_created: 0,
        votes_cast: 0,
        comments_made: 0,
        session_duration: 0,
        sessions: 0,
        feature_usage: {},
        last_active: new Date().toISOString(),
        total_sessions: 0
      }
    }
  }, [])

  const loadUserType = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const behavior = await fetchUserBehavior(userId)
      const userType = calculateUserType(behavior)
      const confidenceScore = calculateConfidenceScore(behavior, userType)

      const segmentationData: SegmentationData = {
        user_type: userType,
        confidence_score: confidenceScore,
        behavior_metrics: behavior,
        recommendations: TYPE_RECOMMENDATIONS[userType],
        next_milestone: TYPE_MILESTONES[userType],
        type_changed_at: new Date().toISOString()
      }

      setSegmentationData(segmentationData)
    } catch (error) {
      devLog('Error loading user type:', error)
      setError('Failed to load user type data')
    } finally {
      setIsLoading(false)
    }
  }, [userId, calculateUserType, calculateConfidenceScore, fetchUserBehavior])

  const updateUserType = useCallback(async (newType: UserType) => {
    if (!userId) return

    try {
      const response = await fetch(`/api/user/type/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_type: newType })
      })

      if (response.ok) {
        // Reload user type data
        await loadUserType()
      } else {
        throw new Error('Failed to update user type')
      }
    } catch (error) {
      devLog('Error updating user type:', error)
      setError('Failed to update user type')
    }
  }, [userId, loadUserType])

  const trackFeatureUsage = useCallback(async (feature: string) => {
    if (!userId) return

    try {
      await fetch('/api/user/feature-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, feature })
      })
    } catch (error) {
      devLog('Error tracking feature usage:', error)
    }
  }, [userId])

  const trackSession = useCallback(async (duration: number) => {
    if (!userId) return

    try {
      await fetch('/api/user/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, duration })
      })
    } catch (error) {
      devLog('Error tracking session:', error)
    }
  }, [userId])

  useEffect(() => {
    loadUserType()
  }, [loadUserType])

  return {
    userType: segmentationData?.user_type || 'newcomer',
    confidenceScore: segmentationData?.confidence_score || 0,
    behaviorMetrics: segmentationData?.behavior_metrics || null,
    recommendations: segmentationData?.recommendations || [],
    nextMilestone: segmentationData?.next_milestone || '',
    isLoading,
    error,
    updateUserType,
    trackFeatureUsage,
    trackSession,
    refreshUserType: loadUserType
  }
}
