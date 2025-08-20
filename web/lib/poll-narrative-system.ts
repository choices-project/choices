// Poll Narrative System - Story-Driven Polls with Verified Information
// Each poll becomes an educational narrative with community-moderated facts

import { createClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { cookies } from 'next/headers';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface PollNarrative {
  id: string;
  pollId: string;
  title: string;
  summary: string;
  fullStory: string;
  context: StoryContext;
  verifiedFacts: VerifiedFact[];
  communityFacts: CommunityFact[];
  sources: NarrativeSource[];
  timeline: TimelineEvent[];
  stakeholders: Stakeholder[];
  controversy: ControversyAnalysis;
  moderation: ModerationStatus;
  createdAt: Date;
  updatedAt: Date;
  lastModeratedAt: Date;
}

export interface StoryContext {
  background: string;
  currentSituation: string;
  keyIssues: string[];
  historicalContext: string;
  geographicScope: 'local' | 'national' | 'international' | 'global';
  timeSensitivity: 'low' | 'medium' | 'high' | 'urgent';
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  politicalImpact: number; // 0-1 scale
  economicImpact: number; // 0-1 scale
  socialImpact: number; // 0-1 scale
}

export interface VerifiedFact {
  id: string;
  statement: string;
  category: 'fact' | 'statistic' | 'quote' | 'document' | 'event' | 'policy';
  verificationLevel: 'verified' | 'partially_verified' | 'unverified' | 'disputed';
  sources: FactSource[];
  factCheckers: FactChecker[];
  lastVerified: Date;
  confidence: number; // 0-1 scale
  tags: string[];
  relatedFacts: string[]; // IDs of related facts
  controversy: number; // 0-1 scale
}

export interface FactSource {
  id: string;
  name: string;
  url: string;
  type: 'news' | 'government' | 'academic' | 'document' | 'video' | 'audio' | 'social_media';
  reliability: number; // 0-1 scale
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  lastAccessed: Date;
  accessibility: 'public' | 'restricted' | 'archived';
}

export interface FactChecker {
  id: string;
  name: string;
  organization: string;
  expertise: string[];
  reliability: number; // 0-1 scale
  methodology: string;
  conclusion: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false';
  explanation: string;
  dateChecked: Date;
}

export interface CommunityFact {
  id: string;
  statement: string;
  category: 'fact' | 'opinion' | 'anecdote' | 'question' | 'correction';
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  votes: {
    helpful: number;
    notHelpful: number;
    verified: number;
    disputed: number;
  };
  moderatorNotes: string;
  reviewedBy: string;
  reviewedAt: Date;
  sources: string[];
  tags: string[];
  parentFact?: string; // If this is a response to another fact
}

export interface NarrativeSource {
  id: string;
  title: string;
  url: string;
  type: 'article' | 'video' | 'document' | 'interview' | 'press_release' | 'social_media';
  source: string;
  author: string;
  publishDate: Date;
  reliability: number; // 0-1 scale
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  summary: string;
  keyQuotes: string[];
  factCheckStatus: 'verified' | 'mixed' | 'disputed' | 'pending';
  communityRating: number; // 0-5 scale
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  sources: string[];
  verified: boolean;
  controversy: number; // 0-1 scale
  tags: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  type: 'individual' | 'organization' | 'government' | 'corporation' | 'group';
  role: string;
  position: 'support' | 'oppose' | 'neutral' | 'mixed' | 'unknown';
  influence: number; // 0-1 scale
  credibility: number; // 0-1 scale
  background: string;
  statements: StakeholderStatement[];
  conflicts: string[];
  sources: string[];
}

export interface StakeholderStatement {
  id: string;
  quote: string;
  date: Date;
  context: string;
  source: string;
  verified: boolean;
  impact: number; // 0-1 scale
}

export interface ControversyAnalysis {
  level: 'low' | 'medium' | 'high' | 'extreme';
  sources: string[];
  keyDisputes: Dispute[];
  consensusAreas: string[];
  unresolvedIssues: string[];
  expertOpinions: ExpertOpinion[];
  publicSentiment: SentimentAnalysis;
}

export interface Dispute {
  id: string;
  topic: string;
  parties: string[];
  positions: string[];
  evidence: string[];
  resolution: 'resolved' | 'unresolved' | 'ongoing';
  impact: number; // 0-1 scale
}

export interface ExpertOpinion {
  id: string;
  expert: string;
  credentials: string;
  opinion: string;
  confidence: number; // 0-1 scale
  date: Date;
  sources: string[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  trends: SentimentTrend[];
  demographics: Record<string, SentimentBreakdown>;
}

export interface SentimentTrend {
  period: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  intensity: number; // 0-1 scale
  factors: string[];
}

export interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface ModerationStatus {
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  moderator: string;
  reviewedAt: Date;
  notes: string;
  requiredChanges: string[];
  communityScore: number; // 0-1 scale
  factAccuracy: number; // 0-1 scale
  biasAssessment: number; // 0-1 scale
  overallQuality: number; // 0-1 scale
}

// ============================================================================
// COMMUNITY MODERATION SYSTEM
// ============================================================================

export interface ModerationAction {
  id: string;
  narrativeId: string;
  moderatorId: string;
  action: 'approve' | 'reject' | 'request_revision' | 'flag' | 'fact_check';
  reason: string;
  details: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  followUpRequired: boolean;
}

export interface CommunityModerator {
  id: string;
  userId: string;
  level: 'junior' | 'senior' | 'expert' | 'admin';
  expertise: string[];
  reliability: number; // 0-1 scale
  reviewCount: number;
  accuracy: number; // 0-1 scale
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ModerationQueue {
  id: string;
  narrativeId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: Date;
  estimatedTime: number; // minutes
  category: 'fact_check' | 'bias_review' | 'quality_assessment' | 'community_dispute';
}

// ============================================================================
// FACT VERIFICATION SYSTEM
// ============================================================================

export interface FactVerificationRequest {
  id: string;
  factId: string;
  requesterId: string;
  reason: string;
  evidence: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
  result?: FactVerificationResult;
}

export interface FactVerificationResult {
  accuracy: 'true' | 'mostly_true' | 'mixed' | 'mostly_false' | 'false';
  confidence: number; // 0-1 scale
  explanation: string;
  sources: string[];
  methodology: string;
  limitations: string[];
  recommendations: string[];
}

// ============================================================================
// POLL NARRATIVE SERVICE
// ============================================================================

export class PollNarrativeService {
  private supabase;

  constructor() {
    const cookieStore = cookies();
    this.supabase = createClient(cookieStore);
  }

  async createNarrative(narrative: Omit<PollNarrative, 'id' | 'createdAt' | 'updatedAt' | 'lastModeratedAt'>): Promise<PollNarrative | null> {
    try {
      const { data, error } = await this.supabase
        .from('poll_narratives')
        .insert([{
          ...narrative,
          moderation: {
            ...narrative.moderation,
            status: 'draft'
          }
        }])
        .select()
        .single();

      if (error) throw error;

      return data ? this?.mapNarrativeFromDB(data) : null;
    } catch (error) {
      devLog('Error creating narrative:', error);
      return null;
    }
  }

  async addVerifiedFact(narrativeId: string, fact: Omit<VerifiedFact, 'id' | 'lastVerified'>): Promise<VerifiedFact | null> {
    try {
      const { data, error } = await this.supabase
        .from('verified_facts')
        .insert([{
          ...fact,
          narrative_id: narrativeId,
          last_verified: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      return data ? this?.mapVerifiedFactFromDB(data) : null;
    } catch (error) {
      devLog('Error adding verified fact:', error);
      return null;
    }
  }

  async submitCommunityFact(narrativeId: string, fact: Omit<CommunityFact, 'id' | 'submittedAt' | 'status' | 'votes'>): Promise<CommunityFact | null> {
    try {
      const { data, error } = await this.supabase
        .from('community_facts')
        .insert([{
          ...fact,
          narrative_id: narrativeId,
          submitted_at: new Date(),
          status: 'pending',
          votes: {
            helpful: 0,
            notHelpful: 0,
            verified: 0,
            disputed: 0
          }
        }])
        .select()
        .single();

      if (error) throw error;

      return data ? this?.mapCommunityFactFromDB(data) : null;
    } catch (error) {
      devLog('Error submitting community fact:', error);
      return null;
    }
  }

  async voteOnCommunityFact(factId: string, userId: string, voteType: 'helpful' | 'notHelpful' | 'verified' | 'disputed'): Promise<boolean> {
    try {
      // Get current fact
      const { data: fact, error: fetchError } = await this.supabase
        .from('community_facts')
        .select('votes')
        .eq('id', factId)
        .single();

      if (fetchError) throw fetchError;

      // Update votes
      const updatedVotes = {
        ...fact.votes,
        [voteType]: fact.votes[voteType] + 1
      };

      const { error: updateError } = await this.supabase
        .from('community_facts')
        .update({ votes: updatedVotes })
        .eq('id', factId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      devLog('Error voting on community fact:', error);
      return false;
    }
  }

  async moderateNarrative(narrativeId: string, moderatorId: string, action: ModerationAction): Promise<boolean> {
    try {
      // Create moderation action
      const { error: actionError } = await this.supabase
        .from('moderation_actions')
        .insert([{
          narrative_id: narrativeId,
          moderator_id: moderatorId,
          action: action.action,
          reason: action.reason,
          details: action.details,
          timestamp: new Date(),
          priority: action.priority,
          follow_up_required: action.followUpRequired
        }]);

      if (actionError) throw actionError;

      // Update narrative moderation status
      const { error: updateError } = await this.supabase
        .from('poll_narratives')
        .update({
          moderation: {
            status: action.action === 'approve' ? 'approved' : 
                   action.action === 'reject' ? 'rejected' : 'needs_revision',
            moderator: moderatorId,
            reviewed_at: new Date(),
            notes: action.reason
          },
          last_moderated_at: new Date()
        })
        .eq('id', narrativeId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      devLog('Error moderating narrative:', error);
      return false;
    }
  }

  async requestFactVerification(factId: string, requesterId: string, reason: string, evidence: string[]): Promise<FactVerificationRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('fact_verification_requests')
        .insert([{
          fact_id: factId,
          requester_id: requesterId,
          reason,
          evidence,
          priority: 'medium',
          status: 'pending',
          created_at: new Date()
        }])
        .select()
        .single();

      if (error) throw error;

      return data ? this.mapVerificationRequestFromDB(data) : null;
    } catch (error) {
      devLog('Error requesting fact verification:', error);
      return null;
    }
  }

  async getNarrativeWithContext(narrativeId: string): Promise<PollNarrative | null> {
    try {
      const { data, error } = await this.supabase
        .from('poll_narratives')
        .select(`
          *,
          verified_facts (*),
          community_facts (*),
          sources (*),
          timeline (*),
          stakeholders (*)
        `)
        .eq('id', narrativeId)
        .single();

      if (error) throw error;

      return data ? this.mapNarrativeWithContextFromDB(data) : null;
    } catch (error) {
      devLog('Error getting narrative with context:', error);
      return null;
    }
  }

  async searchNarratives(query: string, filters?: {
    category?: string;
    timeSensitivity?: string;
    complexity?: string;
    status?: string;
  }): Promise<PollNarrative[]> {
    try {
      let queryBuilder = this.supabase
        .from('poll_narratives')
        .select('id, poll_id, narrative_data, created_at')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,full_story.ilike.%${query}%`);

      if (filters?.category) {
        queryBuilder = queryBuilder.eq('context->geographicScope', filters.category);
      }
      if (filters?.timeSensitivity) {
        queryBuilder = queryBuilder.eq('context->timeSensitivity', filters.timeSensitivity);
      }
      if (filters?.complexity) {
        queryBuilder = queryBuilder.eq('context->complexity', filters.complexity);
      }
      if (filters?.status) {
        queryBuilder = queryBuilder.eq('moderation->status', filters.status);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data ? data.map(item => this.mapNarrativeFromDB(item)) : [];
    } catch (error) {
      devLog('Error searching narratives:', error);
      return [];
    }
  }

  // Database mapping methods
  private mapNarrativeFromDB(data: any): PollNarrative {
    return {
      id: data.id,
      pollId: data.poll_id,
      title: data.title,
      summary: data.summary,
      fullStory: data.full_story,
      context: data.context,
      verifiedFacts: data.verified_facts || [],
      communityFacts: data.community_facts || [],
      sources: data.sources || [],
      timeline: data.timeline || [],
      stakeholders: data.stakeholders || [],
      controversy: data.controversy,
      moderation: data.moderation,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastModeratedAt: data.last_moderated_at ? new Date(data.last_moderated_at) : new Date()
    };
  }

  private mapNarrativeWithContextFromDB(data: any): PollNarrative {
    return {
      ...this.mapNarrativeFromDB(data),
      verifiedFacts: data.verified_facts?.map((f: any) => this.mapVerifiedFactFromDB(f)) || [],
      communityFacts: data.community_facts?.map((f: any) => this.mapCommunityFactFromDB(f)) || [],
      sources: data.sources?.map((s: any) => this.mapSourceFromDB(s)) || [],
      timeline: data.timeline?.map((t: any) => this.mapTimelineEventFromDB(t)) || [],
      stakeholders: data.stakeholders?.map((s: any) => this.mapStakeholderFromDB(s)) || []
    };
  }

  private mapVerifiedFactFromDB(data: any): VerifiedFact {
    return {
      id: data.id,
      statement: data.statement,
      category: data.category,
      verificationLevel: data.verification_level,
      sources: data.sources || [],
      factCheckers: data.fact_checkers || [],
      lastVerified: new Date(data.last_verified),
      confidence: data.confidence,
      tags: data.tags || [],
      relatedFacts: data.related_facts || [],
      controversy: data.controversy
    };
  }

  private mapCommunityFactFromDB(data: any): CommunityFact {
    return {
      id: data.id,
      statement: data.statement,
      category: data.category,
      submittedBy: data.submitted_by,
      submittedAt: new Date(data.submitted_at),
      status: data.status,
      votes: data.votes,
      moderatorNotes: data.moderator_notes || '',
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      sources: data.sources || [],
      tags: data.tags || [],
      parentFact: data.parent_fact
    };
  }

  private mapSourceFromDB(data: any): NarrativeSource {
    return {
      id: data.id,
      title: data.title,
      url: data.url,
      type: data.type,
      source: data.source,
      author: data.author,
      publishDate: new Date(data.publish_date),
      reliability: data.reliability,
      bias: data.bias,
      summary: data.summary,
      keyQuotes: data.key_quotes || [],
      factCheckStatus: data.fact_check_status,
      communityRating: data.community_rating
    };
  }

  private mapTimelineEventFromDB(data: any): TimelineEvent {
    return {
      id: data.id,
      date: new Date(data.date),
      title: data.title,
      description: data.description,
      significance: data.significance,
      sources: data.sources || [],
      verified: data.verified,
      controversy: data.controversy,
      tags: data.tags || []
    };
  }

  private mapStakeholderFromDB(data: any): Stakeholder {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      role: data.role,
      position: data.position,
      influence: data.influence,
      credibility: data.credibility,
      background: data.background,
      statements: data.statements || [],
      conflicts: data.conflicts || [],
      sources: data.sources || []
    };
  }

  private mapVerificationRequestFromDB(data: any): FactVerificationRequest {
    return {
      id: data.id,
      factId: data.fact_id,
      requesterId: data.requester_id,
      reason: data.reason,
      evidence: data.evidence || [],
      priority: data.priority,
      status: data.status,
      assignedTo: data.assigned_to,
      createdAt: new Date(data.created_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      result: data.result
    };
  }
}

// ============================================================================
// EXAMPLE NARRATIVE FOR GAVIN NEWSOM VS TRUMP
// ============================================================================

export const NEWSOM_TRUMP_NARRATIVE: Omit<PollNarrative, 'id' | 'createdAt' | 'updatedAt' | 'lastModeratedAt'> = {
  pollId: 'newsom-trump-debate-poll',
  title: 'Gavin Newsom vs Donald Trump: The Presidential Debate Challenge',
  summary: 'California Governor Gavin Newsom has publicly challenged former President Donald Trump to a presidential debate, sparking intense political discourse and raising questions about the 2024 election landscape.',
  fullStory: `
    In a bold political move that has captured national attention, California Governor Gavin Newsom has issued a direct challenge to former President Donald Trump for a presidential debate. This unprecedented challenge from a sitting governor to a former president has ignited intense political discourse and speculation about the 2024 election landscape.

    The challenge emerged during a recent interview where Newsom, a prominent Democratic figure, criticized Trump's leadership and policies, stating that the American people deserve to see a direct comparison of their visions for the country. Trump has responded with characteristic bravado, calling Newsom's challenge "desperate" and questioning his qualifications.

    This political theater comes at a critical juncture in American politics, with both parties positioning themselves for the upcoming election cycle. The debate challenge raises fundamental questions about political discourse, media responsibility, and the role of governors in national politics.

    Key questions surrounding this development include:
    - What are the legal and political implications of a governor challenging a former president to debate?
    - How does this reflect the current state of American political discourse?
    - What impact might this have on the 2024 presidential race?
    - Should such debates be regulated or left to the free market of ideas?
  `,
  context: {
    background: 'Gavin Newsom has been a vocal critic of Trump\'s policies and leadership style, while Trump has frequently targeted California\'s policies under Newsom\'s administration.',
    currentSituation: 'Newsom has challenged Trump to a debate, Trump has responded dismissively, and the political world is watching to see if this will materialize.',
    keyIssues: [
      'Presidential debate protocols and regulations',
      'Role of governors in national political discourse',
      'Media responsibility in political coverage',
      'Impact on 2024 election dynamics'
    ],
    historicalContext: 'This would be unprecedented - no sitting governor has ever challenged a former president to a debate in this manner.',
    geographicScope: 'national',
    timeSensitivity: 'high',
    complexity: 'moderate',
    politicalImpact: 0.8,
    economicImpact: 0.3,
    socialImpact: 0.7
  },
  verifiedFacts: [
    {
      id: 'fact-1',
      statement: 'Gavin Newsom is the current Governor of California, serving since 2019.',
      category: 'fact',
      verificationLevel: 'verified',
      sources: [
        {
          id: 'source-1',
          name: 'California State Government',
          url: 'https://www.ca.gov/',
          type: 'government',
          reliability: 0.95,
          bias: 'center',
          lastAccessed: new Date(),
          accessibility: 'public'
        }
      ],
      factCheckers: [
        {
          id: 'checker-1',
          name: 'FactCheck.org',
          organization: 'Annenberg Public Policy Center',
          expertise: ['politics', 'government'],
          reliability: 0.9,
          methodology: 'Cross-referenced with official government records',
          conclusion: 'true',
          explanation: 'Verified through official California state records',
          dateChecked: new Date()
        }
      ],
      lastVerified: new Date(),
      confidence: 0.95,
      tags: ['politics', 'california', 'government'],
      relatedFacts: [],
      controversy: 0.1
    }
  ],
  communityFacts: [],
  sources: [
    {
      id: 'source-1',
      title: 'Newsom Challenges Trump to Presidential Debate',
      url: 'https://example.com/newsom-trump-challenge',
      type: 'article',
      source: 'Reuters',
      author: 'John Smith',
      publishDate: new Date(),
      reliability: 0.9,
      bias: 'center',
      summary: 'California Governor Gavin Newsom has challenged former President Donald Trump to a presidential debate.',
      keyQuotes: [
        '"I\'m ready to debate Donald Trump anytime, anywhere," Newsom said.',
        '"The American people deserve to see our visions side by side."'
      ],
      factCheckStatus: 'verified',
      communityRating: 4.2
    }
  ],
  timeline: [
    {
      id: 'event-1',
      date: new Date('2024-01-15'),
      title: 'Newsom Issues Debate Challenge',
      description: 'During a television interview, Newsom publicly challenges Trump to a debate.',
      significance: 'high',
      sources: ['source-1'],
      verified: true,
      controversy: 0.3,
      tags: ['debate', 'challenge', 'politics']
    }
  ],
  stakeholders: [
    {
      id: 'stakeholder-1',
      name: 'Gavin Newsom',
      type: 'individual',
      role: 'California Governor',
      position: 'support',
      influence: 0.8,
      credibility: 0.7,
      background: 'Democratic governor of California since 2019',
      statements: [
        {
          id: 'statement-1',
          quote: 'I\'m ready to debate Donald Trump anytime, anywhere.',
          date: new Date('2024-01-15'),
          context: 'Television interview',
          source: 'CNN',
          verified: true,
          impact: 0.8
        }
      ],
      conflicts: ['Political opponent of Trump'],
      sources: ['source-1']
    }
  ],
  controversy: {
    level: 'high',
    sources: ['source-1'],
    keyDisputes: [
      {
        id: 'dispute-1',
        topic: 'Whether a governor should challenge a former president to debate',
        parties: ['Democrats', 'Republicans'],
        positions: [
          'Democrats: Shows leadership and transparency',
          'Republicans: Desperate political stunt'
        ],
        evidence: ['Political commentary', 'Media analysis'],
        resolution: 'ongoing',
        impact: 0.7
      }
    ],
    consensusAreas: [
      'This is an unprecedented political move',
      'The challenge has generated significant media attention'
    ],
    unresolvedIssues: [
      'Whether the debate will actually happen',
      'What format the debate should take',
      'Who should moderate such a debate'
    ],
    expertOpinions: [
      {
        id: 'expert-1',
        expert: 'Dr. Jane Political',
        credentials: 'Political Science Professor, Harvard University',
        opinion: 'This represents a new level of political theater in American politics.',
        confidence: 0.8,
        date: new Date(),
        sources: ['academic-analysis-1']
      }
    ],
    publicSentiment: {
      overall: 'mixed',
      breakdown: {
        positive: 0.4,
        negative: 0.3,
        neutral: 0.3
      },
      trends: [
        {
          period: 'Last 24 hours',
          sentiment: 'neutral',
          intensity: 0.7,
          factors: ['Media coverage', 'Social media reaction']
        }
      ],
      demographics: {
        'Democrats': { positive: 0.6, negative: 0.2, neutral: 0.2, total: 1000 },
        'Republicans': { positive: 0.2, negative: 0.6, neutral: 0.2, total: 1000 },
        'Independents': { positive: 0.3, negative: 0.3, neutral: 0.4, total: 1000 }
      }
    }
  },
  moderation: {
    status: 'pending_review',
    moderator: '',
    reviewedAt: new Date(),
    notes: 'Narrative submitted for review',
    requiredChanges: [],
    communityScore: 0.8,
    factAccuracy: 0.9,
    biasAssessment: 0.7,
    overallQuality: 0.8
  }
};
