'use client';

import { useEffect } from 'react';

import CivicsLure from '@/features/civics/components/CivicsLure';

import { useRepresentativeStore } from '@/lib/stores/representativeStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useElectionStore } from '@/lib/stores/electionStore';

import type { Representative } from '@/types/representative';
import type { CivicElection } from '@/types/civic';

// Note: Client components cannot export metadata, but we set document.title in useEffect
// The root layout provides the default title and lang attribute in the HTML

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

const MOCK_ELECTIONS: CivicElection[] = [
  {
    election_id: 'mock-election-1',
    name: 'General Election 2025',
    election_day: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    ocd_division_id: 'ocd-division/country:us/state:ca/place:san_francisco',
    fetched_at: new Date().toISOString(),
  },
];

export default function CivicsLureHarnessPage() {
  const handleEngage = () => undefined;

  useEffect(() => {
    // Set page title for accessibility - must be in useEffect to avoid infinite loops
    // Ensure title element exists and is set
    let titleElement = document.querySelector('head title');
    if (!titleElement) {
      titleElement = document.createElement('title');
      document.head.appendChild(titleElement);
    }
    titleElement.textContent = 'Civics Lure E2E Harness - Choices';
    document.title = 'Civics Lure E2E Harness - Choices';
    
    // Ensure lang attribute is set on html element
    if (!document.documentElement.getAttribute('lang')) {
      document.documentElement.setAttribute('lang', 'en');
    }
    
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

    // Set up mock elections data to prevent network requests
    useElectionStore.setState((state) => {
      const divisionId = 'ocd-division/country:us/state:ca/place:san_francisco';
      if (!state.electionsByDivision) {
        state.electionsByDivision = new Map();
      }
      state.electionsByDivision.set(divisionId, MOCK_ELECTIONS);
      state.loading = false;
      state.error = null;
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6" data-testid="civics-lure-harness">
      <CivicsLure userLocation="San Francisco, CA" onEngage={handleEngage} />
    </main>
  );
}


