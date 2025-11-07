/**
 * Poll Types
 *
 * Type definitions for the polls system
 * Based on database schema: polls, poll_options, votes tables
 *
 * Status: ✅ ACTIVE
 */

import type { Database } from '@/types/database';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type PollRow = Database['public']['Tables']['polls']['Row'];
export type PollInsert = Database['public']['Tables']['polls']['Insert'];
export type PollUpdate = Database['public']['Tables']['polls']['Update'];

export type PollOptionRow = Database['public']['Tables']['poll_options']['Row'];
export type PollOptionInsert = Database['public']['Tables']['poll_options']['Insert'];
export type PollOptionUpdate = Database['public']['Tables']['poll_options']['Update'];

export type VoteRow = Database['public']['Tables']['votes']['Row'];
export type VoteInsert = Database['public']['Tables']['votes']['Insert'];
export type VoteUpdate = Database['public']['Tables']['votes']['Update'];

// ============================================================================
// DOMAIN TYPES (using base types)
// ============================================================================

// Primary Poll type - use DB type directly
export type Poll = PollRow;

// PollOption - use DB type directly
export type PollOption = PollOptionRow;

// Vote - use DB type directly
export type Vote = VoteRow;

// ============================================================================
// ENUM/UNION TYPES (derived from database values)
// ============================================================================

export type PollType =
  | 'single_choice'
  | 'multiple_choice'
  | 'ranked_choice'
  | 'approval'
  | 'quadratic'
  | 'range';

export type VotingMethod =
  | 'single'
  | 'multiple'
  | 'ranked'
  | 'approval'
  | 'quadratic'
  | 'range'
  | 'single-choice'
  | 'ranked-choice';

export type PollStatus =
  | 'draft'
  | 'active'
  | 'closed'
  | 'archived';

// ============================================================================
// SETTINGS TYPES (JSON fields from database)
// ============================================================================

export type PollSettings = {
  allow_multiple_votes: boolean;
  allow_vote_changes: boolean;
  show_results_before_close: boolean;
  show_voter_count: boolean;
  require_authentication: boolean;
  allow_anonymous_votes: boolean;
  max_votes_per_option?: number;
  min_votes_per_user?: number;
  max_votes_per_user?: number;
};

export type TemplateSettings = {
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  requireAuthentication: boolean;
  requireEmail: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  allowComments: boolean;
  enableNotifications?: boolean;
  maxSelections?: number;
  votingMethod?: string;
  privacyLevel?: string;
  moderationEnabled?: boolean;
  autoClose?: boolean;
};

// ============================================================================
// DOMAIN-SPECIFIC TYPES
// ============================================================================

export type PollResults = {
  poll_id: string
  total_votes: number
  unique_voters: number
  results: PollOptionResult[]
  trust_tier_breakdown: Record<string, number>
  demographics?: PollDemographics
  generated_at: string
}

export type PollOptionResult = {
  option_id: string
  option_text: string
  vote_count: number
  percentage: number
  rank?: number
  is_winner?: boolean
}

export type PollDemographics = {
  age_groups: Record<string, number>
  locations: Record<string, number>
  trust_tiers: Record<string, number>
  voting_methods: Record<string, number>
}

export type PollCreationData = {
  question: string
  description?: string
  poll_type: PollType
  voting_method: VotingMethod
  options: string[]
  settings: Partial<PollSettings>
  expires_at?: string
  hashtags?: string[]
  is_public?: boolean
  is_shareable?: boolean
}

export type PollUpdateData = {
  question?: string
  description?: string
  settings?: Partial<PollSettings>
  expires_at?: string
  hashtags?: string[]
  is_public?: boolean
  is_shareable?: boolean
}

export type PollHashtagIntegrationRecord = {
  poll_id: string
  hashtag_id: string
  created_at: string
}

export type PollWizardData = {
  title: string
  description: string
  category: string
  options: string[]
  tags: string[]
  settings: {
    votingMethod: string
    allowMultipleVotes: boolean
    showResults: boolean
    allowComments: boolean
  }
  privacyLevel: string
}

export type PollWizardState = {
  currentStep: number
  totalSteps: number
  data: PollWizardData
  errors: Record<string, string>
  isLoading: boolean
  progress: number
  canProceed: boolean
  canGoBack: boolean
  isComplete: boolean
}

export type PollTemplate = {
  id: string
  name: string
  title: string
  description: string
  category: string
  templateCategory?: TemplateCategory
  options: string[]
  settings?: Partial<PollSettings>
  tags: string[]
  isPopular: boolean
  usageCount: number
  createdAt: Date | string
  updatedAt: Date | string
  privacyLevel?: string
  estimatedDuration?: number
  estimatedTime?: number
  difficulty?: string
  isPublic?: boolean
  createdBy?: string
  rating?: number
  steps?: any[]
  defaultSettings?: TemplateSettings
}

export type PollCategory = {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export type TemplateCategory = {
  id: string
  name: string
  description: string
  icon: string
  color: string
  templateCount: number
}
