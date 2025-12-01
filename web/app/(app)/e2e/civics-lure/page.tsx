'use client';

import { useEffect } from 'react';

import CivicsLure from '@/features/civics/components/CivicsLure';
import { useRepresentativeStore } from '@/lib/stores/representativeStore';
import { useUserStore } from '@/lib/stores/userStore';
import type { Representative } from '@/types/representative';

const MOCK_REPRESENTATIVES: Representative[] = [
  {
    id: 1,
    name: 'Representative One',
    office: 'Mayor',
    level: 'local',
    party: 'Independent',
    ocdDivisionIds: ['ocd-division/country:us/state:ca/place:san_francisco'],
    division_ids: ['ocd-division/country:us/state:ca/place:san_francisco'],
    data_quality_score: 92,
    verification_status: 'verified',
    activities: [
      {
        id: 1,
        representative_id: 1,
        type: 'town_hall',
        title: 'Hosted neighborhood town hall',
        description: 'Discussed community safety improvements',
        date: '2025-05-01',
        source: 'test',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ],
    committees: [],
    district: 'San Francisco',
    primary_email: 'rep.one@example.com',
    primary_phone: '555-0101',
    state: 'CA',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    last_verified: '2025-01-01T00:00:00Z',
    data_sources: ['test'],
    primary_website: 'https://example.com/rep-one',
  },
];

export default function CivicsLureHarnessPage() {
  const handleEngage = () => undefined;

  useEffect(() => {
    useRepresentativeStore.setState((state) => {
      state.locationRepresentatives = MOCK_REPRESENTATIVES;
      state.userDivisionIds = ['ocd-division/country:us/state:ca/place:san_francisco'];
      state.isLoading = false;
      state.error = null;
    });

    useUserStore.setState((state) => {
      state.currentAddress = 'San Francisco, CA';
      state.representatives = MOCK_REPRESENTATIVES;
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6" data-testid="civics-lure-harness">
      <CivicsLure userLocation="San Francisco, CA" onEngage={handleEngage} />
    </main>
  );
}


