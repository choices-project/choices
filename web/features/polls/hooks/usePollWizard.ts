/**
 * Poll Wizard Hook
 *
 * This module provides a hook for managing poll creation wizard state.
 * It replaces the old @/shared/utils/lib/usePollWizard imports.
 */

import { useState, useCallback } from 'react';

import {
  createInitialPollWizardData,
  POLL_WIZARD_TOTAL_STEPS,
} from '@/lib/polls/defaults';
import { validatePollWizardStep } from '@/lib/polls/validation';
import { logger } from '@/lib/utils/logger';

import type {
  PollWizardData,
  PollWizardState,
} from '../types';

const INITIAL_WIZARD_DATA = createInitialPollWizardData();

const INITIAL_WIZARD_STATE: PollWizardState = {
  currentStep: 0,
  totalSteps: POLL_WIZARD_TOTAL_STEPS,
  data: INITIAL_WIZARD_DATA,
  errors: {},
  isLoading: false,
  progress: 0,
  canProceed: false,
  canGoBack: false,
  isComplete: false,
};

const mergeWizardState = (state: PollWizardState, updates: Partial<PollWizardState>): PollWizardState => ({
  ...state,
  ...updates,
});

const mergeWizardData = (data: PollWizardData, updates: Partial<PollWizardData>): PollWizardData => ({
  ...data,
  ...updates,
});

const mergeWizardSettings = (
  settings: PollWizardData['settings'],
  updates: Partial<PollWizardData['settings']>
): PollWizardData['settings'] => ({
  ...settings,
  ...updates,
});

export function usePollWizard() {
  const [wizardState, setWizardState] = useState<PollWizardState>(INITIAL_WIZARD_STATE);

  // Validation function
  const validateStep = useCallback(
    (step: number, data: PollWizardData) => validatePollWizardStep(step, data),
    [],
  );

  // Helper function to check if current step is valid
  const isCurrentStepValid = useCallback((step: number, data: PollWizardData): boolean => {
    const errors = validateStep(step, data);
    return Object.keys(errors).length === 0;
  }, [validateStep]);

  // Navigation functions
  const nextStep = useCallback(() => {
    setWizardState((prev: PollWizardState) => {
      const errors = validateStep(prev.currentStep, prev.data);
      if (Object.keys(errors).length > 0) {
        return mergeWizardState(prev, { errors });
      }

      return mergeWizardState(prev, {
        currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
        errors: {},
        canProceed: prev.currentStep + 1 < prev.totalSteps - 1 || isCurrentStepValid(prev.currentStep + 1, prev.data)
      });
    });
  }, [validateStep, isCurrentStepValid]);

  const prevStep = useCallback(() => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
      currentStep: Math.max(prev.currentStep - 1, 0),
      errors: {}
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
      currentStep: Math.max(0, Math.min(step, prev.totalSteps - 1)),
      errors: {}
    }));
  }, []);

  // Data update functions
  const updateData = useCallback((updates: Partial<PollWizardData>) => {
    setWizardState((prev: PollWizardState) => {
      const newData = mergeWizardData(prev.data, updates);
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      // Debug logging
      logger.info('🔧 usePollWizard updateData:', {
        currentStep: prev.currentStep,
        updates,
        newData: { title: newData.title, description: newData.description },
        errors,
        canProceed
      });

      return mergeWizardState(prev, {
        data: newData,
        canProceed,
        errors
      });
    });
  }, [validateStep]);

  const addOption = useCallback(() => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
      data: mergeWizardData(prev.data, {
        options: [...prev.data.options, '']
      })
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setWizardState((prev: PollWizardState) => {
      const newOptions = prev.data.options.filter((_: string, i: number) => i !== index);
      return mergeWizardState(prev, {
        data: mergeWizardData(prev.data, {
          options: newOptions
        })
      });
    });
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
      data: mergeWizardData(prev.data, {
        options: prev.data.options.map((option: string, i: number) => i === index ? value : option)
      })
    }));
  }, []);

  const addTag = useCallback((tag: string) => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
      data: mergeWizardData(prev.data, {
        tags: [...prev.data.tags, tag]
      })
    }));
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setWizardState((prev: PollWizardState) => {
      const newTags = prev.data.tags.filter((tag: string) => tag !== tagToRemove);
      return mergeWizardState(prev, {
        data: mergeWizardData(prev.data, {
          tags: newTags
        })
      });
    });
  }, []);

  // Loading state
  const setLoading = useCallback((loading: boolean) => {
    setWizardState((prev: PollWizardState) => mergeWizardState(prev, { isLoading: loading }));
  }, []);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setWizardState(INITIAL_WIZARD_STATE);
  }, []);

  // Submit poll
  const submitPoll = useCallback(async (): Promise<{ success: boolean; pollId?: string; error?: string }> => {
    setLoading(true);

    try {
      // Validate final data before submission
      const finalErrors = validateStep(3, wizardState.data);
      if (Object.keys(finalErrors).length > 0) {
        setWizardState((prev: PollWizardState) => mergeWizardState(prev, { errors: finalErrors }));
        return {
          success: false,
          error: 'Please fix validation errors before submitting'
        };
      }

      // Prepare poll data for API
      const pollData = {
        title: wizardState.data.title.trim(),
        description: wizardState.data.description.trim(),
        options: wizardState.data.options.filter((option: string) => option.trim().length > 0),
        voting_method: wizardState.data.settings.votingMethod,
        privacy_level: wizardState.data.privacyLevel,
        category: wizardState.data.category,
        allowMultipleVotes: wizardState.data.settings.allowMultipleVotes,
        showResults: wizardState.data.settings.showResults,
        allowComments: wizardState.data.settings.allowComments,
        tags: wizardState.data.tags
      };

      // Submit to API
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `HTTP ${response.status}: Failed to create poll`);
      }

      const result = await response.json();

      // Update wizard state to mark as complete
      setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
        isComplete: true,
        progress: 100
      }));

      return {
        success: true,
        pollId: result.id
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create poll';

      // Update wizard state with error
      setWizardState((prev: PollWizardState) => mergeWizardState(prev, {
        errors: { submit: errorMessage }
      }));

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [wizardState.data, validateStep, setLoading]);

  // Progress calculation with dynamic error detection
  const progress = [
    {
      step: 0,
      title: 'Basic Information',
      isCompleted: wizardState.currentStep > 0,
      isCurrent: wizardState.currentStep === 0,
      hasError: !!(wizardState.errors.title || wizardState.errors.description),
      estimatedTime: 2
    },
    {
      step: 1,
      title: 'Poll Options',
      isCompleted: wizardState.currentStep > 1,
      isCurrent: wizardState.currentStep === 1,
      hasError: !!(wizardState.errors.options || wizardState.errors.option_0 || wizardState.errors.option_1),
      estimatedTime: 2
    },
    {
      step: 2,
      title: 'Category & Tags',
      isCompleted: wizardState.currentStep > 2,
      isCurrent: wizardState.currentStep === 2,
      hasError: !!(wizardState.errors.tags || wizardState.errors.category),
      estimatedTime: 2
    },
    {
      step: 3,
      title: 'Review',
      isCompleted: wizardState.currentStep > 3,
      isCurrent: wizardState.currentStep === 3,
      hasError: !!(wizardState.errors.submit),
      estimatedTime: 2
    }
  ];

  // Alias functions for compatibility
  const updateWizardData = updateData;
  const previousStep = prevStep;
  const updateSettings = (updates: Partial<PollWizardData['settings']>) => updateData({ settings: mergeWizardSettings(wizardState.data.settings, updates) });

  return {
    wizardState,
    progress,
    updateWizardData,
    nextStep,
    previousStep,
    goToStep,
    updateData,
    addOption,
    removeOption,
    updateOption,
    updateSettings,
    addTag,
    removeTag,
    setLoading,
    resetWizard,
    submitPoll,
    validateStep: (step: number) => validateStep(step, wizardState.data),
    isCurrentStepValid: (step: number) => isCurrentStepValid(step, wizardState.data)
  };
}


