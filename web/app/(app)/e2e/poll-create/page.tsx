'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { usePollWizardStore } from '@/lib/stores/pollWizardStore';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

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
    const persist = (usePollWizardStore as typeof usePollWizardStore & {
      persist?: {
        hasHydrated?: () => boolean;
        onFinishHydration?: (callback: () => void) => (() => void) | void;
      };
    }).persist;

    let unsubscribe: (() => void) | void;

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

