/**
 * Poll Wizard Store - Zustand Implementation
 * 
 * Comprehensive poll creation wizard state management including step navigation,
 * form data persistence, validation, and progress tracking. Migrates from
 * usePollWizard hook to centralized Zustand store.
 * 
 * Created: January 15, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';


// Poll wizard data types
export interface PollWizardData {
  title: string;
  description: string;
  category: string;
  options: string[];
  tags: string[];
  privacyLevel: 'public' | 'private' | 'unlisted';
  allowMultipleVotes: boolean;
  showResults: boolean;
  isTemplate: boolean;
  settings: {
    allowMultipleVotes: boolean;
    allowAnonymousVotes: boolean;
    requireAuthentication: boolean;
    requireEmail: boolean;
    showResults: boolean;
    allowWriteIns: boolean;
    allowComments: boolean;
    enableNotifications: boolean;
    maxSelections: number;
    votingMethod: 'single' | 'multiple' | 'ranked' | 'quadratic';
    privacyLevel: 'public' | 'private' | 'unlisted';
    moderationEnabled: boolean;
    autoClose: boolean;
  };
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

// Initial data
const INITIAL_WIZARD_DATA: PollWizardData = {
  title: '',
  description: '',
  category: 'general',
  options: ['', ''],
  tags: [],
  privacyLevel: 'public',
  allowMultipleVotes: false,
  showResults: true,
  isTemplate: false,
  settings: {
    allowMultipleVotes: false,
    allowAnonymousVotes: true,
    requireAuthentication: false,
    requireEmail: false,
    showResults: true,
    allowWriteIns: false,
    allowComments: true,
    enableNotifications: true,
    maxSelections: 1,
    votingMethod: 'single',
    privacyLevel: 'public',
    moderationEnabled: false,
    autoClose: false
  }
};

const INITIAL_WIZARD_STATE: PollWizardState = {
  currentStep: 0,
  totalSteps: 4,
  data: INITIAL_WIZARD_DATA,
  isLoading: false,
  errors: {},
  progress: 0,
  canGoBack: false,
  canProceed: false,
  isComplete: false
};

// Store interface
interface PollWizardStore extends PollWizardState {
  // Step navigation actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
  
  // Data update actions
  updateData: (updates: Partial<PollWizardData>) => void;
  updateSettings: (settings: Partial<PollWizardData['settings']>) => void;
  
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
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  
  // Utility functions
  getStepData: (step: number) => Partial<PollWizardData>;
  getProgress: () => number;
  canProceedToNextStep: (step: number) => boolean;
  isStepValid: (step: number) => boolean;
  getStepErrors: (step: number) => Record<string, string>;
}

// Validation function
const validateStep = (step: number, data: PollWizardData): Record<string, string> => {
  const errors: Record<string, string> = {};

  switch (step) {
    case 0: // Basic info
      if (!data.title.trim()) {
        errors.title = 'Title is required';
      }
      if (!data.description.trim()) {
        errors.description = 'Description is required';
      }
      break;
    
    case 1: // Options
      const step1ValidOptions = data.options.filter(option => option.trim().length > 0);
      if (step1ValidOptions.length < 2) {
        errors.options = 'At least 2 options are required';
      }
      break;
    
    case 2: // Settings
      if (data.category === 'general' && !data.tags.length) {
        errors.tags = 'At least one tag is required for general polls';
      }
      break;
    
    case 3: // Review
      // Final validation - comprehensive check
      const validOptions = data.options.filter(option => option.trim().length > 0);
      if (validOptions.length < 2) {
        errors.options = 'At least 2 valid options are required';
      }
      
      // Check for duplicate options
      const uniqueOptions = new Set(validOptions.map(opt => opt.toLowerCase().trim()));
      if (uniqueOptions.size !== validOptions.length) {
        errors.options = 'Duplicate options are not allowed';
      }
      
      // Validate title length
      if (data.title.trim().length < 3) {
        errors.title = 'Title must be at least 3 characters';
      }
      if (data.title.trim().length > 200) {
        errors.title = 'Title must be less than 200 characters';
      }
      
      // Validate description length
      if (data.description.trim().length > 1000) {
        errors.description = 'Description must be less than 1000 characters';
      }
      break;
  }

  return errors;
};

// Create the store
export const usePollWizardStore = create<PollWizardStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...INITIAL_WIZARD_STATE,

        // Step navigation actions
        nextStep: () => {
          const state = get();
          const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
          const progress = ((nextStep + 1) / state.totalSteps) * 100;
          
          set({
            currentStep: nextStep,
            progress,
            canGoBack: nextStep > 0,
            canProceed: nextStep < state.totalSteps - 1,
            isComplete: nextStep === state.totalSteps - 1
          });
        },

        prevStep: () => {
          const state = get();
          const prevStep = Math.max(state.currentStep - 1, 0);
          const progress = ((prevStep + 1) / state.totalSteps) * 100;
          
          set({
            currentStep: prevStep,
            progress,
            canGoBack: prevStep > 0,
            canProceed: prevStep < state.totalSteps - 1,
            isComplete: prevStep === state.totalSteps - 1,
            errors: {} // Clear errors when going back
          });
        },

        goToStep: (step: number) => {
          const state = get();
          const targetStep = Math.max(0, Math.min(step, state.totalSteps - 1));
          const progress = ((targetStep + 1) / state.totalSteps) * 100;
          
          set({
            currentStep: targetStep,
            progress,
            canGoBack: targetStep > 0,
            canProceed: targetStep < state.totalSteps - 1,
            isComplete: targetStep === state.totalSteps - 1,
            errors: {} // Clear errors when navigating
          });
        },

        resetWizard: () => {
          set(INITIAL_WIZARD_STATE);
        },

        // Data update actions
        updateData: (updates: Partial<PollWizardData>) => {
          const state = get();
          const newData = { ...state.data, ...updates };
          const errors = validateStep(state.currentStep, newData);
          const canProceed = Object.keys(errors).length === 0;
          
          set({
            data: newData,
            canProceed,
            errors
          });
        },

        updateSettings: (settings: Partial<PollWizardData['settings']>) => {
          const state = get();
          const newSettings = { ...state.data.settings, ...settings };
          const newData = { ...state.data, settings: newSettings };
          
          set({ data: newData });
        },

        // Options management
        addOption: () => {
          const state = get();
          const newOptions = [...state.data.options, ''];
          const newData = { ...state.data, options: newOptions };
          
          set({ data: newData });
        },

        removeOption: (index: number) => {
          const state = get();
          const newOptions = state.data.options.filter((_, i) => i !== index);
          const newData = { ...state.data, options: newOptions };
          
          set({ data: newData });
        },

        updateOption: (index: number, value: string) => {
          const state = get();
          const newOptions = state.data.options.map((option, i) => 
            i === index ? value : option
          );
          const newData = { ...state.data, options: newOptions };
          
          set({ data: newData });
        },

        // Tags management
        addTag: (tag: string) => {
          const state = get();
          if (!state.data.tags.includes(tag)) {
            const newTags = [...state.data.tags, tag];
            const newData = { ...state.data, tags: newTags };
            
            set({ data: newData });
          }
        },

        removeTag: (tag: string) => {
          const state = get();
          const newTags = state.data.tags.filter(t => t !== tag);
          const newData = { ...state.data, tags: newTags };
          
          set({ data: newData });
        },

        updateTags: (tags: string[]) => {
          const state = get();
          const newData = { ...state.data, tags };
          
          set({ data: newData });
        },

        // Validation
        validateStep: (step: number, data: PollWizardData) => {
          return validateStep(step, data);
        },

        validateCurrentStep: () => {
          const state = get();
          const errors = validateStep(state.currentStep, state.data);
          const canProceed = Object.keys(errors).length === 0;
          
          set({
            canProceed,
            errors
          });
        },

        // Loading and error states
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (field: string, error: string) => {
          const state = get();
          set({
            errors: { ...state.errors, [field]: error }
          });
        },

        clearError: (field: string) => {
          const state = get();
          const newErrors = { ...state.errors };
          delete newErrors[field];
          set({ errors: newErrors });
        },

        clearAllErrors: () => {
          set({ errors: {} });
        },

        // Utility functions
        getStepData: (step: number) => {
          const state = get();
          switch (step) {
            case 0:
              return {
                title: state.data.title,
                description: state.data.description,
                category: state.data.category
              };
            case 1:
              return {
                options: state.data.options
              };
            case 2:
              return {
                tags: state.data.tags,
                privacyLevel: state.data.privacyLevel,
                settings: state.data.settings
              };
            case 3:
              return state.data;
            default:
              return {};
          }
        },

        getProgress: () => {
          const state = get();
          return ((state.currentStep + 1) / state.totalSteps) * 100;
        },

        canProceedToNextStep: (step: number) => {
          const state = get();
          const errors = validateStep(step, state.data);
          return Object.keys(errors).length === 0;
        },

        isStepValid: (step: number) => {
          const state = get();
          const errors = validateStep(step, state.data);
          return Object.keys(errors).length === 0;
        },

        getStepErrors: (step: number) => {
          const state = get();
          return validateStep(step, state.data);
        }
      }),
      {
        name: 'poll-wizard-store',
        partialize: (state) => ({
          data: state.data,
          currentStep: state.currentStep,
          progress: state.progress
        })
      }
    ),
    { name: 'poll-wizard-store' }
  )
);

// Store selectors for optimized re-renders
export const usePollWizardData = () => usePollWizardStore(state => state.data);
export const usePollWizardStep = () => usePollWizardStore(state => state.currentStep);
export const usePollWizardProgress = () => usePollWizardStore(state => state.progress);
export const usePollWizardLoading = () => usePollWizardStore(state => state.isLoading);
export const usePollWizardErrors = () => usePollWizardStore(state => state.errors);
export const usePollWizardCanProceed = () => usePollWizardStore(state => state.canProceed);
export const usePollWizardCanGoBack = () => usePollWizardStore(state => state.canGoBack);
export const usePollWizardIsComplete = () => usePollWizardStore(state => state.isComplete);

// Action selectors
export const usePollWizardActions = () => usePollWizardStore(state => ({
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
  setError: state.setError,
  clearError: state.clearError,
  clearAllErrors: state.clearAllErrors,
  getStepData: state.getStepData,
  getProgress: state.getProgress,
  canProceedToNextStep: state.canProceedToNextStep,
  isStepValid: state.isStepValid,
  getStepErrors: state.getStepErrors
}));

// Computed selectors
export const usePollWizardStats = () => usePollWizardStore(state => ({
  currentStep: state.currentStep,
  totalSteps: state.totalSteps,
  progress: state.progress,
  canGoBack: state.canGoBack,
  canProceed: state.canProceed,
  isComplete: state.isComplete,
  hasErrors: Object.keys(state.errors).length > 0,
  errorCount: Object.keys(state.errors).length
}));

export const usePollWizardStepData = (step: number) => usePollWizardStore(state => 
  state.getStepData(step)
);

export const usePollWizardStepErrors = (step: number) => usePollWizardStore(state => 
  state.getStepErrors(step)
);

export const usePollWizardStepValidation = (step: number) => usePollWizardStore(state => ({
  isValid: state.isStepValid(step),
  errors: state.getStepErrors(step),
  canProceed: state.canProceedToNextStep(step)
}));

// Store utilities
export const pollWizardStoreUtils = {
  /**
   * Get wizard summary
   */
  getWizardSummary: () => {
    const state = usePollWizardStore.getState();
    return {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isComplete: state.isComplete,
      hasErrors: Object.keys(state.errors).length > 0,
      data: state.data
    };
  },

  /**
   * Reset wizard to initial state
   */
  resetWizard: () => {
    usePollWizardStore.getState().resetWizard();
  },

  /**
   * Validate all steps
   */
  validateAllSteps: () => {
    const state = usePollWizardStore.getState();
    const allErrors: Record<string, string> = {};
    
    for (let step = 0; step < state.totalSteps; step++) {
      const stepErrors = state.getStepErrors(step);
      Object.assign(allErrors, stepErrors);
    }
    
    return {
      isValid: Object.keys(allErrors).length === 0,
      errors: allErrors
    };
  },

  /**
   * Export wizard data
   */
  exportWizardData: () => {
    const state = usePollWizardStore.getState();
    return {
      data: state.data,
      currentStep: state.currentStep,
      progress: state.progress,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Import wizard data
   */
  importWizardData: (data: Partial<PollWizardState>) => {
    const state = usePollWizardStore.getState();
    if (data.data) {
      state.updateData(data.data);
    }
    if (data.currentStep !== undefined) {
      state.goToStep(data.currentStep);
    }
  }
};

// Store subscriptions
export const pollWizardStoreSubscriptions = {
  /**
   * Subscribe to step changes
   */
  onStepChange: (callback: (step: number) => void) => {
    let previousStep: number | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.currentStep !== previousStep) {
        previousStep = state.currentStep;
        callback(state.currentStep);
      }
    });
  },

  /**
   * Subscribe to progress changes
   */
  onProgressChange: (callback: (progress: number) => void) => {
    let previousProgress: number | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.progress !== previousProgress) {
        previousProgress = state.progress;
        callback(state.progress);
      }
    });
  },

  /**
   * Subscribe to data changes
   */
  onDataChange: (callback: (data: PollWizardData) => void) => {
    let previousData: PollWizardData | undefined;
    return usePollWizardStore.subscribe((state) => {
      if (state.data !== previousData) {
        previousData = state.data;
        callback(state.data);
      }
    });
  }
};

// Store debugging
export const pollWizardStoreDebug = {
  /**
   * Log current state
   */
  logState: () => {
    const state = usePollWizardStore.getState();
    logger.debug('Poll Wizard Store State', {
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      progress: state.progress,
      isComplete: state.isComplete,
      hasErrors: Object.keys(state.errors).length > 0,
      errorCount: Object.keys(state.errors).length
    });
  },

  /**
   * Log wizard data
   */
  logWizardData: () => {
    const state = usePollWizardStore.getState();
    logger.debug('Poll Wizard Data', {
      title: state.data.title,
      description: state.data.description,
      category: state.data.category,
      options: state.data.options,
      tags: state.data.tags,
      privacyLevel: state.data.privacyLevel
    });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    usePollWizardStore.getState().resetWizard();
    logger.info('Poll wizard store reset to initial state');
  }
};
