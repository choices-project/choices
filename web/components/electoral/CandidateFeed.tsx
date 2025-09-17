'use client';

import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  ExternalLink, 
  TrendingUp,
  Shield,
  DollarSign,
  Users,
  Calendar,
  Star,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  party?: string;
  office: string;
  isIncumbent: boolean;
  photo?: string;
  bio: string;
  keyIssues: string[];
  independenceScore: number;
  transparencyScore: number;
  contactInfo: {
    email?: string;
    website?: string;
    twitter?: string;
  };
  recentActivity?: string;
  isVerified: boolean;
}

interface CandidateFeedProps {
  candidates: Candidate[];
  jurisdictionName: string;
}

export default function CandidateFeed({ candidates, jurisdictionName }: CandidateFeedProps) {
  const [likedCandidates, setLikedCandidates] = useState<Set<string>>(new Set());
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set());

  const handleLike = (candidateId: string) => {
    setLikedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleSave = (candidateId: string) => {
    setSavedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your {jurisdictionName} Candidates 🗳️
        </h1>
        <p className="text-gray-600">
          Meet everyone running in your area - from big parties to independents
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{candidates.length} candidates</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Election Nov 5, 2024</span>
          </div>
        </div>
      </div>

      {/* Candidates feed */}
      <div className="space-y-6">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Candidate header */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {candidate.photo ? (
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-bold text-gray-900">{candidate.name}</h3>
                    {candidate.isVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="font-medium">{candidate.office}</span>
                    {candidate.party && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {candidate.party}
                      </span>
                    )}
                    {candidate.isIncumbent && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Incumbent
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">{candidate.bio}</p>
                </div>
              </div>
            </div>

            {/* Key issues */}
            <div className="px-6 pb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Key Issues</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.keyIssues.map((issue, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>

            {/* Scores */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Independence</span>
                    <Shield className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.independenceScore)}`}>
                    {getScoreIcon(candidate.independenceScore)}
                    <span className="ml-1">{candidate.independenceScore}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Less corporate influence
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Transparency</span>
                    <DollarSign className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(candidate.transparencyScore)}`}>
                    {getScoreIcon(candidate.transparencyScore)}
                    <span className="ml-1">{candidate.transparencyScore}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Open about funding
                  </p>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            {candidate.recentActivity && (
              <div className="px-6 pb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Recent Activity</p>
                      <p className="text-sm text-blue-700">{candidate.recentActivity}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(candidate.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      likedCandidates.has(candidate.id)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedCandidates.has(candidate.id) ? 'fill-current' : ''}`} />
                    <span>Like</span>
                  </button>

                  <button className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask Question</span>
                  </button>

                  <button
                    onClick={() => handleSave(candidate.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      savedCandidates.has(candidate.id)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${savedCandidates.has(candidate.id) ? 'fill-current' : ''}`} />
                    <span>Save</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {candidate.contactInfo.website && (
                    <a
                      href={candidate.contactInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                  
                  <button className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Ready to make a difference? 🚀
        </h3>
        <p className="text-gray-600 mb-4">
          Connect with candidates, ask questions, and make your voice heard. 
          Every voice matters in democracy!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Start a Conversation
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Share with Friends
          </button>
        </div>
      </div>
    </div>
  );
}
