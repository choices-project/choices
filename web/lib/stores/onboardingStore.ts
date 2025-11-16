/**
 * Onboarding Store - Zustand Implementation
 *
 * Comprehensive onboarding state management including step navigation,
 * form data persistence, and progress tracking. Integrates with UserStore
 * for profile data and AppStore for user preferences.
 *
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import type { StateCreator, StoreApi } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type {
  AuthSetupStepData,
  ProfileData as FeatureProfileData,
  ValuesData as FeatureValuesData,
  PrivacyPreferences,
} from '@/features/onboarding/types';
import { logger } from '@/lib/utils/logger';

import { createSafeStorage } from './storage';

// Onboarding data types
type AuthData = {
  method?: 'email' | 'google' | 'apple' | 'phone';
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
  marketingOptIn?: boolean;
}

type ProfileData = FeatureProfileData & {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  location?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  website?: string;
};

type ValuesData = FeatureValuesData & {
  politicalAffiliation?: string;
  secondaryInterests?: string[];
  values?: string[];
  priorities?: string[];
  engagementLevel?: 'low' | 'medium' | 'high';
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
};

type PreferencesData = PrivacyPreferences & {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: boolean;
  privacy?: 'public' | 'private' | 'friends';
  dataSharing?: boolean;
  marketing?: boolean;
};

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
  skipped: boolean;
  data?: unknown;
};

export type OnboardingState = {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  isActive: boolean;
  authData: AuthData;
  profileData: ProfileData;
  valuesData: ValuesData;
  preferencesData: PreferencesData;
  progress: number;
  completedSteps: number[];
  skippedSteps: number[];
  stepData: Record<number, unknown>;
  steps: OnboardingStep[];
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;
};

export type OnboardingActions = {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  updateFormData: (step: number, data: Record<string, unknown>) => void;
  updateAuthData: (data: Partial<AuthData>) => void;
  updateProfileData: (data: Partial<ProfileData>) => void;
  updateValuesData: (data: Partial<ValuesData>) => void;
  updatePreferencesData: (data: Partial<PreferencesData>) => void;
  clearStepData: (step: number) => void;
  clearAllData: () => void;
  markStepCompleted: (step: number) => void;
  markStepSkipped: (step: number) => void;
  markStepIncomplete: (step: number) => void;
  canProceedToNextStep: (step: number) => boolean;
  getStepValidationErrors: (step: number) => string[];
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  submitOnboarding: () => Promise<void>;
  validateStep: (step: number) => boolean;
  validateAllSteps: () => boolean;
  // Candidate onboarding extensions (no new store)
  startCandidateOnboarding: (input: {
    displayName: string;
    office?: string;
    jurisdiction?: string;
    party?: string;
  }) => Promise<{ id: string; slug: string } | null>;
  verifyCandidateOfficialEmail: () => Promise<{ ok: boolean; slug?: string }>;
};

export type OnboardingStore = OnboardingState & OnboardingActions;

type OnboardingStoreCreator = StateCreator<
  OnboardingStore,
  [['zustand/devtools', never], ['zustand/persist', unknown]]
>;

type OnboardingStoreSetState = StoreApi<OnboardingStore>['setState'];
type OnboardingStoreGetState = StoreApi<OnboardingStore>['getState'];

// Default onboarding steps
const defaultSteps: OnboardingStep[] = [
  {
    id: 0,
    title: 'Welcome',
    description: 'Get started with your civic engagement journey',
    component: 'WelcomeStep',
    required: true,
    completed: false,
    skipped: false,
  },
  {
    id: 1,
    title: 'Authentication',
    description: 'Set up your account and security',
    component: 'AuthSetupStep',
    required: true,
    completed: false,
    skipped: false,
  },
  {
    id: 2,
    title: 'Profile Setup',
    description: 'Tell us about yourself',
    component: 'ProfileSetupStep',
    required: true,
    completed: false,
    skipped: false,
  },
  {
    id: 3,
    title: 'Values & Interests',
    description: 'Help us personalize your experience',
    component: 'ValuesStep',
    required: true,
    completed: false,
    skipped: false,
  },
  {
    id: 4,
    title: 'Privacy & Data',
    description: 'Control your data and privacy settings',
    component: 'DataUsageStepLite',
    required: true,
    completed: false,
    skipped: false,
  },
  {
    id: 5,
    title: 'Complete',
    description: 'You\'re all set! Welcome to Choices',
    component: 'CompleteStep',
    required: true,
    completed: false,
    skipped: false,
  },
];

const mergeState = <T extends object>(state: T, updates: Partial<T>): T => {
  const base = Object.assign({}, state) as Record<string, unknown>;
  for (const [k, v] of Object.entries(updates as Record<string, unknown>)) {
    if (v !== undefined) {
      base[k] = v;
    } else {
      delete base[k];
    }
  }
  return base as T;
};

const mergeStepData = (
  stepData: Record<number, unknown>,
  step: number,
  data: unknown,
): Record<number, unknown> =>
  mergeState(stepData, { [step]: data } as Record<number, unknown>);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const getBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const getStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

const getAuthMethod = (value: unknown): AuthSetupStepData['authMethod'] | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const authMethods: AuthSetupStepData['authMethod'][] = ['email', 'social', 'webauthn', 'anonymous', 'skip'];
  return (authMethods as string[]).includes(value) ? (value as AuthSetupStepData['authMethod']) : undefined;
};

const cloneSteps = () => defaultSteps.map((step) => mergeState(step, {}));

export const createInitialOnboardingState = (): OnboardingState => ({
  currentStep: 0,
  totalSteps: defaultSteps.length,
  isCompleted: false,
  isSkipped: false,
  isActive: false,
  authData: {} as AuthData,
  profileData: {} as ProfileData,
  valuesData: {} as ValuesData,
  preferencesData: {} as PreferencesData,
  progress: 0,
  completedSteps: [],
  skippedSteps: [],
  stepData: {},
  steps: cloneSteps(),
  isLoading: false,
  isSaving: false,
  isSubmitting: false,
  error: null,
});

export const createOnboardingActions = (
  set: OnboardingStoreSetState,
  get: OnboardingStoreGetState
): OnboardingActions => ({
  setCurrentStep: (step) =>
    set((state: OnboardingStore) => {
      const newStep = Math.max(0, Math.min(step, state.totalSteps - 1));
      const progress = (newStep / state.totalSteps) * 100;

      logger.info('Onboarding step changed', {
        from: state.currentStep,
        to: newStep,
        progress: Math.round(progress),
      });

      return mergeState(state, {
        currentStep: newStep,
        progress,
      });
    }),

  nextStep: () =>
    set((state: OnboardingStore) => {
      const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
      const progress = (nextStep / state.totalSteps) * 100;

      logger.info('Onboarding next step', {
        currentStep: nextStep,
        progress: Math.round(progress),
      });

      return mergeState(state, {
        currentStep: nextStep,
        progress,
      });
    }),

  previousStep: () =>
    set((state: OnboardingStore) => {
      const prevStep = Math.max(state.currentStep - 1, 0);
      const progress = (prevStep / state.totalSteps) * 100;

      logger.info('Onboarding previous step', {
        currentStep: prevStep,
        progress: Math.round(progress),
      });

      return mergeState(state, {
        currentStep: prevStep,
        progress,
      });
    }),

  goToStep: (step) => {
    const { setCurrentStep } = get();
    setCurrentStep(step);
  },

  completeOnboarding: () =>
    set((state: OnboardingStore) => {
      logger.info('Onboarding completed', {
        totalSteps: state.totalSteps,
        completedSteps: state.completedSteps.length + 1,
      });

      return mergeState(state, {
        isCompleted: true,
        isActive: false,
        progress: 100,
        completedSteps: [...state.completedSteps, state.currentStep],
      });
    }),

  skipOnboarding: () =>
    set({
      isSkipped: true,
      isActive: false,
      progress: 100,
    }),

  restartOnboarding: () =>
    set(() => ({
      ...createInitialOnboardingState(),
      isActive: true,
    })),

  updateFormData: (step, data) =>
    set((state: OnboardingStore) => {
      const existing = asRecord(state.stepData[step]);
      const merged = mergeState(existing, data as Record<string, unknown>);
      const next = {
        stepData: mergeStepData(state.stepData, step, merged),
      } as Partial<OnboardingStore>;
      queueMicrotask(async () => {
        try {
          await get().saveProgress();
        } catch {
          // Ignore persistence errors in background save; surfaced via explicit saveProgress calls
        }
      });
      return next as OnboardingStore;
    }),

  updateAuthData: (data) =>
    set((state: OnboardingStore) => {
      const next = {
        authData: mergeState(state.authData, data),
      } as Partial<OnboardingStore>;
      queueMicrotask(async () => {
        try {
          await get().saveProgress();
        } catch {
          // Ignore persistence errors in background save; surfaced via explicit saveProgress calls
        }
      });
      return next as OnboardingStore;
    }),

  updateProfileData: (data) =>
    set((state: OnboardingStore) => {
      const next = {
        profileData: mergeState(state.profileData, data),
      } as Partial<OnboardingStore>;
      queueMicrotask(async () => {
        try {
          await get().saveProgress();
        } catch {
          // Ignore persistence errors in background save; surfaced via explicit saveProgress calls
        }
      });
      return next as OnboardingStore;
    }),

  updateValuesData: (data) =>
    set((state: OnboardingStore) => {
      const next = {
        valuesData: mergeState(state.valuesData, data),
      } as Partial<OnboardingStore>;
      queueMicrotask(async () => {
        try {
          await get().saveProgress();
        } catch {
          // Ignore persistence errors in background save; surfaced via explicit saveProgress calls
        }
      });
      return next as OnboardingStore;
    }),

  updatePreferencesData: (data) =>
    set((state: OnboardingStore) => {
      const next = {
        preferencesData: mergeState(state.preferencesData, data),
      } as Partial<OnboardingStore>;
      queueMicrotask(async () => {
        try {
          await get().saveProgress();
        } catch {
          // Intentionally ignore persistence errors in background save
          return;
        }
      });
      return next as OnboardingStore;
    }),

  clearStepData: (step) =>
    set((state: OnboardingStore) => ({
      stepData: mergeStepData(state.stepData, step, {}),
    })),

  clearAllData: () =>
    set(() => ({
      stepData: {},
      authData: {} as AuthData,
      profileData: {} as ProfileData,
      valuesData: {} as ValuesData,
      preferencesData: {} as PreferencesData,
    })),

  markStepCompleted: (step) =>
    set((state: OnboardingStore) => ({
      completedSteps: [...state.completedSteps, step],
      steps: state.steps.map((s: OnboardingStep) => (s.id === step ? mergeState(s, { completed: true }) : s)),
    })),

  markStepSkipped: (step) =>
    set((state: OnboardingStore) => ({
      skippedSteps: [...state.skippedSteps, step],
      steps: state.steps.map((s: OnboardingStep) => (s.id === step ? mergeState(s, { skipped: true }) : s)),
    })),

  markStepIncomplete: (step) =>
    set((state: OnboardingStore) => ({
      completedSteps: state.completedSteps.filter((s) => s !== step),
      steps: state.steps.map((s: OnboardingStep) => (s.id === step ? mergeState(s, { completed: false }) : s)),
    })),

  canProceedToNextStep: (step) => {
    const state = get();
    const currentStepData = asRecord(state.stepData[step]);
    const stepConfig = state.steps.find((s) => s.id === step);

    if (!stepConfig?.required) return true;

    switch (step) {
      case 0:
        return true;
      case 1: {
        const method = getAuthMethod(currentStepData.authMethod);
        const completed = getBoolean(currentStepData.authSetupCompleted);
        const email = getString(currentStepData.email);
        return method === 'skip' || Boolean(completed) || !!email;
      }
      case 2: {
        const completed = getBoolean(currentStepData.profileSetupCompleted);
        const displayName = getString(currentStepData.displayName);
        const visibility = getString(currentStepData.profileVisibility);
        return Boolean(completed) || !!displayName || !!visibility;
      }
      case 3: {
        const primaryConcerns = getStringArray(currentStepData.primaryConcerns);
        const communityFocus = getStringArray(currentStepData.communityFocus);
        return primaryConcerns.length > 0 && communityFocus.length > 0;
      }
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  },

  getStepValidationErrors: (step) => {
    const state = get();
    const currentStepData = asRecord(state.stepData[step]);
    const errors: string[] = [];

    switch (step) {
      case 1: {
        const method = getAuthMethod(currentStepData.authMethod);
        if (!method) {
          errors.push('Select an authentication method.');
        }
        if (method === 'email' && !getString(currentStepData.email)) {
          errors.push('Provide a valid email address for the email login option.');
        }
        break;
      }
      case 2: {
        if (!getString(currentStepData.profileVisibility)) {
          errors.push('Choose a profile visibility setting.');
        }
        break;
      }
      case 3: {
        if (getStringArray(currentStepData.primaryConcerns).length === 0) {
          errors.push('Select at least one primary concern.');
        }
        if (getStringArray(currentStepData.communityFocus).length === 0) {
          errors.push('Select at least one community focus.');
        }
        break;
      }
      default:
        break;
    }

    return errors;
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  saveProgress: async () => {
    const { setSaving, setError } = get();

    try {
      setSaving(true);
      setError(null);

      const state = get();
      const response = await fetch('/api/profile?action=onboarding-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: state.currentStep,
          progress: state.progress,
          stepData: state.stepData,
          authData: state.authData,
          profileData: state.profileData,
          valuesData: state.valuesData,
          preferencesData: state.preferencesData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding progress');
      }

      logger.info('Onboarding progress saved', {
        currentStep: state.currentStep,
        progress: state.progress,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to save onboarding progress', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setSaving(false);
    }
  },

  loadProgress: async () => {
    const { setLoading, setError } = get();

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profile?action=onboarding-progress');

      if (!response.ok) {
        throw new Error('Failed to load onboarding progress');
      }

      const data = await response.json();

      set({
        currentStep: data.currentStep ?? 0,
        progress: data.progress ?? 0,
        stepData: data.stepData ?? {},
        authData: data.authData ?? {},
        profileData: data.profileData ?? {},
        valuesData: data.valuesData ?? {},
        preferencesData: data.preferencesData ?? {},
      });

      logger.info('Onboarding progress loaded', {
        currentStep: data.currentStep,
        progress: data.progress,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to load onboarding progress', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  },

  submitOnboarding: async () => {
    const { setSubmitting, setError, completeOnboarding } = get();

    try {
      setSubmitting(true);
      setError(null);

      const state = get();
      const response = await fetch('/api/profile?action=complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authData: state.authData,
          profileData: state.profileData,
          valuesData: state.valuesData,
          preferencesData: state.preferencesData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      completeOnboarding();

      logger.info('Onboarding submitted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      logger.error('Failed to submit onboarding', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setSubmitting(false);
    }
  },

  validateStep: (step) => {
    const { getStepValidationErrors } = get();
    const errors = getStepValidationErrors(step);
    return errors.length === 0;
  },

  validateAllSteps: () => {
    const { validateStep, totalSteps } = get();
    return Array.from({ length: totalSteps }, (_, i) => i).every((step) => validateStep(step));
  },

  startCandidateOnboarding: async (input) => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/candidates/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: input.displayName,
          office: input.office,
          jurisdiction: input.jurisdiction,
          party: input.party,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false || !payload?.data?.slug) {
        throw new Error(payload?.error ?? 'Failed to start candidate onboarding');
      }
      // Persist slug into stepData for the current step
      const state = get();
      const step = state.currentStep;
      const existing = asRecord(state.stepData[step]);
      const merged = mergeState(existing, { candidateSlug: payload.data.slug, candidateId: payload.data.id });
      set({
        stepData: mergeStepData(state.stepData, step, merged),
      });
      return { id: String(payload.data.id), slug: String(payload.data.slug) };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error starting candidate onboarding';
      get().setError(message);
      return null;
    } finally {
      get().setLoading(false);
    }
  },

  verifyCandidateOfficialEmail: async () => {
    const { setLoading, setError } = get();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/candidates/verify/official-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error ?? 'Verification failed');
      }
      return { ok: Boolean(payload?.data?.ok), slug: payload?.data?.slug };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during verification';
      get().setError(message);
      return { ok: false };
    } finally {
      get().setLoading(false);
    }
  },
});

export const onboardingStoreCreator: OnboardingStoreCreator = (set, get) =>
  Object.assign(createInitialOnboardingState(), createOnboardingActions(set, get));

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(onboardingStoreCreator, {
      name: 'onboarding-store',
      storage: createSafeStorage(),
      partialize: (state) => ({
        currentStep: state.currentStep,
        progress: state.progress,
        stepData: state.stepData,
        authData: state.authData,
        profileData: state.profileData,
        valuesData: state.valuesData,
        preferencesData: state.preferencesData,
        completedSteps: state.completedSteps,
        skippedSteps: state.skippedSteps,
      }),
    }),
    { name: 'onboarding-store' }
  )
);

// Store selectors for optimized re-renders
export const useOnboardingStep = () => useOnboardingStore(state => state.currentStep);
export const useOnboardingProgress = () => useOnboardingStore(state => state.progress);
export const useOnboardingCompleted = () => useOnboardingStore(state => state.isCompleted);
export const useOnboardingSkipped = () => useOnboardingStore(state => state.isSkipped);
export const useOnboardingActive = () => useOnboardingStore(state => state.isActive);
// FIXED: Use individual selectors to prevent infinite re-renders
export const useOnboardingData = () => {
  const currentStep = useOnboardingStore(state => state.currentStep);
  const progress = useOnboardingStore(state => state.progress);
  const isCompleted = useOnboardingStore(state => state.isCompleted);
  const authData = useOnboardingStore(state => state.authData);
  const profileData = useOnboardingStore(state => state.profileData);
  const valuesData = useOnboardingStore(state => state.valuesData);
  const preferencesData = useOnboardingStore(state => state.preferencesData);

  return {
    currentStep,
    progress,
    isCompleted,
    authData,
    profileData,
    valuesData,
    preferencesData,
  };
};
export const useOnboardingLoading = () => useOnboardingStore(state => state.isLoading);
export const useOnboardingError = () => useOnboardingStore(state => state.error);

// Action selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useOnboardingActions = () => {
  const setCurrentStep = useOnboardingStore(state => state.setCurrentStep);
  const nextStep = useOnboardingStore(state => state.nextStep);
  const previousStep = useOnboardingStore(state => state.previousStep);
  const goToStep = useOnboardingStore(state => state.goToStep);
  const completeOnboarding = useOnboardingStore(state => state.completeOnboarding);
  const skipOnboarding = useOnboardingStore(state => state.skipOnboarding);
  const restartOnboarding = useOnboardingStore(state => state.restartOnboarding);
  const updateFormData = useOnboardingStore(state => state.updateFormData);
  const updateAuthData = useOnboardingStore(state => state.updateAuthData);
  const updateProfileData = useOnboardingStore(state => state.updateProfileData);
  const updateValuesData = useOnboardingStore(state => state.updateValuesData);
  const updatePreferencesData = useOnboardingStore(state => state.updatePreferencesData);
  const clearStepData = useOnboardingStore(state => state.clearStepData);
  const clearAllData = useOnboardingStore(state => state.clearAllData);
  const markStepCompleted = useOnboardingStore(state => state.markStepCompleted);
  const markStepSkipped = useOnboardingStore(state => state.markStepSkipped);
  const markStepIncomplete = useOnboardingStore(state => state.markStepIncomplete);
  const canProceedToNextStep = useOnboardingStore(state => state.canProceedToNextStep);
  const getStepValidationErrors = useOnboardingStore(state => state.getStepValidationErrors);
  const setLoading = useOnboardingStore(state => state.setLoading);
  const setSaving = useOnboardingStore(state => state.setSaving);
  const setSubmitting = useOnboardingStore(state => state.setSubmitting);
  const setError = useOnboardingStore(state => state.setError);
  const clearError = useOnboardingStore(state => state.clearError);
  const saveProgress = useOnboardingStore(state => state.saveProgress);
  const loadProgress = useOnboardingStore(state => state.loadProgress);
  const submitOnboarding = useOnboardingStore(state => state.submitOnboarding);
  const validateStep = useOnboardingStore(state => state.validateStep);
  const validateAllSteps = useOnboardingStore(state => state.validateAllSteps);

  return useMemo(
    () => ({
      setCurrentStep,
      nextStep,
      previousStep,
      goToStep,
      completeOnboarding,
      skipOnboarding,
      restartOnboarding,
      updateFormData,
      updateAuthData,
      updateProfileData,
      updateValuesData,
      updatePreferencesData,
      clearStepData,
      clearAllData,
      markStepCompleted,
      markStepSkipped,
      markStepIncomplete,
      canProceedToNextStep,
      getStepValidationErrors,
      setLoading,
      setSaving,
      setSubmitting,
      setError,
      clearError,
      saveProgress,
      loadProgress,
      submitOnboarding,
      validateStep,
      validateAllSteps,
    }),
    [
      setCurrentStep,
      nextStep,
      previousStep,
      goToStep,
      completeOnboarding,
      skipOnboarding,
      restartOnboarding,
      updateFormData,
      updateAuthData,
      updateProfileData,
      updateValuesData,
      updatePreferencesData,
      clearStepData,
      clearAllData,
      markStepCompleted,
      markStepSkipped,
      markStepIncomplete,
      canProceedToNextStep,
      getStepValidationErrors,
      setLoading,
      setSaving,
      setSubmitting,
      setError,
      clearError,
      saveProgress,
      loadProgress,
      submitOnboarding,
      validateStep,
      validateAllSteps,
    ],
  );
};

// Computed selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useOnboardingStats = () => {
  const totalSteps = useOnboardingStore(state => state.totalSteps);
  const currentStep = useOnboardingStore(state => state.currentStep);
  const completedSteps = useOnboardingStore(state => state.completedSteps.length);
  const skippedSteps = useOnboardingStore(state => state.skippedSteps.length);
  const progress = useOnboardingStore(state => state.progress);
  const isCompleted = useOnboardingStore(state => state.isCompleted);
  const isSkipped = useOnboardingStore(state => state.isSkipped);

  return {
    totalSteps,
    currentStep,
    completedSteps,
    skippedSteps,
    progress,
    isCompleted,
    isSkipped,
  };
};

export const useCurrentStepData = () => useOnboardingStore(state =>
  state.stepData[state.currentStep] ?? {}
);

export const useStepValidation = (step: number) => useOnboardingStore(state => ({
  canProceed: state.canProceedToNextStep(step),
  errors: state.getStepValidationErrors(step),
  isValid: state.validateStep(step),
}));

// Store utilities
export const onboardingStoreUtils = {
  /**
   * Get onboarding summary
   */
  getOnboardingSummary: () => {
    const state = useOnboardingStore.getState();
    return {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isCompleted: state.isCompleted,
      isSkipped: state.isSkipped,
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
    };
  },

  /**
   * Get step data for specific step
   */
  getStepData: (step: number) => {
    const state = useOnboardingStore.getState();
    return state.stepData[step] ?? {};
  },

  /**
   * Check if onboarding can be completed
   */
  canCompleteOnboarding: () => {
    const state = useOnboardingStore.getState();
    return state.validateAllSteps() && state.currentStep === state.totalSteps - 1;
  },

  /**
   * Get onboarding progress percentage
   */
  getProgressPercentage: () => {
    const state = useOnboardingStore.getState();
    return Math.round(state.progress);
  },

  /**
   * Get next incomplete step
   */
  getNextIncompleteStep: () => {
    const state = useOnboardingStore.getState();
    const incompleteSteps = state.steps.filter(step => !step.completed && !step.skipped);
    return incompleteSteps[0] ?? null;
  }
};

// Store subscriptions for external integrations
export const onboardingStoreSubscriptions = {
  /**
   * Subscribe to onboarding progress changes
   */
  onProgressChange: (callback: (progress: number) => void) => {
    return useOnboardingStore.subscribe(
      (state) => {
        callback(state.progress);
      }
    );
  },

  /**
   * Subscribe to step changes
   */
  onStepChange: (callback: (step: number) => void) => {
    return useOnboardingStore.subscribe(
      (state) => {
        callback(state.currentStep);
      }
    );
  },

  /**
   * Subscribe to completion status
   */
  onCompletionChange: (callback: (isCompleted: boolean) => void) => {
    return useOnboardingStore.subscribe(
      (state) => {
        callback(state.isCompleted);
      }
    );
  }
};

// Store debugging utilities
export const onboardingStoreDebug = {
  /**
   * Log current onboarding state
   */
  logState: () => {
    const state = useOnboardingStore.getState();
    logger.debug('Onboarding Store State', {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isCompleted: state.isCompleted,
      isSkipped: state.isSkipped,
      completedSteps: state.completedSteps,
      skippedSteps: state.skippedSteps,
      isLoading: state.isLoading,
      error: state.error
    });
  },

  /**
   * Log onboarding summary
   */
  logSummary: () => {
    const summary = onboardingStoreUtils.getOnboardingSummary();
    logger.debug('Onboarding Summary', summary);
  },

  /**
   * Log step data
   */
  logStepData: (step: number) => {
    const stepData = onboardingStoreUtils.getStepData(step);
    logger.debug('Step Data', { step, stepData });
  },

  /**
   * Reset onboarding store
   */
  reset: () => {
    useOnboardingStore.getState().restartOnboarding();
    logger.info('Onboarding store reset');
  }
};
