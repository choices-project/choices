'use client';

import { Suspense } from 'react';

import CreatePollForm from '@/features/polls/pages/create-simple/CreatePollForm';

export default function PollsCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CreatePollForm />
    </Suspense>
  );
}
