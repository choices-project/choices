'use client';

import { useEffect, useState } from 'react';

import AuthSetupStep from '@/features/onboarding/components/AuthSetupStep';
import type { AuthSetupStepData } from '@/features/onboarding/types';

export default function OnboardingAuthHarnessPage() {
  const [authData, setAuthData] = useState<AuthSetupStepData>({});
  const [stepCount, setStepCount] = useState(0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.onboardingAuthHarness = 'ready';
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete document.documentElement.dataset.onboardingAuthHarness;
      }
    };
  }, []);

  return (
    <main data-testid="onboarding-auth-harness" className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Onboarding Auth Harness</h1>
        <p className="text-sm text-slate-600">
          Use this harness to interact with <code>AuthSetupStep</code> in isolation.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <AuthSetupStep
          forceInteractive
          data={authData}
          onUpdate={(updates) => setAuthData((prev) => ({ ...prev, ...updates }))}
          onNext={() => setStepCount((prev) => prev + 1)}
          onBack={() => setStepCount((prev) => Math.max(prev - 1, 0))}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Harness State</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex justify-between gap-2">
              <dt>Step Count</dt>
              <dd data-testid="onboarding-auth-step">{stepCount}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">Auth Data</h2>
          <pre
            data-testid="onboarding-auth-data"
            className="mt-2 max-h-56 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-700"
          >
            {JSON.stringify(authData ?? {}, null, 2)}
          </pre>
        </article>
      </section>
    </main>
  );
}


