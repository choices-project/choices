/**
 * Social Features Types
 * 
 * Comprehensive type definitions for social features, candidate tools,
 * network effects, and social discovery
 * 
 * Created: January 15, 2025
 * Updated: January 15, 2025
 */

// ============================================================================
// CORE SOCIAL TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  age: number;
  education: string;
  location: string;
  interests: string[];
  demographics: Demographics;
  votingHistory: VotingRecord[];
}

export interface Demographics {
  ageGroup: string;
  education: string;
  location: string;
  politicalAffiliation?: string;
  incomeBracket?: string;
}

export interface VotingRecord {
  pollId: string;
  ranking: string[];
  timestamp: Date;
  category: string;
}

// ============================================================================
// CANDIDATE TOOLS TYPES
// ============================================================================

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  isIndependent: boolean;
  bio: string;
  policies: string[];
  campaignFinance: CampaignFinance;
  verification: CandidateVerification;
  contact: CandidateContact;
  socialMedia?: SocialMedia;
  website?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignFinance {
  totalRaised: number;
  independenceScore: number; // 0-100, higher = more independent
  topDonors: string[];
  fundingSources: FundingSource[];
  transparencyScore: number; // 0-100
}

export interface FundingSource {
  type: 'individual' | 'corporate' | 'pac' | 'party' | 'self-funded';
  amount: number;
  percentage: number;
  description: string;
}

export interface CandidateVerification {
  verified: boolean;
  method: 'government-email' | 'campaign-website' | 'social-media' | 'manual';
  verifiedAt?: Date;
  verifiedBy?: string;
  documents: VerificationDocument[];
}

export interface VerificationDocument {
  type: 'government-id' | 'campaign-filing' | 'website-ownership' | 'social-media';
  url: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface CandidateContact {
  email?: string;
  phone?: string;
  address?: string;
  campaignOffice?: string;
}

export interface SocialMedia {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface CampaignDashboardData {
  candidateId: string;
  currentRank: number;
  totalCandidates: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
  topInterests: InterestAlignment[];
  profileViews: number;
  policyClicks: number;
  socialShares: number;
  topSupportReasons: string[];
  commonConcerns: string[];
  engagementMetrics: EngagementMetrics;
  demographicBreakdown: DemographicBreakdown;
  geographicBreakdown: GeographicBreakdown;
  lastUpdated: Date;
}

export interface InterestAlignment {
  name: string;
  alignment: number; // 0-100
  userCount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface EngagementMetrics {
  totalEngagements: number;
  engagementRate: number;
  averageEngagementScore: number;
  topEngagementTypes: EngagementType[];
  engagementTrend: 'up' | 'down' | 'stable';
}

export interface EngagementType {
  type: 'profile_view' | 'policy_click' | 'social_share' | 'discussion' | 'vote';
  count: number;
  percentage: number;
}

export interface DemographicBreakdown {
  ageGroups: Record<string, number>;
  education: Record<string, number>;
  politicalAffiliation: Record<string, number>;
  incomeBrackets: Record<string, number>;
}

export interface GeographicBreakdown {
  regions: Record<string, number>;
  cities: Record<string, number>;
  counties: Record<string, number>;
}

export interface PolicyAlignment {
  policy: string;
  alignment: number; // 0-100
  userCount: number;
  confidence: number;
  sources: string[];
}

export interface CandidateInsights {
  candidateId: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
  competitiveAnalysis: CompetitiveAnalysis[];
  lastUpdated: Date;
}

export interface CompetitiveAnalysis {
  competitorId: string;
  competitorName: string;
  comparison: {
    support: number;
    engagement: number;
    policyAlignment: number;
  };
  advantages: string[];
  disadvantages: string[];
}

// ============================================================================
// SOCIAL DISCOVERY TYPES
// ============================================================================

export interface InterestRecommendation {
  candidateId: string;
  candidateName: string;
  interest: string;
  alignmentScore: number;
  userCount: number;
  confidence: number;
  reason: string;
  privacyProtected: boolean;
}

export interface NetworkInsight {
  connectionId: string;
  connectionName: string;
  sharedInterests: string[];
  ranking: string[];
  confidence: number;
  privacyProtected: boolean;
}

export interface TrendingCandidate {
  candidateId: string;
  candidateName: string;
  trendScore: number;
  activityCount: number;
  trendDirection: 'up' | 'down' | 'stable';
  timeWindow: number;
  confidence: number;
  metadata: TrendingMetadata;
}

export interface TrendingMetadata {
  pollId: string;
  category: string;
  geographicArea: string;
  demographicGroup: string;
  interestCategories: string[];
}

export interface SurgeData {
  pollId: string;
  candidateId: string;
  surgeScore: number;
  activityCount: number;
  timeWindow: number;
  geographicArea: string;
  demographicGroup: string;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  candidateResults: Array<{
    candidateId: string;
    votes: number;
    percentage: number;
  }>;
  timestamp: Date;
}

export interface Activity {
  candidateId: string;
  timestamp: Date;
  intensity: number;
  type: 'vote' | 'view' | 'share' | 'discuss';
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunityDiscussion {
  id: string;
  pollId: string;
  candidateId?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
  upvotes: number;
  downvotes: number;
  replies: number;
  isModerated: boolean;
  tags: string[];
}

export interface SocialEngagement {
  userId: string;
  pollId: string;
  actions: {
    voted: boolean;
    shared: boolean;
    discussed: boolean;
    recommended: boolean;
  };
  timestamp: Date;
  engagementScore: number;
}

// ============================================================================
// NETWORK EFFECTS TYPES
// ============================================================================

export interface AggregatedInsights {
  demographicBreakdowns: DemographicBreakdown[];
  geographicBreakdowns: GeographicBreakdown[];
  interestBreakdowns: Record<string, InterestBreakdown>;
  totalUsers: number;
  lastUpdated: Date;
}

export interface InterestBreakdown {
  interest: string;
  topCandidate: {
    id: string;
    name: string;
    alignmentScore: number;
  };
  userCount: number;
  confidence: number;
}

export interface DiversityNudge {
  type: 'cross-demographic' | 'geographic' | 'cross-interest' | 'similar-users';
  message: string;
  candidateId: string;
  candidateName: string;
  confidence: number;
  source: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface CrossDemographicInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  demographicGroup: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface GeographicInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  geographicArea: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface CrossInterestInsight {
  candidateId: string;
  candidateName: string;
  confidence: number;
  interestCategory: string;
  userCount: number;
  privacyProtected: boolean;
}

export interface ExposureRecord {
  userId: string;
  contentType: 'cluster' | 'candidate' | 'viral' | 'diversity';
  contentId: string;
  timestamp: number;
  sessionId: string;
}

export interface CounterfactualPreview {
  scenario: string;
  description: string;
  impact: {
    candidateId: string;
    candidateName: string;
    change: number;
    direction: 'up' | 'down';
  };
  confidence: number;
  userCount: number;
}

export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  acceptedAt?: Date;
}

export interface NetworkMetrics {
  totalConnections: number;
  activeConnections: number;
  inviteCodesGenerated: number;
  inviteCodesUsed: number;
  networkGrowth: number;
  engagementRate: number;
}

// ============================================================================
// VIRAL DETECTION TYPES
// ============================================================================

export interface ViralMoment {
  id: string;
  pollId: string;
  candidateId?: string;
  type: 'poll' | 'candidate' | 'issue';
  viralityScore: number;
  reach: number;
  engagement: number;
  velocity: number;
  peakTime: Date;
  duration: number;
  factors: ViralFactor[];
}

export interface ViralFactor {
  type: 'social_media' | 'news' | 'influencer' | 'event' | 'controversy';
  impact: number;
  description: string;
  source: string;
  timestamp: Date;
}

export interface ViralThreshold {
  minReach: number;
  minEngagement: number;
  minVelocity: number;
  timeWindow: number;
  category: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PollData {
  id: string;
  title: string;
  candidates: Candidate[];
  closeAt?: Date;
  allowPostclose: boolean;
  status: 'draft' | 'active' | 'closed' | 'archived';
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserConnection {
  id: string;
  name: string;
  sharedInterests: string[];
}

export interface ConnectionInsights {
  ranking: string[];
  confidence: number;
  privacyProtected: boolean;
}

export interface VerificationAttemptData {
  email?: string;
  code?: string;
  status: 'pending' | 'verified' | 'failed';
}

export interface VoteData {
  id: string;
  poll_id: string;
  user_id: string;
  vote_data?: {
    ranking?: string[];
  };
  created_at: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

export interface SessionData {
  id: string;
}

export interface ReplayData {
  algorithm: string;
  steps: unknown[];
  metadata: Record<string, unknown>;
}
