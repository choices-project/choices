/**
 * Poll Utilities
 * 
 * Utility functions for poll operations
 * 
 * Created: October 10, 2025
 * Updated: October 11, 2025
 */

import type { Poll, PollOption, PollSettings, VotingMethod } from '../types';

/**
 * Format a poll date for display
 */
export function formatPollDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * Calculate the duration of a poll in milliseconds
 */
export function calculatePollDuration(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end.getTime() - start.getTime();
}

/**
 * Check if a poll is currently active
 */
export function isPollActive(startDate: string | Date, endDate: string | Date): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

/**
 * Validate poll title
 */
export function validatePollTitle(title: string): { isValid: boolean; error?: string } {
  if (!title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.length > 200) {
    return { isValid: false, error: 'Title must be 200 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validate poll description
 */
export function validatePollDescription(description: string): { isValid: boolean; error?: string } {
  if (!description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }
  if (description.length > 1000) {
    return { isValid: false, error: 'Description must be 1000 characters or less' };
  }
  return { isValid: true };
}

/**
 * Validate poll options
 */
export function validatePollOptions(options: string[]): { isValid: boolean; error?: string } {
  const validOptions = options.filter(option => option.trim().length > 0);
  if (validOptions.length < 2) {
    return { isValid: false, error: 'At least 2 options are required' };
  }
  if (validOptions.length > 10) {
    return { isValid: false, error: 'Maximum 10 options allowed' };
  }
  return { isValid: true };
}

/**
 * Validate poll settings
 */
export function validatePollSettings(settings: Partial<PollSettings>): { isValid: boolean; error?: string } {
  if (settings.max_votes_per_option !== undefined && settings.max_votes_per_option < 1) {
    return { isValid: false, error: 'Max votes per option must be at least 1' };
  }
  if (settings.max_votes_per_user !== undefined && settings.max_votes_per_user < 1) {
    return { isValid: false, error: 'Max votes per user must be at least 1' };
  }
  if (settings.min_votes_per_user !== undefined && settings.min_votes_per_user < 0) {
    return { isValid: false, error: 'Min votes per user cannot be negative' };
  }
  return { isValid: true };
}

/**
 * Format poll duration for display
 */
export function formatPollDuration(durationMs: number): string {
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Calculate poll participation rate
 */
export function calculateParticipationRate(totalVotes: number, totalUsers: number): number {
  if (totalUsers === 0) return 0;
  return Math.round((totalVotes / totalUsers) * 100);
}

/**
 * Get poll status display text
 */
export function getPollStatusText(status: Poll['status']): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'active':
      return 'Active';
    case 'closed':
      return 'Closed';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
}

/**
 * Get voting method display text
 */
export function getVotingMethodText(method: VotingMethod): string {
  switch (method) {
    case 'single':
      return 'Single Choice';
    case 'multiple':
      return 'Multiple Choice';
    case 'ranked':
      return 'Ranked Choice';
    case 'approval':
      return 'Approval Voting';
    case 'range':
      return 'Range Voting';
    case 'quadratic':
      return 'Quadratic Voting';
    default:
      return 'Unknown';
  }
}

/**
 * Check if poll allows multiple votes
 */
export function allowsMultipleVotes(votingMethod: VotingMethod): boolean {
  return ['approval', 'multiple'].includes(votingMethod);
}

/**
 * Get poll option percentage
 */
export function calculateOptionPercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return Math.round((votes / totalVotes) * 100);
}

/**
 * Sort poll options by vote count
 */
export function sortOptionsByVotes(options: PollOption[]): PollOption[] {
  return [...options].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
}

/**
 * Check if poll is expired
 */
export function isPollExpired(endDate: string | Date): boolean {
  const end = new Date(endDate);
  const now = new Date();
  return now > end;
}

/**
 * Get time remaining until poll ends
 */
export function getTimeRemaining(endDate: string | Date): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, end.getTime() - now.getTime());
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(timeRemainingMs: number): string {
  if (timeRemainingMs <= 0) return 'Expired';
  
  const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
}

/**
 * Sanitize poll title for URL
 */
export function sanitizePollTitleForUrl(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate poll summary
 */
export function generatePollSummary(poll: Poll): string {
  const status = getPollStatusText(poll.status);
  const method = getVotingMethodText((poll.voting_method || 'single') as VotingMethod);
  const votes = `${poll.total_votes} votes`;
  
  return `${status} • ${method} • ${votes}`;
}
