import React from 'react';

import { RepresentativeListSkeleton } from '@/components/shared/Skeletons';

export default function CivicsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RepresentativeListSkeleton count={8} />
    </div>
  );
}
