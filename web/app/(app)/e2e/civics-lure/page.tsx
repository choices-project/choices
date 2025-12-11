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
    state: 'CA',
    party: 'Independent',
    ocdDivisionIds: ['ocd-division/country:us/state:ca/place:san_francisco'],
    division_ids: ['ocd-division/country:us/state:ca/place:san_francisco'],
    data_quality_score: 92,
    verification_status: 'verified',
    data_sources: ['mock'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_verified: new Date().toISOString(),
    primary_email: 'rep.one@example.com',
    primary_phone: '555-0101',
    primary_website: 'https://example.com/rep-one',
    activities: [
      {
        id: 1,
        representative_id: 1,
        type: 'town_hall',
        title: 'Hosted neighborhood town hall',
        description: 'Discussed community safety improvements',
        date: '2025-05-01',
        source: 'mock',
        created_at: '2025-05-01T10:00:00.000Z',
        updated_at: '2025-05-01T10:00:00.000Z',
      },
    ],
    committees: [],
    district: 'San Francisco',
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


