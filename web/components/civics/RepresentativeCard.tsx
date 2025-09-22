/**
 * Civics Representative Card Component
 * Feature Flag: CIVICS_ADDRESS_LOOKUP (disabled by default)
 * 
 * This component displays representative information in a privacy-safe way
 */

'use client';

import { isFeatureEnabled } from '@/lib/core/feature-flags';

type Representative = {
  id: string;
  name: string;
  party: string | null;
  office: string;
  level: 'federal' | 'state' | 'local';
  district: string | null;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  fec?: {
    total_receipts: number;
    cash_on_hand: number;
    cycle: number;
  };
  voting?: {
    party_alignment: number;
    recent_votes: number;
  };
  social_media?: {
    twitter?: string;
    facebook?: string;
  };
}

type RepresentativeCardProps = {
  representative: Representative;
  className?: string;
}

export function RepresentativeCard({ representative, className = '' }: RepresentativeCardProps) {
  // Feature flag check - don't render if disabled
  if (!isFeatureEnabled('CIVICS_ADDRESS_LOOKUP')) {
    return null;
  }

  const handleContact = (method: 'email' | 'phone' | 'website', value: string) => {
    // TODO: Implement contact tracking when feature is enabled
    console.log(`Contact ${method}:`, value);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'federal': return 'bg-red-100 text-red-800';
      case 'state': return 'bg-blue-100 text-blue-800';
      case 'local': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartyColor = (party: string | null) => {
    if (!party) return 'bg-gray-100 text-gray-800';
    if (party.toLowerCase().includes('democratic')) return 'bg-blue-100 text-blue-800';
    if (party.toLowerCase().includes('republican')) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {representative.name}
          </h3>
          <p className="text-sm text-gray-600">{representative.office}</p>
          {representative.district && (
            <p className="text-xs text-gray-500">District: {representative.district}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(representative.level)}`}>
            {representative.level}
          </span>
          {representative.party && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPartyColor(representative.party)}`}>
              {representative.party}
            </span>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {representative.contact && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Contact</h4>
          <div className="space-y-1">
            {representative.contact.email && (
              <button
                onClick={() => handleContact('email', representative.contact!.email!)}
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                📧 {representative.contact.email}
              </button>
            )}
            {representative.contact.phone && (
              <button
                onClick={() => handleContact('phone', representative.contact!.phone!)}
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                📞 {representative.contact.phone}
              </button>
            )}
            {representative.contact.website && (
              <button
                onClick={() => handleContact('website', representative.contact!.website!)}
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                🌐 Website
              </button>
            )}
          </div>
        </div>
      )}

      {/* Campaign Finance */}
      {representative.fec && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Campaign Finance (2024)</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Receipts:</span>
              <span className="ml-2 font-medium">
                ${representative.fec.total_receipts.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cash on Hand:</span>
              <span className="ml-2 font-medium">
                ${representative.fec.cash_on_hand.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Voting Record */}
      {representative.voting && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Voting Record</h4>
          <div className="text-sm">
            <span className="text-gray-600">Party Alignment:</span>
            <span className="ml-2 font-medium">
              {(representative.voting.party_alignment * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Recent Votes:</span>
            <span className="ml-2 font-medium">{representative.voting.recent_votes}</span>
          </div>
        </div>
      )}

      {/* Social Media */}
      {representative.social_media && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Social Media</h4>
          <div className="flex space-x-4">
            {representative.social_media.twitter && (
              <a
                href={`https://twitter.com/${representative.social_media.twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                🐦 {representative.social_media.twitter}
              </a>
            )}
            {representative.social_media.facebook && (
              <a
                href={`https://facebook.com/${representative.social_media.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                📘 Facebook
              </a>
            )}
          </div>
        </div>
      )}

      {/* Data Attribution */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Data sources: GovTrack.us, FEC, Congress.gov
        </p>
      </div>
    </div>
  );
}
