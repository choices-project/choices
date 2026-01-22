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
  allowComments: boolean;
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
};

