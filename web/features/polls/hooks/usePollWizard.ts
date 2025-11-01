/**
 * Poll Wizard Hook
 * 
 * This module provides a hook for managing poll creation wizard state.
 * It replaces the old @/shared/utils/lib/usePollWizard imports.
 */

import { useState, useCallback } from 'react';

import { logger } from '../../../lib/logger';
import type { 
  PollWizardData, 
  PollWizardState 
} from '../types';

const INITIAL_WIZARD_DATA: PollWizardData = {
  title: '',
  description: '',
  category: 'general',
  options: ['', ''],
  tags: [],
  privacyLevel: 'public',
  settings: {
    votingMethod: 'single',
    allowMultipleVotes: false,
    showResults: true,
    allowComments: true
  }
};

const INITIAL_WIZARD_STATE: PollWizardState = {
  currentStep: 0,
  totalSteps: 4,
  data: INITIAL_WIZARD_DATA,
  errors: {},
  isLoading: false,
  canProceed: false,
  canGoBack: false,
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
        const step1ValidOptions = data.options.filter((option: string) => option.trim().length > 0);
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
        const validOptions = data.options.filter((option: string) => option.trim().length > 0);
        if (validOptions.length < 2) {
          errors.options = 'At least 2 valid options are required';
        }
        
        // Check for duplicate options
        const uniqueOptions = new Set(validOptions.map((opt: string) => opt.toLowerCase().trim()));
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
  }, []);

  // Helper function to check if current step is valid
  const isCurrentStepValid = useCallback((step: number, data: PollWizardData): boolean => {
    const errors = validateStep(step, data);
    return Object.keys(errors).length === 0;
  }, [validateStep]);

  // Navigation functions
  const nextStep = useCallback(() => {
    setWizardState((prev: any) => {
      const errors = validateStep(prev.currentStep, prev.data);
      if (Object.keys(errors).length > 0) {
        return Object.assign({}, prev, { errors });
      }
      
      return Object.assign({}, prev, {
        currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
        errors: {},
        canProceed: prev.currentStep + 1 < prev.totalSteps - 1 || isCurrentStepValid(prev.currentStep + 1, prev.data)
      });
    });
  }, [validateStep, isCurrentStepValid]);

  const prevStep = useCallback(() => {
    setWizardState(prev => Object.assign({}, prev, {
      currentStep: Math.max(prev.currentStep - 1, 0),
      errors: {}
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setWizardState(prev => Object.assign({}, prev, {
      currentStep: Math.max(0, Math.min(step, prev.totalSteps - 1)),
      errors: {}
    }));
  }, []);

  // Data update functions
  const updateData = useCallback((updates: Partial<PollWizardData>) => {
    setWizardState((prev: any) => {
      const newData = Object.assign({}, prev.data, updates);
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
      
      return Object.assign({}, prev, {
        data: newData,
        canProceed,
        errors
      });
    });
  }, [validateStep]);

  const addOption = useCallback(() => {
    setWizardState(prev => Object.assign({}, prev, {
      data: Object.assign({}, prev.data, {
        options: [...prev.data.options, '']
      })
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setWizardState((prev: any) => {
      const newOptions = prev.data.options.filter((_: string, i: number) => i !== index);
      return Object.assign({}, prev, {
        data: Object.assign({}, prev.data, {
          options: newOptions
        })
      });
    });
  }, []);

  const updateOption = useCallback((index: number, value: string) => {
    setWizardState(prev => Object.assign({}, prev, {
      data: Object.assign({}, prev.data, {
        options: prev.data.options.map((option: string, i: number) => i === index ? value : option)
      })
    }));
  }, []);

  const addTag = useCallback((tag: string) => {
    setWizardState(prev => Object.assign({}, prev, {
      data: Object.assign({}, prev.data, {
        tags: [...prev.data.tags, tag]
      })
    }));
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setWizardState((prev: any) => {
      const newTags = prev.data.tags.filter((tag: string) => tag !== tagToRemove);
      return Object.assign({}, prev, {
        data: Object.assign({}, prev.data, {
          tags: newTags
        })
      });
    });
  }, []);

  // Loading state
  const setLoading = useCallback((loading: boolean) => {
    setWizardState(prev => Object.assign({}, prev, { isLoading: loading }));
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
        setWizardState(prev => Object.assign({}, prev, { errors: finalErrors }));
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
      setWizardState(prev => Object.assign({}, prev, {
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
      setWizardState(prev => Object.assign({}, prev, {
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
  const updateSettings = (updates: Partial<PollWizardData['settings']>) => updateData({ settings: Object.assign({}, wizardState.data.settings, updates) });

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


