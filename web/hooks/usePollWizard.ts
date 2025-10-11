/**
 * Poll Wizard Hook - V2
 * 
 * This hook provides functionality for creating polls with a step-by-step wizard interface.
 * It manages the poll creation state, validation, and submission.
 * 
 * Created: January 21, 2025
 * Status: Active - Poll creation functionality
 * Version: V2 - Modernized for current patterns
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface PollOption {
  id: string;
  text: string;
  description?: string;
}

export interface PollWizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface PollWizardData {
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  votingMethod: 'single' | 'multiple' | 'ranked';
  options: PollOption[];
  tags: string[];
  endDate?: Date;
  allowComments: boolean;
  requireAuth: boolean;
}

export interface PollWizardState {
  currentStep: number;
  data: PollWizardData;
  steps: PollWizardStep[];
  isValid: boolean;
  isSubmitting: boolean;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POLL_WIZARD_STEPS: PollWizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter the poll title and description',
    completed: false,
    required: true,
  },
  {
    id: 'options',
    title: 'Poll Options',
    description: 'Add the choices for your poll',
    completed: false,
    required: true,
  },
  {
    id: 'settings',
    title: 'Poll Settings',
    description: 'Configure voting method and privacy',
    completed: false,
    required: true,
  },
  {
    id: 'review',
    title: 'Review & Publish',
    description: 'Review your poll before publishing',
    completed: false,
    required: true,
  },
];

const DEFAULT_POLL_DATA: PollWizardData = {
  title: '',
  description: '',
  category: 'politics',
  privacy: 'public',
  votingMethod: 'single',
  options: [],
  tags: [],
  allowComments: true,
  requireAuth: false,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePollWizard() {
  const router = useRouter();
  
  const [state, setState] = useState<PollWizardState>({
    currentStep: 0,
    data: DEFAULT_POLL_DATA,
    steps: POLL_WIZARD_STEPS,
    isValid: false,
    isSubmitting: false,
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = state.steps[stepIndex];
    if (!step) return false;

    switch (step.id) {
      case 'basic-info':
        return state.data.title.trim().length > 0 && state.data.description.trim().length > 0;
      
      case 'options':
        return state.data.options.length >= 2 && state.data.options.every(option => option.text.trim().length > 0);
      
      case 'settings':
        return state.data.category.length > 0 && state.data.votingMethod.length > 0;
      
      case 'review':
        return state.isValid;
      
      default:
        return false;
    }
  }, [state.data, state.steps, state.isValid]);

  const validateAllSteps = useCallback((): boolean => {
    return state.steps.every((_, index) => validateStep(index));
  }, [state.steps, validateStep]);

  // ============================================================================
  // STEP NAVIGATION
  // ============================================================================

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < state.steps.length) {
      setState(prev => ({
        ...prev,
        currentStep: stepIndex,
      }));
    }
  }, [state.steps.length]);

  const nextStep = useCallback(() => {
    if (state.currentStep < state.steps.length - 1) {
      const currentStepValid = validateStep(state.currentStep);
      
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        steps: prev.steps.map((step, index) => 
          index === prev.currentStep ? { ...step, completed: currentStepValid } : step
        ),
      }));
    }
  }, [state.currentStep, state.steps.length, validateStep]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [state.currentStep]);

  // ============================================================================
  // DATA UPDATES
  // ============================================================================

  const updateData = useCallback((updates: Partial<PollWizardData>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates },
    }));
  }, []);

  const addOption = useCallback((text: string, description?: string) => {
    const newOption: PollOption = {
      id: `option-${Date.now()}`,
      text: text.trim(),
      description: description?.trim(),
    };

    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        options: [...prev.data.options, newOption],
      },
    }));
  }, []);

  const updateOption = useCallback((id: string, updates: Partial<PollOption>) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        options: prev.data.options.map(option =>
          option.id === id ? { ...option, ...updates } : option
        ),
      },
    }));
  }, []);

  const removeOption = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        options: prev.data.options.filter(option => option.id !== id),
      },
    }));
  }, []);

  const reorderOptions = useCallback((fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newOptions = [...prev.data.options];
      const [removed] = newOptions.splice(fromIndex, 1);
      newOptions.splice(toIndex, 0, removed);

      return {
        ...prev,
        data: {
          ...prev.data,
          options: newOptions,
        },
      };
    });
  }, []);

  // ============================================================================
  // SUBMISSION
  // ============================================================================

  const submitPoll = useCallback(async () => {
    if (!validateAllSteps()) {
      setState(prev => ({
        ...prev,
        error: 'Please complete all required fields',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isSubmitting: true,
      error: undefined,
    }));

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state.data),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const result = await response.json();
      
      // Redirect to the new poll
      router.push(`/polls/${result.id}`);
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, [state.data, validateAllSteps, router]);

  // ============================================================================
  // RESET
  // ============================================================================

  const resetWizard = useCallback(() => {
    setState({
      currentStep: 0,
      data: DEFAULT_POLL_DATA,
      steps: POLL_WIZARD_STEPS,
      isValid: false,
      isSubmitting: false,
    });
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const currentStepData = useMemo(() => {
    return state.steps[state.currentStep];
  }, [state.steps, state.currentStep]);

  const isFirstStep = useMemo(() => {
    return state.currentStep === 0;
  }, [state.currentStep]);

  const isLastStep = useMemo(() => {
    return state.currentStep === state.steps.length - 1;
  }, [state.currentStep, state.steps.length]);

  const canProceed = useMemo(() => {
    return validateStep(state.currentStep);
  }, [state.currentStep, validateStep]);

  const progress = useMemo(() => {
    return ((state.currentStep + 1) / state.steps.length) * 100;
  }, [state.currentStep, state.steps.length]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    currentStep: state.currentStep,
    data: state.data,
    steps: state.steps,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    error: state.error,
    
    // Computed values
    currentStepData,
    isFirstStep,
    isLastStep,
    canProceed,
    progress,
    
    // Actions
    goToStep,
    nextStep,
    previousStep,
    updateData,
    addOption,
    updateOption,
    removeOption,
    reorderOptions,
    submitPoll,
    resetWizard,
    
    // Validation
    validateStep,
    validateAllSteps,
  };
}