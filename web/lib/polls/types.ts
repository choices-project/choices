/**
 * Shared Poll Domain Types
 *
 * Centralizes shared type definitions between poll-related Zustand stores,
 * React hooks, and feature modules. Keeping these in one place reduces the
 * drift between the browsing and creation experiences.
 */

export type PollPrivacyLevel = 'public' | 'private' | 'unlisted';

export type PollFilters = {
  status: string[];
  category: string[];
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  votingStatus: 'all' | 'voted' | 'not_voted';
  trendingOnly: boolean;
};

export type PollPreferences = {
  defaultView: 'list' | 'grid' | 'card' | 'trending';
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'closing_soon';
  itemsPerPage: number;
  showResults: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
};

export type PollWizardSettings = {
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  requireAuthentication: boolean;
  requireEmail: boolean;
  showResults: boolean;
  allowWriteIns: boolean;
  // allowComments removed - feature not implemented, moderation concerns
  enableNotifications: boolean;
  preventDuplicateVotes: boolean;
  maxSelections: number;
  votingMethod: 'single' | 'multiple' | 'ranked' | 'quadratic';
  privacyLevel: PollPrivacyLevel;
  moderationEnabled: boolean;
  autoClose: boolean;
};

export type PollWizardData = {
  title: string;
  description: string;
  category: string;
  options: string[];
  tags: string[];
  privacyLevel: PollPrivacyLevel;
  allowMultipleVotes: boolean;
  showResults: boolean;
  isTemplate: boolean;
  settings: PollWizardSettings;
  endDate?: string; // ISO datetime string for when poll should close
  representative_id?: number; // Optional: ID of representative this poll is about
  bill_id?: string; // Optional: GovInfo package ID for bill-related polls
  bill_title?: string; // Optional: Bill title for display
  bill_summary?: string; // Optional: Bill summary
  poll_type?: 'standard' | 'constituent_will'; // Optional: Type of poll
};

