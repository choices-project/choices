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

import { create } from 'zustand';
import { devtools , persist } from 'zustand/middleware';

import { logger } from '@/lib/utils/logger';

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

type ProfileData = {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  website?: string;
}

type ValuesData = {
  politicalAffiliation?: string;
  primaryInterests?: string[];
  secondaryInterests?: string[];
  values?: string[];
  priorities?: string[];
  engagementLevel?: 'low' | 'medium' | 'high';
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

type PreferencesData = {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  notifications?: boolean;
  privacy?: 'public' | 'private' | 'friends';
  dataSharing?: boolean;
  analytics?: boolean;
  marketing?: boolean;
}

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
  skipped: boolean;
  data?: unknown;
}

// Onboarding store state interface
type OnboardingStore = {
  // Onboarding state
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  isActive: boolean;
  
  // Form data
  authData: AuthData;
  profileData: ProfileData;
  valuesData: ValuesData;
  preferencesData: PreferencesData;
  
  // Progress tracking
  progress: number;
  completedSteps: number[];
  skippedSteps: number[];
  stepData: Record<number, unknown>;
  
  // Steps configuration
  steps: OnboardingStep[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions - Navigation
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  restartOnboarding: () => void;
  
  // Actions - Data management
  updateFormData: (step: number, data: any) => void;
  updateAuthData: (data: Partial<AuthData>) => void;
  updateProfileData: (data: Partial<ProfileData>) => void;
  updateValuesData: (data: Partial<ValuesData>) => void;
  updatePreferencesData: (data: Partial<PreferencesData>) => void;
  clearStepData: (step: number) => void;
  clearAllData: () => void;
  
  // Actions - Step management
  markStepCompleted: (step: number) => void;
  markStepSkipped: (step: number) => void;
  markStepIncomplete: (step: number) => void;
  canProceedToNextStep: (step: number) => boolean;
  getStepValidationErrors: (step: number) => string[];
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Actions - Data operations
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  submitOnboarding: () => Promise<void>;
  validateStep: (step: number) => boolean;
  validateAllSteps: () => boolean;
}

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

// Create onboarding store with middleware
export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentStep: 0,
        totalSteps: 6,
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
        steps: defaultSteps,
        isLoading: false,
        isSaving: false,
        isSubmitting: false,
        error: null,
        
        // Navigation actions
        setCurrentStep: (step) => set((state) => {
          const newStep = Math.max(0, Math.min(step, state.totalSteps - 1));
          const progress = (newStep / state.totalSteps) * 100;
          
          logger.info('Onboarding step changed', {
            from: state.currentStep,
            to: newStep,
            progress: Math.round(progress)
          });
          
          return {
            ...state,
            currentStep: newStep,
            progress
          };
        }),
        
        nextStep: () => set((state) => {
          const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
          const progress = (nextStep / state.totalSteps) * 100;
          
          logger.info('Onboarding next step', {
            currentStep: nextStep,
            progress: Math.round(progress)
          });
          
          return {
            ...state,
            currentStep: nextStep,
            progress
          };
        }),
        
        previousStep: () => set((state) => {
          const prevStep = Math.max(state.currentStep - 1, 0);
          const progress = (prevStep / state.totalSteps) * 100;
          
          logger.info('Onboarding previous step', {
            currentStep: prevStep,
            progress: Math.round(progress)
          });
          
          return {
            ...state,
            currentStep: prevStep,
            progress
          };
        }),
        
        goToStep: (step) => {
          const { setCurrentStep } = get();
          setCurrentStep(step);
        },
        
        completeOnboarding: () => set((state) => {
          logger.info('Onboarding completed', {
            totalSteps: state.totalSteps,
            completedSteps: state.completedSteps.length + 1
          });
          
          return {
            ...state,
            isCompleted: true,
            isActive: false,
            progress: 100,
            completedSteps: [...state.completedSteps, state.currentStep]
          };
        }),
        
        skipOnboarding: () => set({
          isSkipped: true,
          isActive: false,
          progress: 100
        }),
        
        restartOnboarding: () => set({
          currentStep: 0,
          isCompleted: false,
          isSkipped: false,
          isActive: true,
          progress: 0,
          completedSteps: [],
          skippedSteps: [],
          stepData: {},
          authData: {} as AuthData,
          profileData: {} as ProfileData,
          valuesData: {} as ValuesData,
          preferencesData: {} as PreferencesData,
          error: null
        }),
        
        // Data management actions
        updateFormData: (step, data) => set((state) => ({
          stepData: {
            ...state.stepData,
            [step]: { ...(state.stepData[step] || {}), ...data }
          }
        })),
        
        updateAuthData: (data) => set((state) => ({
          authData: { ...state.authData, ...data }
        })),
        
        updateProfileData: (data) => set((state) => ({
          profileData: { ...state.profileData, ...data }
        })),
        
        updateValuesData: (data) => set((state) => ({
          valuesData: { ...state.valuesData, ...data }
        })),
        
        updatePreferencesData: (data) => set((state) => ({
          preferencesData: { ...state.preferencesData, ...data }
        })),
        
        clearStepData: (step) => set((state) => ({
          stepData: {
            ...state.stepData,
            [step]: {}
          }
        })),
        
        clearAllData: () => set({
          stepData: {},
          authData: {} as AuthData,
          profileData: {} as ProfileData,
          valuesData: {} as ValuesData,
          preferencesData: {} as PreferencesData
        }),
        
        // Step management actions
        markStepCompleted: (step) => set((state) => ({
          completedSteps: [...state.completedSteps, step],
          steps: state.steps.map(s => 
            s.id === step ? { ...s, completed: true } : s
          )
        })),
        
        markStepSkipped: (step) => set((state) => ({
          skippedSteps: [...state.skippedSteps, step],
          steps: state.steps.map(s => 
            s.id === step ? { ...s, skipped: true } : s
          )
        })),
        
        markStepIncomplete: (step) => set((state) => ({
          completedSteps: state.completedSteps.filter(s => s !== step),
          steps: state.steps.map(s => 
            s.id === step ? { ...s, completed: false } : s
          )
        })),
        
        canProceedToNextStep: (step) => {
          const state = get();
          const currentStepData = state.stepData[step] as any;
          const stepConfig = state.steps.find(s => s.id === step);
          
          if (!stepConfig?.required) return true;
          
          // Add validation logic here based on step requirements
          switch (step) {
            case 0: // Welcome step
              return true;
            case 1: // Auth step
              return !!(currentStepData?.email && currentStepData?.password);
            case 2: // Profile step
              return !!(currentStepData?.firstName && currentStepData?.lastName);
            case 3: // Values step
              return !!(currentStepData?.primaryInterests?.length > 0);
            case 4: // Privacy step
              return !!(currentStepData?.privacyAccepted);
            case 5: // Complete step
              return true;
            default:
              return true;
          }
        },
        
        getStepValidationErrors: (step) => {
          const state = get();
          const currentStepData = state.stepData[step] as any;
          const errors: string[] = [];
          
          switch (step) {
            case 1: // Auth step
              if (!currentStepData?.email) errors.push('Email is required');
              if (!currentStepData?.password) errors.push('Password is required');
              if (currentStepData?.password !== currentStepData?.confirmPassword) {
                errors.push('Passwords do not match');
              }
              break;
            case 2: // Profile step
              if (!currentStepData?.firstName) errors.push('First name is required');
              if (!currentStepData?.lastName) errors.push('Last name is required');
              break;
            case 3: // Values step
              if (!currentStepData?.primaryInterests?.length) {
                errors.push('Please select at least one interest');
              }
              break;
            case 4: // Privacy step
              if (!currentStepData?.privacyAccepted) {
                errors.push('You must accept the privacy policy');
              }
              break;
          }
          
          return errors;
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setSaving: (saving) => set({ isSaving: saving }),
        setSubmitting: (submitting) => set({ isSubmitting: submitting }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        
        // Data operations
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
              progress: state.progress
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
              currentStep: data.currentStep || 0,
              progress: data.progress || 0,
              stepData: data.stepData || {},
              authData: data.authData || {},
              profileData: data.profileData || {},
              valuesData: data.valuesData || {},
              preferencesData: data.preferencesData || {},
            });
            
            logger.info('Onboarding progress loaded', {
              currentStep: data.currentStep,
              progress: data.progress
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
          return Array.from({ length: totalSteps }, (_, i) => i)
            .every(step => validateStep(step));
        },
      }),
      {
        name: 'onboarding-store',
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
      }
    ),
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
  
  return {
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
  };
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
  state.stepData[state.currentStep] || {}
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
    return state.stepData[step] || {};
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
    return incompleteSteps[0] || null;
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
