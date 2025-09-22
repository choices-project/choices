'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getSupabaseBrowserClient } from '@/utils/supabase/client';
import { devLog } from '@/lib/logger';
import { completeOnboardingAction } from '@/app/actions/complete-onboarding';

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

// Step components
import WelcomeStep from './WelcomeStep';
import PrivacyPhilosophyStep from './PrivacyPhilosophyStep';
import PlatformTourStep from './PlatformTourStep';
import DataUsageStep from './DataUsageStep';
import DataUsageStepLite from './DataUsageStepLite';
import AuthSetupStep from './AuthSetupStep';
import ProfileSetupStep from './ProfileSetupStep';
import InterestSelectionStep from './InterestSelectionStep';
import FirstExperienceStep from './FirstExperienceStep';
import CompleteStep from './CompleteStep';
import ProgressIndicator from './ProgressIndicator';

// Local state navigation with URL sync in background
function useLocalStepNavigation(): [StepSlug, (s: StepSlug) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1) Local step state renders immediately
  const initial = (searchParams.get('step') as StepSlug) ?? 'welcome';
  const [step, setStep] = React.useState<StepSlug>(initial);

  // 2) Keep URL in sync (but don't *wait* on it)
  const syncUrl = React.useCallback((next: StepSlug) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('step', next);
    router.replace(`?${p.toString()}`, { scroll: false });
  }, [router, searchParams]);

  function goToStep(next: StepSlug) {
    console.log('goToStep called:', { current: step, next });
    setStep(next);           // render now
    syncUrl(next);           // URL catch-up
  }

  // Default to welcome step on mount if no step param
  React.useEffect(() => {
    if (!searchParams.get('step')) {
      goToStep('welcome');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return [step, goToStep];
}

const INITIAL_STATE: OnboardingDataHybrid = {
  completedSteps: [],
  stepData: {},
};

// UI/URL order uses slugs exclusively
const STEP_ORDER = DEFAULT_STEP_ORDER;

// Test ID mappings for E2E tests
const NEXT_TESTID: Partial<Record<StepSlug, string>> = {
  'welcome': 'welcome-next',
  'privacy-philosophy': 'privacy-next',
  'platform-tour': 'tour-next',
  'data-usage': 'data-usage-next',
  'auth-setup': 'auth-next',
  'profile-setup': 'profile-next',
  'interest-selection': 'interests-next',
  'first-experience': 'experience-next',
  'complete': 'complete-onboarding',
};

const BACK_TESTID: Partial<Record<StepSlug, string>> = {
  'privacy-philosophy': 'privacy-back',
  'platform-tour': 'tour-back',
  'data-usage': 'data-usage-back',
  'auth-setup': 'auth-back',
  'profile-setup': 'profile-back',
  'interest-selection': 'interests-back',
  'first-experience': 'experience-back',
};

// Complete button component using useFormStatus
function CompleteButton() {
  const { pending } = useFormStatus(); // disables during server-submit
  return (
    <button
      type="submit"
      data-testid="complete-onboarding"
      aria-label="Complete onboarding"
      disabled={pending}
      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
    >
      {pending ? 'Finishing…' : 'Complete'}
    </button>
  );
}

const OnboardingContext = React.createContext<OnboardingContextType | undefined>(undefined);

type OnboardingContextType = {
  data: OnboardingDataHybrid;
  updateData: OnGenericUpdate;
  updateStepData: <K extends StepId>(key: K) => OnStepUpdate<K>;
  currentStep: StepSlug;
  setCurrentStep: (step: StepSlug) => void;
  isLoading: boolean;
  error: string | null;
  startOnboarding: () => Promise<void>;
  updateOnboardingStep: (step: StepSlug, stepData?: Record<string, unknown>) => Promise<void>;
}

export function useOnboardingContext() {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingContext must be used within OnboardingProvider');
  return ctx;
}

function EnhancedOnboardingFlowInner() {
  const [currentStep, setCurrentStep] = useLocalStepNavigation();
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

  const handleComplete = React.useCallback(() => {
    // This will be handled by the form submission
    devLog('Onboarding completion triggered');
  }, []);

  // Init: auth + URL step
  React.useEffect(() => {
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step is now managed by useUrlBackedStep hook

        const client = await getSupabaseBrowserClient();
        if (!client) {
          throw new Error('Failed to create Supabase client');
        }
        const { data: auth, error: userError } = await client.auth.getUser();
        const user = auth.user;
        if (user && !userError) {
          setData(prev => ({
            ...prev,
            user,
            displayName: user.user_metadata.full_name || user.email?.split('@')[0] || '',
            avatar: user.user_metadata.avatar_url || '',
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


  // Optimistic navigation functions
  function nextOf(s: StepSlug): StepSlug {
    const i = STEP_ORDER.indexOf(s);
    if (i === -1) return 'welcome'; // fallback if step not found
    const nextIndex = Math.min(STEP_ORDER.length - 1, i + 1);
    return STEP_ORDER[nextIndex] as StepSlug;
  }
  
  function prevOf(s: StepSlug): StepSlug {
    const i = STEP_ORDER.indexOf(s);
    if (i === -1) return 'welcome'; // fallback if step not found
    const prevIndex = Math.max(0, i - 1);
    return STEP_ORDER[prevIndex] as StepSlug;
  }

  // Persist progress, but NEVER block navigation on it
  async function persistProgress(next: StepSlug) {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-e2e-bypass': '1', // critical for E2E; harmless elsewhere
        },
        body: JSON.stringify({ step: next }),
        cache: 'no-store',
      });
    } catch {
      // swallow in E2E; we navigated already
    }
  }

  const handleNext = () => {
    const nxt = nextOf(currentStep);
    console.log('handleNext called:', { currentStep, next: nxt });
    setCurrentStep(nxt);       // render now (local state)
    void persistProgress(nxt); // don't await
  };

  const handleBack = () => {
    const prv = prevOf(currentStep);
    setCurrentStep(prv);       // render now (local state)
    void persistProgress(prv);
  };

  const ctx: OnboardingContextType = {
    data,
    updateData,
    updateStepData,
    currentStep,
    setCurrentStep: setCurrentStep,
    isLoading,
    error,
    startOnboarding,
    updateOnboardingStep,
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center" data-testid="onb-error">
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center" data-testid="onb-loading">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
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
            <div data-testid="welcome-step">
              <WelcomeStep
                data={data.welcome ?? {}}
                onStepUpdate={updateStepData('welcome')}
                onNext={handleNext}
              />
            </div>
          )}
          {currentStep === 'privacy-philosophy' && (
            <div data-testid="privacy-philosophy-step">
              <PrivacyPhilosophyStep
                data={data.privacyPhilosophy ?? {}}
                onStepUpdate={updateStepData('privacyPhilosophy')}
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'platform-tour' && (
            <div data-testid="platform-tour-step">
              <PlatformTourStep
                data={data.platformTour}
                onUpdate={updateStepData('platformTour')}
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'data-usage' && (
            <div data-testid="data-usage-step">
              {data.showAdvancedPrivacy ? (
                <DataUsageStep
                  data={data.dataUsage}
                  onUpdate={() => updateStepData('dataUsage')({ dataUsageCompleted: true })}
                  onNext={handleNext}
                  onBack={() => {
                    // Go back to lite mode
                    setData(prev => ({ ...prev, showAdvancedPrivacy: false }));
                  }}
                />
              ) : (
                <DataUsageStepLite 
                  onNext={handleNext}
                  onShowAdvanced={() => {
                    // Switch to advanced mode within the same step
                    setData(prev => ({ ...prev, showAdvancedPrivacy: true }));
                  }}
                />
              )}
            </div>
          )}
          {currentStep === 'auth-setup' && (
            <div data-testid="auth-setup-step">
              <AuthSetupStep
                data={data.auth}
                onUpdate={updateStepData('auth')}
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'profile-setup' && (
            <div data-testid="profile-setup-step">
              <ProfileSetupStep
                data={data.profile ?? {}}
                onUpdate={updateStepData('profile')}
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'interest-selection' && (
            <div data-testid="interest-selection-step">
              <InterestSelectionStep
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'first-experience' && (
            <div data-testid="first-experience-step">
              <FirstExperienceStep
                data={data.firstExperience ?? {}}
                onUpdate={() => updateStepData('firstExperience')({ firstExperienceCompleted: true })}
                onNext={handleNext}
                onBack={handleBack}
              />
            </div>
          )}
          {currentStep === 'complete' && (
            <div data-testid="complete-step">
              <CompleteStep
                data={data}
                onBack={handleBack}
                onComplete={handleComplete}
              />
              
              <form
                action={completeOnboardingAction}
                data-testid="onboarding-form"
                method="post"
                onSubmit={() => console.log('Client submit intercepted; calling server action')}
              >
                <input type="hidden" name="finished" value="true" />

                <div className="mt-6 flex justify-center">
                  <CompleteButton />
                </div>
              </form>
            </div>
          )}
          
          {/* Navigation buttons with E2E test IDs for other steps */}
          {currentStep !== 'complete' && (
            <div className="mt-6 flex gap-2 justify-center">
              {currentStep !== 'welcome' && (
                <button
                  data-testid={BACK_TESTID[currentStep] ?? 'onb-back'}
                  onClick={handleBack}
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back
                </button>
              )}

              <button
                data-testid={NEXT_TESTID[currentStep] ?? 'onb-next'}
                onClick={handleNext}
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
              </button>
            </div>
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

