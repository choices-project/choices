import type { PollFilters, PollPreferences, PollWizardData, PollWizardSettings } from './types';

export const createDefaultPollFilters = (): PollFilters => ({
  status: ['active'],
  category: [],
  tags: [],
  dateRange: {
    start: '',
    end: '',
  },
  votingStatus: 'all',
  trendingOnly: false,
});

export const createDefaultPollPreferences = (): PollPreferences => ({
  defaultView: 'list',
  sortBy: 'newest',
  itemsPerPage: 20,
  showResults: true,
  autoRefresh: true,
  refreshInterval: 5,
});

export const createDefaultPollWizardSettings = (): PollWizardSettings => ({
  allowMultipleVotes: false,
  allowAnonymousVotes: true,
  requireAuthentication: false,
  requireEmail: false,
  showResults: true,
  allowWriteIns: false,
  // allowComments removed - feature not implemented, moderation concerns
  enableNotifications: true,
  preventDuplicateVotes: true,
  maxSelections: 1,
  votingMethod: 'single',
  privacyLevel: 'public',
  moderationEnabled: false,
  autoClose: false,
});

export const createInitialPollWizardData = (): PollWizardData => ({
  title: '',
  description: '',
  category: 'general',
  options: ['', ''],
  tags: [],
  privacyLevel: 'public',
  allowMultipleVotes: false,
  showResults: true,
  isTemplate: false,
  settings: createDefaultPollWizardSettings(),
});

export const POLL_WIZARD_TOTAL_STEPS = 4;

