/**
 * Civics Demo Page
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This page demonstrates the civics components but is hidden until e2e work is complete
 */

'use client';

import { useState } from 'react';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { AddressLookupForm } from '@/components/civics/AddressLookupForm';
import { RepresentativeCard } from '@/components/civics/RepresentativeCard';
import { PrivacyStatusBadge } from '@/components/civics/PrivacyStatusBadge';

// Mock representative data for demo
const mockRepresentatives = [
  {
    id: '1',
    name: 'Nancy Pelosi',
    party: 'Democratic',
    office: 'U.S. House of Representatives',
    level: 'federal' as const,
    district: 'CA-12',
    contact: {
      email: 'nancy.pelosi@house.gov',
      phone: '(202) 225-4965',
      website: 'https://pelosi.house.gov'
    },
    fec: {
      total_receipts: 2500000,
      cash_on_hand: 500000,
      cycle: 2024
    },
    voting: {
      party_alignment: 0.95,
      recent_votes: 5
    },
    social_media: {
      twitter: '@SpeakerPelosi',
      facebook: 'NancyPelosi'
    }
  },
  {
    id: '2',
    name: 'Dianne Feinstein',
    party: 'Democratic',
    office: 'U.S. Senate',
    level: 'federal' as const,
    district: null,
    contact: {
      email: 'dianne.feinstein@senate.gov',
      phone: '(202) 224-3841',
      website: 'https://feinstein.senate.gov'
    },
    fec: {
      total_receipts: 1800000,
      cash_on_hand: 300000,
      cycle: 2024
    },
    voting: {
      party_alignment: 0.92,
      recent_votes: 3
    },
    social_media: {
      twitter: '@SenFeinstein',
      facebook: 'SenatorFeinstein'
    }
  }
];

export default function CivicsDemoPage() {
  const [representatives, setRepresentatives] = useState<typeof mockRepresentatives>([]);
  const [showResults, setShowResults] = useState(false);

  // Feature flag check - show disabled message if not enabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Civics Address Lookup
            </h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <PrivacyStatusBadge />
              </div>
              <p className="text-yellow-800">
                This feature is currently disabled while we complete our e2e testing work. 
                The foundation is ready and will be enabled soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddressLookup = (address: string) => {
    console.log('Address lookup requested:', address);
    
    // For demo purposes, show mock data
    setRepresentatives(mockRepresentatives);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Your Representatives
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Enter your address to discover your federal, state, and local representatives
          </p>
          <PrivacyStatusBadge />
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <AddressLookupForm onLookup={handleAddressLookup} />
        </div>

        {showResults && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Representatives
            </h2>
            
            {/* Privacy notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>How we handle your data:</strong> Your exact address and GPS never get saved. 
                We cache a scrambled code and an approximate area to make repeat lookups fast—without identifying you.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {representatives.map((rep) => (
                <RepresentativeCard
                  key={rep.id}
                  representative={rep}
                />
              ))}
            </div>

            {/* Data attribution */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Data sources: Google Civic Information API, GovTrack.us, Federal Election Commission, Congress.gov
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
