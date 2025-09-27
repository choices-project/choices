'use client';

import React, { useState } from 'react';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  Heart, 
  ArrowRight,
  Star,
  Shield,
  DollarSign,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

type CivicsLureProps = {
  userLocation?: string;
  onEngage: () => void;
}

export default function CivicsLure({ userLocation, onEngage }: CivicsLureProps) {
  const [_showDetails, _setShowDetails] = useState(false);

  // Mock data - in real app this would come from API
  const localCandidates = [
    {
      id: 'candidate-1',
      name: 'Sarah Johnson',
      office: 'City Council District 3',
      party: 'Independent',
      independenceScore: 92,
      transparencyScore: 88,
      keyIssues: ['Housing', 'Environment', 'Transparency'],
      recentActivity: 'Just responded to 15 constituent questions this week',
      isIncumbent: false
    },
    {
      id: 'candidate-2',
      name: 'Mike Rodriguez',
      office: 'City Council District 3',
      party: 'Republican',
      independenceScore: 34,
      transparencyScore: 45,
      keyIssues: ['Business', 'Taxes', 'Development'],
      recentActivity: 'Received $50,000 from real estate developers last month',
      isIncumbent: true
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ready to vote on something that actually matters? 🗳️
        </h2>
        <p className="text-gray-600">
          While you&apos;re here voting on Drag Race, check out who&apos;s running in your area and see who&apos;s really representing you!
        </p>
      </div>

      {/* Location Display */}
      {userLocation && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Your Area:</span>
            <span className="text-gray-600">{userLocation}</span>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Local Candidates</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">2</div>
          <div className="text-sm text-gray-500">Running in your district</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Active Issues</span>
          </div>
          <div className="text-2xl font-bold text-green-600">5</div>
          <div className="text-sm text-gray-500">Hot topics in your area</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-gray-900">Your Voice</span>
          </div>
          <div className="text-2xl font-bold text-red-600">0</div>
          <div className="text-sm text-gray-500">Questions asked so far</div>
        </div>
      </div>

      {/* Candidate Preview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Your Local Candidates</h3>
          <p className="text-sm text-gray-600">
            See who&apos;s running and who&apos;s really independent vs. &quot;bought off&quot;
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          {localCandidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-600">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{candidate.name}</h4>
                  {!candidate.isIncumbent && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Challenger
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{candidate.office}</p>
                
                <div className="flex items-center space-x-4">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.independenceScore)}`}>
                    {getScoreIcon(candidate.independenceScore)}
                    <span className="ml-1">{candidate.independenceScore}% Independent</span>
                  </div>
                  
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.transparencyScore)}`}>
                    <Shield className="w-3 h-3" />
                    <span className="ml-1">{candidate.transparencyScore}% Transparent</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Key Issues:</div>
                <div className="flex flex-wrap gap-1">
                  {candidate.keyIssues.slice(0, 2).map((issue) => (
                    <span key={issue} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Hooks */}
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Star className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Did you know?</h4>
              <p className="text-sm text-yellow-800">
                Sarah Johnson (Independent) has responded to 15 constituent questions this week, 
                while Mike Rodriguez (Incumbent) hasn&apos;t responded to any in 3 months.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">&quot;Bought Off&quot; Alert</h4>
              <p className="text-sm text-red-800">
                Mike Rodriguez received $50,000 from real estate developers last month. 
                He&apos;s voting on a major development project next week. Coincidence?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-6">
        <button
          onClick={onEngage}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center mx-auto"
        >
          <span>See All My Local Candidates</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Ask questions, see who&apos;s funding whom, and make your voice heard
        </p>
      </div>

      {/* Social Proof */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>10,000+ voters</span>
          </div>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-1" />
            <span>100% private</span>
          </div>
          <div className="flex items-center">
            <Heart className="w-4 h-4 mr-1" />
            <span>Equal access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
