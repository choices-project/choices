'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  ExternalLink, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube,
  DollarSign,
  Shield,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Users,
  Eye,
  Share2,
  Heart
} from 'lucide-react';
import { Candidate } from '@/lib/social/candidate-tools';

interface EqualPlatformProfileProps {
  candidate: Candidate;
  onPolicyClick?: (policy: string) => void;
  onContactClick?: (candidate: Candidate) => void;
  onShare?: (candidate: Candidate) => void;
  showEngagement?: boolean;
  className?: string;
}

export default function EqualPlatformProfile({ 
  candidate, 
  onPolicyClick,
  onContactClick,
  onShare,
  showEngagement = false,
  className = '' 
}: EqualPlatformProfileProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'policies' | 'finance' | 'contact'>('about');
  const [showFullBio, setShowFullBio] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getIndependenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTransparencyColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const tabs = [
    { id: 'about', label: 'About', icon: Users },
    { id: 'policies', label: 'Policies', icon: Shield },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'contact', label: 'Contact', icon: Mail }
  ] as const;

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-start space-x-4">
          {/* Candidate Image */}
          <div className="flex-shrink-0">
            {candidate.imageUrl ? (
              <img
                src={candidate.imageUrl}
                alt={candidate.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Candidate Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {candidate.name}
                </h1>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    candidate.isIndependent 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {candidate.party || 'Independent'}
                  </span>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    candidate.verification.verified 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {candidate.verification.verified ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </>
                    ) : (
                      <span>Unverified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {onShare && (
                  <button
                    onClick={() => onShare(candidate)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Share candidate profile"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
                
                {candidate.website && (
                  <a
                    href={candidate.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Visit campaign website"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(candidate.campaignFinance.totalRaised)}
                </div>
                <div className="text-xs text-gray-500">Total Raised</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getIndependenceColor(candidate.campaignFinance.independenceScore)}`}>
                  {candidate.campaignFinance.independenceScore}%
                </div>
                <div className="text-xs text-gray-500">Independence</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getTransparencyColor(candidate.campaignFinance.transparencyScore)}`}>
                  {candidate.campaignFinance.transparencyScore}%
                </div>
                <div className="text-xs text-gray-500">Transparency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <div className="prose prose-sm max-w-none">
                <p className={`text-gray-700 leading-relaxed ${
                  !showFullBio && candidate.bio.length > 200 ? 'line-clamp-3' : ''
                }`}>
                  {candidate.bio}
                </p>
                {candidate.bio.length > 200 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                  >
                    {showFullBio ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>

            {/* Verification Details */}
            {candidate.verification.verified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">
                      Verified Candidate
                    </h4>
                    <p className="text-sm text-green-700">
                      This candidate has been verified through {candidate.verification.method.replace('-', ' ')}.
                      {candidate.verification.verifiedAt && (
                        <span className="block mt-1">
                          Verified on {candidate.verification.verifiedAt.toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {candidate.policies.map((policy, index) => (
                <button
                  key={index}
                  onClick={() => onPolicyClick?.(policy)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 group-hover:text-blue-700">
                      #{policy}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Finance</h3>
            
            {/* Funding Sources */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Funding Sources</h4>
              <div className="space-y-3">
                {candidate.campaignFinance.fundingSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {source.type.replace('-', ' ')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {source.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(source.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {source.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Donors */}
            {candidate.campaignFinance.topDonors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Top Donors</h4>
                <div className="space-y-2">
                  {candidate.campaignFinance.topDonors.map((donor, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{donor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact & Links</h3>
            
            <div className="space-y-3">
              {candidate.contact.email && (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <a 
                      href={`mailto:${candidate.contact.email}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {candidate.contact.email}
                    </a>
                  </div>
                </div>
              )}

              {candidate.contact.phone && (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Phone</div>
                    <a 
                      href={`tel:${candidate.contact.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {candidate.contact.phone}
                    </a>
                  </div>
                </div>
              )}

              {candidate.contact.address && (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Address</div>
                    <div className="text-sm text-gray-700">{candidate.contact.address}</div>
                  </div>
                </div>
              )}

              {candidate.website && (
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Website</div>
                    <a 
                      href={candidate.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {candidate.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media */}
            {candidate.socialMedia && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Social Media</h4>
                <div className="flex space-x-3">
                  {candidate.socialMedia.twitter && (
                    <a
                      href={`https://twitter.com/${candidate.socialMedia.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {candidate.socialMedia.facebook && (
                    <a
                      href={candidate.socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {candidate.socialMedia.instagram && (
                    <a
                      href={`https://instagram.com/${candidate.socialMedia.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-pink-500 transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {candidate.socialMedia.linkedin && (
                    <a
                      href={candidate.socialMedia.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-700 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {candidate.socialMedia.youtube && (
                    <a
                      href={candidate.socialMedia.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="YouTube"
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {onContactClick && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => onContactClick(candidate)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Candidate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
