'use client';

import { AccessiblePollWizard } from '@/features/polls/components/AccessiblePollWizard';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

export default function PollCreateHarnessPage() {
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

        <AccessiblePollWizard />
      </div>
    </main>
  );
}

