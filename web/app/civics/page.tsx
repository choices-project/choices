'use client';

import { useState } from 'react';

interface District {
  id: string;
  label: string;
}

interface Candidate {
  personId: string;
  name: string;
  party: string;
  districtLabel: string;
  incumbent: boolean;
}

export default function CivicsPage() {
  const [address, setAddress] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleAddressSubmit = async () => {
    if (!address.trim()) {
      setError("Please enter an address");
      return;
    }

    setLoading(true);
    setError("");
    setDistricts([]);
    setCandidates([]);

    try {
      const response = await fetch(`/api/district?addr=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setDistricts(data.posts || []);
    } catch (error) {
      setError('Failed to fetch districts. Please try again.');
      console.error('Failed to fetch districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictClick = async (districtId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/candidates?district_id=${encodeURIComponent(districtId)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setCandidates(data.candidates || []);
    } catch (error) {
      setError('Failed to fetch candidates. Please try again.');
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateClick = (personId: string) => {
    // Navigate to candidate detail page
    window.location.href = `/civics/candidates/${personId}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Representatives</h1>
        <p className="text-gray-600">
          Enter your address to discover your electoral districts and candidates
        </p>
      </div>
      
      {/* Address Input */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Enter Your Address</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter your full address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSubmit()}
          />
          <button
            onClick={handleAddressSubmit}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Find Representatives'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-red-600 text-sm">{error}</p>
        )}
      </div>

      {/* Verified Toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium">Verified electorate only</span>
          <span className="ml-2 text-xs text-gray-500">(Coming soon)</span>
        </label>
      </div>

      {/* Districts Results */}
      {districts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Electoral Districts</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {districts.map((district) => (
              <div
                key={district.id}
                onClick={() => handleDistrictClick(district.id)}
                className="p-4 bg-white rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-lg mb-2">{district.label}</h3>
                <p className="text-sm text-gray-600">Click to view candidates</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidates Results */}
      {candidates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Candidates</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((candidate) => (
              <div
                key={candidate.personId}
                onClick={() => handleCandidateClick(candidate.personId)}
                className="p-4 bg-white rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-lg">{candidate.name}</h3>
                  {candidate.incumbent && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Incumbent
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{candidate.party}</p>
                <p className="text-sm text-gray-500">{candidate.districtLabel}</p>
                <p className="text-xs text-blue-600 mt-2">Click for details →</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is currently using mock data for Pennsylvania districts. 
          Real data integration is planned for Sprint 2.
        </p>
      </div>
    </div>
  );
}
