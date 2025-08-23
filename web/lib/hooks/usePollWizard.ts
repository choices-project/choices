import { useState, useCallback, useMemo } from 'react';
import { 
  PollWizardState, 
  PollWizardData, 
  PollSettings, 
  PollCategory,
  PollTemplate,
  StepValidation 
} from '../types/poll-templates';

const DEFAULT_SETTINGS: PollSettings = {
  allowMultipleVotes: false,
  allowAnonymousVotes: true,
  requireEmail: false,
  showResults: true,
  allowComments: true,
  enableNotifications: true,
  votingMethod: 'single',
  privacyLevel: 'public',
  moderationEnabled: false,
  autoClose: false,
};

const DEFAULT_WIZARD_DATA: PollWizardData = {
  title: '',
  description: '',
  options: ['', ''],
  settings: DEFAULT_SETTINGS,
  category: 'general',
  tags: [],
};

export const usePollWizard = (template?: PollTemplate) => {
  const [wizardState, setWizardState] = useState<PollWizardState>({
    currentStep: 0,
    totalSteps: 5,
    isComplete: false,
    canProceed: false,
    canGoBack: false,
    data: template ? { ...DEFAULT_WIZARD_DATA, template } : DEFAULT_WIZARD_DATA,
    errors: {},
    isLoading: false,
  });

  const steps = useMemo(() => [
    { id: 'basic-info', title: 'Basic Information', type: 'question' as const },
    { id: 'options', title: 'Poll Options', type: 'options' as const },
    { id: 'category', title: 'Category & Tags', type: 'question' as const },
    { id: 'settings', title: 'Advanced Settings', type: 'settings' as const },
    { id: 'preview', title: 'Preview & Publish', type: 'preview' as const },
  ], []);

  const validateStep = useCallback((stepIndex: number, data: PollWizardData): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (stepIndex) {
      case 0: // Basic Information
        if (!data.title.trim()) {
          errors.title = 'Poll title is required';
        } else if (data.title.length < 3) {
          errors.title = 'Title must be at least 3 characters';
        } else if (data.title.length > 100) {
          errors.title = 'Title must be less than 100 characters';
        }
        if (!data.description.trim()) {
          errors.description = 'Description is required';
        }
        break;

      case 1: // Poll Options
        const validOptions = data.options.filter(option => option.trim().length > 0);
        if (validOptions.length < 2) {
          errors.options = 'At least 2 options are required';
        } else if (validOptions.length > 10) {
          errors.options = 'Maximum 10 options allowed';
        }
        data.options.forEach((option, index) => {
          if (option.trim().length > 0 && option.length > 200) {
            errors[`option-${index}`] = 'Option text must be less than 200 characters';
          }
        });
        break;

      case 2: // Category & Tags
        if (!data.category) {
          errors.category = 'Please select a category';
        }
        if (data.tags.length > 5) {
          errors.tags = 'Maximum 5 tags allowed';
        }
        break;

      case 3: // Advanced Settings
        if (data.settings.expirationDate && data.settings.expirationDate < new Date()) {
          errors.expirationDate = 'Expiration date must be in the future';
        }
        if (data.settings.maxVotes && data.settings.maxVotes < 1) {
          errors.maxVotes = 'Maximum votes must be at least 1';
        }
        break;

      case 4: // Preview & Publish
        // Final validation - all previous validations should pass
        break;
    }

    return errors;
  }, []);

  const updateWizardData = useCallback((updates: Partial<PollWizardData>) => {
    setWizardState(prev => {
      const newData = { ...prev.data, ...updates };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
        canGoBack: prev.currentStep > 0,
      };
    });
  }, [validateStep]);

  const nextStep = useCallback(() => {
    setWizardState(prev => {
      if (prev.currentStep < prev.totalSteps - 1) {
        const nextStepIndex = prev.currentStep + 1;
        const errors = validateStep(nextStepIndex, prev.data);
        const canProceed = Object.keys(errors).length === 0;

        return {
          ...prev,
          currentStep: nextStepIndex,
          errors,
          canProceed,
          canGoBack: true,
          isComplete: nextStepIndex === prev.totalSteps - 1,
        };
      }
      return prev;
    });
  }, [validateStep]);

  const previousStep = useCallback(() => {
    setWizardState(prev => {
      if (prev.currentStep > 0) {
        const prevStepIndex = prev.currentStep - 1;
        const errors = validateStep(prevStepIndex, prev.data);
        const canProceed = Object.keys(errors).length === 0;

        return {
          ...prev,
          currentStep: prevStepIndex,
          errors,
          canProceed,
          canGoBack: prevStepIndex > 0,
          isComplete: false,
        };
      }
      return prev;
    });
  }, [validateStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setWizardState(prev => {
      if (stepIndex >= 0 && stepIndex < prev.totalSteps) {
        const errors = validateStep(stepIndex, prev.data);
        const canProceed = Object.keys(errors).length === 0;

        return {
          ...prev,
          currentStep: stepIndex,
          errors,
          canProceed,
          canGoBack: stepIndex > 0,
          isComplete: stepIndex === prev.totalSteps - 1,
        };
      }
      return prev;
    });
  }, [validateStep]);

  const addOption = useCallback(() => {
    setWizardState(prev => {
      const newOptions = [...prev.data.options, ''];
      const newData = { ...prev.data, options: newOptions };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const removeOption = useCallback((index: number) => {
    setWizardState(prev => {
      if (prev.data.options.length <= 2) return prev; // Minimum 2 options
      
      const newOptions = prev.data.options.filter((_, i) => i !== index);
      const newData = { ...prev.data, options: newOptions };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const updateOption = useCallback((index: number, value: string) => {
    setWizardState(prev => {
      const newOptions = [...prev.data.options];
      newOptions[index] = value;
      const newData = { ...prev.data, options: newOptions };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const updateSettings = useCallback((updates: Partial<PollSettings>) => {
    setWizardState(prev => {
      const newSettings = { ...prev.data.settings, ...updates };
      const newData = { ...prev.data, settings: newSettings };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const addTag = useCallback((tag: string) => {
    setWizardState(prev => {
      const trimmedTag = tag.trim();
      if (!trimmedTag || prev.data.tags.includes(trimmedTag)) return prev;
      
      const newTags = [...prev.data.tags, trimmedTag];
      const newData = { ...prev.data, tags: newTags };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const removeTag = useCallback((tagToRemove: string) => {
    setWizardState(prev => {
      const newTags = prev.data.tags.filter(tag => tag !== tagToRemove);
      const newData = { ...prev.data, tags: newTags };
      const errors = validateStep(prev.currentStep, newData);
      const canProceed = Object.keys(errors).length === 0;

      return {
        ...prev,
        data: newData,
        errors,
        canProceed,
      };
    });
  }, [validateStep]);

  const resetWizard = useCallback(() => {
    setWizardState({
      currentStep: 0,
      totalSteps: 5,
      isComplete: false,
      canProceed: false,
      canGoBack: false,
      data: template ? { ...DEFAULT_WIZARD_DATA, template } : DEFAULT_WIZARD_DATA,
      errors: {},
      isLoading: false,
    });
  }, [template]);

  const setLoading = useCallback((loading: boolean) => {
    setWizardState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const progress = useMemo(() => {
    return steps.map((step, index) => ({
      step: index,
      title: step.title,
      isCompleted: index < wizardState.currentStep,
      isCurrent: index === wizardState.currentStep,
      hasError: Object.keys(wizardState.errors).some(key => key.startsWith(step.id)),
      estimatedTime: 2, // 2 minutes per step
    }));
  }, [steps, wizardState.currentStep, wizardState.errors]);

  return {
    wizardState,
    steps,
    progress,
    updateWizardData,
    nextStep,
    previousStep,
    goToStep,
    addOption,
    removeOption,
    updateOption,
    updateSettings,
    addTag,
    removeTag,
    resetWizard,
    setLoading,
    validateStep,
  };
};

