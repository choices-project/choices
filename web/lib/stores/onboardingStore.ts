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
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';

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
  data?: any;
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
  stepData: Record<number, any>;
  
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
        authData: {},
        profileData: {},
        valuesData: {},
        preferencesData: {},
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
          
          set({ currentStep: newStep, progress });
          
          logger.info('Onboarding step changed', {
            from: state.currentStep,
            to: newStep,
            progress: Math.round(progress)
          });
        }),
        
        nextStep: () => set((state) => {
          const nextStep = Math.min(state.currentStep + 1, state.totalSteps - 1);
          const progress = (nextStep / state.totalSteps) * 100;
          
          set({ currentStep: nextStep, progress });
          
          logger.info('Onboarding next step', {
            currentStep: nextStep,
            progress: Math.round(progress)
          });
        }),
        
        previousStep: () => set((state) => {
          const prevStep = Math.max(state.currentStep - 1, 0);
          const progress = (prevStep / state.totalSteps) * 100;
          
          set({ currentStep: prevStep, progress });
          
          logger.info('Onboarding previous step', {
            currentStep: prevStep,
            progress: Math.round(progress)
          });
        }),
        
        goToStep: (step) => {
          const { setCurrentStep } = get();
          setCurrentStep(step);
        },
        
        completeOnboarding: () => set((state) => {
          set({
            isCompleted: true,
            isActive: false,
            progress: 100,
            completedSteps: [...state.completedSteps, state.currentStep]
          });
          
          logger.info('Onboarding completed', {
            totalSteps: state.totalSteps,
            completedSteps: state.completedSteps.length + 1
          });
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
          authData: {},
          profileData: {},
          valuesData: {},
          preferencesData: {},
          error: null
        }),
        
        // Data management actions
        updateFormData: (step, data) => set((state) => ({
          stepData: withOptional(state.stepData, {
            [step]: withOptional(state.stepData[step] || {}, data)
          })
        })),
        
        updateAuthData: (data) => set((state) => ({
          authData: withOptional(state.authData, data)
        })),
        
        updateProfileData: (data) => set((state) => ({
          profileData: withOptional(state.profileData, data)
        })),
        
        updateValuesData: (data) => set((state) => ({
          valuesData: withOptional(state.valuesData, data)
        })),
        
        updatePreferencesData: (data) => set((state) => ({
          preferencesData: withOptional(state.preferencesData, data)
        })),
        
        clearStepData: (step) => set((state) => ({
          stepData: withOptional(state.stepData, {
            [step]: {}
          })
        })),
        
        clearAllData: () => set({
          stepData: {},
          authData: {},
          profileData: {},
          valuesData: {},
          preferencesData: {}
        }),
        
        // Step management actions
        markStepCompleted: (step) => set((state) => ({
          completedSteps: [...state.completedSteps, step],
          steps: state.steps.map(s => 
            s.id === step ? withOptional(s, { completed: true }) : s
          )
        })),
        
        markStepSkipped: (step) => set((state) => ({
          skippedSteps: [...state.skippedSteps, step],
          steps: state.steps.map(s => 
            s.id === step ? withOptional(s, { skipped: true }) : s
          )
        })),
        
        markStepIncomplete: (step) => set((state) => ({
          completedSteps: state.completedSteps.filter(s => s !== step),
          steps: state.steps.map(s => 
            s.id === step ? withOptional(s, { completed: false }) : s
          )
        })),
        
        canProceedToNextStep: (step) => {
          const state = get();
          const currentStepData = state.stepData[step];
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
          const currentStepData = state.stepData[step];
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
            const response = await fetch('/api/onboarding/progress', {
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
            logger.error('Failed to save onboarding progress:', errorMessage);
          } finally {
            setSaving(false);
          }
        },
        
        loadProgress: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/onboarding/progress');
            
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
            logger.error('Failed to load onboarding progress:', errorMessage);
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
            const response = await fetch('/api/onboarding/complete', {
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
            logger.error('Failed to submit onboarding:', errorMessage);
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
export const useOnboardingData = () => useOnboardingStore(state => ({
  authData: state.authData,
  profileData: state.profileData,
  valuesData: state.valuesData,
  preferencesData: state.preferencesData,
}));
export const useOnboardingLoading = () => useOnboardingStore(state => state.isLoading);
export const useOnboardingError = () => useOnboardingStore(state => state.error);

// Action selectors
export const useOnboardingActions = () => useOnboardingStore(state => ({
  setCurrentStep: state.setCurrentStep,
  nextStep: state.nextStep,
  previousStep: state.previousStep,
  goToStep: state.goToStep,
  completeOnboarding: state.completeOnboarding,
  skipOnboarding: state.skipOnboarding,
  restartOnboarding: state.restartOnboarding,
  updateFormData: state.updateFormData,
  updateAuthData: state.updateAuthData,
  updateProfileData: state.updateProfileData,
  updateValuesData: state.updateValuesData,
  updatePreferencesData: state.updatePreferencesData,
  clearStepData: state.clearStepData,
  clearAllData: state.clearAllData,
  markStepCompleted: state.markStepCompleted,
  markStepSkipped: state.markStepSkipped,
  markStepIncomplete: state.markStepIncomplete,
  canProceedToNextStep: state.canProceedToNextStep,
  getStepValidationErrors: state.getStepValidationErrors,
  setLoading: state.setLoading,
  setSaving: state.setSaving,
  setSubmitting: state.setSubmitting,
  setError: state.setError,
  clearError: state.clearError,
  saveProgress: state.saveProgress,
  loadProgress: state.loadProgress,
  submitOnboarding: state.submitOnboarding,
  validateStep: state.validateStep,
  validateAllSteps: state.validateAllSteps,
}));

// Computed selectors
export const useOnboardingStats = () => useOnboardingStore(state => ({
  totalSteps: state.totalSteps,
  currentStep: state.currentStep,
  completedSteps: state.completedSteps.length,
  skippedSteps: state.skippedSteps.length,
  progress: state.progress,
  isCompleted: state.isCompleted,
  isSkipped: state.isSkipped,
}));

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
      (state) => state.progress,
      (progress, prevProgress) => {
        if (progress !== prevProgress) {
          callback(progress);
        }
      }
    );
  },
  
  /**
   * Subscribe to step changes
   */
  onStepChange: (callback: (step: number) => void) => {
    return useOnboardingStore.subscribe(
      (state) => state.currentStep,
      (step, prevStep) => {
        if (step !== prevStep) {
          callback(step);
        }
      }
    );
  },
  
  /**
   * Subscribe to completion status
   */
  onCompletionChange: (callback: (isCompleted: boolean) => void) => {
    return useOnboardingStore.subscribe(
      (state) => state.isCompleted,
      (isCompleted, prevIsCompleted) => {
        if (isCompleted !== prevIsCompleted) {
          callback(isCompleted);
        }
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
    console.log('Onboarding Store State:', {
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
    console.log('Onboarding Summary:', summary);
  },
  
  /**
   * Log step data
   */
  logStepData: (step: number) => {
    const stepData = onboardingStoreUtils.getStepData(step);
    console.log(`Step ${step} Data:`, stepData);
  },
  
  /**
   * Reset onboarding store
   */
  reset: () => {
    useOnboardingStore.getState().restartOnboarding();
    console.log('Onboarding store reset');
  }
};
