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
    photo_url: null,
    party: 'Independent',
    ocdDivisionIds: ['ocd-division/country:us/state:ca/place:san_francisco'],
    division_ids: ['ocd-division/country:us/state:ca/place:san_francisco'],
    data_quality_score: 92,
    verification_status: 'verified',
    activities: [
      {
        id: 1,
        type: 'town_hall',
        title: 'Hosted neighborhood town hall',
        description: 'Discussed community safety improvements',
        date: '2025-05-01',
      },
    ],
    committees: [],
    contact: [],
    district: 'San Francisco',
    email: 'rep.one@example.com',
    phone: '555-0101',
    social_media: [],
    website: 'https://example.com/rep-one',
    scorecard: null,
    endorsements: [],
    tenure: null,
    biography: '',
    address: {
      line1: '1 Dr Carlton B Goodlett Pl',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94102',
    },
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


