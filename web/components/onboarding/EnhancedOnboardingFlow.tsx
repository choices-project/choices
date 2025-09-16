'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { devLog } from '@/lib/logger';

import type {
  StepId,
  StepDataMap,
  StepSlug,
  OnboardingDataHybrid,
  OnStepUpdate,
  OnGenericUpdate,
} from './types';

import {
  toSlug,
  DEFAULT_STEP_ORDER,
} from './types';

// Step components (swap to your real ones)
import WelcomeStep from './steps/WelcomeStep';
import PrivacyPhilosophyStep from './steps/PrivacyPhilosophyStep';
import PlatformTourStep from './steps/PlatformTourStep';
import DataUsageStep from './steps/DataUsageStep';
import AuthSetupStep from './steps/AuthSetupStep';
import ProfileSetupStep from './steps/ProfileSetupStep';
import InterestSelectionStep from './steps/InterestSelectionStep';
import FirstExperienceStep from './steps/FirstExperienceStep';
import CompleteStep from './steps/CompleteStep';
import ContributionStep from './steps/ContributionStep';
import ProgressIndicator from './components/ProgressIndicator';

const INITIAL_STATE: OnboardingDataHybrid = {
  completedSteps: [],
  stepData: {},
};

// UI/URL order uses slugs exclusively
const STEP_ORDER = DEFAULT_STEP_ORDER;

const OnboardingContext = React.createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingContextType {
  data: OnboardingDataHybrid;
  updateData: OnGenericUpdate;
  updateStepData: <K extends StepId>(key: K) => OnStepUpdate<K>;
  currentStep: StepSlug;
  setCurrentStep: (step: StepSlug) => void;
  isLoading: boolean;
  error: string | null;
  startOnboarding: () => Promise<void>;
  updateOnboardingStep: (step: StepSlug, stepData?: Record<string, unknown>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export function useOnboardingContext() {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingContext must be used within OnboardingProvider');
  return ctx;
}

function EnhancedOnboardingFlowInner() {
  const [currentStep, setCurrentStep] = React.useState<StepSlug>('welcome');
  const [data, setData] = React.useState<OnboardingDataHybrid>(INITIAL_STATE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  /** Mirror important fields into legacy top-level properties (back-compat) */
  const bridgeToLegacy = React.useCallback(
    <K extends StepId>(key: K, patch: Partial<StepDataMap[K]>): Partial<OnboardingDataHybrid> => {
      switch (key) {
        case 'profile': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('displayName' in patch && patch.displayName !== undefined) {
            out.displayName = String(patch.displayName);
          }
          if ('profileSetupCompleted' in patch && patch.profileSetupCompleted !== undefined) {
            out.profileSetupCompleted = !!patch.profileSetupCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('profile'));
          }
          return out;
        }
        case 'privacyPhilosophy': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('privacyPhilosophyCompleted' in patch && patch.privacyPhilosophyCompleted !== undefined) {
            out.privacyPhilosophyCompleted = !!patch.privacyPhilosophyCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('privacyPhilosophy'));
          }
          if ('privacyLevel' in patch && patch.privacyLevel !== undefined && patch.privacyLevel !== null && typeof patch.privacyLevel === 'string') {
            out.privacyLevel = patch.privacyLevel;
          }
          if ('profileVisibility' in patch && patch.profileVisibility !== undefined && patch.profileVisibility !== null && typeof patch.profileVisibility === 'string') {
            out.profileVisibility = patch.profileVisibility;
          }
          if ('dataSharing' in patch && patch.dataSharing !== undefined && patch.dataSharing !== null && typeof patch.dataSharing === 'string') {
            out.dataSharing = patch.dataSharing;
          }
          return out;
        }
        case 'platformTour': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('platformTourCompleted' in patch && patch.platformTourCompleted !== undefined) {
            out.platformTourCompleted = !!patch.platformTourCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('platformTour'));
          }
          return out;
        }
        case 'dataUsage': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('dataUsageCompleted' in patch && patch.dataUsageCompleted !== undefined) {
            out.dataUsageCompleted = !!patch.dataUsageCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('dataUsage'));
          }
          return out;
        }
        case 'firstExperience': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('firstExperienceCompleted' in patch && patch.firstExperienceCompleted !== undefined) {
            out.firstExperienceCompleted = !!patch.firstExperienceCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('firstExperience'));
          }
          return out;
        }
        case 'auth': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('authCompleted' in patch && patch.authCompleted !== undefined) {
            out.authSetupCompleted = !!patch.authCompleted;
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('auth'));
          }
          return out;
        }
        case 'privacy': {
          const out: Partial<OnboardingDataHybrid> = {};
          if ('privacyCompleted' in patch && patch.privacyCompleted !== undefined) {
            out.completedSteps = maybePushCompleted(data.completedSteps, toSlug('privacy'));
          }
          return out;
        }
        default:
          return {};
      }
    },
    [data.completedSteps]
  );

  /** New, type-safe step updater: onStepUpdate={updateStepData('privacyPhilosophy')} */
  const updateStepData = React.useCallback(
    <K extends StepId>(key: K): OnStepUpdate<K> =>
      (...args) => {
        const patch = args[0];
        setData(prev => {
          const next: OnboardingDataHybrid = {
            ...prev,
            [key]: { ...(prev[key] as StepDataMap[K] | undefined), ...patch },
          };
          const legacy = bridgeToLegacy(key, patch);
          return { ...next, ...legacy };
        });
      },
    [bridgeToLegacy]
  );

  /** Legacy-friendly updater for flat/old fields */
  const updateData: OnGenericUpdate = React.useCallback(
    (...args) => {
      const patch = args[0];
      setData(prev => ({ ...prev, ...patch }));
    },
    []
  );

  const startOnboarding = React.useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'welcome', action: 'start' }),
      });
      if (!response.ok) throw new Error('Failed to start onboarding');
      devLog('Onboarding started successfully');
    } catch (error) {
      devLog('Error starting onboarding:', error);
      setError('Failed to start onboarding');
    }
  }, []);

  const updateOnboardingStep = React.useCallback(
    async (step: StepSlug, stepData?: Record<string, unknown>) => {
      try {
        const response = await fetch('/api/onboarding/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step,
            action: 'update',
            data: stepData || {},
          }),
        });
        if (!response.ok) throw new Error('Failed to update onboarding step');

        setData(prev => ({
          ...prev,
          completedSteps: [...new Set([...prev.completedSteps, step])],
          stepData: { ...prev.stepData, [step]: stepData },
        }));

        devLog(`Onboarding step ${step} updated successfully`);
      } catch (error) {
        devLog('Error updating onboarding step:', error);
        setError('Failed to update onboarding progress');
      }
    },
    []
  );

  const completeOnboarding = React.useCallback(async () => {
    try {
      const response = await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'complete', action: 'complete' }),
      });
      if (!response.ok) throw new Error('Failed to complete onboarding');

      devLog('Onboarding completed successfully');
      router.push('/dashboard');
    } catch (error) {
      devLog('Error completing onboarding:', error);
      setError('Failed to complete onboarding');
    }
  }, [router]);

  // Init: auth + URL step
  React.useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const stepParam = searchParams.get('step') as StepSlug | null;
        if (stepParam && STEP_ORDER.includes(stepParam)) {
          setCurrentStep(stepParam);
        }

        const client = getSupabaseBrowserClient();
        if (!client) {
          throw new Error('Failed to create Supabase client');
        }
        const { data: auth, error: userError } = await client.auth.getUser();
        const user = auth?.user;
        if (user && !userError) {
          setData(prev => ({
            ...prev,
            user,
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            avatar: user.user_metadata?.avatar_url || '',
          }));
        }

        // Load persisted onboarding progress (optional)
        try {
          const response = await fetch('/api/onboarding/progress');
          if (response.ok) {
            const progress = (await response.json()) as Partial<OnboardingDataHybrid>;
            setData(prev => ({ ...prev, ...progress }));
          }
        } catch (progressError) {
          devLog('Could not load onboarding progress:', progressError);
        }
      } catch (e) {
        devLog('Error initializing onboarding:', e);
        setError('Failed to initialize onboarding');
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [searchParams]);

  const goTo = (step: StepSlug) => {
    setCurrentStep(step);
    router.push(`/onboarding?step=${step}`);
  };

  const handleNext = () => {
    const i = STEP_ORDER.indexOf(currentStep);
    if (i >= 0 && i < STEP_ORDER.length - 1) goTo(STEP_ORDER[i + 1]);
  };

  const handleBack = () => {
    const i = STEP_ORDER.indexOf(currentStep);
    if (i > 0) goTo(STEP_ORDER[i - 1]);
  };

  const ctx: OnboardingContextType = {
    data,
    updateData,
    updateStepData,
    currentStep,
    setCurrentStep: goTo,
    isLoading,
    error,
    startOnboarding,
    updateOnboardingStep,
    completeOnboarding,
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Something went wrong</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingContext.Provider value={ctx}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <ProgressIndicator currentStep={currentStep} completedSteps={data.completedSteps} />
        <div className="container mx-auto px-4 py-8">
          {currentStep === 'welcome' && (
            <WelcomeStep
              data={data.welcome}
              onStepUpdate={updateStepData('welcome')}
              onNext={handleNext}
            />
          )}
          {currentStep === 'privacy-philosophy' && (
            <PrivacyPhilosophyStep
              data={data.privacyPhilosophy}
              onStepUpdate={updateStepData('privacyPhilosophy')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'platform-tour' && (
            <PlatformTourStep
              data={data.platformTour}
              onUpdate={updateStepData('platformTour')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'data-usage' && (
            <DataUsageStep
              data={data.dataUsage}
              onUpdate={() => updateStepData('dataUsage')({ dataUsageCompleted: true })}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'auth-setup' && (
            <AuthSetupStep
              data={data.auth}
              onUpdate={updateStepData('auth')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'profile-setup' && (
            <ProfileSetupStep
              data={data.profile}
              onUpdate={updateStepData('profile')}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'interest-selection' && (
            <InterestSelectionStep
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'first-experience' && (
            <FirstExperienceStep
              data={data.firstExperience}
              onUpdate={() => updateStepData('firstExperience')({ firstExperienceCompleted: true })}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep
              data={data}
              onComplete={completeOnboarding}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

/** Helpers */

function maybePushCompleted(list: OnboardingDataHybrid['completedSteps'], step: StepSlug) {
  const curr = Array.isArray(list) ? list : [];
  return curr.includes(step) ? curr : [...curr, step];
}

export default function EnhancedOnboardingFlow() {
  return <EnhancedOnboardingFlowInner />;
}

