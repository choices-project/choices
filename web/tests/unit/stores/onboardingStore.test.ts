import { create } from 'zustand';

import type { OnboardingStore } from '@/lib/stores/onboardingStore';
import { createInitialOnboardingState, createOnboardingActions } from '@/lib/stores/onboardingStore';

const createTestOnboardingStore = () =>
  create<OnboardingStore>()((set, get, _api) =>
    Object.assign(createInitialOnboardingState(), createOnboardingActions(set, get))
  );

describe('onboardingStore', () => {
  it('restartOnboarding resets progress and activates flow', () => {
    const store = createTestOnboardingStore();

    store.getState().setCurrentStep(3);
    store.getState().updateAuthData({ email: 'test@example.com' });
    store.getState().markStepCompleted(2);
    store.getState().markStepSkipped(1);

    store.getState().restartOnboarding();

    const state = store.getState();
    expect(state.currentStep).toBe(0);
    expect(state.progress).toBe(0);
    expect(state.isCompleted).toBe(false);
    expect(state.isSkipped).toBe(false);
    expect(state.isActive).toBe(true);
    expect(state.completedSteps).toEqual([]);
    expect(state.skippedSteps).toEqual([]);
    expect(state.authData).toEqual({});
    expect(state.profileData).toEqual({});
    expect(state.valuesData).toEqual({});
    expect(state.preferencesData).toEqual({});
    expect(state.stepData).toEqual({});
  });

  it('updateAuthData merges values without clearing existing fields', () => {
    const store = createTestOnboardingStore();

    store.getState().updateAuthData({ method: 'email', email: 'first@example.com' });
    store.getState().updateAuthData({ marketingOptIn: true });

    expect(store.getState().authData).toMatchObject({
      method: 'email',
      email: 'first@example.com',
      marketingOptIn: true,
    });
  });

  it('clearAllData removes stored step data and form slices', () => {
    const store = createTestOnboardingStore();

    store.getState().updateFormData(2, { profileSetupCompleted: true });
    store.getState().updateProfileData({ firstName: 'Ada' });
    store.getState().updateValuesData({ values: ['equity'] });
    store.getState().updatePreferencesData({ theme: 'dark' });

    store.getState().clearAllData();

    const state = store.getState();
    expect(state.stepData).toEqual({});
    expect(state.profileData).toEqual({});
    expect(state.valuesData).toEqual({});
    expect(state.preferencesData).toEqual({});
  });

  it('markStepCompleted flags the step and records completion', () => {
    const store = createTestOnboardingStore();

    store.getState().markStepCompleted(1);

    expect(store.getState().completedSteps).toContain(1);
    const step = store.getState().steps.find((s) => s.id === 1);
    expect(step?.completed).toBe(true);
  });
});


