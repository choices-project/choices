'use client';

import { useEffect } from 'react';

import {
  usePollWizardActions,
  usePollWizardCanGoBack,
  usePollWizardCanProceed,
  usePollWizardData,
  usePollWizardErrors,
  usePollWizardIsComplete,
  usePollWizardProgress,
  usePollWizardStats,
  usePollWizardStep,
  usePollWizardStore,
  type PollWizardStore,
} from '@/lib/stores/pollWizardStore';

type PollWizardHarnessActions = ReturnType<typeof usePollWizardActions>;

export type PollWizardHarness = {
  getSnapshot: () => PollWizardStore;
  actions: {
    nextStep: PollWizardHarnessActions['nextStep'];
    prevStep: PollWizardHarnessActions['prevStep'];
    goToStep: PollWizardHarnessActions['goToStep'];
    resetWizard: PollWizardHarnessActions['resetWizard'];
    updateData: PollWizardHarnessActions['updateData'];
    updateSettings: PollWizardHarnessActions['updateSettings'];
    addOption: PollWizardHarnessActions['addOption'];
    removeOption: PollWizardHarnessActions['removeOption'];
    updateOption: PollWizardHarnessActions['updateOption'];
    addTag: PollWizardHarnessActions['addTag'];
    removeTag: PollWizardHarnessActions['removeTag'];
    updateTags: PollWizardHarnessActions['updateTags'];
    validateCurrentStep: PollWizardHarnessActions['validateCurrentStep'];
    clearAllErrors: PollWizardHarnessActions['clearAllErrors'];
    setFieldError: PollWizardHarnessActions['setFieldError'];
    clearFieldError: PollWizardHarnessActions['clearFieldError'];
    canProceedToNextStep: PollWizardHarnessActions['canProceedToNextStep'];
    getStepErrors: PollWizardHarnessActions['getStepErrors'];
  };
};

declare global {
  interface Window {
    __pollWizardHarness?: PollWizardHarness;
  }
}

export default function PollWizardStoreHarnessPage() {
  const data = usePollWizardData();
  const step = usePollWizardStep();
  const progress = usePollWizardProgress();
  const errors = usePollWizardErrors();
  const canProceed = usePollWizardCanProceed();
  const canGoBack = usePollWizardCanGoBack();
  const isComplete = usePollWizardIsComplete();
  const stats = usePollWizardStats();
  const {
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
    updateData,
    updateSettings,
    addOption,
    removeOption,
    updateOption,
    addTag,
    removeTag,
    updateTags,
    validateCurrentStep,
    clearAllErrors,
    setFieldError,
    clearFieldError,
    canProceedToNextStep,
    getStepErrors,
  } = usePollWizardActions();

  useEffect(() => {
    const harness: PollWizardHarness = {
      getSnapshot: () => usePollWizardStore.getState(),
      actions: {
        nextStep,
        prevStep,
        goToStep,
        resetWizard,
        updateData,
        updateSettings,
        addOption,
        removeOption,
        updateOption,
        addTag,
        removeTag,
        updateTags,
        validateCurrentStep,
        clearAllErrors,
        setFieldError,
        clearFieldError,
        canProceedToNextStep,
        getStepErrors,
      },
    };

    window.__pollWizardHarness = harness;
    return () => {
      if (window.__pollWizardHarness === harness) {
        delete window.__pollWizardHarness;
      }
    };
  }, [
    addOption,
    addTag,
    canProceedToNextStep,
    clearAllErrors,
    clearFieldError,
    getStepErrors,
    goToStep,
    nextStep,
    prevStep,
    removeOption,
    removeTag,
    resetWizard,
    setFieldError,
    updateData,
    updateOption,
    updateSettings,
    updateTags,
    validateCurrentStep,
  ]);

  const errorEntries = Object.entries(errors);

  return (
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
              <dd data-testid="wizard-current-step">{String(step)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Total steps</dt>
              <dd data-testid="wizard-total-steps">{String(stats.totalSteps)}</dd>
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
  );
}

