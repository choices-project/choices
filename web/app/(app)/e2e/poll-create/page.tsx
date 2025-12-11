'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// type imported only for external consumers via window harness
 
// import type { PollWizardStore } from '@/lib/stores/pollWizardStore';
import { usePollWizardStore } from '@/lib/stores/pollWizardStore';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

import type { PollWizardHarness } from '../poll-wizard/page';

const AccessiblePollWizard = dynamic(
  () =>
    import('@/features/polls/components/AccessiblePollWizard').then(
      (mod) => mod.AccessiblePollWizard,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="poll-create-harness-loading"
        className="rounded border border-slate-200 bg-slate-100 p-4 text-center text-sm text-slate-600"
      >
        Preparing poll wizard harness…
      </div>
    ),
  },
);

export default function PollCreateHarnessPage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const harness: PollWizardHarness = {
      getSnapshot: () => usePollWizardStore.getState(),
      actions: {
        nextStep: () => usePollWizardStore.getState().nextStep(),
        prevStep: () => usePollWizardStore.getState().prevStep(),
        goToStep: (step) => usePollWizardStore.getState().goToStep(step),
        resetWizard: () => usePollWizardStore.getState().resetWizard(),
        updateData: (updates) => usePollWizardStore.getState().updateData(updates),
        updateSettings: (settings) => usePollWizardStore.getState().updateSettings(settings),
        addOption: () => usePollWizardStore.getState().addOption(),
        removeOption: (index) => usePollWizardStore.getState().removeOption(index),
        updateOption: (index, value) => usePollWizardStore.getState().updateOption(index, value),
        addTag: (tag) => usePollWizardStore.getState().addTag(tag),
        removeTag: (tag) => usePollWizardStore.getState().removeTag(tag),
        updateTags: (tags) => usePollWizardStore.getState().updateTags(tags),
        validateCurrentStep: () => usePollWizardStore.getState().validateCurrentStep(),
        clearAllErrors: () => usePollWizardStore.getState().clearAllErrors(),
        setFieldError: (field, error) => usePollWizardStore.getState().setFieldError(field, error),
        clearFieldError: (field) => usePollWizardStore.getState().clearFieldError(field),
        canProceedToNextStep: (step) => usePollWizardStore.getState().canProceedToNextStep(step),
        getStepErrors: (step) => usePollWizardStore.getState().getStepErrors(step),
      },
    };

    (window as typeof window & { __pollWizardHarness?: PollWizardHarness }).__pollWizardHarness = harness;

    return () => {
      const current = (window as typeof window & { __pollWizardHarness?: PollWizardHarness }).__pollWizardHarness;
      if (current === harness) {
        delete (window as typeof window & { __pollWizardHarness?: PollWizardHarness }).__pollWizardHarness;
      }
    };
  }, []);

  useEffect(() => {
    const persist = (usePollWizardStore as typeof usePollWizardStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribe: (() => void) | void;

  if (process.env.NODE_ENV !== 'production') {
      console.warn('[E2E] Poll wizard persist helpers available?', Boolean(persist));
    }

    if (persist?.hasHydrated?.()) {
      setHydrated(true);
    } else if (persist?.onFinishHydration) {
      unsubscribe = persist.onFinishHydration(() => {
        setHydrated(true);
      });
    } else {
      setHydrated(true);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <AnalyticsTestBridge />
      <div className="mx-auto max-w-4xl rounded-xl border bg-white px-6 py-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Poll creation harness</h1>
          <p className="mt-1 text-sm text-slate-500">
            This page mirrors the production poll authoring flow so automated tests run without Supabase or analytics
            dependencies. Keyboard and screen-reader behaviour matches the live experience.
          </p>
        </header>

        {hydrated ? (
          <AccessiblePollWizard />
        ) : (
          <div
            data-testid="poll-create-harness-loading"
            className="rounded border border-slate-200 bg-slate-100 p-4 text-center text-sm text-slate-600"
          >
            Preparing poll wizard harness…
          </div>
        )}
      </div>
    </main>
  );
}

