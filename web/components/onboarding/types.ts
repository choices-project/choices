// Hybrid, back-compatible onboarding types + helpers

/** Canonical per-step keys used in code and state */
export type StepId =
  | 'welcome'
  | 'profile'
  | 'privacy'
  | 'auth'
  | 'demographics'
  | 'values'
  | 'firstExperience'
  | 'platformTour'
  | 'privacyPhilosophy'
  | 'dataUsage';

/** URL/UI slugs (kebab-case) */
export type StepSlug =
  | 'welcome'
  | 'profile-setup'
  | 'privacy'
  | 'auth-setup'
  | 'demographics'
  | 'values'
  | 'first-experience'
  | 'platform-tour'
  | 'privacy-philosophy'
  | 'data-usage'
  | 'complete';

/** Mapping between ids and slugs (single source of truth) */
export const STEP_ID_TO_SLUG: Record<StepId, StepSlug> = {
  welcome: 'welcome',
  profile: 'profile-setup',
  privacy: 'privacy',
  auth: 'auth-setup',
  demographics: 'demographics',
  values: 'values',
  firstExperience: 'first-experience',
  platformTour: 'platform-tour',
  privacyPhilosophy: 'privacy-philosophy',
  dataUsage: 'data-usage',
};

export const STEP_SLUG_TO_ID: Record<StepSlug, StepId> = Object.fromEntries(
  Object.entries(STEP_ID_TO_SLUG).map(([id, slug]) => [slug, id])
) as Record<StepSlug, StepId>;

export const toSlug = (id: StepId): StepSlug => STEP_ID_TO_SLUG[id];
export const toId = (slug: StepSlug): StepId => STEP_SLUG_TO_ID[slug];

/** Step-scoped data shapes (extend safely over time) */
export interface StepDataMap {
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
}

/** Legacy structure (kept for back-compat) */
export interface LegacyOnboardingData {
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
  'first-experience': 'First Experience',
  'complete': 'Complete',
};
