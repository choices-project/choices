/**
 * Poll Types
 * 
 * Type definitions for the polls system
 */

export interface Poll {
  id: string
  question: string
  description?: string
  poll_type: PollType
  voting_method: VotingMethod
  options: PollOption[]
  settings: PollSettings
  status: PollStatus
  created_at: string
  updated_at: string
  created_by: string
  expires_at?: string
  closed_at?: string
  total_votes: number
  is_public: boolean
  is_shareable: boolean
  hashtags?: string[]
  metadata?: Record<string, any>
}

export type PollType = 
  | 'single_choice'
  | 'multiple_choice'
  | 'ranked_choice'
  | 'approval'
  | 'quadratic'
  | 'range'

export type VotingMethod = 
  | 'single'
  | 'multiple'
  | 'ranked'
  | 'approval'
  | 'quadratic'
  | 'range'

export interface PollOption {
  id: string
  poll_id: string
  text: string
  description?: string
  order: number
  vote_count: number
  created_at: string
  metadata?: Record<string, any>
}

export interface PollSettings {
  allow_multiple_votes: boolean
  allow_vote_changes: boolean
  show_results_before_close: boolean
  show_voter_count: boolean
  require_authentication: boolean
  allow_anonymous_votes: boolean
  max_votes_per_option?: number
  min_votes_per_user?: number
  max_votes_per_user?: number
}

export interface TemplateSettings {
  allowMultipleVotes: boolean
  allowAnonymousVotes: boolean
  requireAuthentication: boolean
  requireEmail: boolean
  showResults: boolean
  allowWriteIns: boolean
  allowComments: boolean
  enableNotifications?: boolean
  maxSelections?: number
  votingMethod?: string
  privacyLevel?: string
  moderationEnabled?: boolean
  autoClose?: boolean
}

export type PollStatus = 
  | 'draft'
  | 'active'
  | 'closed'
  | 'archived'

export interface Vote {
  id: string
  poll_id: string
  option_id: string
  user_id?: string
  voter_session?: string
  trust_tier?: string
  weight: number
  created_at: string
  metadata?: Record<string, any>
}

export interface PollResults {
  poll_id: string
  total_votes: number
  unique_voters: number
  results: PollOptionResult[]
  trust_tier_breakdown: Record<string, number>
  demographics?: PollDemographics
  generated_at: string
}

export interface PollOptionResult {
  option_id: string
  option_text: string
  vote_count: number
  percentage: number
  rank?: number
  is_winner?: boolean
}

export interface PollDemographics {
  age_groups: Record<string, number>
  locations: Record<string, number>
  trust_tiers: Record<string, number>
  voting_methods: Record<string, number>
}

export interface PollCreationData {
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

export interface PollUpdateData {
  question?: string
  description?: string
  settings?: Partial<PollSettings>
  expires_at?: string
  hashtags?: string[]
  is_public?: boolean
  is_shareable?: boolean
}

export interface PollHashtagIntegration {
  poll_id: string
  hashtag_id: string
  created_at: string
}

export interface PollWizardData {
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

export interface PollWizardState {
  currentStep: number
  totalSteps: number
  data: PollWizardData
  errors: Record<string, string>
  isLoading: boolean
  canProceed: boolean
  canGoBack: boolean
  isComplete: boolean
}

export interface PollTemplate {
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

export interface PollCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  templateCount: number
}
