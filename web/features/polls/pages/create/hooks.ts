import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  usePollWizardActions,
  usePollWizardCanGoBack,
  usePollWizardCanProceed,
  usePollWizardData,
  usePollWizardErrors,
  usePollWizardIsComplete,
  usePollWizardLoading,
  usePollWizardStep,
  usePollWizardStepValidation,
} from '@/lib/stores';

import { CATEGORIES, POLL_CREATION_STEPS, STEP_TIPS } from './constants';
import type { PollWizardSubmissionResult } from './schema';

export const usePollCreateController = () => {
  const data = usePollWizardData();
  const errors = usePollWizardErrors();
  const currentStep = usePollWizardStep();
  const canGoBack = usePollWizardCanGoBack();
  const canProceedFlag = usePollWizardCanProceed();
  const isLoading = usePollWizardLoading();
  const isComplete = usePollWizardIsComplete();
  const stepValidation = usePollWizardStepValidation(currentStep);

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

  const canProceed = canProceedFlag ?? stepValidation.canProceed;

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

