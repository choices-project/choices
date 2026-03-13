import React from 'react';

import { RepresentativeCardSkeleton } from '@/components/shared/Skeletons';

export default function CandidatesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RepresentativeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
