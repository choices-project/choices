'use client';

import PollClient from '@/app/(app)/polls/[id]/PollClient';

import { AnalyticsTestBridge } from '../../_components/AnalyticsTestBridge';

type PollClientProps = Parameters<typeof PollClient>[0];

type HarnessPollRunProps = {
  poll: PollClientProps['poll'];
};

export default function PollRunHarnessClient({ poll }: HarnessPollRunProps) {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <AnalyticsTestBridge />
      <div className="mx-auto max-w-4xl rounded-xl border bg-white px-6 py-8 shadow-sm">
        <PollClient poll={poll} />
      </div>
    </main>
  );
}
