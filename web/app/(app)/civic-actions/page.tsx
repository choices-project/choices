'use client';

import { useEffect } from 'react';

import { CivicActionList } from '@/features/civics/components/civic-actions/CivicActionList';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { useAppActions } from '@/lib/stores/appStore';

export default function CivicActionsPage() {
  const { setCurrentRoute, setBreadcrumbs } = useAppActions();

  useEffect(() => {
    setCurrentRoute('/civic-actions');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Civic Actions', href: '/civic-actions' },
    ]);
  }, [setCurrentRoute, setBreadcrumbs]);

  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Civic Engagement V2</h1>
          <p className="text-gray-600">This feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Civic Actions</h1>
        <p className="text-gray-600">
          Discover and participate in civic engagement opportunities in your community.
        </p>
      </div>

      <CivicActionList data-testid="civic-actions-container" />
    </div>
  );
}

