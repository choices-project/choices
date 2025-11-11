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
import { withOptional } from '@/lib/util/objects';

import { createPollRequest } from './api';
import { CATEGORIES, POLL_CREATION_STEPS, STEP_TIPS } from './constants';
import { buildPollCreatePayload, mapValidationErrors, validateWizardDataForSubmission } from './schema';
import type { PollCreateResult } from './types';

const isCancelledResult = (result: PollCreateResult) => !result.success && result.status === 0;

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
    setLoading,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    validateCurrentStep,
    canProceedToNextStep,
    resetWizard,
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
    const steps = POLL_CREATION_STEPS.map((step, index) => {
      const extras = {
        index,
        isCurrent: index === currentStep,
        isCompleted: index < currentStep,
        hasError: index === currentStep && Object.keys(errors).length > 0,
      };
      return withOptional(step as Record<string, unknown>, extras) as typeof step & typeof extras;
    });

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

  const submit = useCallback(async (): Promise<PollCreateResult> => {
    const validation = validateWizardDataForSubmission(data);
    if (!validation.success) {
      clearAllErrors();
      const fieldErrors = mapValidationErrors(validation.error);
      Object.entries(fieldErrors).forEach(([field, message]) => {
        setFieldError(field, message);
      });

      return {
        success: false,
        message: 'Please fix the highlighted issues before publishing.',
        fieldErrors,
      };
    }

    const payload = buildPollCreatePayload(validation.data);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);

    try {
      const result = await createPollRequest(payload, controller.signal);

      if (isCancelledResult(result)) {
        return result;
      }

      if (!result.success) {
        clearAllErrors();

        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            setFieldError(field, message);
          });
        } else {
          setFieldError('_form', result.message);
        }

        return result;
      }

      clearAllErrors();
      return result;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [clearAllErrors, data, setFieldError, setLoading]);

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

