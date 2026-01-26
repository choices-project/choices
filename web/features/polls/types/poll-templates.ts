export type PollTemplate = {
  id: string;
  name: string;
  description: string;
  category: PollCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  tags: string[];
  thumbnail?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  rating: number;
  steps: PollWizardStep[];
  defaultSettings: PollSettings;
}

export type PollWizardStep = {
  id: string;
  title: string;
  description: string;
  type: 'question' | 'options' | 'settings' | 'preview' | 'confirmation';
  required: boolean;
  order: number;
  validation?: StepValidation;
  options?: WizardStepOption[];
}

export type WizardStepOption = {
  id: string;
  label: string;
  value: string | number | boolean;
  description?: string;
  icon?: string;
  isDefault?: boolean;
}

export type StepValidation = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: string | number | boolean) => boolean | string;
}

export type PollSettings = {
  allowMultipleVotes: boolean;
  // allowAnonymousVotes removed - was saved but never checked
  // requireAuthentication removed - redundant, main vote endpoint always requires auth
  requireEmail: boolean;
  showResults: boolean;
  // allowComments removed - feature not implemented
  enableNotifications: boolean;
  expirationDate?: Date;
  maxVotes?: number;
  votingMethod: 'single' | 'multiple' | 'ranked' | 'approval';
  privacyLevel: 'public' | 'private' | 'invite-only';
  moderationEnabled: boolean;
  autoClose: boolean;
  autoCloseThreshold?: number;
}

export type PollWizardState = {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  canProceed: boolean;
  canGoBack: boolean;
  data: PollWizardData;
  errors: Record<string, string>;
  isLoading: boolean;
}

export type PollWizardData = {
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
}

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

export type TemplateCategory = {
  id: PollCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  templateCount: number;
}

export type PollWizardProgress = {
  step: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
  hasError: boolean;
  estimatedTime: number;
}

export type PollTemplateSearch = {
  query: string;
  category?: PollCategory;
  difficulty?: string;
  tags?: string[];
  sortBy: 'popular' | 'recent' | 'rating' | 'name';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export type PollTemplateStats = {
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

