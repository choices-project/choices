'use client';

import { useEffect, useMemo } from 'react';

import type { OnboardingStore } from '@/lib/stores/onboardingStore';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

export type OnboardingStoreHarness = {
  setCurrentStep: OnboardingStore['setCurrentStep'];
  nextStep: OnboardingStore['nextStep'];
  previousStep: OnboardingStore['previousStep'];
  goToStep: OnboardingStore['goToStep'];
  completeOnboarding: OnboardingStore['completeOnboarding'];
  skipOnboarding: OnboardingStore['skipOnboarding'];
  restartOnboarding: OnboardingStore['restartOnboarding'];
  updateFormData: OnboardingStore['updateFormData'];
  updateAuthData: OnboardingStore['updateAuthData'];
  updateProfileData: OnboardingStore['updateProfileData'];
  updateValuesData: OnboardingStore['updateValuesData'];
  updatePreferencesData: OnboardingStore['updatePreferencesData'];
  clearStepData: OnboardingStore['clearStepData'];
  clearAllData: OnboardingStore['clearAllData'];
  markStepCompleted: OnboardingStore['markStepCompleted'];
  markStepSkipped: OnboardingStore['markStepSkipped'];
  markStepIncomplete: OnboardingStore['markStepIncomplete'];
  getStepValidationErrors: OnboardingStore['getStepValidationErrors'];
  canProceedToNextStep: OnboardingStore['canProceedToNextStep'];
  validateStep: OnboardingStore['validateStep'];
  validateAllSteps: OnboardingStore['validateAllSteps'];
  getSnapshot: () => OnboardingStore;
};

declare global {
  var __onboardingStoreHarness: OnboardingStoreHarness | undefined;
}

const useDisplayJson = (value: unknown) =>
  useMemo(() => JSON.stringify(value ?? null, null, 2) ?? 'null', [value]);

export default function OnboardingStoreHarnessPage() {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const totalSteps = useOnboardingStore((state) => state.totalSteps);
  const progress = useOnboardingStore((state) => state.progress);
  const isCompleted = useOnboardingStore((state) => state.isCompleted);
  const isSkipped = useOnboardingStore((state) => state.isSkipped);
  const isActive = useOnboardingStore((state) => state.isActive);
  const completedSteps = useOnboardingStore((state) => state.completedSteps);
  const skippedSteps = useOnboardingStore((state) => state.skippedSteps);
  const stepData = useOnboardingStore((state) => state.stepData);
  const authData = useOnboardingStore((state) => state.authData);
  const profileData = useOnboardingStore((state) => state.profileData);
  const valuesData = useOnboardingStore((state) => state.valuesData);
  const preferencesData = useOnboardingStore((state) => state.preferencesData);

  const stepDataJson = useDisplayJson(stepData);
  const authDataJson = useDisplayJson(authData);
  const profileDataJson = useDisplayJson(profileData);
  const valuesDataJson = useDisplayJson(valuesData);
  const preferencesDataJson = useDisplayJson(preferencesData);

  useEffect(() => {
    const api = useOnboardingStore.getState();
    const harness: OnboardingStoreHarness = {
      setCurrentStep: api.setCurrentStep,
      nextStep: api.nextStep,
      previousStep: api.previousStep,
      goToStep: api.goToStep,
      completeOnboarding: api.completeOnboarding,
      skipOnboarding: api.skipOnboarding,
      restartOnboarding: api.restartOnboarding,
      updateFormData: api.updateFormData,
      updateAuthData: api.updateAuthData,
      updateProfileData: api.updateProfileData,
      updateValuesData: api.updateValuesData,
      updatePreferencesData: api.updatePreferencesData,
      clearStepData: api.clearStepData,
      clearAllData: api.clearAllData,
      markStepCompleted: api.markStepCompleted,
      markStepSkipped: api.markStepSkipped,
      markStepIncomplete: api.markStepIncomplete,
      getStepValidationErrors: api.getStepValidationErrors,
      canProceedToNextStep: api.canProceedToNextStep,
      validateStep: api.validateStep,
      validateAllSteps: api.validateAllSteps,
      getSnapshot: () => useOnboardingStore.getState(),
    };

    window.__onboardingStoreHarness = harness;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.onboardingStoreHarness = 'ready';
    }

    return () => {
      if (window.__onboardingStoreHarness) {
        delete window.__onboardingStoreHarness;
      }
      if (typeof document !== 'undefined' && document.documentElement.dataset.onboardingStoreHarness) {
        delete document.documentElement.dataset.onboardingStoreHarness;
      }
    };
  }, []);

  return (
    <main data-testid="onboarding-store-harness">
      <h1>Onboarding Store Harness</h1>

      <section aria-labelledby="onboarding-summary-heading">
        <h2 id="onboarding-summary-heading">Summary</h2>
        <dl>
          <div>
            <dt>Current Step</dt>
            <dd data-testid="onboarding-current-step">{currentStep}</dd>
          </div>
          <div>
            <dt>Total Steps</dt>
            <dd data-testid="onboarding-total-steps">{totalSteps}</dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd data-testid="onboarding-progress">{progress}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd data-testid="onboarding-is-completed">{String(isCompleted)}</dd>
          </div>
          <div>
            <dt>Skipped</dt>
            <dd data-testid="onboarding-is-skipped">{String(isSkipped)}</dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd data-testid="onboarding-is-active">{String(isActive)}</dd>
          </div>
          <div>
            <dt>Completed Steps Count</dt>
            <dd data-testid="onboarding-completed-count">{completedSteps.length}</dd>
          </div>
          <div>
            <dt>Skipped Steps Count</dt>
            <dd data-testid="onboarding-skipped-count">{skippedSteps.length}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="onboarding-collections-heading">
        <h2 id="onboarding-collections-heading">Collections</h2>
        <p data-testid="onboarding-completed-steps">{completedSteps.join(', ') || 'none'}</p>
        <p data-testid="onboarding-skipped-steps">{skippedSteps.join(', ') || 'none'}</p>
      </section>

      <section aria-labelledby="onboarding-data-heading">
        <h2 id="onboarding-data-heading">Data</h2>
        <article>
          <h3>Step Data</h3>
          <pre data-testid="onboarding-step-data">{stepDataJson}</pre>
        </article>
        <article>
          <h3>Auth Data</h3>
          <pre data-testid="onboarding-auth-data">{authDataJson}</pre>
        </article>
        <article>
          <h3>Profile Data</h3>
          <pre data-testid="onboarding-profile-data">{profileDataJson}</pre>
        </article>
        <article>
          <h3>Values Data</h3>
          <pre data-testid="onboarding-values-data">{valuesDataJson}</pre>
        </article>
        <article>
          <h3>Preferences Data</h3>
          <pre data-testid="onboarding-preferences-data">{preferencesDataJson}</pre>
        </article>
      </section>
    </main>
  );
}

