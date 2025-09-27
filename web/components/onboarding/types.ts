// Hybrid, back-compatible onboarding types + helpers

/** Canonical per-step keys used in code and state */
export type StepId =
  | 'welcome'
  | 'profile'
  | 'privacy'
  | 'auth'
  | 'demographics'
  | 'values'
  | 'interestSelection'
  | 'firstExperience'
  | 'platformTour'
  | 'privacyPhilosophy'
  | 'dataUsage'
  | 'contribution';

/** URL/UI slugs (kebab-case) */
export type StepSlug =
  | 'welcome'
  | 'profile-setup'
  | 'privacy'
  | 'auth-setup'
  | 'demographics'
  | 'values'
  | 'interest-selection'
  | 'first-experience'
  | 'platform-tour'
  | 'privacy-philosophy'
  | 'data-usage'
  | 'contribution'
  | 'complete';

/** Mapping between ids and slugs (single source of truth) */
export const STEP_ID_TO_SLUG: Record<StepId, StepSlug> = {
  welcome: 'welcome',
  profile: 'profile-setup',
  privacy: 'privacy',
  auth: 'auth-setup',
  demographics: 'demographics',
  values: 'values',
  interestSelection: 'interest-selection',
  firstExperience: 'first-experience',
  platformTour: 'platform-tour',
  privacyPhilosophy: 'privacy-philosophy',
  dataUsage: 'data-usage',
  contribution: 'contribution',
};

export const STEP_SLUG_TO_ID: Record<StepSlug, StepId> = Object.fromEntries(
  Object.entries(STEP_ID_TO_SLUG).map(([id, slug]) => [slug, id])
) as Record<StepSlug, StepId>;

export const toSlug = (id: StepId): StepSlug => STEP_ID_TO_SLUG[id];
export const toId = (slug: StepSlug): StepId => STEP_SLUG_TO_ID[slug];

/** Step-scoped data shapes (extend safely over time) */
export type StepDataMap = {
  welcome: { welcomeStarted?: boolean };

  profile: {
    displayName?: string;
    profileVisibility?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    profileSetupCompleted?: boolean;
  };

  privacy: {
    shareAnalytics?: boolean;
    dpLevel?: number;
    privacyCompleted?: boolean;
  };

  auth: {
    mfaEnabled?: boolean;
    authMethod?: string;
    authCompleted?: boolean;
  };

  demographics: {
    ageRange?: string;
    region?: string;
    education?: string;
    employment?: string;
    incomeRange?: string;
    demographics?: Record<string, string>;
  };

  values: { valuesCompleted?: boolean };

  interestSelection: {
    selectedInterests?: string[];
    interestSelectionCompleted?: boolean;
  };

  firstExperience: {
    firstExperienceCompleted?: boolean;
    firstVote?: string;
  };

  platformTour: { platformTourCompleted?: boolean };

  privacyPhilosophy: {
    privacyPhilosophyCompleted?: boolean;
    privacyLevel?: 'low' | 'medium' | 'high' | 'maximum' | string;
    profileVisibility?: 'public' | 'private' | 'friends_only' | 'anonymous' | string;
    dataSharing?: 'none' | 'analytics_only' | 'research' | 'full' | string;
  };

  dataUsage: { dataUsageCompleted?: boolean };

  contribution: {
    contributionInterests?: string[];
    contributionStepCompleted?: boolean;
  };
}

/** Legacy structure (kept for back-compat) */
export type LegacyOnboardingData = {
  user?: unknown;
  displayName?: string;
  avatar?: string;

  // Legacy privacy prefs
  privacyLevel?: 'low' | 'medium' | 'high' | 'maximum' | string;
  profileVisibility?: 'public' | 'private' | 'friends_only' | 'anonymous' | string;
  dataSharing?: 'none' | 'analytics_only' | 'research' | 'full' | string;

  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  /**
   * We store slugs here for URL/UI stability.
   * (If older code expects arbitrary strings, this is still assignable.)
   */
  completedSteps: string[]; // actually StepSlug[], but kept as string[] for broad compat
  stepData: Record<string, unknown>;

  // Legacy completion flags
  privacyPhilosophyCompleted?: boolean;
  platformTourCompleted?: boolean;
  dataUsageCompleted?: boolean;
  authSetupCompleted?: boolean;
  profileSetupCompleted?: boolean;
  firstExperienceCompleted?: boolean;
  
  // Progressive disclosure state
  showAdvancedPrivacy?: boolean;
}

/** New + legacy hybrid snapshot used by the app */
export type OnboardingDataHybrid =
  Partial<{ [K in StepId]: StepDataMap[K] }> & LegacyOnboardingData;

/** Lint-safe function-prop types (rest-tuple avoids unused param id warnings) */
export type OnStepUpdate<K extends StepId> =
  (...args: [Partial<StepDataMap[K]>]) => void;

export type OnGenericUpdate =
  (...args: [Partial<OnboardingDataHybrid>]) => void;

// ---- Progress/UI helpers ----

export const DEFAULT_STEP_ORDER: StepSlug[] = [
  'welcome',
  'privacy-philosophy',
  'platform-tour',
  'data-usage',
  'auth-setup',
  'profile-setup',
  'interest-selection',
  'first-experience',
  'complete',
];

export const STEP_LABEL: Record<StepSlug, string> = {
  'welcome': 'Welcome',
  'privacy': 'Privacy',
  'privacy-philosophy': 'Privacy Philosophy',
  'platform-tour': 'Platform Tour',
  'data-usage': 'Data Usage',
  'auth-setup': 'Auth Setup',
  'profile-setup': 'Profile Setup',
  'demographics': 'Demographics',
  'values': 'Values',
  'interest-selection': 'Your Interests',
  'contribution': 'Contribution',
  'first-experience': 'First Experience',
  'complete': 'Complete',
};
