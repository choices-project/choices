import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-4 border-b border-border">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
