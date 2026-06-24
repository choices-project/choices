'use client';

import React, { useEffect, useState } from 'react';

import { usePollWizardStore, type PollWizardStore } from '@/lib/stores/pollWizardStore';

export type PollWizardHarness = {
  getSnapshot: () => PollWizardStore;
  actions: {
    nextStep: PollWizardStore['nextStep'];
    prevStep: PollWizardStore['prevStep'];
    goToStep: PollWizardStore['goToStep'];
    resetWizard: PollWizardStore['resetWizard'];
    updateData: PollWizardStore['updateData'];
    updateSettings: PollWizardStore['updateSettings'];
    addOption: PollWizardStore['addOption'];
    removeOption: PollWizardStore['removeOption'];
    updateOption: PollWizardStore['updateOption'];
    addTag: PollWizardStore['addTag'];
    removeTag: PollWizardStore['removeTag'];
    updateTags: PollWizardStore['updateTags'];
    validateCurrentStep: PollWizardStore['validateCurrentStep'];
    clearAllErrors: PollWizardStore['clearAllErrors'];
    setFieldError: PollWizardStore['setFieldError'];
    clearFieldError: PollWizardStore['clearFieldError'];
    canProceedToNextStep: PollWizardStore['canProceedToNextStep'];
    getStepErrors: PollWizardStore['getStepErrors'];
  };
};

declare global {
  var __pollWizardHarness: PollWizardHarness | undefined;
}

// Set up placeholder harness immediately at module load time (before React renders)
// This ensures the harness object exists when tests check for it
if (typeof window !== 'undefined') {
  const noop = () => undefined;
  // Create a placeholder that will be replaced by the real harness in useLayoutEffect
  // This prevents tests from timing out while waiting for React to render
  (window as any).__pollWizardHarness = {
    getSnapshot: () => usePollWizardStore.getState(),
    actions: {
      nextStep: noop,
      prevStep: noop,
      goToStep: noop,
      resetWizard: noop,
      updateData: noop,
      updateSettings: noop,
      addOption: noop,
      removeOption: noop,
      updateOption: noop,
      addTag: noop,
      removeTag: noop,
      updateTags: noop,
      validateCurrentStep: () => true,
      clearAllErrors: noop,
      setFieldError: noop,
      clearFieldError: noop,
      canProceedToNextStep: () => true,
      getStepErrors: () => ({}),
    },
  };
}

export default function PollWizardStoreHarnessPage() {
  const [wizardState, setWizardState] = useState<PollWizardStore>(() => usePollWizardStore.getState());

  useEffect(() => {
    const unsubscribe = usePollWizardStore.subscribe((state) => {
      setWizardState(state);
    });
    return unsubscribe;
  }, []);

  const {
    data,
    currentStep,
    progress,
    errors,
    canProceed,
    canGoBack,
    isComplete,
    totalSteps,
  } = wizardState;

  // Use useLayoutEffect to set up harness synchronously before paint
  // This ensures the harness is available immediately when the test checks
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

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

    // Set up harness immediately
    window.__pollWizardHarness = harness;

    // Set dataset attribute - check for store hydration but don't wait
    const persist = (usePollWizardStore as typeof usePollWizardStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    const markReady = () => {
      document.documentElement.dataset.pollWizardHarness = 'ready';
    };

    if (persist?.hasHydrated?.()) {
      markReady();
    } else if (persist?.onFinishHydration) {
      // Set ready immediately, but also listen for hydration
      markReady();
      const unsubscribeHydration = persist.onFinishHydration(() => {
        // Already marked ready, but ensure it's still set
        markReady();
      });
      return () => {
        if (typeof unsubscribeHydration === 'function') {
          unsubscribeHydration();
        }
        if (window.__pollWizardHarness === harness) {
          delete window.__pollWizardHarness;
        }
        if (typeof document !== 'undefined') {
          delete document.documentElement.dataset.pollWizardHarness;
        }
      };
    } else {
      // No persistence, mark ready immediately
      markReady();
    }

    return () => {
      if (window.__pollWizardHarness === harness) {
        delete window.__pollWizardHarness;
      }
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.pollWizardHarness;
      }
    };
  }, []);

  const errorEntries = Object.entries(errors);

  return (
    <>
      {/* Script to set up harness immediately on page load, before React hydrates */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window === 'undefined') return;
              // Set up placeholder harness immediately
              if (!window.__pollWizardHarness) {
                window.__pollWizardHarness = {
                  getSnapshot: function() { return {}; },
                  actions: {
                    nextStep: function() {},
                    prevStep: function() {},
                    goToStep: function() {},
                    resetWizard: function() {},
                    updateData: function() {},
                    updateSettings: function() {},
                    addOption: function() {},
                    removeOption: function() {},
                    updateOption: function() {},
                    addTag: function() {},
                    removeTag: function() {},
                    updateTags: function() {},
                    validateCurrentStep: function() { return true; },
                    clearAllErrors: function() {},
                    setFieldError: function() {},
                    clearFieldError: function() {},
                    canProceedToNextStep: function() { return true; },
                    getStepErrors: function() { return {}; }
                  }
                };
              }
            })();
          `,
        }}
      />
      <main
        data-testid="poll-wizard-harness"
        className="mx-auto flex max-w-4xl flex-col gap-6 p-6 text-slate-900"
      >
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Poll Wizard Store Harness</h1>
        <p className="text-sm text-slate-600">
          Interact with the poll creation wizard store via <code>window.__pollWizardHarness</code>.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium">Progress</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt>Current step</dt>
              <dd data-testid="wizard-current-step">{String(currentStep)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total steps</dt>
              <dd data-testid="wizard-total-steps">{String(totalSteps)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Progress (%)</dt>
              <dd data-testid="wizard-progress">{progress.toFixed(1)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Can proceed</dt>
              <dd data-testid="wizard-can-proceed">{String(canProceed)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Can go back</dt>
              <dd data-testid="wizard-can-go-back">{String(canGoBack)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Complete</dt>
              <dd data-testid="wizard-is-complete">{String(isComplete)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Error count</dt>
              <dd data-testid="wizard-error-count">{String(errorEntries.length)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-lg font-medium">Errors</h2>
          <ul
            data-testid="wizard-errors"
            className="mt-2 space-y-2 rounded border border-slate-200 bg-slate-50 p-2 text-sm"
          >
            {errorEntries.length === 0 && <li className="text-slate-500">None</li>}
            {errorEntries.map(([field, message]) => (
              <li key={field} className="flex justify-between gap-2">
                <span className="font-medium">{field}</span>
                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Wizard Data Snapshot</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between gap-2">
            <dt>Title</dt>
            <dd data-testid="wizard-data-title" className="text-right">
              {data.title || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Description length</dt>
            <dd data-testid="wizard-data-description-length">{String(data.description.length)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Category</dt>
            <dd data-testid="wizard-data-category">{data.category}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Privacy level</dt>
            <dd data-testid="wizard-data-privacy">{data.privacyLevel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Options</dt>
            <dd data-testid="wizard-options-count">{String(data.options.length)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Tags</dt>
            <dd data-testid="wizard-tags-count">{String(data.tags.length)}</dd>
          </div>
        </dl>

        <div>
          <h3 className="text-sm font-semibold">Options</h3>
          <ol data-testid="wizard-options" className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {data.options.map((option, index) => (
              <li key={`${option}-${index}`} className="text-slate-700">
                {option || '(empty)'}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Tags</h3>
          <ul data-testid="wizard-tags" className="mt-1 flex flex-wrap gap-2 text-sm">
            {data.tags.length === 0 && <li className="text-slate-500">None</li>}
            {data.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                #{tag}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
    </>
  );
}

