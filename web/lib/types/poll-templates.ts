/**
 * Poll Templates Module
 * 
 * This module provides poll template types and utilities.
 * It replaces the old @/shared/utils/lib/types/poll-templates imports.
 */

export interface PollTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  category: PollCategory;
  options: string[];
  tags: string[];
  privacyLevel: 'public' | 'private' | 'anonymous';
  estimatedDuration: number; // in minutes
  estimatedTime: number; // in minutes (alias for estimatedDuration)
  difficulty: 'easy' | 'medium' | 'hard' | 'beginner' | 'intermediate' | 'advanced';
  isPopular: boolean;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  steps: any[];
  defaultSettings: {
    allowMultipleVotes: boolean;
    allowAnonymousVotes: boolean;
    requireEmail: boolean;
    showResults: boolean;
    allowComments: boolean;
    enableNotifications: boolean;
    votingMethod: string;
    privacyLevel: string;
    moderationEnabled: boolean;
    autoClose: boolean;
  };
}

export type PollCategory = 
  | 'politics'
  | 'social'
  | 'technology'
  | 'entertainment'
  | 'sports'
  | 'education'
  | 'health'
  | 'environment'
  | 'business'
  | 'general'
  | 'food'
  | 'travel'
  | 'fashion'
  | 'finance';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

export interface PollSettings {
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  requireEmail: boolean;
  showResults: boolean;
  allowComments: boolean;
  enableNotifications: boolean;
  votingMethod: string;
  privacyLevel: string;
  moderationEnabled: boolean;
  autoClose: boolean;
  expirationDate?: Date;
  maxVotes?: number;
}

export interface PollWizardData {
  title: string;
  description: string;
  category: PollCategory;
  options: string[];
  tags: string[];
  privacyLevel: 'public' | 'private' | 'anonymous';
  allowMultipleVotes: boolean;
  showResults: boolean;
  endDate?: Date;
  isTemplate: boolean;
  settings: PollSettings;
}

export interface PollWizardState {
  currentStep: number;
  totalSteps: number;
  data: PollWizardData;
  isLoading: boolean;
  errors: Record<string, string>;
  progress: number;
  canGoBack: boolean;
  canProceed: boolean;
  isComplete: boolean;
}

// Default poll templates
export const DEFAULT_POLL_TEMPLATES: PollTemplate[] = [
  {
    id: 'quick-politics',
    name: 'Quick Political Opinion',
    title: 'Quick Political Opinion',
    description: 'A simple political opinion poll',
    category: 'politics',
    options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'],
    tags: ['politics', 'quick', 'opinion'],
    privacyLevel: 'public',
    estimatedDuration: 2,
    estimatedTime: 2,
    difficulty: 'easy',
    isPopular: true,
    usageCount: 0,
    rating: 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isPublic: true,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'single',
      privacyLevel: 'public',
      moderationEnabled: false,
      autoClose: false
    }
  },
  {
    id: 'tech-preference',
    name: 'Technology Preference',
    title: 'Technology Preference',
    description: 'Which technology do you prefer?',
    category: 'technology',
    options: ['Mobile', 'Desktop', 'Tablet', 'Smart TV'],
    tags: ['technology', 'preference', 'devices'],
    privacyLevel: 'public',
    estimatedDuration: 1,
    estimatedTime: 1,
    difficulty: 'easy',
    isPopular: true,
    usageCount: 0,
    rating: 4.2,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isPublic: true,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'single',
      privacyLevel: 'public',
      moderationEnabled: false,
      autoClose: false
    }
  },
  {
    id: 'social-issue',
    name: 'Social Issue Discussion',
    title: 'Social Issue Discussion',
    description: 'Share your thoughts on this social issue',
    category: 'social',
    options: ['Very Important', 'Important', 'Somewhat Important', 'Not Important'],
    tags: ['social', 'discussion', 'community'],
    privacyLevel: 'public',
    estimatedDuration: 5,
    estimatedTime: 5,
    difficulty: 'medium',
    isPopular: false,
    usageCount: 0,
    rating: 3.8,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    isPublic: true,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'single',
      privacyLevel: 'public',
      moderationEnabled: false,
      autoClose: false
    }
  }
];

// Template categories - now using the interface structure
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'quick',
    name: 'Quick Polls',
    description: 'Fast polls that take 2 minutes or less',
    icon: '⚡',
    color: 'yellow',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.estimatedDuration <= 2).length
  },
  {
    id: 'detailed',
    name: 'Detailed Polls',
    description: 'Comprehensive polls that take more time',
    icon: '📊',
    color: 'blue',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.estimatedDuration > 2).length
  },
  {
    id: 'survey',
    name: 'Surveys',
    description: 'Survey-style polls for data collection',
    icon: '📋',
    color: 'green',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.tags.includes('survey')).length
  },
  {
    id: 'debate',
    name: 'Debates',
    description: 'Polls designed for discussion and debate',
    icon: '💬',
    color: 'red',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.tags.includes('debate')).length
  },
  {
    id: 'ranking',
    name: 'Ranking',
    description: 'Polls for ranking and ordering options',
    icon: '🏆',
    color: 'purple',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.tags.includes('ranking')).length
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Polls for comparing different options',
    icon: '⚖️',
    color: 'orange',
    templateCount: DEFAULT_POLL_TEMPLATES.filter(t => t.tags.includes('comparison')).length
  }
];

// Utility functions
export function getTemplatesByCategory(category: PollCategory): PollTemplate[] {
  return DEFAULT_POLL_TEMPLATES.filter(template => template.category === category);
}

export function getPopularTemplates(): PollTemplate[] {
  return DEFAULT_POLL_TEMPLATES.filter(template => template.isPopular);
}

export function searchTemplates(query: string): PollTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return DEFAULT_POLL_TEMPLATES.filter(template => 
    template.title.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

