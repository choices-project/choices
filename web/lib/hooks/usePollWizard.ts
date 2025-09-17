/**
 * Poll Wizard Hook
 * 
 * This module provides a hook for managing poll creation wizard state.
 * It replaces the old @/shared/utils/lib/usePollWizard imports.
 */

import { useState, useCallback } from 'react';
import type { 
  PollWizardData, 
  PollWizardState 
} from '../types/poll-templates';

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
    requireEmail: false,
    showResults: true,
    allowComments: true,
    enableNotifications: true,
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

export function usePollWizard() {
  const [wizardState, setWizardState] = useState<PollWizardState>(INITIAL_WIZARD_STATE);

  // Validation function
  const validateStep = useCallback((step: number, data: PollWizardData): Record<string, string> => {
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
        const validOptions = data.options.filter(option => option.trim().length > 0);
        if (validOptions.length < 2) {
          errors.options = 'At least 2 options are required';
        }
        break;
      
      case 2: // Settings
        if (data.category === 'general' && !data.tags.length) {
          errors.tags = 'At least one tag is required for general polls';
        }
        break;
      
      case 3: // Review
        // Final validation
        data.options.forEach((option, index) => {
          if (!option.trim()) {
            errors[`option_${index}`] = 'Empty options are not allowed';
          }
        });
        break;
    }

    return errors;
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    setWizardState(prev => {
      const errors = validateStep(prev.currentStep, prev.data);
      if (Object.keys(errors).length > 0) {
        return { ...prev, errors };
      }
      
      return {
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
        errors: {}
      };
    });
  }, [validateStep]);

  const prevStep = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      errors: {}
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setWizardState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, prev.totalSteps - 1)),
      errors: {}
    }));
  }, []);

  // Data update functions
  const updateData = useCallback((updates: Partial<PollWizardData>) => {
    setWizardState(prev => ({
      ...prev,
      data: { ...prev.data, ...updates }
    }));
  }, []);

  const addOption = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        options: [...prev.data.options, '']
      }
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setWizardState(prev => {
      const newOptions = prev.data.options.filter((_, i) => i !== index);
      return {
        ...prev,
        data: {
          ...prev.data,
          options: newOptions
        }
      };
    });
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        options: prev.data.options.map((option, i) => i === index ? value : option)
      }
    }));
  }, []);

  const addTag = useCallback((tag: string) => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        tags: [...prev.data.tags, tag]
      }
    }));
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setWizardState(prev => {
      const newTags = prev.data.tags.filter(tag => tag !== tagToRemove);
      return {
        ...prev,
        data: {
          ...prev.data,
          tags: newTags
        }
      };
    });
  }, []);

  // Loading state
  const setLoading = useCallback((loading: boolean) => {
    setWizardState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setWizardState(INITIAL_WIZARD_STATE);
  }, []);

  // Submit poll
  const submitPoll = useCallback(async (): Promise<{ success: boolean; pollId?: string; error?: string }> => {
    setLoading(true);
    
    try {
      // TODO: Implement actual poll submission
      // This is a placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        pollId: `poll_${Date.now()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create poll'
      };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Progress calculation
  const progress = [
    { step: 0, title: 'Basic Information', isCompleted: wizardState.currentStep > 0, isCurrent: wizardState.currentStep === 0, hasError: false, estimatedTime: 2 },
    { step: 1, title: 'Poll Options', isCompleted: wizardState.currentStep > 1, isCurrent: wizardState.currentStep === 1, hasError: false, estimatedTime: 2 },
    { step: 2, title: 'Category & Tags', isCompleted: wizardState.currentStep > 2, isCurrent: wizardState.currentStep === 2, hasError: false, estimatedTime: 2 },
    { step: 3, title: 'Review', isCompleted: wizardState.currentStep > 3, isCurrent: wizardState.currentStep === 3, hasError: false, estimatedTime: 2 }
  ];

  // Alias functions for compatibility
  const updateWizardData = updateData;
  const previousStep = prevStep;
  const updateSettings = (updates: Partial<PollWizardData['settings']>) => updateData({ settings: { ...wizardState.data.settings, ...updates } });

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
    validateStep: (step: number) => validateStep(step, wizardState.data)
  };
}


