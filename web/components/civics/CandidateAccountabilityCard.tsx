'use client';

import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Vote,
  Users,
  ExternalLink,
  Star,
  Target,
  BarChart3,
  Phone,
  Mail,
  Twitter,
  Building2
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { useUserStore } from '@/lib/stores/userStore';

type Promise = {
  id: string;
  title: string;
  description: string;
  status: 'kept' | 'broken' | 'in_progress' | 'pending';
  dateMade: string;
  dateCompleted?: string;
  evidence?: string;
  source?: string;
};

type CampaignFinance = {
  totalRaised: number;
  totalSpent: number;
  cashOnHand: number;
  topDonors: Array<{
    name: string;
    amount: number;
    type: 'individual' | 'pac' | 'corporate';
  }>;
  aipacDonations?: number;
  corporateDonations: number;
  insiderTrading?: {
    amount: number;
    transactions: number;
    lastTransaction: string;
  };
};

type VotingRecord = {
  totalVotes: number;
  partyAlignment: number; // percentage
  constituentAlignment: number; // percentage
  recentVotes: Array<{
    bill: string;
    vote: 'yes' | 'no' | 'abstain';
    date: string;
    partyPosition: 'with' | 'against';
    constituentPosition: 'with' | 'against';
  }>;
  keyVotes: Array<{
    bill: string;
    description: string;
    vote: 'yes' | 'no' | 'abstain';
    impact: 'high' | 'medium' | 'low';
  }>;
};

type PerformanceMetrics = {
  constituentSatisfaction: number; // 0-100
  responseRate: number; // 0-100
  townHalls: number;
  lastTownHall: string;
  socialMediaEngagement: number;
  transparencyScore: number; // 0-100
};

type AlternativeCandidate = {
  id: string;
  name: string;
  party: string;
  platform: string[];
  experience: string;
  endorsements: string[];
  funding: {
    total: number;
    sources: string[];
  };
  visibility: 'high' | 'medium' | 'low';
};

type Representative = {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  office: string;
  level?: 'federal' | 'state' | 'local';  // Add level for API lookup
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  photo?: string;
  bio?: string;
  committees?: string[];
  tenure: string;
  nextElection: string;
};

type CandidateAccountabilityCardProps = {
  representative: Representative;
  promises?: Promise[];
  campaignFinance?: CampaignFinance;
  votingRecord?: VotingRecord;
  performanceMetrics?: PerformanceMetrics;
  alternativeCandidates?: AlternativeCandidate[];
  className?: string;
};

export function CandidateAccountabilityCard({
  representative,
  promises = [],
  campaignFinance,
  votingRecord,
  performanceMetrics,
  alternativeCandidates = [],
  className = ''
}: CandidateAccountabilityCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [realAlternatives, setRealAlternatives] = useState<AlternativeCandidate[]>([]);

  // Mock data for demonstration
  const mockPromises: Promise[] = [
    {
      id: '1',
      title: 'Lower Healthcare Costs',
      description: 'Promised to support legislation to reduce prescription drug prices',
      status: 'broken',
      dateMade: '2023-01-15',
      evidence: 'Voted against HR 3 (Lower Drug Costs Now Act)',
      source: 'Congress.gov'
    },
    {
      id: '2',
      title: 'Climate Action',
      description: 'Committed to supporting renewable energy initiatives',
      status: 'kept',
      dateMade: '2023-02-01',
      dateCompleted: '2023-06-15',
      evidence: 'Co-sponsored Green New Deal legislation',
      source: 'Congress.gov'
    },
    {
      id: '3',
      title: 'Infrastructure Investment',
      description: 'Promised to support infrastructure spending in district',
      status: 'in_progress',
      dateMade: '2023-03-10',
      evidence: 'Secured $50M in infrastructure funding',
      source: 'Press Release'
    }
  ];

  const mockCampaignFinance: CampaignFinance = {
    totalRaised: 2500000,
    totalSpent: 1800000,
    cashOnHand: 700000,
    topDonors: [
      { name: 'AIPAC', amount: 150000, type: 'pac' },
      { name: 'Pharmaceutical Industry PAC', amount: 120000, type: 'pac' },
      { name: 'Tech Industry PAC', amount: 100000, type: 'pac' }
    ],
    aipacDonations: 150000,
    corporateDonations: 800000,
    insiderTrading: {
      amount: 250000,
      transactions: 12,
      lastTransaction: '2023-11-15'
    }
  };

  const mockVotingRecord: VotingRecord = {
    totalVotes: 450,
    partyAlignment: 95,
    constituentAlignment: 60,
    recentVotes: [
      {
        bill: 'HR 3 - Lower Drug Costs Now Act',
        vote: 'no',
        date: '2023-10-15',
        partyPosition: 'against',
        constituentPosition: 'with'
      },
      {
        bill: 'S 1 - For the People Act',
        vote: 'no',
        date: '2023-09-20',
        partyPosition: 'against',
        constituentPosition: 'with'
      }
    ],
    keyVotes: [
      {
        bill: 'Infrastructure Investment Act',
        description: 'Major infrastructure spending bill',
        vote: 'yes',
        impact: 'high'
      }
    ]
  };

  const mockPerformanceMetrics: PerformanceMetrics = {
    constituentSatisfaction: 45,
    responseRate: 30,
    townHalls: 2,
    lastTownHall: '2023-08-15',
    socialMediaEngagement: 1200,
    transparencyScore: 25
  };

  const mockAlternatives: AlternativeCandidate[] = [
    {
      id: 'alt1',
      name: 'Sarah Johnson',
      party: 'Independent',
      platform: ['Medicare for All', 'Green New Deal', 'End Corporate Lobbying'],
      experience: 'Community Organizer, 10 years',
      endorsements: ['Progressive Coalition', 'Climate Action Now'],
      funding: {
        total: 150000,
        sources: ['Small Donors', 'Grassroots Fundraising']
      },
      visibility: 'medium'
    },
    {
      id: 'alt2',
      name: 'Michael Chen',
      party: 'Green Party',
      platform: ['Universal Basic Income', 'Public Banking', 'Worker Cooperatives'],
      experience: 'Small Business Owner, 15 years',
      endorsements: ['Green Party', 'Local Labor Union'],
      funding: {
        total: 75000,
        sources: ['Small Donors', 'Volunteer Fundraising']
      },
      visibility: 'low'
    }
  ];

  // Fetch real alternative candidates when alternatives section is opened
  useEffect(() => {
    if (showAlternatives && representative?.office && representative?.state && isFeatureEnabled('ALTERNATIVE_CANDIDATES')) {
      setLoadingAlternatives(true);
      // Use query params for office/state lookup (more reliable than ID)
      const params = new URLSearchParams({
        office: representative.office,
        state: representative.state,
        level: representative.level ?? 'federal'
      });
      if (representative.district && representative.district !== 'N/A') {
        params.append('district', representative.district);
      }
      
      fetch(`/api/v1/civics/representative/0/alternatives?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.data?.alternatives) {
            setRealAlternatives(data.data.alternatives);
          }
        })
        .catch(() => {
          // Fall back to empty array on error (will show "no candidates" message)
          setRealAlternatives([]);
        })
        .finally(() => {
          setLoadingAlternatives(false);
        });
    }
  }, [showAlternatives, representative?.office, representative?.state, representative?.level, representative?.district]);

  const displayPromises = promises.length > 0 ? promises : mockPromises;
  const displayCampaignFinance = campaignFinance ?? mockCampaignFinance;
  const displayVotingRecord = votingRecord ?? mockVotingRecord;
  const displayPerformanceMetrics = performanceMetrics ?? mockPerformanceMetrics;
  
  // Use real alternatives if available, otherwise use prop, otherwise mock
  const displayAlternatives = 
    realAlternatives.length > 0 ? realAlternatives :
    alternativeCandidates.length > 0 ? alternativeCandidates : 
    mockAlternatives;

  const getPromiseStatusIcon = (status: string) => {
    switch (status) {
      case 'kept':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'broken':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPromiseStatusColor = (status: string) => {
    switch (status) {
      case 'kept':
        return 'bg-green-100 text-green-800';
      case 'broken':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'promises', name: 'Promises', icon: <Target className="h-4 w-4" /> },
    { id: 'finance', name: 'Campaign Finance', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'voting', name: 'Voting Record', icon: <Vote className="h-4 w-4" /> },
    { id: 'performance', name: 'Performance', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  if (!isFeatureEnabled('CANDIDATE_ACCOUNTABILITY')) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <p className="text-yellow-800 text-center">
          Candidate Accountability Platform is currently disabled. 
          This feature will be enabled soon to provide transparency and accountability.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`} data-testid="candidate-accountability-card">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {representative.photo && (
              <Image
                src={representative.photo}
                alt={representative.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{representative.name}</h2>
              <p className="text-gray-600">{representative.title}</p>
              <p className="text-sm text-gray-500">{representative.party} • {representative.district}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                Accountability Score: {displayPerformanceMetrics.transparencyScore}/100
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                Satisfaction: {displayPerformanceMetrics.constituentSatisfaction}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Promises Kept</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {displayPromises.filter(p => p.status === 'kept').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Promises Broken</p>
                    <p className="text-2xl font-bold text-red-900">
                      {displayPromises.filter(p => p.status === 'broken').length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Campaign Raised</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(displayCampaignFinance.totalRaised)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {representative.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{representative.phone}</span>
                  </div>
                )}
                {representative.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{representative.email}</span>
                  </div>
                )}
                {representative.website && (
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <a href={representative.website} className="text-sm text-blue-600 hover:underline">
                      Official Website
                    </a>
                  </div>
                )}
                {representative.socialMedia?.twitter && (
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-4 w-4 text-gray-400" />
                    <a href={representative.socialMedia.twitter} className="text-sm text-blue-600 hover:underline">
                      Twitter
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'promises' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Promises</h3>
              <div className="flex space-x-2">
                <span className="text-sm text-gray-500">
                  {displayPromises.filter(p => p.status === 'kept').length} kept, {' '}
                  {displayPromises.filter(p => p.status === 'broken').length} broken
                </span>
              </div>
            </div>
            {displayPromises.map((promise) => (
              <div key={promise.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getPromiseStatusIcon(promise.status)}
                      <h4 className="font-medium text-gray-900">{promise.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPromiseStatusColor(promise.status)}`}>
                        {promise.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{promise.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Made: {new Date(promise.dateMade).toLocaleDateString()}</span>
                      {promise.dateCompleted && (
                        <span>Completed: {new Date(promise.dateCompleted).toLocaleDateString()}</span>
                      )}
                    </div>
                    {promise.evidence && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <strong>Evidence:</strong> {promise.evidence}
                        {promise.source && (
                          <span className="text-gray-500"> (Source: {promise.source})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Finance</h3>
            
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Total Raised</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(displayCampaignFinance.totalRaised)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-600">Total Spent</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatCurrency(displayCampaignFinance.totalSpent)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Cash on Hand</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(displayCampaignFinance.cashOnHand)}
                </p>
              </div>
            </div>

            {/* Top Donors */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Top Donors</h4>
              <div className="space-y-2">
                {displayCampaignFinance.topDonors.map((donor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{donor.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        donor.type === 'pac' ? 'bg-red-100 text-red-800' :
                        donor.type === 'corporate' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {donor.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(donor.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Interest Donations */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-yellow-800 mb-2">Special Interest Donations</h4>
              <div className="space-y-2">
                {displayCampaignFinance.aipacDonations && (
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-700">AIPAC Donations</span>
                    <span className="text-sm font-bold text-yellow-800">
                      {formatCurrency(displayCampaignFinance.aipacDonations)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-yellow-700">Corporate Donations</span>
                  <span className="text-sm font-bold text-yellow-800">
                    {formatCurrency(displayCampaignFinance.corporateDonations)}
                  </span>
                </div>
                {displayCampaignFinance.insiderTrading && (
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-700">Insider Trading Value</span>
                    <span className="text-sm font-bold text-yellow-800">
                      {formatCurrency(displayCampaignFinance.insiderTrading.amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voting' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Voting Record</h3>
            
            {/* Alignment Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-600">Party Alignment</p>
                <p className="text-2xl font-bold text-red-900">{displayVotingRecord.partyAlignment}%</p>
                <p className="text-xs text-red-700">Votes with party</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Constituent Alignment</p>
                <p className="text-2xl font-bold text-blue-900">{displayVotingRecord.constituentAlignment}%</p>
                <p className="text-xs text-blue-700">Votes with constituents</p>
              </div>
            </div>

            {/* Recent Votes */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Votes</h4>
              <div className="space-y-2">
                {displayVotingRecord.recentVotes.map((vote, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{vote.bill}</p>
                      <p className="text-xs text-gray-500">{new Date(vote.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vote.vote === 'yes' ? 'bg-green-100 text-green-800' :
                        vote.vote === 'no' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vote.vote.toUpperCase()}
                      </span>
                      <div className="flex space-x-1">
                        <span className={`text-xs ${
                          vote.partyPosition === 'with' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Party: {vote.partyPosition}
                        </span>
                        <span className={`text-xs ${
                          vote.constituentPosition === 'with' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Constituents: {vote.constituentPosition}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            
            {/* Performance Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Constituent Satisfaction</p>
                <p className="text-2xl font-bold text-blue-900">{displayPerformanceMetrics.constituentSatisfaction}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Response Rate</p>
                <p className="text-2xl font-bold text-green-900">{displayPerformanceMetrics.responseRate}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-600">Town Halls</p>
                <p className="text-2xl font-bold text-purple-900">{displayPerformanceMetrics.townHalls}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-orange-600">Transparency Score</p>
                <p className="text-2xl font-bold text-orange-900">{displayPerformanceMetrics.transparencyScore}/100</p>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Engagement Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Last Town Hall</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(displayPerformanceMetrics.lastTownHall).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Social Media Engagement</p>
                  <p className="text-sm font-medium text-gray-900">
                    {displayPerformanceMetrics.socialMediaEngagement.toLocaleString()} interactions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alternative Candidates Section */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Alternative Candidates</h3>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button
                onClick={() => router.push(`/candidate/declare?office=${encodeURIComponent(representative.office)}&state=${representative.state}`)}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Run for This Office
              </Button>
            )}
            <button
              onClick={() => setShowAlternatives(!showAlternatives)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showAlternatives ? 'Hide' : 'Show'} Alternatives
            </button>
          </div>
        </div>
        
        {showAlternatives && (
          <>
            {loadingAlternatives ? (
              <div className="text-center py-8 text-gray-500">Loading candidates...</div>
            ) : displayAlternatives.length > 0 ? (
              <div className="space-y-4">
                {displayAlternatives.map((candidate) => (
                <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          candidate.visibility === 'high' ? 'bg-green-100 text-green-800' :
                          candidate.visibility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.party}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{candidate.experience}</p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Platform:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {candidate.platform.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Funding: {formatCurrency(candidate.funding.total)}</span>
                        <span>Endorsements: {candidate.endorsements.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No alternative candidates found for this office.</p>
                {isAuthenticated && (
                  <Button
                    onClick={() => router.push(`/candidate/declare?office=${encodeURIComponent(representative.office)}&state=${representative.state}`)}
                    variant="outline"
                    className="mt-4"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Be the First to Run
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
