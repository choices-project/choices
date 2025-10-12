/**
 * Polls Feature - Consolidated Type Definitions
 * 
 * This file consolidates all poll-related types from scattered locations:
 * - features/polls/types/poll-templates.ts
 * - features/polls/types/voting.ts  
 * - lib/types/poll-templates.ts
 * - types/poll.ts
 * 
 * Created: October 10, 2025
 * Purpose: Single source of truth for all poll-related TypeScript types
 */

// ============================================================================
// CORE POLL TYPES
// ============================================================================

/**
 * Core poll data structure
 */
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed' | 'archived' | 'locked' | 'post-close';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  settings: PollSettings;
  category: PollCategory;
  tags: string[];
  hashtags?: string[]; // Enhanced hashtag support
  primary_hashtag?: string; // Primary hashtag for the poll
  hashtag_engagement?: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
  privacyLevel: 'public' | 'private' | 'anonymous' | 'invite-only';
  votingMethod: VotingMethod;
  totalVotes: number;
  participationRate: number;
}

/**
 * Individual poll option
 */
export interface PollOption {
  id: string;
  text: string;
  label?: string; // Alias for text
  description?: string;
  imageUrl?: string;
  order: number;
  weight?: number;
  votes?: number;
  percentage?: number;
}

/**
 * Poll status type
 */
export type PollStatus = 'draft' | 'active' | 'closed' | 'archived' | 'locked' | 'post-close';

/**
 * Poll template category type
 */
export type PollTemplateCategory = 'politics' | 'civics' | 'social' | 'environment' | 'economy' | 'health' | 'education' | 'technology' | 'culture' | 'sports' | 'entertainment' | 'news' | 'local' | 'national' | 'international' | 'custom';

/**
 * Poll configuration settings
 */
export interface PollSettings {
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  requireAuthentication: boolean;
  requireEmail: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  allowComments: boolean;
  enableNotifications: boolean;
  maxSelections: number;
  votingMethod: VotingMethod;
  privacyLevel: 'public' | 'private' | 'anonymous' | 'invite-only';
  moderationEnabled: boolean;
  autoClose: boolean;
  expirationDate?: Date;
  maxVotes?: number;
  autoCloseThreshold?: number;
}

// ============================================================================
// VOTING METHOD TYPES
// ============================================================================

/**
 * Database voting method enum values
 */
export type DbVotingMethod = 'single' | 'approval' | 'ranked' | 'range' | 'quadratic' | 'multiple';

/**
 * UI voting method display values
 */
export type UiVotingMethod = 'single_choice' | 'multiple_choice' | 'approval' | 'ranked_choice' | 'range' | 'quadratic';

/**
 * Unified voting method type
 */
export type VotingMethod = DbVotingMethod | UiVotingMethod;

/**
 * Mapping between database and UI voting methods
 */
export const mapDbToUi: Record<DbVotingMethod, UiVotingMethod> = {
  single: 'single_choice',
  approval: 'approval',
  ranked: 'ranked_choice',
  range: 'range',
  quadratic: 'quadratic',
  multiple: 'multiple_choice',
};

export const mapUiToDb: Record<UiVotingMethod, DbVotingMethod> = {
  single_choice: 'single',
  multiple_choice: 'multiple',
  approval: 'approval',
  ranked_choice: 'ranked',
  range: 'range',
  quadratic: 'quadratic',
};

/**
 * Utility functions for type-safe mapping
 */
export function toUiVotingMethod(dbMethod: DbVotingMethod): UiVotingMethod {
  return mapDbToUi[dbMethod];
}

export function toDbVotingMethod(uiMethod: UiVotingMethod): DbVotingMethod {
  return mapUiToDb[uiMethod];
}

/**
 * Type guards for runtime validation
 */
export function isDbVotingMethod(value: string): value is DbVotingMethod {
  return value in mapDbToUi;
}

export function isUiVotingMethod(value: string): value is UiVotingMethod {
  return value in mapUiToDb;
}

// ============================================================================
// POLL RESULTS TYPES
// ============================================================================

/**
 * Poll voting result
 */
export interface PollResult {
  pollId: string;
  totalVotes: number;
  results: OptionResult[];
  metadata: ResultMetadata;
}

/**
 * Individual option result
 */
export interface OptionResult {
  optionId: string;
  optionText: string;
  option?: string; // Alias for optionText
  votes: number;
  voteCount?: number; // Alias for votes
  percentage: number;
  votePercentage?: number; // Alias for percentage
  rank: number;
  uniqueVoters?: number;
}

/**
 * Result calculation metadata
 */
export interface ResultMetadata {
  strategy: string;
  processedAt: Date;
  totalRounds: number;
  quota: number;
  threshold: number;
  responseTime?: number;
  cacheHit?: boolean;
  includePrivate?: boolean;
  userId?: string;
}

/**
 * Optimized poll result for performance
 */
export interface OptimizedPollResult {
  id: string;
  title: string;
  options: string[];
  totalVotes: number;
  results: Array<{ 
    option: string; 
    votes: number; 
    percentage: number; 
    voteCount?: number;
    optionId?: string;
    label?: string;
    votePercentage?: number;
    uniqueVoters?: number;
  }>;
  metadata: Record<string, any>;
  pollStatus?: string;
  pollTitle?: string;
  pollType?: string;
  uniqueVoters?: number;
  kAnonymitySatisfied?: boolean;
  privacyBudgetRemaining?: number;
  canVote: boolean;
  hasVoted: boolean;
}

// ============================================================================
// POLL TEMPLATES TYPES
// ============================================================================

/**
 * Poll template for creating polls
 */
export interface PollTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  category: PollCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  estimatedDuration?: number; // alias for estimatedTime
  tags: string[];
  thumbnail?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  isPopular?: boolean;
  steps: PollWizardStep[];
  defaultSettings: PollSettings;
  options: string[];
  privacyLevel: 'public' | 'private' | 'anonymous';
}

/**
 * Poll wizard step definition
 */
export interface PollWizardStep {
  id: string;
  title: string;
  description: string;
  type: 'question' | 'options' | 'settings' | 'preview' | 'confirmation';
  required: boolean;
  order: number;
  validation?: StepValidation;
  options?: WizardStepOption[];
}

/**
 * Wizard step option
 */
export interface WizardStepOption {
  id: string;
  label: string;
  value: string | number | boolean;
  description?: string;
  icon?: string;
  isDefault?: boolean;
}

/**
 * Step validation rules
 */
export interface StepValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: string | number | boolean) => boolean | string;
}

/**
 * Poll wizard state management
 */
export interface PollWizardState {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  canProceed: boolean;
  canGoBack: boolean;
  data: PollWizardData;
  errors: Record<string, string>;
  isLoading: boolean;
  progress?: number;
}

/**
 * Poll wizard data structure
 */
export interface PollWizardData {
  title: string;
  description: string;
  options: string[];
  settings: PollSettings;
  template?: PollTemplate;
  category: PollCategory;
  tags: string[];
  thumbnail?: string;
  scheduledDate?: Date;
  targetAudience?: string;
  goals?: string[];
  privacyLevel: 'public' | 'private' | 'anonymous';
  allowMultipleVotes: boolean;
  showResults: boolean;
  endDate?: Date;
  isTemplate: boolean;
}

/**
 * Poll wizard progress tracking
 */
export interface PollWizardProgress {
  step: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
  hasError: boolean;
  estimatedTime: number;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

/**
 * Poll category enumeration
 */
export type PollCategory = 
  | 'general'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'politics'
  | 'technology'
  | 'health'
  | 'sports'
  | 'food'
  | 'travel'
  | 'fashion'
  | 'finance'
  | 'environment'
  | 'social'
  | 'custom';

/**
 * Template category definition
 */
export interface TemplateCategory {
  id: PollCategory | string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

// ============================================================================
// SEARCH AND FILTERING TYPES
// ============================================================================

/**
 * Poll template search parameters
 */
export interface PollTemplateSearch {
  query: string;
  category?: PollCategory;
  difficulty?: string;
  tags?: string[];
  sortBy: 'popular' | 'recent' | 'rating' | 'name';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Poll template statistics
 */
export interface PollTemplateStats {
  totalTemplates: number;
  publicTemplates: number;
  userTemplates: number;
  popularCategories: Array<{
    category: PollCategory;
    count: number;
    percentage: number;
  }>;
  averageRating: number;
  totalUsage: number;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

/**
 * Poll event handler interface
 */
export interface PollEventHandler {
  onVote: (pollId: string, selections: string[]) => Promise<void>;
  onShare: (pollId: string) => void;
  onBookmark: (pollId: string) => void;
  onReport: (pollId: string, reason: string) => void;
}

/**
 * Poll list component props
 */
export interface PollListProps {
  polls: Poll[];
  loading: boolean;
  error?: string;
  onPollClick: (pollId: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

/**
 * Results chart component props
 */
export interface ResultsChartProps {
  results: PollResult;
  chartType: 'bar' | 'pie' | 'line';
  showPercentages: boolean;
  showVoteCounts: boolean;
}

/**
 * Poll card component props
 */
export interface PollCardProps {
  poll: Poll;
  showActions?: boolean;
  className?: string;
}

/**
 * Poll results component props
 */
export interface PollResultsProps {
  pollId: string;
}

/**
 * Optimized poll results component props
 */
export interface OptimizedPollResultsProps {
  pollId: string;
  userId?: string;
  includePrivate?: boolean;
  onResultsLoaded?: () => void;
  onError?: () => void;
  showPerformanceMetrics?: boolean;
}

/**
 * Private poll results component props
 */
export interface PrivatePollResultsProps {
  poll: Poll;
  userId: string;
  onPrivacyBudgetExceeded?: () => void;
}

/**
 * Poll share component props
 */
export interface PollShareProps {
  pollId: string;
  poll?: Poll;
}

/**
 * Post-close banner component props
 */
export interface PostCloseBannerProps {
  pollStatus: 'closed' | 'locked' | 'post-close';
  baselineAt?: Date;
  lockedAt?: Date;
  allowPostClose?: boolean;
  onEnablePostClose?: () => void;
  onLockPoll?: () => void;
  canManage?: boolean;
  className?: string;
}

// ============================================================================
// INTEREST-BASED FEED TYPES
// ============================================================================

/**
 * User interests for personalized feeds
 */
export interface UserInterests {
  selectedInterests: string[];
  customInterests: string[]; // User-created hashtags
  trendingHashtags: string[]; // Real-time trending
  userHashtags: string[]; // User's custom hashtags
}

/**
 * Personalized poll feed
 */
export interface PersonalizedPollFeed {
  userId: string;
  generatedAt: string;
  polls: PollRecommendation[];
  interestMatches: InterestMatch[];
  trendingHashtags: string[];
  suggestedInterests: string[];
}

/**
 * Poll recommendation for feeds
 */
export interface PollRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  interestMatches: string[];
  totalVotes: number;
  created_at: string;
}

/**
 * Interest match for analytics
 */
export interface InterestMatch {
  interest: string;
  matchCount: number;
  relevanceScore: number;
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

/**
 * Performance metrics for poll operations
 */
export interface PerformanceMetrics {
  metricName: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  countMeasurements: number;
  responseTime?: number;
  memoryUsage?: number;
  cacheHitRate?: number;
  errorRate?: number;
}

// ============================================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Re-export all types from the original files for backward compatibility
export type {
  // From poll-templates.ts
  PollTemplate as PollTemplateOriginal,
  PollWizardStep as PollWizardStepOriginal,
  WizardStepOption as WizardStepOptionOriginal,
  StepValidation as StepValidationOriginal,
  PollSettings as PollSettingsOriginal,
  PollWizardState as PollWizardStateOriginal,
  PollWizardData as PollWizardDataOriginal,
  PollCategory as PollCategoryOriginal,
  TemplateCategory as TemplateCategoryOriginal,
  PollWizardProgress as PollWizardProgressOriginal,
  PollTemplateSearch as PollTemplateSearchOriginal,
  PollTemplateStats as PollTemplateStatsOriginal,
} from './poll-templates';

export type {
  // From voting.ts
  DbVotingMethod as DbVotingMethodOriginal,
  UiVotingMethod as UiVotingMethodOriginal,
} from './voting';

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

// ============================================================================
// HASHTAG INTEGRATION TYPES
// ============================================================================

export interface PollHashtagIntegration {
  poll_id: string;
  hashtags: string[];
  primary_hashtag?: string;
  hashtag_engagement: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
  related_polls: string[];
  hashtag_trending_score: number;
}

export interface HashtagContent {
  id: string;
  hashtag_id: string;
  content_type: 'poll' | 'comment' | 'profile' | 'feed' | 'post';
  content_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  engagement_score: number;
  metadata?: Record<string, any>;
}

export default {
  // Voting method mappings
  mapDbToUi,
  mapUiToDb,
  toUiVotingMethod,
  toDbVotingMethod,
  isDbVotingMethod,
  isUiVotingMethod,
};
