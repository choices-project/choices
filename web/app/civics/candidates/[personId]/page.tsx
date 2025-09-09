'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface CandidateCard {
  personId: string;
  cycle: number;
  name: string;
  party?: string;
  districtLabel: string;
  headline: {
    summary?: string;
    incumbency?: 'incumbent' | 'challenger' | 'open';
  };
  finance: {
    totals: {
      receipts: number | null;
      disbursements: number | null;
      cashOnHand: number | null;
      lastUpdated: string | null;
    };
    topDonors: Array<{
      name: string;
      amount: number;
    }>;
  };
  recentVotes: Array<{
    roll?: string;
    date?: string;
    title?: string;
    position?: 'Yea' | 'Nay' | 'Present' | 'Not Voting';
    result?: string;
  }>;
  committees?: Array<{
    name: string;
    role?: string;
  }>;
  updatedAt: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const [candidate, setCandidate] = useState<CandidateCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/candidates/${params.personId}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          return;
        }

        setCandidate(data);
      } catch (error) {
        setError('Failed to fetch candidate details. Please try again.');
        console.error('Failed to fetch candidate:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.personId) {
      fetchCandidate();
    }
  }, [params.personId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-gray-600">Candidate not found</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => window.history.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Districts
        </button>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{candidate.name}</h1>
              <p className="text-lg text-gray-600 mb-2">{candidate.districtLabel}</p>
              {candidate.party && (
                <p className="text-sm text-gray-500">{candidate.party}</p>
              )}
            </div>
            <div className="flex gap-2">
              {candidate.headline.incumbency === 'incumbent' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Incumbent
                </span>
              )}
              {candidate.headline.incumbency === 'challenger' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Challenger
                </span>
              )}
            </div>
          </div>
          
          {candidate.headline.summary && (
            <p className="text-gray-700">{candidate.headline.summary}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Finance */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Campaign Finance</h2>
          <div className="space-y-3">
            {candidate.finance.totals.receipts && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total Receipts:</span>
                <span className="font-medium">${candidate.finance.totals.receipts.toLocaleString()}</span>
              </div>
            )}
            {candidate.finance.totals.disbursements && (
              <div className="flex justify-between">
                <span className="text-gray-600">Total Disbursements:</span>
                <span className="font-medium">${candidate.finance.totals.disbursements.toLocaleString()}</span>
              </div>
            )}
            {candidate.finance.totals.cashOnHand && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cash on Hand:</span>
                <span className="font-medium">${candidate.finance.totals.cashOnHand.toLocaleString()}</span>
              </div>
            )}
            {candidate.finance.totals.lastUpdated && (
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(candidate.finance.totals.lastUpdated).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Committees */}
        {candidate.committees && candidate.committees.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Committees</h2>
            <div className="space-y-2">
              {candidate.committees.map((committee, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3">
                  <p className="font-medium">{committee.name}</p>
                  {committee.role && (
                    <p className="text-sm text-gray-600">{committee.role}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Votes */}
      {candidate.recentVotes && candidate.recentVotes.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Votes</h2>
          <div className="space-y-4">
            {candidate.recentVotes.map((vote, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{vote.title || 'Untitled Bill'}</h3>
                    {vote.roll && (
                      <p className="text-sm text-gray-600">Roll Call: {vote.roll}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {vote.position && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vote.position === 'Yea' ? 'bg-green-100 text-green-800' :
                        vote.position === 'Nay' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vote.position}
                      </span>
                    )}
                    {vote.result && (
                      <span className="text-xs text-gray-500">({vote.result})</span>
                    )}
                  </div>
                </div>
                {vote.date && (
                  <p className="text-xs text-gray-500">
                    {new Date(vote.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Donors */}
      {candidate.finance.topDonors && candidate.finance.topDonors.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Top Donors</h2>
          <div className="space-y-3">
            {candidate.finance.topDonors.map((donor, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">{donor.name}</span>
                <span className="font-medium">${donor.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mock Data Notice */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This is currently using mock data. Real data integration is planned for Sprint 2.
        </p>
      </div>
    </div>
  );
}
