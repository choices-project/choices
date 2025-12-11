import { POLL_WIZARD_TOTAL_STEPS, createDefaultPollFilters } from './defaults';

import type { PollFilters, PollWizardData } from './types';

export type PollWizardValidationErrors = Record<string, string>;

export const POLL_STATUSES = ['draft', 'active', 'closed', 'archived'] as const;

export type PollStatus = (typeof POLL_STATUSES)[number];

export type PollStatusTransition =
  | 'publish'
  | 'close'
  | 'archive'
  | 'reopen'
  | 'restore';

const POLL_STATUS_TRANSITIONS: Record<PollStatus, PollStatus[]> = {
  draft: ['active', 'archived'],
  active: ['closed', 'archived'],
  closed: ['archived', 'active'],
  archived: ['draft'],
};

const uniqueNormalizedArray = (values: string[] | undefined): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
};

export const isValidPollStatus = (status: string | null | undefined): status is PollStatus =>
  Boolean(status && POLL_STATUSES.includes(status as PollStatus));

export const canTransitionPollStatus = (current: string, next: string): boolean => {
  if (!isValidPollStatus(current) || !isValidPollStatus(next)) {
    return false;
  }

  return POLL_STATUS_TRANSITIONS[current].includes(next);
};

export const resolveNextStatus = (
  current: string,
  transition: PollStatusTransition,
): PollStatus | null => {
  if (!isValidPollStatus(current)) {
    return null;
  }

  const mapping: Record<PollStatusTransition, PollStatus | null> = {
    publish: 'active',
    close: 'closed',
    archive: 'archived',
    reopen: 'active',
    restore: 'draft',
  };

  const candidate = mapping[transition];

  if (!candidate) {
    return null;
  }

  return canTransitionPollStatus(current, candidate) ? candidate : null;
};

export type PollFiltersValidationResult = {
  filters: PollFilters;
  errors: Partial<Record<keyof PollFilters, string>>;
  warnings: string[];
};

export const normalizePollFilters = (input: Partial<PollFilters> | undefined): PollFilters => {
  const defaults = createDefaultPollFilters();
  if (!input) {
    return defaults;
  }

  return {
    status: uniqueNormalizedArray(input.status ?? defaults.status),
    category: uniqueNormalizedArray(input.category ?? defaults.category),
    tags: uniqueNormalizedArray(input.tags ?? defaults.tags),
    dateRange: {
      start: input.dateRange?.start ?? defaults.dateRange.start,
      end: input.dateRange?.end ?? defaults.dateRange.end,
    },
    votingStatus: input.votingStatus ?? defaults.votingStatus,
    trendingOnly: input.trendingOnly ?? defaults.trendingOnly,
  };
};

export const validatePollFilters = (
  input: Partial<PollFilters> | undefined,
): PollFiltersValidationResult => {
  const filters = normalizePollFilters(input);
  const errors: Partial<Record<keyof PollFilters, string>> = {};
  const warnings: string[] = [];

  const invalidStatuses = filters.status.filter((status) => !isValidPollStatus(status));
  if (invalidStatuses.length > 0) {
    errors.status = `Invalid statuses removed: ${invalidStatuses.join(', ')}`;
    filters.status = filters.status.filter(isValidPollStatus);
  }

  if (filters.status.length === 0) {
    warnings.push('No statuses selected; results will include all statuses.');
  }

  if (filters.dateRange.start && filters.dateRange.end) {
    const start = Date.parse(filters.dateRange.start);
    const end = Date.parse(filters.dateRange.end);
    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      errors.dateRange = 'Start date must be before end date';
      filters.dateRange = { ...filters.dateRange, end: filters.dateRange.start };
    }
  }

  return { filters, errors, warnings };
};

export type PollAnalytics = {
  total: number;
  draft: number;
  active: number;
  closed: number;
  archived: number;
  trending: number;
  totalVotes: number;
};

type PollAnalyticsInput = {
  status?: string | null;
  total_votes?: number | null;
  trending_position?: number | null;
};

export const derivePollAnalytics = (polls: PollAnalyticsInput[]): PollAnalytics => {
  return polls.reduce<PollAnalytics>(
    (acc, poll) => {
      const status = isValidPollStatus(poll.status ?? '') ? (poll.status as PollStatus) : 'draft';
      acc.total += 1;
      acc[status] += 1;
      if (typeof poll.total_votes === 'number') {
        acc.totalVotes += poll.total_votes;
      }
      if (typeof poll.trending_position === 'number' && poll.trending_position > 0) {
        acc.trending += 1;
      }
      return acc;
    },
    {
      total: 0,
      draft: 0,
      active: 0,
      closed: 0,
      archived: 0,
      trending: 0,
      totalVotes: 0,
    },
  );
};

export const validatePollWizardStep = (
  step: number,
  data: PollWizardData,
): PollWizardValidationErrors => {
  const errors: PollWizardValidationErrors = {};

  switch (step) {
    case 0: {
      if (!data.title.trim()) {
        errors.title = 'Title is required';
      }
      if (!data.description.trim()) {
        errors.description = 'Description is required';
      }
      break;
    }
    case 1: {
      const validOptions = data.options.filter((option) => option.trim().length > 0);
      if (validOptions.length < 2) {
        errors.options = 'At least 2 options are required';
      }
      const uniqueOptions = new Set(validOptions.map((opt) => opt.toLowerCase().trim()));
      if (uniqueOptions.size !== validOptions.length) {
        errors.options = 'Duplicate options are not allowed';
      }
      break;
    }
    case 2: {
      if (data.category === 'general' && data.tags.length === 0) {
        errors.tags = 'At least one tag is required for general polls';
      }
      break;
    }
    case 3: {
      if (data.title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters';
      }
      if (data.title.trim().length > 200) {
        errors.title = 'Title must be less than 200 characters';
      }
      if (data.description.trim().length > 1000) {
        errors.description = 'Description must be less than 1000 characters';
      }
      break;
    }
    default:
      break;
  }

  return errors;
};

export const validateAllPollWizardSteps = (
  data: PollWizardData,
  totalSteps: number = POLL_WIZARD_TOTAL_STEPS,
): PollWizardValidationErrors => {
  const errors: PollWizardValidationErrors = {};
  for (let step = 0; step < totalSteps; step += 1) {
    Object.assign(errors, validatePollWizardStep(step, data));
  }
  return errors;
};

