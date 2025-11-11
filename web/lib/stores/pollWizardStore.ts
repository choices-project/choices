/**
 * Poll Wizard Store - Zustand Implementation
 *
 * Modernized poll creation wizard store providing typed state/actions, standardized middleware,
 * persistence, and selector helpers for the creation flow.
 */

import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import {
  createInitialPollWizardData,
  POLL_WIZARD_TOTAL_STEPS,
} from '@/lib/polls/defaults';
import type { PollWizardData, PollWizardSettings } from '@/lib/polls/types';
import {
  validateAllPollWizardSteps,
  validatePollWizardStep,
} from '@/lib/polls/validation';
import { logger } from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

export type { PollWizardData, PollWizardSettings } from '@/lib/polls/types';

export type PollWizardState = {
  currentStep: number;
  totalSteps: number;
  data: PollWizardData;
  isLoading: boolean;
  errors: Record<string, string>;
  progress: number;
  canGoBack: boolean;
  canProceed: boolean;
  isComplete: boolean;
};

export type PollWizardActions = {
  setLoading: (loading: boolean) => void;
  // Step navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;

  // Data updates
  updateData: (updates: Partial<PollWizardData>) => void;
  updateSettings: (settings: Partial<PollWizardSettings>) => void;

  // Options management
  addOption: () => void;
  removeOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;

  // Tags management
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  updateTags: (tags: string[]) => void;

  // Validation
  validateStep: (step: number, data: PollWizardData) => Record<string, string>;
  validateCurrentStep: () => void;

  // Error handling
  setFieldError: (field: string, error: string) => void;
  /** @deprecated use setFieldError */
  setError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  /** @deprecated use clearFieldError */
  clearError: (field: string) => void;
  clearAllErrors: () => void;

  // Utilities
  getStepData: (step: number) => Partial<PollWizardData>;
  getProgress: () => number;
  canProceedToNextStep: (step: number) => boolean;
  isStepValid: (step: number) => boolean;
  getStepErrors: (step: number) => Record<string, string>;
};

export type PollWizardStore = PollWizardState & PollWizardActions;

type PollWizardStoreCreator = StateCreator<
  PollWizardStore,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]]
>;

export const createInitialPollWizardState = (): PollWizardState => ({
  currentStep: 0,
  totalSteps: POLL_WIZARD_TOTAL_STEPS,
  data: createInitialPollWizardData(),
  isLoading: false,
  errors: {},
  progress: 0,
  canGoBack: false,
  canProceed: false,
  isComplete: false,
});

const mergeWizardData = (data: PollWizardData, updates: Partial<PollWizardData>) => ({
  ...data,
  ...updates,
});

const mergeWizardSettings = (
  settings: PollWizardSettings,
  updates: Partial<PollWizardSettings>,
) => ({
  ...settings,
  ...updates,
});

export const createPollWizardActions = (
  set: Parameters<PollWizardStoreCreator>[0],
  get: Parameters<PollWizardStoreCreator>[1],
): PollWizardActions => {
  const setState = set as unknown as (recipe: (draft: PollWizardState) => void) => void;
  const baseActions = createBaseStoreActions<PollWizardState>(setState);

  const applyStepResult = (step: number) => {
    const totalSteps = get().totalSteps;
    const progress = ((step + 1) / totalSteps) * 100;
    setState((state) => {
      state.currentStep = step;
      state.progress = progress;
      state.canGoBack = step > 0;
      state.canProceed = step < totalSteps - 1;
      state.isComplete = step === totalSteps - 1;
      state.errors = {};
    });
  };

  const runValidation = (step: number, data: PollWizardData) =>
    validatePollWizardStep(step, data);

  return {
    setLoading: baseActions.setLoading,

    setFieldError: (field, error) =>
      setState((state) => {
        state.errors[field] = error;
      }),

    setError: (field, error) =>
      setState((state) => {
        state.errors[field] = error;
      }),

    clearFieldError: (field) =>
      setState((state) => {
        delete state.errors[field];
      }),

    clearError: (field) =>
      setState((state) => {
        delete state.errors[field];
      }),

    clearAllErrors: () =>
      setState((state) => {
        state.errors = {};
      }),

    nextStep: () => {
      const state = get();
      const errors = runValidation(state.currentStep, state.data);
      if (Object.keys(errors).length > 0) {
        setState((draft) => {
          draft.errors = errors;
          draft.canProceed = false;
        });
        return;
      }

      const next = Math.min(state.currentStep + 1, state.totalSteps - 1);
      applyStepResult(next);
    },

    prevStep: () => {
      const state = get();
      const previous = Math.max(state.currentStep - 1, 0);
      applyStepResult(previous);
    },

    goToStep: (step: number) => {
      const state = get();
      const target = Math.max(0, Math.min(step, state.totalSteps - 1));

      if (target > state.currentStep) {
        const errors = runValidation(state.currentStep, state.data);
        if (Object.keys(errors).length > 0) {
          setState((draft) => {
            draft.errors = errors;
            draft.canProceed = false;
          });
          return;
        }
      }

      applyStepResult(target);
    },

    resetWizard: () =>
      setState((state) => {
        Object.assign(state, createInitialPollWizardState());
      }),

    updateData: (updates) => {
      const state = get();
      const nextData = mergeWizardData(state.data, updates);
      const errors = runValidation(state.currentStep, nextData);
      setState((draft) => {
        draft.data = nextData;
        draft.errors = errors;
        draft.canProceed = Object.keys(errors).length === 0;
      });
    },

    updateSettings: (settings) => {
      const state = get();
      const nextSettings = mergeWizardSettings(state.data.settings, settings);
      const nextData = mergeWizardData(state.data, { settings: nextSettings });
      const errors = runValidation(state.currentStep, nextData);
      setState((draft) => {
        draft.data = nextData;
        draft.errors = errors;
        draft.canProceed = Object.keys(errors).length === 0;
      });
    },

    addOption: () => {
      setState((state) => {
        state.data.options.push('');
      });
      get().validateCurrentStep();
    },

    removeOption: (index) => {
      setState((state) => {
        state.data.options.splice(index, 1);
      });
      get().validateCurrentStep();
    },

    updateOption: (index, value) => {
      setState((state) => {
        state.data.options[index] = value;
      });
      get().validateCurrentStep();
    },

    addTag: (tag) => {
      const state = get();
      if (state.data.tags.includes(tag)) {
        return;
      }
      setState((draft) => {
        draft.data.tags.push(tag);
      });
      get().validateCurrentStep();
    },

    removeTag: (tag) => {
      setState((state) => {
        state.data.tags = state.data.tags.filter((item) => item !== tag);
      });
      get().validateCurrentStep();
    },

    updateTags: (tags) => {
      setState((state) => {
        state.data.tags = [...tags];
      });
      get().validateCurrentStep();
    },

    validateStep: runValidation,

    validateCurrentStep: () => {
      const state = get();
      const errors = runValidation(state.currentStep, state.data);
      setState((draft) => {
        draft.errors = errors;
        draft.canProceed = Object.keys(errors).length === 0;
      });
    },

    getStepData: (step) => {
      const { data } = get();
      switch (step) {
        case 0:
          return {
            title: data.title,
            description: data.description,
            category: data.category,
          };
        case 1:
          return { options: data.options };
        case 2:
          return {
            tags: data.tags,
            privacyLevel: data.privacyLevel,
            settings: data.settings,
          };
        case 3:
          return data;
        default:
          return {};
      }
    },

    getProgress: () => {
      const state = get();
      return ((state.currentStep + 1) / state.totalSteps) * 100;
    },

    canProceedToNextStep: (step) => {
      const state = get();
      const errors = runValidation(step, state.data);
      return Object.keys(errors).length === 0;
    },

    isStepValid: (step) => {
      const state = get();
      const errors = runValidation(step, state.data);
      return Object.keys(errors).length === 0;
    },

    getStepErrors: (step) => {
      const state = get();
      return runValidation(step, state.data);
    },
  };
};

export const pollWizardStoreCreator: PollWizardStoreCreator = (set, get) =>
  Object.assign(createInitialPollWizardState(), createPollWizardActions(set, get));

export const usePollWizardStore = create<PollWizardStore>()(
  devtools(
    persist(
      immer(pollWizardStoreCreator),
      {
        name: 'poll-wizard-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          currentStep: state.currentStep,
          data: state.data,
        }),
      },
    ),
    { name: 'poll-wizard-store' },
  ),
);

// Selectors
export const usePollWizardData = () => usePollWizardStore((state) => state.data);
export const usePollWizardStep = () => usePollWizardStore((state) => state.currentStep);
export const usePollWizardProgress = () => usePollWizardStore((state) => state.progress);
export const usePollWizardLoading = () => usePollWizardStore((state) => state.isLoading);
export const usePollWizardErrors = () => usePollWizardStore((state) => state.errors);
export const usePollWizardCanProceed = () => usePollWizardStore((state) => state.canProceed);
export const usePollWizardCanGoBack = () => usePollWizardStore((state) => state.canGoBack);
export const usePollWizardIsComplete = () => usePollWizardStore((state) => state.isComplete);

export const usePollWizardActions = () =>
  usePollWizardStore((state) => ({
    nextStep: state.nextStep,
    prevStep: state.prevStep,
    goToStep: state.goToStep,
    resetWizard: state.resetWizard,
    updateData: state.updateData,
    updateSettings: state.updateSettings,
    addOption: state.addOption,
    removeOption: state.removeOption,
    updateOption: state.updateOption,
    addTag: state.addTag,
    removeTag: state.removeTag,
    updateTags: state.updateTags,
    validateCurrentStep: state.validateCurrentStep,
    setLoading: state.setLoading,
    setFieldError: state.setFieldError,
    clearFieldError: state.clearFieldError,
    setError: state.setError,
    clearError: state.clearError,
    clearAllErrors: state.clearAllErrors,
    getStepData: state.getStepData,
    getProgress: state.getProgress,
    canProceedToNextStep: state.canProceedToNextStep,
    isStepValid: state.isStepValid,
    getStepErrors: state.getStepErrors,
  }));

export const usePollWizardStats = () =>
  usePollWizardStore((state) => ({
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    progress: state.progress,
    canGoBack: state.canGoBack,
    canProceed: state.canProceed,
    isComplete: state.isComplete,
    hasErrors: Object.keys(state.errors).length > 0,
    errorCount: Object.keys(state.errors).length,
  }));

export const usePollWizardStepData = (step: number) =>
  usePollWizardStore((state) => state.getStepData(step));

export const usePollWizardStepErrors = (step: number) =>
  usePollWizardStore((state) => state.getStepErrors(step));

export const usePollWizardStepValidation = (step: number) =>
  usePollWizardStore((state) => ({
    isValid: state.isStepValid(step),
    errors: state.getStepErrors(step),
    canProceed: state.canProceedToNextStep(step),
  }));

export const pollWizardStoreUtils = {
  getWizardSummary: () => {
    const state = usePollWizardStore.getState();
    return {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isComplete: state.isComplete,
      hasErrors: Object.keys(state.errors).length > 0,
      data: state.data,
    };
  },

  resetWizard: () => {
    usePollWizardStore.getState().resetWizard();
  },

  validateAllSteps: () => {
    const state = usePollWizardStore.getState();
    const errors = validateAllPollWizardSteps(state.data, state.totalSteps);
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  exportWizardData: () => {
    const state = usePollWizardStore.getState();
    return {
      data: state.data,
      currentStep: state.currentStep,
      progress: state.progress,
      timestamp: new Date().toISOString(),
    };
  },

  importWizardData: (payload: Partial<PollWizardState>) => {
    const state = usePollWizardStore.getState();
    if (payload.data) {
      state.updateData(payload.data);
    }
    if (typeof payload.currentStep === 'number') {
      state.goToStep(payload.currentStep);
    }
  },
};

export const pollWizardStoreSubscriptions = {
  onStepChange: (callback: (step: number) => void) => {
    let previous: number | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.currentStep !== previous) {
        previous = state.currentStep;
        callback(state.currentStep);
      }
    });
  },

  onProgressChange: (callback: (progress: number) => void) => {
    let previous: number | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.progress !== previous) {
        previous = state.progress;
        callback(state.progress);
      }
    });
  },

  onDataChange: (callback: (data: PollWizardData) => void) => {
    let previous: PollWizardData | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.data !== previous) {
        previous = state.data;
        callback(state.data);
      }
    });
  },
};

export const pollWizardStoreDebug = {
  logState: () => {
    const state = usePollWizardStore.getState();
    logger.debug('Poll Wizard Store State', {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isComplete: state.isComplete,
      hasErrors: Object.keys(state.errors).length > 0,
      errorCount: Object.keys(state.errors).length,
    });
  },

  logWizardData: () => {
    const state = usePollWizardStore.getState();
    logger.debug('Poll Wizard Data', {
      title: state.data.title,
      description: state.data.description,
      category: state.data.category,
      options: state.data.options,
      tags: state.data.tags,
      privacyLevel: state.data.privacyLevel,
    });
  },

  reset: () => {
    usePollWizardStore.getState().resetWizard();
    logger.info('Poll wizard store reset to initial state');
  },
};
