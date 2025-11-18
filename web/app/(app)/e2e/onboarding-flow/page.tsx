'use client';

import { useEffect, useMemo } from 'react';

import type { CommunityFocus, ProfileVisibility } from '@/features/onboarding/types';
import type { OnboardingStore } from '@/lib/stores/onboardingStore';
import { useOnboardingStore } from '@/lib/stores/onboardingStore';

type AuthStepInput = {
  method?: 'email' | 'google' | 'apple' | 'phone' | 'skip';
  email?: string;
  authSetupCompleted?: boolean;
};

type ProfileStepInput = {
  displayName?: string;
  profileVisibility?: ProfileVisibility;
  profileSetupCompleted?: boolean;
};

type ValuesStepInput = {
  primaryConcerns?: string[];
  communityFocus?: CommunityFocus[];
};

type PreferencesStepInput = {
  privacyAccepted?: boolean;
  marketingOptIn?: boolean;
};

type SeedData = {
  auth?: Partial<OnboardingStore['authData']>;
  profile?: Partial<OnboardingStore['profileData']>;
  values?: Partial<OnboardingStore['valuesData']>;
  preferences?: Partial<OnboardingStore['preferencesData']>;
};

type OnboardingFlowHarness = {
  reset: () => void;
  startOnboarding: (seed?: SeedData) => void;
  completeAuthStep: (input?: AuthStepInput) => void;
  fillProfileStep: (input?: ProfileStepInput) => void;
  setValuesStep: (input?: ValuesStepInput) => void;
  completePrivacyStep: (input?: PreferencesStepInput) => void;
  finish: () => void;
  snapshot: () => Pick<
    OnboardingStore,
    'currentStep' | 'progress' | 'isCompleted' | 'authData' | 'profileData' | 'valuesData' | 'preferencesData'
  >;
};

type OnboardingHarnessWindow = typeof window & {
  __onboardingFlowHarness?: OnboardingFlowHarness;
};

const useDisplayJson = (value: unknown) =>
  useMemo(() => JSON.stringify(value ?? null, null, 2) ?? 'null', [value]);

type ScrollableJsonProps = {
  label: string;
  dataTestId: string;
  value: string;
};

const ScrollableJson = ({ label, dataTestId, value }: ScrollableJsonProps) => (
  <article className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
    <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-500'>{label}</h3>
    <pre
      data-testid={dataTestId}
      className='mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
      role='region'
      aria-label={`${label} JSON output`}
    >
      {value}
    </pre>
  </article>
);

const DEFAULT_AUTH: Required<AuthStepInput> = {
  method: 'email',
  email: 'playwright@example.com',
  authSetupCompleted: true,
};

const DEFAULT_PROFILE: Required<ProfileStepInput> = {
  displayName: 'Playwright Tester',
  profileVisibility: 'public',
  profileSetupCompleted: true,
};

const DEFAULT_VALUES: Required<ValuesStepInput> = {
  primaryConcerns: ['climate'],
  communityFocus: ['local'],
};

const DEFAULT_PREFERENCES: Required<PreferencesStepInput> = {
  privacyAccepted: true,
  marketingOptIn: false,
};

function createHarness(): OnboardingFlowHarness {
  return {
    reset: () => {
      useOnboardingStore.getState().restartOnboarding();
      useOnboardingStore.getState().setCurrentStep(0);
    },
    startOnboarding: (seed) => {
      const store = useOnboardingStore.getState();
      store.restartOnboarding();
      if (seed?.auth) {
        store.updateAuthData(seed.auth);
      }
      if (seed?.profile) {
        store.updateProfileData(seed.profile);
      }
      if (seed?.values) {
        store.updateValuesData(seed.values);
      }
      if (seed?.preferences) {
        store.updatePreferencesData(seed.preferences);
      }
      store.setCurrentStep(0);
    },
    completeAuthStep: (input) => {
      const payload = { ...DEFAULT_AUTH, ...input };
      const store = useOnboardingStore.getState();
      store.setCurrentStep(1);
      store.updateFormData(1, {
        authMethod: payload.method,
        email: payload.email,
        authSetupCompleted: payload.authSetupCompleted,
      });
      if (payload.method !== 'skip') {
        store.updateAuthData({
          method: payload.method,
          email: payload.email,
          termsAccepted: true,
        });
      } else {
        store.updateAuthData({
          email: payload.email,
          termsAccepted: true,
        });
      }
      store.markStepCompleted(1);
      store.nextStep();
    },
    fillProfileStep: (input) => {
      const store = useOnboardingStore.getState();
      const existingProfile = store.profileData;
      const payload = {
        displayName: input?.displayName ?? existingProfile.displayName ?? DEFAULT_PROFILE.displayName,
        profileVisibility:
          input?.profileVisibility ?? existingProfile.profileVisibility ?? DEFAULT_PROFILE.profileVisibility,
        profileSetupCompleted:
          input?.profileSetupCompleted ?? existingProfile.profileSetupCompleted ?? DEFAULT_PROFILE.profileSetupCompleted,
      };
      store.setCurrentStep(2);
      store.updateFormData(2, {
        displayName: payload.displayName,
        profileVisibility: payload.profileVisibility,
        profileSetupCompleted: payload.profileSetupCompleted,
      });
      store.updateProfileData({
        displayName: payload.displayName,
        username: payload.displayName?.toLowerCase().replace(/\s+/g, '_'),
        profileVisibility: payload.profileVisibility,
        profileSetupCompleted: payload.profileSetupCompleted,
      });
      store.markStepCompleted(2);
      store.nextStep();
    },
    setValuesStep: (input) => {
      const payload = {
        primaryConcerns: input?.primaryConcerns ?? DEFAULT_VALUES.primaryConcerns,
        communityFocus: input?.communityFocus ?? DEFAULT_VALUES.communityFocus,
      };
      const store = useOnboardingStore.getState();
      store.setCurrentStep(3);
      store.updateFormData(3, {
        primaryConcerns: payload.primaryConcerns,
        communityFocus: payload.communityFocus,
      });
      store.updateValuesData({
        primaryConcerns: payload.primaryConcerns,
        communityFocus: payload.communityFocus,
      });
      store.markStepCompleted(3);
      store.nextStep();
    },
    completePrivacyStep: (input) => {
      const payload = { ...DEFAULT_PREFERENCES, ...input };
      const store = useOnboardingStore.getState();
      store.setCurrentStep(4);
      store.updateFormData(4, {
        privacyAccepted: payload.privacyAccepted,
        marketingOptIn: payload.marketingOptIn,
      });
      store.updatePreferencesData({
        privacy: payload.privacyAccepted ? 'friends' : 'public',
        marketing: payload.marketingOptIn,
      });
      store.markStepCompleted(4);
      store.nextStep();
    },
    finish: () => {
      const store = useOnboardingStore.getState();
      store.completeOnboarding();
    },
    snapshot: () => {
      const state = useOnboardingStore.getState();
      return {
        currentStep: state.currentStep,
        progress: state.progress,
        isCompleted: state.isCompleted,
        authData: state.authData,
        profileData: state.profileData,
        valuesData: state.valuesData,
        preferencesData: state.preferencesData,
      };
    },
  };
}

export default function OnboardingFlowHarnessPage() {
  const currentStep = useOnboardingStore((state) => state.currentStep);
  const progress = useOnboardingStore((state) => state.progress);
  const isCompleted = useOnboardingStore((state) => state.isCompleted);
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
    (window as OnboardingHarnessWindow).__onboardingFlowHarness = createHarness();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.onboardingFlowReady = 'true';
    }

    return () => {
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.onboardingFlowReady;
        delete document.documentElement.dataset.onboardingFlowStep;
        delete document.documentElement.dataset.onboardingFlowStatus;
      }
      delete (window as OnboardingHarnessWindow).__onboardingFlowHarness;
    };
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.onboardingFlowStep = String(currentStep);
      document.documentElement.dataset.onboardingFlowStatus = isCompleted ? 'completed' : 'in-progress';
    }
  }, [currentStep, isCompleted]);

  return (
    <main
      data-testid='onboarding-flow-harness'
      className='mx-auto flex max-w-4xl flex-col gap-6 p-6'
    >
      <header className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
        <h1 className='text-xl font-semibold'>Onboarding Flow Harness</h1>
        <p className='text-sm text-slate-600'>
          Utility page for Playwright tests. Use the exposed harness helpers to drive onboarding without
          touching production routes.
        </p>
      </header>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='text-lg font-medium'>Summary</h2>
          <dl className='mt-3 space-y-2 text-sm'>
            <div className='flex justify-between gap-2'>
              <dt>Current Step</dt>
              <dd data-testid='onboarding-flow-current-step'>{currentStep}</dd>
            </div>
            <div className='flex justify-between gap-2'>
              <dt>Progress</dt>
              <dd data-testid='onboarding-flow-progress'>{Math.round(progress)}</dd>
            </div>
            <div className='flex justify-between gap-2'>
              <dt>Status</dt>
              <dd data-testid='onboarding-flow-status'>{isCompleted ? 'completed' : 'in-progress'}</dd>
            </div>
          </dl>
        </div>

        <div className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm'>
          <h2 className='text-lg font-medium'>Harness Controls</h2>
          <p className='text-sm text-slate-600'>
            Call helpers from Playwright via <code>window.__onboardingFlowHarness</code>. See
            `docs/testing/ONBOARDING.md` for examples.
          </p>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <ScrollableJson label='Step Data' dataTestId='onboarding-flow-step-data' value={stepDataJson} />
        <ScrollableJson label='Auth Data' dataTestId='onboarding-flow-auth-data' value={authDataJson} />
        <ScrollableJson label='Profile Data' dataTestId='onboarding-flow-profile-data' value={profileDataJson} />
        <ScrollableJson label='Values Data' dataTestId='onboarding-flow-values-data' value={valuesDataJson} />
        <ScrollableJson
          label='Preferences Data'
          dataTestId='onboarding-flow-preferences-data'
          value={preferencesDataJson}
        />
      </section>
    </main>
  );
}

