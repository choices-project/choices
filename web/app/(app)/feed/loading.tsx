import React from 'react';

import { FeedSkeleton } from '@/components/shared/Skeletons';

export default function FeedLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FeedSkeleton count={5} />
    </div>
  );
}
