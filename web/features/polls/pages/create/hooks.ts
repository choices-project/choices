import { useCallback, useEffect, useMemo, useRef } from 'react';

import { validatePollWizardStep } from '@/lib/polls/validation';
import {
  usePollWizardActions,
  usePollWizardCanGoBack,
  usePollWizardCanProceed,
  usePollWizardData,
  usePollWizardErrors,
  usePollWizardIsComplete,
  usePollWizardLoading,
  usePollWizardStep,
} from '@/lib/stores';

import { CATEGORIES, POLL_CREATION_STEPS, STEP_TIPS } from './constants';
import type { PollWizardSubmissionResult } from './schema';

type StepValidationSnapshot = {
  isValid: boolean;
  errors: Record<string, string>;
  canProceed: boolean;
};

export const usePollCreateController = () => {
  const data = usePollWizardData();
  const errors = usePollWizardErrors();
  const currentStep = usePollWizardStep();
  const canGoBack = usePollWizardCanGoBack();
  const canProceedFlag = usePollWizardCanProceed();
  const isLoading = usePollWizardLoading();
  const isComplete = usePollWizardIsComplete();
  const stepValidation = useMemo<StepValidationSnapshot>(() => {
    const errorsForStep = validatePollWizardStep(currentStep, data);
    const isValid = Object.keys(errorsForStep).length === 0;

    return {
      isValid,
      errors: errorsForStep,
      canProceed: isValid,
    };
  }, [currentStep, data]);

  const {
    nextStep,
    prevStep,
    updateData,
    updateSettings,
    addOption,
    removeOption,
    updateOption,
    addTag,
    removeTag,
    updateTags,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validateCurrentStep,
    canProceedToNextStep,
    resetWizard,
    submitPoll,
  } = usePollWizardActions();

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const progress = useMemo(() => {
    const total = POLL_CREATION_STEPS.length;
    const steps = POLL_CREATION_STEPS.map((step, index) => ({
      ...step,
      index,
      isCurrent: index === currentStep,
      isCompleted: index < currentStep,
      hasError: index === currentStep && Object.keys(errors).length > 0,
    }));
    return {
      percent: Math.round(((currentStep + 1) / total) * 100),
      steps,
    };
  }, [currentStep, errors]);

  const activeTip = STEP_TIPS[Math.min(currentStep, STEP_TIPS.length - 1)];

  const totalSteps = POLL_CREATION_STEPS.length;
  const canProceed =
    currentStep === totalSteps - 1
      ? stepValidation.isValid
      : (canProceedFlag ?? stepValidation.canProceed);

  const goToNextStep = useCallback(() => {
    validateCurrentStep();
    if (canProceedToNextStep(currentStep)) {
      nextStep();
    }
  }, [canProceedToNextStep, currentStep, nextStep, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (canGoBack) {
      prevStep();
    }
  }, [canGoBack, prevStep]);

  const submit = useCallback(async (): Promise<PollWizardSubmissionResult> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await submitPoll({ signal: controller.signal });

      if (!result.success) {
        if (result.reason !== 'cancelled') {
          clearAllErrors();
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([field, message]) => {
              setFieldError(field, message);
            });
          } else {
            setFieldError('_form', result.message);
          }
        }
      } else {
        clearAllErrors();
      }

      return result;
    } finally {
      abortControllerRef.current = null;
    }
  }, [clearAllErrors, setFieldError, submitPoll]);

  return {
    data,
    errors,
    currentStep,
    progressPercent: progress.percent,
    activeTip,
    canProceed,
    canGoBack,
    isComplete,
    isLoading,
    steps: progress.steps,
    categories: CATEGORIES,
    actions: {
      updateData,
      updateSettings,
      addOption,
      removeOption,
      updateOption,
      addTag,
      removeTag,
      updateTags,
      setFieldError,
      clearFieldError,
      clearAllErrors,
      resetWizard,
    },
    goToNextStep,
    goToPreviousStep,
    submit,
  };
};

