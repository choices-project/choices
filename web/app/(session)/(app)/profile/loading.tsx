import React from 'react';

import { ProfileSkeleton } from '@/components/shared/Skeletons';

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileSkeleton />
    </div>
  );
}
